import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 })
    }

    // Verify the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { feedbacks, projectId } = body

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json({ error: 'Invalid feedback data' }, { status: 400 })
    }

    // Ensure user profile exists with retry logic
    let existingProfile
    try {
      existingProfile = await prisma.profile.findUnique({
        where: { id: user.id }
      })
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({
        error: 'Database connection failed. Please try again in a moment.'
      }, { status: 503 })
    }

    if (!existingProfile) {
      try {
        // Create profile if it doesn't exist
        await prisma.profile.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email
          }
        })
      } catch (profileError) {
        console.error('Error creating profile:', profileError)
        return NextResponse.json({
          error: 'Failed to create user profile. Please try again.'
        }, { status: 500 })
      }
    }

    // Handle project assignment
    let assignedProjectId = projectId
    
    if (projectId) {
      // Verify the specified project belongs to the user
      const projectExists = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id
        }
      })
      
      if (!projectExists) {
        return NextResponse.json({ error: 'Invalid project ID or unauthorized' }, { status: 400 })
      }
    } else {
      // If no project specified, assign to default project
      const defaultProject = await prisma.project.findFirst({
        where: {
          userId: user.id,
          isDefault: true
        }
      })
      
      if (defaultProject) {
        assignedProjectId = defaultProject.id
      }
      // If no default project exists, leave projectId as null for backward compatibility
    }

    // Validate and prepare feedback data for bulk insert with AI fields
    const feedbackData = feedbacks.map((feedback, index) => {
      // Validate required fields
      if (!feedback.content || typeof feedback.content !== 'string') {
        throw new Error(`Invalid content at index ${index}: content is required and must be a string`)
      }

      // Ensure proper JSON serialization for complex fields
      let topics, aiClassificationMeta, classificationHistory
      
      try {
        topics = Array.isArray(feedback.topics) ? feedback.topics : []
        aiClassificationMeta = feedback.aiClassificationMeta ?
          (typeof feedback.aiClassificationMeta === 'object' ? feedback.aiClassificationMeta : JSON.parse(feedback.aiClassificationMeta)) : null
        classificationHistory = Array.isArray(feedback.classificationHistory) ? feedback.classificationHistory : []
      } catch (jsonError) {
        console.warn(`JSON parsing error for feedback at index ${index}:`, jsonError)
        topics = []
        aiClassificationMeta = null
        classificationHistory = []
      }

      return {
        userId: user.id,
        projectId: assignedProjectId,
        content: feedback.content.trim(),
        source: feedback.source || 'csv_import',
        category: feedback.category || 'general_inquiry',
        sentimentScore: typeof feedback.sentimentScore === 'number' ? feedback.sentimentScore : 0.5,
        sentimentLabel: feedback.sentimentLabel || 'neutral',
        topics,
        feedbackDate: feedback.feedbackDate ? new Date(feedback.feedbackDate) : new Date(),
        // AI categorization fields
        aiCategoryConfidence: typeof feedback.aiCategoryConfidence === 'number' ? feedback.aiCategoryConfidence : null,
        aiClassificationMeta,
        classificationHistory,
        manualOverride: Boolean(feedback.manualOverride)
      }
    })

    // Count how many have AI analysis
    const aiAnalyzedCount = feedbacks.filter(f => f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined).length

    // Use transaction for atomic operation
    const result = await prisma.$transaction(async (tx) => {
      // Bulk insert feedback
      const createdFeedbacks = await tx.feedback.createMany({
        data: feedbackData,
        skipDuplicates: true
      })

      // Fetch the created feedbacks to return them
      const insertedFeedbacks = await tx.feedback.findMany({
        where: {
          userId: user.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: feedbackData.length
      })

      return {
        count: createdFeedbacks.count,
        aiAnalyzed: aiAnalyzedCount,
        feedbacks: insertedFeedbacks
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error bulk creating feedback:', error)
    return NextResponse.json({ error: 'Failed to bulk create feedback' }, { status: 500 })
  }
}