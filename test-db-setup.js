import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test if all tables exist
    const tables = [
      'profiles',
      'feedback', 
      'categories',
      'feedback_notes',
      'activity_logs'
    ];
    
    console.log('\n📋 Checking table structure...');
    for (const table of tables) {
      try {
        const count = await prisma.$queryRaw`SELECT COUNT(*) FROM ${Prisma.sql([table])}`;
        console.log(`✅ Table '${table}' exists - Records: ${count[0].count}`);
      } catch (error) {
        console.log(`❌ Table '${table}' error: ${error.message}`);
      }
    }
    
    // Test RLS policies by checking if they exist
    console.log('\n🔒 Checking RLS policies...');
    const policies = await prisma.$queryRaw`
      SELECT schemaname, tablename, policyname, cmd 
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `;
    
    if (policies.length > 0) {
      console.log(`✅ Found ${policies.length} RLS policies:`);
      policies.forEach(policy => {
        console.log(`   - ${policy.tablename}: ${policy.policyname} (${policy.cmd})`);
      });
    } else {
      console.log('❌ No RLS policies found');
    }
    
    // Test triggers
    console.log('\n⚡ Checking triggers...');
    const triggers = await prisma.$queryRaw`
      SELECT trigger_name, event_object_table, action_timing, event_manipulation
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `;
    
    if (triggers.length > 0) {
      console.log(`✅ Found ${triggers.length} triggers:`);
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.event_object_table}: ${trigger.trigger_name} (${trigger.action_timing} ${trigger.event_manipulation})`);
      });
    } else {
      console.log('❌ No triggers found');
    }
    
    console.log('\n🎉 Database setup test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();