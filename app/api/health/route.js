import { NextResponse } from 'next/server'
import { checkDatabaseHealth, testDatabaseOperations } from '@/lib/db-health'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const detailed = searchParams.get('detailed') === 'true'
    
    // Basic health check
    const healthCheck = await checkDatabaseHealth()
    
    const response = {
      service: 'feedbacksense-api',
      timestamp: new Date().toISOString(),
      database: healthCheck
    }
    
    // Add detailed operations test if requested
    if (detailed && healthCheck.connected) {
      const operationsTest = await testDatabaseOperations()
      response.operations = operationsTest
    }
    
    // Return appropriate status code
    const statusCode = healthCheck.connected ? 200 : 503
    
    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      service: 'feedbacksense-api',
      timestamp: new Date().toISOString(),
      database: {
        status: 'error',
        connected: false,
        error: error.message
      }
    }, { status: 503 })
  }
}