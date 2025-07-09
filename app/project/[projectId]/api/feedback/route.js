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

export async function GET(request, { params }) {
  try {
    const { projectId } = await params
    const { user, project } = await getProjectFromRequest(request, projectId)

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const sentiment = searchParams.get('sentiment')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    // Build where clause - automatically scoped to project
    const whereClause = {
      projectId: project.id,
      userId: user.id
    }

    // Add optional filters
    if (category && category !== 'all') {
      whereClause.category = category
    }
    
    if (sentiment && sentiment !== 'all') {
      whereClause.sentiment = sentiment
    }

    // Fetch feedback with retry logic
    let feedback
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        feedback = await prisma.feedback.findMany({
          where: whereClause,
          include: {
            notes: {
              orderBy: { createdAt: 'desc' }
            },
            project: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          ...(limit && { take: parseInt(limit) }),
          ...(offset && { skip: parseInt(offset) })
        })
        break
      } catch (dbError) {
        retryCount++
        console.error(`Database error (attempt ${retryCount}):`, dbError)
        
        if (retryCount >= maxRetries) {
          if (dbError.code === 'P1001' || dbError.message?.includes("Can't reach database server")) {
            return NextResponse.json({
              error: 'Database connection failed. Please check your database connection and try again.',
              details: 'Unable to connect to database server'
            }, { status: 503 })
          }
          throw dbError
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000))
      }
    }

    return NextResponse.json(feedback || [])
  } catch (error) {
    console.error('Error fetching project feedback:', error)
    
    if (error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    if (error.message === 'Invalid token' || error.message === 'Missing authorization header') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json({
      error: 'Failed to fetch feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const { projectId } = await params
    const { user, project } = await getProjectFromRequest(request, projectId)

    // Parse request body
    let body = {}
    try {
      const contentType = request.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const text = await request.text()
        if (text.trim()) {
          body = JSON.parse(text)
        }
      }
    } catch (parseError) {
      console.error('JSON parsing error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }

    const { content, category, customerName, source } = body

    // Validate required fields
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Feedback content is required' }, { status: 400 })
    }

    // Analyze the feedback using AI (simplified for now)
    let analysisResult = {
      sentimentLabel: 'neutral',
      sentimentScore: 0.5,
      suggestedCategory: category || 'general',
      summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
      topics: []
    }

    try {
      // Try to import and use AI analysis if available
      const { categorizeFeedback } = await import('@/lib/geminiAI')
      const aiResult = await categorizeFeedback(content)
      analysisResult = {
        sentimentLabel: 'neutral', // For now, use simple sentiment
        sentimentScore: aiResult.confidence || 0.5,
        suggestedCategory: aiResult.category || category || 'general',
        summary: content.slice(0, 100) + (content.length > 100 ? '...' : ''),
        topics: aiResult.keyIndicators || []
      }
    } catch (aiError) {
      console.error('AI analysis failed, using defaults:', aiError)
    }

    // Create feedback entry - automatically scoped to project
    const feedback = await prisma.feedback.create({
      data: {
        userId: user.id,
        projectId: project.id, // Automatically associate with the project
        content: content.trim(),
        category: category || analysisResult.suggestedCategory,
        sentimentLabel: analysisResult.sentimentLabel,
        sentimentScore: analysisResult.sentimentScore,
        topics: analysisResult.topics,
        source: source?.trim() || 'manual'
      },
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

    return NextResponse.json(feedback)
  } catch (error) {
    console.error('Error creating project feedback:', error)
    
    if (error.message === 'Project not found or access denied') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    
    if (error.message === 'Invalid token' || error.message === 'Missing authorization header') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    return NextResponse.json({
      error: 'Failed to create feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}