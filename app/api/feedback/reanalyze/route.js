import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'
import { batchReanalyzeFeedback } from '@/lib/sentimentAnalysis'
import { getBatchConfig } from '@/lib/batchConfig'

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

    // Parse request body for query parameters
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
      // Continue with empty body for backward compatibility
    }

    // Get optimal batch configuration for reanalysis
    const batchConfig = getBatchConfig('reanalysis')
    
    const {
      categories = [],
      sources = [],
      dateFrom = null,
      dateTo = null,
      batchSize = batchConfig.batchSize,
      projectId = null
    } = body

    // Build where clause based on filters
    const whereClause = {
      userId: user.id
    }

    if (categories.length > 0) {
      whereClause.category = { in: categories }
    }

    if (sources.length > 0) {
      whereClause.source = { in: sources }
    }

    if (dateFrom || dateTo) {
      whereClause.feedbackDate = {}
      if (dateFrom) whereClause.feedbackDate.gte = new Date(dateFrom)
      if (dateTo) whereClause.feedbackDate.lte = new Date(dateTo)
    }

    if (projectId) {
      whereClause.projectId = projectId
    } else {
      // If no specific project requested, filter by default project
      const defaultProject = await prisma.project.findFirst({
        where: {
          userId: user.id,
          isDefault: true
        }
      })
      
      if (defaultProject) {
        whereClause.projectId = defaultProject.id
      }
      // If no default project, analyze all feedback (backward compatibility)
    }

    // Get filtered feedback for this user
    const feedback = await prisma.feedback.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    console.log(`Re-analyzing ${feedback.length} feedback entries with AI categorization...`)

    if (feedback.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        message: 'No feedback found matching the specified criteria'
      })
    }

    // Process using efficient batch analysis
    const results = {
      total: feedback.length,
      processed: 0,
      failed: 0,
      errors: []
    }

    console.log(`🚀 Starting optimized batch re-analysis: ${feedback.length} items using ${batchConfig.description} (batch size: ${batchSize})`)

    try {
      // Prepare feedback items for batch processing
      const feedbackItems = feedback.map(f => ({
        id: f.id,
        content: f.content,
        classificationHistory: Array.isArray(f.classificationHistory)
          ? f.classificationHistory
          : []
      }))

      // Use batch re-analysis function with progress tracking
      const analysisResults = await batchReanalyzeFeedback(
        feedbackItems,
        batchSize,
        (progress) => {
          console.log(`Batch progress: ${progress.processed}/${progress.total} (${progress.percentage}%) - Batch ${progress.batchesCompleted}/${progress.totalBatches}`)
        }
      )

      console.log(`Batch analysis complete. Updating ${analysisResults.length} feedback records in database...`)

      // Update all feedback records in the database
      const updatePromises = analysisResults.map(async (analysis) => {
        try {
          const updatedFeedback = await prisma.feedback.update({
            where: { id: analysis.id },
            data: {
              category: analysis.aiCategory,
              sentimentScore: analysis.sentimentScore,
              sentimentLabel: analysis.sentimentLabel,
              topics: analysis.topics,
              aiCategoryConfidence: analysis.aiCategoryConfidence,
              aiClassificationMeta: analysis.classificationMeta,
              classificationHistory: analysis.classificationHistory,
              manualOverride: false // Reset manual override since we're re-analyzing
            }
          })

          results.processed++
          return updatedFeedback
        } catch (updateError) {
          console.error(`Failed to update feedback ${analysis.id}:`, updateError)
          results.failed++
          results.errors.push({
            feedbackId: analysis.id,
            error: updateError.message
          })
          return null
        }
      })

      // Wait for all database updates to complete
      await Promise.all(updatePromises)

    } catch (batchError) {
      console.error('Batch re-analysis failed:', batchError)
      results.failed = feedback.length
      results.errors.push({
        error: `Batch processing failed: ${batchError.message}`
      })
    }

    console.log(`Re-analysis complete: ${results.processed} processed, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      ...results,
      message: `Successfully re-analyzed ${results.processed}/${results.total} feedback entries`
    })

  } catch (error) {
    console.error('Error re-analyzing feedback:', error)
    return NextResponse.json({
      error: 'Failed to re-analyze feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 })
  }
}