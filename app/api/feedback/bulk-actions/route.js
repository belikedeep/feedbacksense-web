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
    const {
      action,
      feedbackIds,
      data: actionData,
      confirmPermanentDelete = false,
      projectId
    } = body

    if (!Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return NextResponse.json({ error: 'No feedback IDs provided' }, { status: 400 })
    }

    // Validate that all feedback belongs to the user and optionally to the specified project
    const whereClause = {
      id: { in: feedbackIds },
      userId: user.id
    }
    
    if (projectId) {
      whereClause.projectId = projectId
    }
    
    const userFeedback = await prisma.feedback.findMany({
      where: whereClause,
      select: { id: true }
    })

    if (userFeedback.length !== feedbackIds.length) {
      return NextResponse.json({ 
        error: 'Some feedback items not found or unauthorized' 
      }, { status: 403 })
    }

    let result = { success: true, processed: 0, errors: [] }

    switch (action) {
      case 'updateStatus':
        if (!actionData?.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 })
        }
        
        result = await updateBulkStatus(feedbackIds, actionData.status, user.id)
        break

      case 'updatePriority':
        if (!actionData?.priority) {
          return NextResponse.json({ error: 'Priority is required' }, { status: 400 })
        }
        
        result = await updateBulkPriority(feedbackIds, actionData.priority, user.id)
        break

      case 'archive':
        result = await archiveBulkFeedback(feedbackIds, true, user.id)
        break

      case 'unarchive':
        result = await archiveBulkFeedback(feedbackIds, false, user.id)
        break

      case 'delete':
        if (!confirmPermanentDelete) {
          return NextResponse.json({ 
            error: 'Permanent delete confirmation required',
            requiresConfirmation: true
          }, { status: 400 })
        }
        
        result = await deleteBulkFeedback(feedbackIds, user.id)
        break

      case 'updateCategory':
        if (!actionData?.category) {
          return NextResponse.json({ error: 'Category is required' }, { status: 400 })
        }
        
        result = await updateBulkCategory(feedbackIds, actionData.category, user.id)
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in bulk actions:', error)
    return NextResponse.json({ 
      error: 'Failed to perform bulk action',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}

async function updateBulkStatus(feedbackIds, status, userId) {
  try {
    const updateResult = await prisma.feedback.updateMany({
      where: {
        id: { in: feedbackIds },
        userId: userId
      },
      data: {
        status: status,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      }
    })

    return {
      success: true,
      processed: updateResult.count,
      action: 'status_update',
      data: { status }
    }
  } catch (error) {
    console.error('Error updating bulk status:', error)
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    }
  }
}

async function updateBulkPriority(feedbackIds, priority, userId) {
  try {
    const updateResult = await prisma.feedback.updateMany({
      where: {
        id: { in: feedbackIds },
        userId: userId
      },
      data: {
        priority: priority,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      }
    })

    return {
      success: true,
      processed: updateResult.count,
      action: 'priority_update',
      data: { priority }
    }
  } catch (error) {
    console.error('Error updating bulk priority:', error)
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    }
  }
}

async function archiveBulkFeedback(feedbackIds, isArchived, userId) {
  try {
    const updateData = {
      isArchived: isArchived,
      lastEditedBy: userId,
      lastEditedAt: new Date()
    }

    if (isArchived) {
      updateData.archivedAt = new Date()
    } else {
      updateData.archivedAt = null
    }

    const updateResult = await prisma.feedback.updateMany({
      where: {
        id: { in: feedbackIds },
        userId: userId
      },
      data: updateData
    })

    return {
      success: true,
      processed: updateResult.count,
      action: isArchived ? 'archive' : 'unarchive'
    }
  } catch (error) {
    console.error('Error archiving bulk feedback:', error)
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    }
  }
}

async function deleteBulkFeedback(feedbackIds, userId) {
  try {
    // First delete related notes
    await prisma.feedbackNote.deleteMany({
      where: {
        feedbackId: { in: feedbackIds }
      }
    })

    // Then delete feedback
    const deleteResult = await prisma.feedback.deleteMany({
      where: {
        id: { in: feedbackIds },
        userId: userId
      }
    })

    return {
      success: true,
      processed: deleteResult.count,
      action: 'delete'
    }
  } catch (error) {
    console.error('Error deleting bulk feedback:', error)
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    }
  }
}

async function updateBulkCategory(feedbackIds, category, userId) {
  try {
    const updateResult = await prisma.feedback.updateMany({
      where: {
        id: { in: feedbackIds },
        userId: userId
      },
      data: {
        category: category,
        manualOverride: true,
        lastEditedBy: userId,
        lastEditedAt: new Date()
      }
    })

    return {
      success: true,
      processed: updateResult.count,
      action: 'category_update',
      data: { category }
    }
  } catch (error) {
    console.error('Error updating bulk category:', error)
    return {
      success: false,
      processed: 0,
      errors: [error.message]
    }
  }
}