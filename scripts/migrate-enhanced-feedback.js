/**
 * Migration script for Enhanced Feedback Management System
 * 
 * This script helps migrate existing FeedbackSense installations to support
 * the new enhanced feedback management features.
 * 
 * Run with: node scripts/migrate-enhanced-feedback.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient()

async function migrateEnhancedFeedback() {
  console.log('🚀 Starting Enhanced Feedback Management migration...')
  
  try {
    // Check if we're already migrated
    const sampleFeedback = await prisma.feedback.findFirst()
    if (sampleFeedback && typeof sampleFeedback.status !== 'undefined') {
      console.log('✅ Database appears to already be migrated. Checking data consistency...')
      await checkDataConsistency()
      return
    }

    console.log('📊 Analyzing existing feedback data...')
    
    // Get total count for progress tracking
    const totalFeedback = await prisma.feedback.count()
    console.log(`📈 Found ${totalFeedback} feedback items to migrate`)

    if (totalFeedback === 0) {
      console.log('ℹ️ No existing feedback to migrate. Schema is ready for new features.')
      return
    }

    // Note: In a real migration, you would run prisma migrate commands first
    // This script assumes the schema has already been updated via Prisma migrations
    
    console.log('🔄 Setting default values for new fields...')
    
    // Update existing feedback with default values
    // Note: This should be done in batches for large datasets
    const batchSize = 100
    let processed = 0
    
    while (processed < totalFeedback) {
      const batch = await prisma.feedback.findMany({
        skip: processed,
        take: batchSize,
        select: { id: true }
      })
      
      if (batch.length === 0) break
      
      const ids = batch.map(item => item.id)
      
      await prisma.feedback.updateMany({
        where: {
          id: { in: ids }
        },
        data: {
          status: 'new',
          priority: 'medium',
          isArchived: false,
          editHistory: [],
          lastEditedBy: null,
          lastEditedAt: null
        }
      })
      
      processed += batch.length
      const percentage = Math.round((processed / totalFeedback) * 100)
      console.log(`📊 Migration progress: ${processed}/${totalFeedback} (${percentage}%)`)
    }

    console.log('✅ Enhanced Feedback Management migration completed successfully!')
    console.log('')
    console.log('🎉 New features available:')
    console.log('   • Edit feedback with full history tracking')
    console.log('   • Status management (New, In Review, Resolved, Archived)')
    console.log('   • Priority levels (High, Medium, Low)')
    console.log('   • Internal notes and team collaboration')
    console.log('   • Enhanced bulk operations')
    console.log('   • Advanced filtering and search')
    console.log('   • Archive management')
    console.log('')
    console.log('📚 See docs/ENHANCED_FEEDBACK_MANAGEMENT.md for detailed documentation')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.log('')
    console.log('🔧 Troubleshooting steps:')
    console.log('1. Ensure database is accessible')
    console.log('2. Run `npx prisma migrate dev` to apply schema changes')
    console.log('3. Check database permissions')
    console.log('4. Verify environment variables are correct')
    throw error
  }
}

async function checkDataConsistency() {
  console.log('🔍 Checking data consistency...')
  
  try {
    // Check for any feedback without proper default values
    const inconsistentFeedback = await prisma.feedback.count({
      where: {
        OR: [
          { status: null },
          { priority: null },
          { isArchived: null }
        ]
      }
    })
    
    if (inconsistentFeedback > 0) {
      console.log(`⚠️ Found ${inconsistentFeedback} feedback items with missing default values`)
      console.log('🔄 Fixing inconsistent data...')
      
      await prisma.feedback.updateMany({
        where: {
          OR: [
            { status: null },
            { priority: null },
            { isArchived: null }
          ]
        },
        data: {
          status: 'new',
          priority: 'medium',
          isArchived: false
        }
      })
      
      console.log('✅ Fixed inconsistent data')
    }
    
    // Verify all required tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('feedback', 'feedback_notes', 'profiles')
    `
    
    console.log('📋 Database tables verified:')
    tables.forEach(table => {
      console.log(`   ✓ ${table.table_name}`)
    })
    
    console.log('✅ Data consistency check completed')
    
  } catch (error) {
    console.error('❌ Data consistency check failed:', error)
    throw error
  }
}

async function displayStatistics() {
  console.log('')
  console.log('📊 Enhanced Feedback Management Statistics:')
  console.log('='*50)
  
  try {
    const totalFeedback = await prisma.feedback.count()
    console.log(`Total Feedback Items: ${totalFeedback}`)
    
    if (totalFeedback > 0) {
      // Status distribution
      const statusStats = await prisma.feedback.groupBy({
        by: ['status'],
        _count: { status: true }
      })
      
      console.log('\nStatus Distribution:')
      statusStats.forEach(stat => {
        const percentage = ((stat._count.status / totalFeedback) * 100).toFixed(1)
        console.log(`   ${stat.status || 'new'}: ${stat._count.status} (${percentage}%)`)
      })
      
      // Priority distribution
      const priorityStats = await prisma.feedback.groupBy({
        by: ['priority'],
        _count: { priority: true }
      })
      
      console.log('\nPriority Distribution:')
      priorityStats.forEach(stat => {
        const percentage = ((stat._count.priority / totalFeedback) * 100).toFixed(1)
        console.log(`   ${stat.priority || 'medium'}: ${stat._count.priority} (${percentage}%)`)
      })
      
      // Archive statistics
      const archivedCount = await prisma.feedback.count({
        where: { isArchived: true }
      })
      
      console.log('\nArchive Status:')
      console.log(`   Active: ${totalFeedback - archivedCount}`)
      console.log(`   Archived: ${archivedCount}`)
      
      // Notes statistics
      const totalNotes = await prisma.feedbackNote.count()
      const feedbackWithNotes = await prisma.feedback.count({
        where: {
          notes: {
            some: {}
          }
        }
      })
      
      console.log('\nCollaboration Statistics:')
      console.log(`   Total Notes: ${totalNotes}`)
      console.log(`   Feedback with Notes: ${feedbackWithNotes}`)
      
      if (totalNotes > 0) {
        const avgNotesPerFeedback = (totalNotes / feedbackWithNotes).toFixed(1)
        console.log(`   Average Notes per Feedback: ${avgNotesPerFeedback}`)
      }
    }
    
  } catch (error) {
    console.log('⚠️ Could not generate statistics:', error.message)
  }
}

// Main execution
async function main() {
  try {
    await migrateEnhancedFeedback()
    await displayStatistics()
    
  } catch (error) {
    console.error('Migration process failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the migration if this script is executed directly
if (import.meta.url === process.argv[1]) {
  main()
}

export default {
  migrateEnhancedFeedback,
  checkDataConsistency,
  displayStatistics
}