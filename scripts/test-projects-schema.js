/**
 * Test script for Projects feature database schema
 * 
 * This script validates:
 * 1. Schema integrity
 * 2. Relationship constraints
 * 3. Index performance
 * 4. Data operations
 * 5. Migration accuracy
 */

import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function testSchemaIntegrity() {
  console.log('🔍 Testing schema integrity...');
  
  try {
    // Test Project model creation
    const testUser = await createTestUser();
    const testProject = await createTestProject(testUser.id);
    
    console.log('✅ Project model creation successful');
    
    // Test relationships
    await testProjectRelationships(testUser.id, testProject.id);
    
    // Test constraints
    await testConstraints(testUser.id, testProject.id);
    
    // Test indexes
    await testIndexes();
    
    // Cleanup
    await cleanup(testUser.id);
    
    console.log('✅ Schema integrity test completed successfully');
    
  } catch (error) {
    console.error('❌ Schema integrity test failed:', error.message);
    throw error;
  }
}

async function createTestUser() {
  const testEmail = `test-${Date.now()}@example.com`;
  
  return await prisma.profile.create({
    data: {
      id: randomUUID(),
      email: testEmail,
      name: 'Test User',
      preferences: {},
      timezone: 'UTC'
    }
  });
}

async function createTestProject(userId) {
  return await prisma.project.create({
    data: {
      userId: userId,
      name: 'Test Project',
      description: 'Test project for schema validation',
      isDefault: false,
      settings: {
        testSetting: 'testValue'
      }
    }
  });
}

async function testProjectRelationships(userId, projectId) {
  console.log('🔗 Testing project relationships...');
  
  // Test Feedback relationship
  const feedback = await prisma.feedback.create({
    data: {
      userId: userId,
      projectId: projectId,
      content: 'Test feedback content',
      source: 'test',
      category: 'test-category',
      sentimentScore: 0.7,
      sentimentLabel: 'positive'
    }
  });
  
  console.log('✅ Feedback-Project relationship working');
  
  // Test Category relationship
  const category = await prisma.category.create({
    data: {
      userId: userId,
      projectId: projectId,
      name: 'Test Category',
      color: '#FF0000'
    }
  });
  
  console.log('✅ Category-Project relationship working');
  
  // Test ExportHistory relationship
  const exportHistory = await prisma.exportHistory.create({
    data: {
      userId: userId,
      projectId: projectId,
      exportType: 'csv',
      configuration: {},
      status: 'completed'
    }
  });
  
  console.log('✅ ExportHistory-Project relationship working');
  
  // Test ExportTemplate relationship
  const exportTemplate = await prisma.exportTemplate.create({
    data: {
      userId: userId,
      projectId: projectId,
      name: 'Test Template',
      configuration: {}
    }
  });
  
  console.log('✅ ExportTemplate-Project relationship working');
  
  // Test cascade behavior
  const projectWithRelations = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      feedback: true,
      categories: true,
      exportHistory: true,
      exportTemplates: true
    }
  });
  
  if (projectWithRelations.feedback.length !== 1 ||
      projectWithRelations.categories.length !== 1 ||
      projectWithRelations.exportHistory.length !== 1 ||
      projectWithRelations.exportTemplates.length !== 1) {
    throw new Error('Project relationships not properly established');
  }
  
  console.log('✅ All project relationships verified');
}

async function testConstraints(userId, projectId) {
  console.log('🔒 Testing database constraints...');
  
  // Test unique constraint on project name per user
  try {
    await prisma.project.create({
      data: {
        userId: userId,
        name: 'Test Project', // Same name as existing project
        description: 'Duplicate name test'
      }
    });
    throw new Error('Unique constraint on project name should have failed');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Unique constraint on project name working');
    } else {
      throw error;
    }
  }
  
  // Test category unique constraint within project
  try {
    await prisma.category.create({
      data: {
        userId: userId,
        projectId: projectId,
        name: 'Test Category', // Same name as existing category in same project
        color: '#00FF00'
      }
    });
    throw new Error('Unique constraint on category name within project should have failed');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Unique constraint on category name within project working');
    } else {
      throw error;
    }
  }
  
  // Test foreign key constraints
  try {
    await prisma.feedback.create({
      data: {
        userId: userId,
        projectId: 'non-existent-project-id',
        content: 'Test content',
        source: 'test'
      }
    });
    throw new Error('Foreign key constraint should have failed');
  } catch (error) {
    if (error.code === 'P2003') {
      console.log('✅ Foreign key constraints working');
    } else {
      throw error;
    }
  }
  
  console.log('✅ All constraints verified');
}

