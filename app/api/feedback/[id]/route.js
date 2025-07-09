import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { analyzeAndCategorizeFeedback } from '@/lib/sentimentAnalysis'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request, { params }) {
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

    const { id } = await params

    // Delete feedback (only if it belongs to the user)
    // Also verify project ownership if projectId is provided in query params
    const url = new URL(request.url)
    const projectId = url.searchParams.get('projectId')
    
    const whereClause = {
      id: id,
      userId: user.id
    }
    
    if (projectId) {
      whereClause.projectId = projectId
    }
    
    const deletedFeedback = await prisma.feedback.deleteMany({
      where: whereClause
    })

    if (deletedFeedback.count === 0) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Error deleting feedback:', error)
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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

    const { id } = await params
    const body = await request.json()
    const {
      content,
      source,
      category,
      sentimentScore,
      sentimentLabel,
      topics,
      feedbackDate,
      status,
      priority,
      isArchived,
      projectId,
      reanalyze = false, // Flag to trigger AI re-analysis
      bulkOperation = false // Flag for bulk operations
    } = body

    // First, get the existing feedback to check current state
    const existingFeedback = await prisma.feedback.findFirst({
      where: {
        id: id,
        userId: user.id
      }
    })

    if (!existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    // Handle project validation if projectId is being updated
    if (projectId && projectId !== existingFeedback.projectId) {
      const projectExists = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id
        }
      })
      
      if (!projectExists) {
        return NextResponse.json({ error: 'Invalid project ID or unauthorized' }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData = {
      content,
      source,
      sentimentScore,
      sentimentLabel,
      topics,
      feedbackDate: feedbackDate ? new Date(feedbackDate) : undefined,
      status,
      priority,
      ...(projectId !== undefined && { projectId })
    }

    // Handle archiving
    if (isArchived !== undefined) {
      updateData.isArchived = isArchived
      if (isArchived) {
        updateData.archivedAt = new Date()
      } else {
        updateData.archivedAt = null
      }
    }

    // Handle category changes and manual overrides
    let classificationHistory = Array.isArray(existingFeedback.classificationHistory)
      ? [...existingFeedback.classificationHistory]
      : []

    // Handle edit history for content changes
    let editHistory = Array.isArray(existingFeedback.editHistory)
      ? [...existingFeedback.editHistory]
      : []

    // Check if category was manually changed
    const categoryChanged = category && category !== existingFeedback.category
    const contentChanged = content && content !== existingFeedback.content
    const hasSignificantChanges = contentChanged || categoryChanged ||
      (status && status !== existingFeedback.status) ||
      (priority && priority !== existingFeedback.priority)

    // Track edit history for significant changes (but not for bulk operations)
    if (hasSignificantChanges && !bulkOperation) {
      const editEntry = {
        timestamp: new Date().toISOString(),
        editedBy: user.id,
        changes: {},
        previousValues: {}
      }

      if (contentChanged) {
        editEntry.changes.content = content
        editEntry.previousValues.content = existingFeedback.content
      }
      if (categoryChanged) {
        editEntry.changes.category = category
        editEntry.previousValues.category = existingFeedback.category
      }
      if (status && status !== existingFeedback.status) {
        editEntry.changes.status = status
        editEntry.previousValues.status = existingFeedback.status
      }
      if (priority && priority !== existingFeedback.priority) {
        editEntry.changes.priority = priority
        editEntry.previousValues.priority = existingFeedback.priority
      }

      editHistory.push(editEntry)
      updateData.editHistory = editHistory
      updateData.lastEditedBy = user.id
      updateData.lastEditedAt = new Date()
    }

    if (categoryChanged) {
      // Add manual override to classification history
      const historyEntry = {
        timestamp: new Date().toISOString(),
        category: category,
        confidence: 1.0, // Manual override has full confidence
        method: 'manual_override',
        reasoning: 'Category manually changed by user',
        previousCategory: existingFeedback.category
      }
      
      classificationHistory.push(historyEntry)
      updateData.category = category
      updateData.manualOverride = true
      updateData.classificationHistory = classificationHistory
    }

    // Handle re-analysis request or content changes
    if (reanalyze || (contentChanged && content)) {
      try {
        const analysisResult = await analyzeAndCategorizeFeedback(content || existingFeedback.content)
        
        // Add AI re-analysis to history
        if (analysisResult.historyEntry) {
          classificationHistory.push(analysisResult.historyEntry)
        }

        // Update with AI results (unless category was manually overridden)
        if (!categoryChanged) {
          updateData.category = analysisResult.aiCategory
          updateData.aiCategoryConfidence = analysisResult.aiCategoryConfidence
          updateData.manualOverride = false
        }
        
        updateData.sentimentScore = analysisResult.sentimentScore
        updateData.sentimentLabel = analysisResult.sentimentLabel
        updateData.topics = analysisResult.topics
        updateData.aiClassificationMeta = analysisResult.classificationMeta
        updateData.classificationHistory = classificationHistory

      } catch (analysisError) {
        console.error('AI re-analysis failed:', analysisError)
        // Continue with manual update, don't block the operation
        if (!categoryChanged && category) {
          updateData.category = category
        }
      }
    } else if (!categoryChanged && category) {
      // Simple category update without AI analysis
      updateData.category = category
    }

    // Update feedback (only if it belongs to the user)
    const updatedFeedback = await prisma.feedback.updateMany({
      where: {
        id: id,
        userId: user.id
      },
      data: updateData
    })

    if (updatedFeedback.count === 0) {
      return NextResponse.json({ error: 'Feedback not found or unauthorized' }, { status: 404 })
    }

    // Fetch and return the updated feedback
    const result = await prisma.feedback.findFirst({
      where: {
        id: id,
        userId: user.id
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            isDefault: true
          }
        }
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating feedback:', error)
    return NextResponse.json({
      error: 'Failed to update feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}