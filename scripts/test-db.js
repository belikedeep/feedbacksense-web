#!/usr/bin/env node

import { PrismaClient } from '@prisma/client'

async function testDatabase() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  })

  console.log('🔍 Testing database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
  
  try {
    // Test connection
    console.log('\n1. Testing basic connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')

    // Test raw query
    console.log('\n2. Testing raw query...')
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Raw query executed:', result)

    // Check tables
    console.log('\n3. Checking tables...')
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    `
    console.log('✅ Tables found:', tables.map(t => t.table_name))

    // Test profile operations
    console.log('\n4. Testing profile operations...')
    const profileCount = await prisma.profile.count()
    console.log('✅ Profile count:', profileCount)

    // Test feedback operations
    console.log('\n5. Testing feedback operations...')
    const feedbackCount = await prisma.feedback.count()
    console.log('✅ Feedback count:', feedbackCount)

    console.log('\n🎉 All database tests passed!')

  } catch (error) {
    console.error('\n❌ Database test failed:')
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    
    if (error.code === 'P1001') {
      console.error('\n💡 This is a connection error. Please check:')
      console.error('   - Database server is running')
      console.error('   - DATABASE_URL is correct')
      console.error('   - Network connectivity')
      console.error('   - Firewall settings')
    }
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()