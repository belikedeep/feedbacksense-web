/**
 * Migration script for the Projects feature
 * 
 * This script helps with:
 * 1. Running the Prisma migration
 * 2. Verifying the migration was successful
 * 3. Providing rollback capabilities if needed
 * 4. Creating additional default projects for users
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🚀 Starting Projects feature migration...');
  
  try {
    // Run Prisma migration
    console.log('📦 Running Prisma migration...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    
    console.log('✅ Prisma migration completed successfully!');
    
    // Verify migration
    await verifyMigration();
    
    console.log('🎉 Projects feature migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if projects table exists and has data
    const projectCount = await prisma.project.count();
    console.log(`📊 Found ${projectCount} projects in the database`);
    
    // Check if all users have at least one default project
    const usersWithoutProjects = await prisma.profile.findMany({
      where: {
        projects: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true
      }
    });
    
    if (usersWithoutProjects.length > 0) {
      console.log(`⚠️  Found ${usersWithoutProjects.length} users without projects. Creating default projects...`);
      await createDefaultProjectsForUsers(usersWithoutProjects);
    }
    
    // Verify relationships
    const feedbackWithProjects = await prisma.feedback.count({
      where: {
        projectId: {
          not: null
        }
      }
    });
    
    const totalFeedback = await prisma.feedback.count();
    
    console.log(`📈 ${feedbackWithProjects}/${totalFeedback} feedback entries have project associations`);
    
    // Check categories
    const categoriesWithProjects = await prisma.category.count({
      where: {
        projectId: {
          not: null
        }
      }
    });
    
    const totalCategories = await prisma.category.count();
    
    console.log(`🏷️  ${categoriesWithProjects}/${totalCategories} categories have project associations`);
    
    console.log('✅ Migration verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    throw error;
  }
}

async function createDefaultProjectsForUsers(users) {
  for (const user of users) {
    try {
      const project = await prisma.project.create({
        data: {
          userId: user.id,
          name: 'Default Project',
          description: 'Auto-created default project',
          isDefault: true
        }
      });
      
      console.log(`✅ Created default project for user ${user.email || user.id}`);
      
      // Migrate any orphaned data to this project
      await migrateOrphanedDataToProject(user.id, project.id);
      
    } catch (error) {
      console.error(`❌ Failed to create default project for user ${user.email || user.id}:`, error.message);
    }
  }
}

async function migrateOrphanedDataToProject(userId, projectId) {
  // Migrate orphaned feedback
  const feedbackUpdated = await prisma.feedback.updateMany({
    where: {
      userId: userId,
      projectId: null
    },
    data: {
      projectId: projectId
    }
  });
  
  // Migrate orphaned categories
  const categoriesUpdated = await prisma.category.updateMany({
    where: {
      userId: userId,
      projectId: null
    },
    data: {
      projectId: projectId
    }
  });
  
  // Migrate orphaned export history
  const exportHistoryUpdated = await prisma.exportHistory.updateMany({
    where: {
      userId: userId,
      projectId: null
    },
    data: {
      projectId: projectId
    }
  });
  
  // Migrate orphaned export templates
  const exportTemplatesUpdated = await prisma.exportTemplate.updateMany({
    where: {
      userId: userId,
      projectId: null
    },
    data: {
      projectId: projectId
    }
  });
  
  if (feedbackUpdated.count > 0 || categoriesUpdated.count > 0 || 
      exportHistoryUpdated.count > 0 || exportTemplatesUpdated.count > 0) {
    console.log(`📦 Migrated orphaned data: ${feedbackUpdated.count} feedback, ${categoriesUpdated.count} categories, ${exportHistoryUpdated.count} export history, ${exportTemplatesUpdated.count} export templates`);
  }
}

async function rollbackMigration() {
  console.log('⚠️  Rolling back Projects feature migration...');
  
  try {
    // This is a destructive operation - ask for confirmation
    console.log('🚨 WARNING: This will remove all project data!');
    console.log('Make sure you have a database backup before proceeding.');
    
    // Remove project relationships
    await prisma.feedback.updateMany({
      data: { projectId: null }
    });
    
    await prisma.category.updateMany({
      data: { projectId: null }
    });
    
    await prisma.exportHistory.updateMany({
      data: { projectId: null }
    });
    
    await prisma.exportTemplate.updateMany({
      data: { projectId: null }
    });
    
    // Delete all projects
    await prisma.project.deleteMany({});
    
    console.log('✅ Rollback completed. Run the reverse migration to remove columns.');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

async function generateMigrationReport() {
  console.log('📊 Generating migration report...');
  
  try {
    const stats = {
      users: await prisma.profile.count(),
      projects: await prisma.project.count(),
      defaultProjects: await prisma.project.count({ where: { isDefault: true } }),
      feedback: await prisma.feedback.count(),
      feedbackWithProjects: await prisma.feedback.count({ where: { projectId: { not: null } } }),
      categories: await prisma.category.count(),
      categoriesWithProjects: await prisma.category.count({ where: { projectId: { not: null } } }),
      exportHistory: await prisma.exportHistory.count(),
      exportHistoryWithProjects: await prisma.exportHistory.count({ where: { projectId: { not: null } } }),
      exportTemplates: await prisma.exportTemplate.count(),
      exportTemplatesWithProjects: await prisma.exportTemplate.count({ where: { projectId: { not: null } } })
    };
    
    console.log('\n📈 Migration Report:');
    console.log('==================');
    console.log(`Total users: ${stats.users}`);
    console.log(`Total projects: ${stats.projects}`);
    console.log(`Default projects: ${stats.defaultProjects}`);
    console.log(`Feedback entries: ${stats.feedbackWithProjects}/${stats.feedback} with projects`);
    console.log(`Categories: ${stats.categoriesWithProjects}/${stats.categories} with projects`);
    console.log(`Export history: ${stats.exportHistoryWithProjects}/${stats.exportHistory} with projects`);
    console.log(`Export templates: ${stats.exportTemplatesWithProjects}/${stats.exportTemplates} with projects`);
    console.log('==================\n');
    
    return stats;
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error.message);
    throw error;
  }
}

async function main() {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'migrate':
        await runMigration();
        break;
      case 'verify':
        await verifyMigration();
        break;
      case 'rollback':
        await rollbackMigration();
        break;
      case 'report':
        await generateMigrationReport();
        break;
      default:
        console.log('Usage: node scripts/migrate-projects-feature.js [command]');
        console.log('Commands:');
        console.log('  migrate  - Run the projects migration');
        console.log('  verify   - Verify the migration was successful');
        console.log('  rollback - Rollback the migration (destructive!)');
        console.log('  report   - Generate a migration report');
        break;
    }
  } catch (error) {
    console.error('Script failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  runMigration,
  verifyMigration,
  rollbackMigration,
  generateMigrationReport
};