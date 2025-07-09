import { prisma } from './prisma'

export async function checkDatabaseHealth() {
  try {
    // Test basic connection
    await prisma.$connect()
    
    // Test query execution
    const result = await prisma.$queryRaw`SELECT 1 as health_check`
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    
    return {
      status: 'healthy',
      connected: true,
      tablesFound: tables.length,
      tables: tables.map(t => t.table_name),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function testDatabaseOperations() {
  try {
    // Test profile operations
    const profileCount = await prisma.profile.count()
    
    // Test feedback operations  
    const feedbackCount = await prisma.feedback.count()
    
    return {
      status: 'success',
      operations: {
        profileCount,
        feedbackCount
      },
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      status: 'failed',
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }
  }
}