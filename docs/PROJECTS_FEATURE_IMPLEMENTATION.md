# Projects Feature Implementation

This document outlines the implementation of the Projects feature for FeedbackSense, including database schema changes, migration procedures, and usage guidelines.

## Overview

The Projects feature allows users to organize their feedback, categories, and export data into separate projects. This provides better organization and multi-tenant capabilities within a single user account.

## Database Schema Changes

### New Project Model

```prisma
model Project {
  id            String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId        String          @map("user_id") @db.Uuid
  name          String
  description   String?
  isDefault     Boolean         @default(false) @map("is_default")
  settings      Json?           @default("{}")
  createdAt     DateTime        @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime        @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  user          Profile         @relation(fields: [userId], references: [id], onDelete: Cascade)
  feedback      Feedback[]
  categories    Category[]
  exportHistory ExportHistory[]
  exportTemplates ExportTemplate[]

  @@index([userId])
  @@index([isDefault])
  @@index([createdAt])
  @@unique([userId, name])
  @@map("projects")
}
```

### Updated Models

The following models have been updated to include optional `projectId` fields:

- **Feedback**: Added `projectId` field for project association
- **Category**: Added `projectId` field for project-specific categories
- **ExportHistory**: Added `projectId` field for project-specific export tracking
- **ExportTemplate**: Added `projectId` field for project-specific export templates

## Key Features

### 1. Backward Compatibility
- All `projectId` fields are optional (nullable)
- Existing data remains accessible without projects
- Default projects are created for existing users during migration

### 2. Security
- UUID primary keys for enhanced security
- Proper foreign key constraints with CASCADE/SET NULL rules
- User-based access control maintained

### 3. Performance
- Comprehensive indexing strategy:
  - Individual indexes on `projectId` fields
  - Composite indexes on `(userId, projectId)` for efficient queries
  - Unique constraints where appropriate

### 4. Data Integrity
- Foreign key relationships with appropriate CASCADE rules
- Unique constraints to prevent duplicate project names per user
- Proper constraint handling for categories within projects

## Migration Process

### Automatic Migration

The migration script (`20250618055900_add_projects_feature`) automatically:

1. Creates the `projects` table
2. Adds `project_id` columns to existing tables
3. Creates a default project for each existing user
4. Migrates all existing data to the default project
5. Adds proper indexes and constraints

### Manual Migration Tools

Use the migration script for additional control:

```bash
# Run the full migration
node scripts/migrate-projects-feature.js migrate

# Verify migration success
node scripts/migrate-projects-feature.js verify

# Generate migration report
node scripts/migrate-projects-feature.js report

# Rollback (if needed - destructive!)
node scripts/migrate-projects-feature.js rollback
```

## Database Relationships

### Cascade Rules

- **Project deletion**: Uses `SET NULL` for related data
  - Feedback, categories, export history, and templates remain but lose project association
  - Prevents accidental data loss

- **User deletion**: Uses `CASCADE` for projects
  - When a user is deleted, all their projects are also deleted
  - Related data is handled by existing cascade rules

### Indexes

Performance-optimized indexes have been added:

```sql
-- Project indexes
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");
CREATE INDEX "projects_is_default_idx" ON "projects"("is_default");
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");
CREATE UNIQUE INDEX "projects_user_id_name_key" ON "projects"("user_id", "name");

-- Relationship indexes
CREATE INDEX "feedback_project_id_idx" ON "feedback"("project_id");
CREATE INDEX "feedback_user_id_project_id_idx" ON "feedback"("user_id", "project_id");

CREATE INDEX "categories_project_id_idx" ON "categories"("project_id");
CREATE INDEX "categories_user_id_project_id_idx" ON "categories"("user_id", "project_id");

-- Similar indexes for export_history and export_templates
```

## Usage Guidelines

### Creating Projects

```javascript
// Create a new project
const project = await prisma.project.create({
  data: {
    userId: user.id,
    name: "Mobile App Feedback",
    description: "Feedback for our mobile application",
    settings: {
      autoCategorizationEnabled: true,
      defaultCategory: "bug"
    }
  }
});
```

### Querying with Projects

```javascript
// Get all feedback for a specific project
const projectFeedback = await prisma.feedback.findMany({
  where: {
    userId: user.id,
    projectId: project.id
  },
  include: {
    project: true,
    notes: true
  }
});

// Get all projects for a user with their feedback counts
const userProjects = await prisma.project.findMany({
  where: { userId: user.id },
  include: {
    _count: {
      select: {
        feedback: true,
        categories: true
      }
    }
  }
});
```

### Handling Legacy Data

```javascript
// Query both project-specific and legacy data
const allUserFeedback = await prisma.feedback.findMany({
  where: {
    userId: user.id,
    OR: [
      { projectId: project.id },
      { projectId: null } // Include legacy data without projects
    ]
  }
});
```

## Migration Verification

After running the migration, verify the following:

1. **Default Projects Created**: Each existing user should have at least one default project
2. **Data Migration**: All existing feedback, categories, etc., should be associated with default projects
3. **Constraints**: All foreign key constraints should be properly established
4. **Indexes**: Performance indexes should be created and functional

## Rollback Strategy

If rollback is necessary:

1. Use the rollback script to remove project associations
2. Run a reverse migration to remove the `project_id` columns
3. Drop the `projects` table

**⚠️ Warning**: Rollback is destructive and will permanently remove all project data. Ensure you have a database backup before proceeding.

## API Integration

The projects feature integrates seamlessly with existing APIs:

- All existing endpoints continue to work (backward compatibility)
- New project-specific endpoints can be added
- Filter parameters can include `projectId` for project-specific operations

## Performance Considerations

- Composite indexes on `(userId, projectId)` optimize most common queries
- Project-specific queries are highly efficient
- Legacy data queries (without projects) remain performant
- Consider pagination for large datasets within projects

## Security Considerations

- Project access is controlled at the user level
- UUID primary keys prevent enumeration attacks
- Proper foreign key constraints maintain data integrity
- No direct project access without user authentication

## Future Enhancements

This implementation supports future enhancements such as:

- Project sharing between users
- Project templates
- Advanced project settings and configurations
- Project-specific analytics and reporting
- Bulk project operations

## Testing

Ensure comprehensive testing of:

- Project creation and management
- Data migration accuracy
- Query performance with projects
- Backward compatibility
- Constraint validation
- Rollback procedures

## Support

For issues or questions regarding the Projects feature implementation:

1. Check the migration logs for any errors
2. Run the verification script to ensure data integrity
3. Review the database constraints and indexes
4. Consult the troubleshooting section in the main documentation