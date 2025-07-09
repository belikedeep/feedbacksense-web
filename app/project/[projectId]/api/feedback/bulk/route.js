import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Helper function to validate project access and get project data
async function getProjectFromRequest(request, projectId) {
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new Error('Missing authorization header')
  }

  // Verify the JWT token
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  if (error || !user) {
    throw new Error('Invalid token')
  }

  // Validate project ownership
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id
    }
  })

  if (!project) {
    throw new Error('Project not found or access denied')
  }

  return { user, project }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = await params
    const { user, project } = await getProjectFromRequest(request, projectId)

    // Parse request body
    const body = await request.json()
    const { feedbacks } = body

    if (!feedbacks || !Array.isArray(feedbacks)) {
      return NextResponse.json({ error: 'Invalid feedbacks array' }, { status: 400 })
    }

    if (feedbacks.length === 0) {
      return NextResponse.json({ error: 'No feedbacks provided' }, { status: 400 })
    }

    // Add user ID and project ID to each feedback entry
    const feedbacksWithUserAndProject = feedbacks.map(feedback => ({
      ...feedback,
      userId: user.id,
      projectId: project.id,
      feedbackDate: feedback.feedbackDate ? new Date(feedback.feedbackDate) : new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    // Use batch insert for better performance - avoid transaction timeout
    const result = await prisma.$transaction(async (prisma) => {
      const createdFeedbacks = []
      
      // Process in smaller batches to avoid timeout
      const batchSize = 10
      for (let i = 0; i < feedbacksWithUserAndProject.length; i += batchSize) {
        const batch = feedbacksWithUserAndProject.slice(i, i + batchSize)
        
        const batchPromises = batch.map(feedbackData =>
          prisma.feedback.create({
            data: feedbackData,
            include: {
              notes: true,
              project: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          })
        )
        
        const batchResults = await Promise.all(batchPromises)
        createdFeedbacks.push(...batchResults)
      }
      
      return createdFeedbacks
    }, {
      timeout: 30000 // Increase timeout to 30 seconds
    })

    return NextResponse.json({
      message: 'Bulk feedback imported successfully',
      count: result.length,
      feedbacks: result
    })

  } catch (error) {
    console.error('Error in bulk feedback import:', error)
    
    if (error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    if (error.message === 'Invalid token' || error.message === 'Missing authorization header') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json({
      error: 'Failed to import bulk feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}