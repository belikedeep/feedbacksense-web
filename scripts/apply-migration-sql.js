import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function applyMigrationSQL() {
  console.log('🚀 Applying Projects feature migration SQL...');
  
  try {
    // Read the migration SQL file
    const migrationPath = join(process.cwd(), 'prisma/migrations/20250618055900_add_projects_feature/migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration SQL loaded successfully');
    
    // Split the SQL into logical blocks and execute them properly
    console.log('⚡ Executing migration SQL in logical blocks...');
    
    // Define migration steps in logical order
    const migrationSteps = [
      {
        name: 'Create projects table',
        sql: `CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);`
      },
      {
        name: 'Add foreign key constraint',
        sql: `ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;`
      },
      {
        name: 'Create indexes for projects table',
        sql: `CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "projects_is_default_idx" ON "projects"("is_default");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "projects_user_id_name_key" ON "projects"("user_id", "name");`
      },
      {
        name: 'Add project_id columns to existing tables',
        sql: `ALTER TABLE "feedback" ADD COLUMN "project_id" UUID;
ALTER TABLE "categories" ADD COLUMN "project_id" UUID;`
      },
      {
        name: 'Create default projects and migrate data',
        sql: `DO $$
DECLARE
    user_record RECORD;
    default_project_id UUID;
BEGIN
    FOR user_record IN SELECT id FROM profiles LOOP
        INSERT INTO projects (user_id, name, description, is_default, created_at, updated_at)
        VALUES (user_record.id, 'Default Project', 'Auto-created default project for existing data', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id INTO default_project_id;
        
        UPDATE feedback
        SET project_id = default_project_id
        WHERE user_id = user_record.id AND project_id IS NULL;
        
        UPDATE categories
        SET project_id = default_project_id
        WHERE user_id = user_record.id AND project_id IS NULL;
        
    END LOOP;
END $$;`
      },
      {
        name: 'Add foreign key constraints for project relationships',
        sql: `ALTER TABLE "feedback" ADD CONSTRAINT "feedback_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;`
      },
      {
        name: 'Create indexes for project relationships',
        sql: `CREATE INDEX "feedback_project_id_idx" ON "feedback"("project_id");
CREATE INDEX "feedback_user_id_project_id_idx" ON "feedback"("user_id", "project_id");
CREATE INDEX "categories_project_id_idx" ON "categories"("project_id");
CREATE INDEX "categories_user_id_project_id_idx" ON "categories"("user_id", "project_id");`
      },
      {
        name: 'Add unique constraint for categories',
        sql: `CREATE UNIQUE INDEX "categories_user_id_project_id_name_key" ON "categories"("user_id", "project_id", "name");`
      },
      {
        name: 'Create updated_at trigger function',
        sql: `CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';`
      },
      {
        name: 'Create updated_at trigger for projects',
        sql: `CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
      }
    ];
    
    // Execute each step
    for (let i = 0; i < migrationSteps.length; i++) {
      const step = migrationSteps[i];
      
      try {
        console.log(`⚡ Step ${i + 1}/${migrationSteps.length}: ${step.name}...`);
        
        // Handle DO blocks and functions with dollar quotes specially (don't split them)
        if (step.sql.includes('DO $$') || step.sql.includes('$$ language')) {
          await prisma.$executeRawUnsafe(step.sql);
        } else {
          // Split multi-statement blocks by semicolon and execute individually
          const statements = step.sql.split(';').filter(stmt => stmt.trim().length > 0);
          
          for (const statement of statements) {
            if (statement.trim()) {
              await prisma.$executeRawUnsafe(statement.trim() + ';');
            }
          }
        }
        
        console.log(`✅ Step ${i + 1} completed successfully`);
        
      } catch (error) {
        // Some errors might be expected (like already exists)
        if (error.message.includes('already exists') ||
            error.message.includes('relation "projects" already exists') ||
            error.message.includes('column "project_id" of relation') ||
            error.message.includes('constraint') && error.message.includes('already exists')) {
          console.log(`⚠️  Step ${i + 1} skipped - already exists`);
        } else {
          console.error(`❌ Error in step ${i + 1} (${step.name}):`, error.message);
          throw error;
        }
      }
    }
    
    console.log('🎉 Migration SQL applied successfully!');
    
    // Verify the migration
    await verifyMigration();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  try {
    // Check if projects table exists
    const projectCount = await prisma.project.count();
    console.log(`📊 Found ${projectCount} projects in the database`);
    
    // Check if project columns were added to other tables
    const feedbackWithProjects = await prisma.feedback.count({
      where: { projectId: { not: null } }
    });
    const totalFeedback = await prisma.feedback.count();
    
    console.log(`📈 ${feedbackWithProjects}/${totalFeedback} feedback entries have project associations`);
    
    // Check users and their projects
    const users = await prisma.profile.findMany({
      include: {
        projects: true
      }
    });
    
    console.log(`👤 Users with projects:`);
    for (const user of users) {
      console.log(`   - ${user.email || user.id}: ${user.projects.length} project(s)`);
    }
    
    console.log('✅ Migration verification completed!');
    
  } catch (error) {
    console.error('❌ Migration verification failed:', error.message);
    throw error;
  }
}

async function main() {
  try {
    await applyMigrationSQL();
    console.log('🎉 Projects feature migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration process failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();