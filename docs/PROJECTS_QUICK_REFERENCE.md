# Projects Feature - Quick Reference Guide

A developer's quick reference for implementing and using the Projects feature in FeedbackSense.

## Database Schema Quick Reference

### Project Model
```prisma
model Project {
  id          String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  name        String
  description String?
  isDefault   Boolean  @default(false) @map("is_default")
  settings    Json?    @default("{}")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
}
```

### Updated Models with Project Relations
- [`Feedback`](prisma/schema.prisma:29) - Added optional `projectId`
- [`Category`](prisma/schema.prisma:69) - Added optional `projectId`
- [`ExportHistory`](prisma/schema.prisma:117) - Added optional `projectId`
- [`ExportTemplate`](prisma/schema.prisma:142) - Added optional `projectId`

## Common Queries

### Create Project
```javascript
const project = await prisma.project.create({
  data: {
    userId: user.id,
    name: "My New Project",
    description: "Project description",
    settings: { autoCategorizationEnabled: true }
  }
});
```

### Get User's Projects
```javascript
const projects = await prisma.project.findMany({
  where: { userId: user.id },
  include: {
    _count: {
      select: {
        feedback: true,
        categories: true
      }
    }
  },
  orderBy: [
    { isDefault: 'desc' },
    { createdAt: 'desc' }
  ]
});
```

### Get Default Project
```javascript
const defaultProject = await prisma.project.findFirst({
  where: {
    userId: user.id,
    isDefault: true
  }
});
```

### Create Feedback with Project
```javascript
const feedback = await prisma.feedback.create({
  data: {
    userId: user.id,
    projectId: project.id, // Optional - can be null
    content: "User feedback content",
    source: "web_form",
    category: "feature_request"
  }
});
```

### Query Project-Specific Data
```javascript
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
```

### Query All User Data (Including Legacy)
```javascript
const allFeedback = await prisma.feedback.findMany({
  where: {
    userId: user.id,
    OR: [
      { projectId: project.id },
      { projectId: null } // Include legacy data
    ]
  }
});
```

### Create Project-Specific Category
```javascript
const category = await prisma.category.create({
  data: {
    userId: user.id,
    projectId: project.id, // Optional
    name: "Bug Reports",
    color: "#FF6B6B"
  }
});
```

## Migration Commands

### Run Migration
```bash
# Full migration with verification
node scripts/migrate-projects-feature.js migrate

# Just verify existing migration
node scripts/migrate-projects-feature.js verify

# Generate migration report
node scripts/migrate-projects-feature.js report
```

### Test Schema
```bash
# Run all tests
node scripts/test-projects-schema.js

# Run specific test
node scripts/test-projects-schema.js schema
node scripts/test-projects-schema.js compatibility
node scripts/test-projects-schema.js migration
```

## API Integration Examples

### REST API Route Updates

```javascript
// GET /api/projects - List user's projects
export async function GET(request) {
  const user = await getUser(request);
  
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    include: { _count: { select: { feedback: true } } }
  });
  
  return Response.json(projects);
}

// POST /api/projects - Create new project
export async function POST(request) {
  const user = await getUser(request);
  const { name, description } = await request.json();
  
  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name,
      description
    }
  });
  
  return Response.json(project);
}
```

### Updated Feedback API

```javascript
// GET /api/feedback with project filtering
export async function GET(request) {
  const user = await getUser(request);
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  
  const where = { userId: user.id };
  if (projectId) {
    where.projectId = projectId;
  }
  
  const feedback = await prisma.feedback.findMany({
    where,
    include: { project: true }
  });
  
  return Response.json(feedback);
}
```

## Frontend Integration

### React Hook for Projects
```javascript
import { useState, useEffect } from 'react';

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        setLoading(false);
      });
  }, []);
  
  return { projects, loading };
}
```

### Project Selector Component
```javascript
export function ProjectSelector({ selectedProject, onProjectChange }) {
  const { projects } = useProjects();
  
  return (
    <select 
      value={selectedProject?.id || ''} 
      onChange={(e) => {
        const project = projects.find(p => p.id === e.target.value);
        onProjectChange(project);
      }}
    >
      <option value="">All Projects</option>
      {projects.map(project => (
        <option key={project.id} value={project.id}>
          {project.name} {project.isDefault && '(Default)'}
        </option>
      ))}
    </select>
  );
}
```

## Database Indexes Reference

### Performance Optimized Queries

These queries will use indexes efficiently:

```javascript
// Uses projects_user_id_idx
await prisma.project.findMany({ where: { userId } });

// Uses projects_user_id_name_key (unique)
await prisma.project.findUnique({ where: { userId_name: { userId, name } } });

// Uses feedback_user_id_project_id_idx
await prisma.feedback.findMany({ where: { userId, projectId } });

// Uses categories_user_id_project_id_idx
await prisma.category.findMany({ where: { userId, projectId } });
```

## Troubleshooting

### Common Issues

1. **Migration fails with constraint errors**
   ```bash
   # Check for orphaned data
   node scripts/migrate-projects-feature.js verify
   ```

2. **Queries are slow**
   ```sql
   -- Check if indexes are being used
   EXPLAIN ANALYZE SELECT * FROM feedback WHERE user_id = $1 AND project_id = $2;
   ```

3. **Unique constraint violations**
   ```javascript
   // Project names must be unique per user
   // Category names must be unique per project
   try {
     await prisma.project.create({ data: { userId, name } });
   } catch (error) {
     if (error.code === 'P2002') {
       // Handle duplicate name
     }
   }
   ```

### Data Integrity Checks

```javascript
// Check for users without default projects
const usersWithoutDefaults = await prisma.profile.findMany({
  where: {
    projects: {
      none: { isDefault: true }
    }
  }
});

// Check for orphaned project data
const orphanedFeedback = await prisma.feedback.findMany({
  where: {
    projectId: { not: null },
    project: null
  }
});
```

## Best Practices

1. **Always check for default project**
   ```javascript
   let project = await getDefaultProject(userId);
   if (!project) {
     project = await createDefaultProject(userId);
   }
   ```

2. **Handle null projectId gracefully**
   ```javascript
   const feedback = await prisma.feedback.findMany({
     where: {
       userId,
       ...(projectId && { projectId })
     }
   });
   ```

3. **Use transactions for related operations**
   ```javascript
   await prisma.$transaction(async (tx) => {
     const project = await tx.project.create({ data: projectData });
     await tx.category.createMany({
       data: defaultCategories.map(cat => ({
         ...cat,
         userId,
         projectId: project.id
       }))
     });
   });
   ```

4. **Implement proper error handling**
   ```javascript
   try {
     const project = await prisma.project.create({ data });
   } catch (error) {
     if (error.code === 'P2002') {
       throw new Error('Project name already exists');
     }
     throw error;
   }
   ```

## Performance Tips

- Use composite indexes for multi-column queries
- Include project data in queries to avoid N+1 problems
- Consider pagination for large project datasets
- Use `_count` for efficient counting without loading data
- Cache project lists for frequently accessed data

## Security Considerations

- Always verify project ownership before operations
- Use UUID primary keys (already implemented)
- Validate project names and descriptions
- Implement rate limiting for project creation
- Log project access for audit trails

---

For detailed implementation information, see [`PROJECTS_FEATURE_IMPLEMENTATION.md`](docs/PROJECTS_FEATURE_IMPLEMENTATION.md).