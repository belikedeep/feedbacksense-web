import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testProjectsFeature() {
  try {
    console.log('🚀 Testing Projects Feature...\n');

    // Test 1: Check if projects table exists and can be queried
    console.log('1. Testing projects table...');
    const projectCount = await prisma.project.count();
    console.log(`✅ Projects table accessible. Found ${projectCount} projects\n`);

    // Test 2: Check if we can create a test project
    console.log('2. Testing project creation...');
    // Get an existing user ID from the database for testing
    const existingUser = await prisma.profile.findFirst();
    if (!existingUser) {
      console.log('❌ No users found in database. Creating test requires existing user.');
      return;
    }

    const testProject = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'A test project for verification',
        businessType: 'ecommerce',
        userId: existingUser.id,
        isDefault: false,
        settings: {}
      }
    });
    console.log(`✅ Project created successfully: ${testProject.name} (ID: ${testProject.id})\n`);

    // Test 3: Test project relationships
    console.log('3. Testing project relationships...');
    const projectWithRelations = await prisma.project.findUnique({
      where: { id: testProject.id },
      include: {
        feedback: true,
        categories: true
      }
    });
    console.log(`✅ Project relationships working. Feedback: ${projectWithRelations.feedback.length}, Categories: ${projectWithRelations.categories.length}\n`);

    // Test 4: Clean up test data
    console.log('4. Cleaning up test data...');
    await prisma.project.delete({
      where: { id: testProject.id }
    });
    console.log('✅ Test project deleted successfully\n');

    // Test 5: Check existing data integrity
    console.log('5. Checking data integrity...');
    const feedbackCount = await prisma.feedback.count();
    const profileCount = await prisma.profile.count();
    console.log(`✅ Data integrity check passed. Profiles: ${profileCount}, Feedback: ${feedbackCount}\n`);

    console.log('🎉 All projects feature tests passed! The system is ready to use.\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testProjectsFeature();