async function testIndexes() {
  console.log('📊 Testing database indexes...');
  
  // Test if indexes exist by running queries that should use them
  const testUserId = randomUUID();
  
  // This should use the userId index
  const startTime = Date.now();
  await prisma.project.findMany({
    where: { userId: testUserId }
  });
  const queryTime = Date.now() - startTime;
  
  if (queryTime > 100) {
    console.warn('⚠️  Query might not be using indexes efficiently');
  } else {
    console.log('✅ Indexes appear to be working efficiently');
  }
  
  // Test composite index query
  await prisma.feedback.findMany({
    where: {
      userId: testUserId,
      projectId: 'test-project-id'
    }
  });
  
  console.log('✅ Index queries completed');
}

async function testBackwardCompatibility() {
  console.log('🔄 Testing backward compatibility...');
  
  const testUser = await createTestUser();
  
  // Test creating feedback without projectId (should work)
  const legacyFeedback = await prisma.feedback.create({
    data: {
      userId: testUser.id,
      content: 'Legacy feedback without project',
      source: 'legacy',
      category: 'general'
    }
  });
  
  if (legacyFeedback.projectId !== null) {
    throw new Error('Legacy feedback should have null projectId');
  }
  
  console.log('✅ Backward compatibility verified');
  
  // Cleanup
  await prisma.feedback.delete({ where: { id: legacyFeedback.id } });
  await prisma.profile.delete({ where: { id: testUser.id } });
}

async function testDataMigration() {
  console.log('📦 Testing data migration scenarios...');
  
  const testUser = await createTestUser();
  
  // Create some test data without projects (simulating pre-migration state)
  const legacyFeedback = await prisma.feedback.create({
    data: {
      userId: testUser.id,
      content: 'Pre-migration feedback',
      source: 'import'
    }
  });
  
  const legacyCategory = await prisma.category.create({
    data: {
      userId: testUser.id,
      name: 'Pre-migration Category'
    }
  });
  
  // Create a default project (simulating migration)
  const defaultProject = await prisma.project.create({
    data: {
      userId: testUser.id,
      name: 'Default Project',
      description: 'Auto-created during migration',
      isDefault: true
    }
  });
  
  // Migrate the legacy data
  await prisma.feedback.update({
    where: { id: legacyFeedback.id },
    data: { projectId: defaultProject.id }
  });
  
  await prisma.category.update({
    where: { id: legacyCategory.id },
    data: { projectId: defaultProject.id }
  });
  
  // Verify migration
  const migratedFeedback = await prisma.feedback.findUnique({
    where: { id: legacyFeedback.id },
    include: { project: true }
  });
  
  const migratedCategory = await prisma.category.findUnique({
    where: { id: legacyCategory.id },
    include: { project: true }
  });
  
  if (!migratedFeedback.project || !migratedCategory.project) {
    throw new Error('Data migration test failed');
  }
  
  console.log('✅ Data migration scenarios verified');
  
  // Cleanup
  await cleanup(testUser.id);
}

async function cleanup(userId) {
  console.log('🧹 Cleaning up test data...');
  
  // Delete in correct order to respect foreign key constraints
  await prisma.feedback.deleteMany({ where: { userId } });
  await prisma.category.deleteMany({ where: { userId } });
  await prisma.exportHistory.deleteMany({ where: { userId } });
  await prisma.exportTemplate.deleteMany({ where: { userId } });
  await prisma.project.deleteMany({ where: { userId } });
  await prisma.profile.delete({ where: { id: userId } });
  
  console.log('✅ Cleanup completed');
}

async function runAllTests() {
  console.log('🚀 Starting Projects feature schema tests...\n');
  
  try {
    await testSchemaIntegrity();
    console.log('');
    
    await testBackwardCompatibility();
    console.log('');
    
    await testDataMigration();
    console.log('');
    
    console.log('🎉 All tests passed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

async function main() {
  const testType = process.argv[2] || 'all';
  
  try {
    switch (testType) {
      case 'schema':
        await testSchemaIntegrity();
        break;
      case 'compatibility':
        await testBackwardCompatibility();
        break;
      case 'migration':
        await testDataMigration();
        break;
      case 'all':
      default:
        await runAllTests();
        break;
    }
  } catch (error) {
    console.error('Test execution failed:', error.message);
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
  testSchemaIntegrity,
  testBackwardCompatibility,
  testDataMigration,
  runAllTests
};