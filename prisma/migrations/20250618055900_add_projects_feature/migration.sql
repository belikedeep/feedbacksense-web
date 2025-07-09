-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "projects_is_default_idx" ON "projects"("is_default");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "projects_user_id_name_key" ON "projects"("user_id", "name");

-- Add projectId columns to existing tables
ALTER TABLE "feedback" ADD COLUMN "project_id" UUID;
ALTER TABLE "categories" ADD COLUMN "project_id" UUID;
ALTER TABLE "export_history" ADD COLUMN "project_id" UUID;
ALTER TABLE "export_templates" ADD COLUMN "project_id" UUID;

-- Create default project for each existing user and migrate data
DO $$
DECLARE
    user_record RECORD;
    default_project_id UUID;
BEGIN
    -- Loop through all existing users
    FOR user_record IN SELECT id FROM profiles LOOP
        -- Create default project for this user
        INSERT INTO projects (user_id, name, description, is_default, created_at, updated_at)
        VALUES (user_record.id, 'Default Project', 'Auto-created default project for existing data', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id INTO default_project_id;
        
        -- Migrate existing feedback to default project
        UPDATE feedback 
        SET project_id = default_project_id 
        WHERE user_id = user_record.id AND project_id IS NULL;
        
        -- Migrate existing categories to default project
        UPDATE categories 
        SET project_id = default_project_id 
        WHERE user_id = user_record.id AND project_id IS NULL;
        
        -- Migrate existing export history to default project
        UPDATE export_history 
        SET project_id = default_project_id 
        WHERE user_id = user_record.id AND project_id IS NULL;
        
        -- Migrate existing export templates to default project
        UPDATE export_templates 
        SET project_id = default_project_id 
        WHERE user_id = user_record.id AND project_id IS NULL;
    END LOOP;
END $$;

-- Add foreign key constraints for project relationships
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "categories" ADD CONSTRAINT "categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "export_history" ADD CONSTRAINT "export_history_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "export_templates" ADD CONSTRAINT "export_templates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create indexes for project relationships
CREATE INDEX "feedback_project_id_idx" ON "feedback"("project_id");
CREATE INDEX "feedback_user_id_project_id_idx" ON "feedback"("user_id", "project_id");

CREATE INDEX "categories_project_id_idx" ON "categories"("project_id");
CREATE INDEX "categories_user_id_project_id_idx" ON "categories"("user_id", "project_id");

CREATE INDEX "export_history_project_id_idx" ON "export_history"("project_id");
CREATE INDEX "export_history_user_id_project_id_idx" ON "export_history"("user_id", "project_id");

CREATE INDEX "export_templates_project_id_idx" ON "export_templates"("project_id");
CREATE INDEX "export_templates_user_id_project_id_idx" ON "export_templates"("user_id", "project_id");

-- Add unique constraint for categories within projects
CREATE UNIQUE INDEX "categories_user_id_project_id_name_key" ON "categories"("user_id", "project_id", "name");

-- Update the updated_at trigger for projects table (if using triggers)
-- This assumes you have a trigger function for updated_at columns
-- If not using triggers, this can be omitted
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for projects table
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();