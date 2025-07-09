# FeedbackSense Multi-Project System Redesign Plan

## Overview

This document outlines the redesign of FeedbackSense from a single-dashboard architecture to a multi-project system similar to Supabase/Stripe, where each project feels like a completely separate application environment.

## Current State Analysis

The application currently has:
- ✅ Basic project database schema with relationships
- ✅ Project management components (ProjectSelector, ProjectManager, CreateProjectModal)
- ✅ API endpoints for project CRUD operations
- ✅ Single-dashboard architecture with project selector within dashboard
- ❌ **Missing**: True multi-project isolation and routing
- ❌ **Missing**: Project-specific URL structure
- ❌ **Missing**: Project selection landing page
- ❌ **Missing**: Project-scoped API endpoints

## User Flow Requirements

Based on requirements gathering:
1. **Dashboard Redirect**: `/dashboard` redirects to `/projects` when user has multiple projects
2. **Project Switching**: Header dropdown that immediately changes URL context
3. **API Auto-filtering**: URLs like `/project/[projectId]/api/feedback` automatically scope to that project

## Detailed Architecture Plan

### 1. URL Structure & Routing Architecture

```
Authentication Routes:
├── /login
├── /signup
└── /reset-password

Project Routes:
├── /projects                           # Project selection/management page
├── /project/[projectId]/dashboard      # Project-specific dashboard
├── /project/[projectId]/feedback       # Project-specific feedback list
├── /project/[projectId]/analytics      # Project-specific analytics
├── /project/[projectId]/settings       # Project-specific settings
├── /project/[projectId]/import         # Project-specific CSV import
└── /project/[projectId]/exports        # Project-specific export history

Legacy Route Handling:
├── /dashboard                          # Redirects based on project count
└── /dashboard/[...oldPaths]            # Redirect to project context
```

**Routing Logic:**
- User login → Check project count
- No projects → Create first project flow
- Single project → Auto-redirect to `/project/[defaultId]/dashboard`
- Multiple projects → Redirect to `/projects` selection page

### 2. Component Architecture Changes

#### 2.1 New File Structure

```
app/
├── projects/
│   └── page.js                    # Project selection page
├── project/
│   └── [projectId]/
│       ├── layout.js              # Project-specific layout with header/sidebar
│       ├── dashboard/
│       │   └── page.js
│       ├── feedback/
│       │   └── page.js
│       ├── analytics/
│       │   └── page.js
│       ├── settings/
│       │   └── page.js
│       └── api/                   # Project-scoped API routes
│           ├── feedback/
│           │   └── route.js
│           ├── analytics/
│           │   └── route.js
│           └── exports/
│               └── route.js
```

#### 2.2 Component Hierarchy Changes

**Current:**
```
Dashboard
├── Sidebar (with ProjectSelector)
├── Main Content
│   ├── ProjectSelector (again)
│   └── Tab Content
```

**New:**
```
ProjectLayout (per project)
├── ProjectHeader (with project switcher)
├── ProjectSidebar (project-scoped navigation)
└── ProjectContent (isolated per project)
```

### 3. Key Components to Create/Modify

#### 3.1 New Components

1. **ProjectSelectionPage** (`app/projects/page.js`)
   - Grid of project cards
   - Create new project option
   - Project stats and quick actions

2. **ProjectLayout** (`app/project/[projectId]/layout.js`)
   - Project context provider
   - Project header with switcher
   - Project-specific sidebar

3. **ProjectHeader** (`components/ProjectHeader.js`)
   - Current project display
   - Project switcher dropdown
   - Breadcrumb navigation

4. **ProjectSwitcher** (`components/ProjectSwitcher.js`)
   - Dropdown with all user projects
   - Quick project switching with URL updates

5. **ProjectContext** (`contexts/ProjectContext.js`)
   - Project state management
   - Project switching logic
   - Data isolation helpers

#### 3.2 Components to Modify

1. **Dashboard** - Split into project-specific components
2. **Sidebar** - Make project-aware
3. **All API consumers** - Update to use project-scoped endpoints

### 4. Data Isolation Implementation

#### 4.1 Project-Scoped API Routes

All API routes will be moved under `/project/[projectId]/api/` structure:

```javascript
// app/project/[projectId]/api/feedback/route.js
export async function GET(request, { params }) {
  const { projectId } = params
  const user = await getCurrentUser(request)
  
  // Validate project ownership
  const project = await validateProjectAccess(user.id, projectId)
  
  // Automatically filter by project
  const feedback = await prisma.feedback.findMany({
    where: {
      projectId: project.id,
      userId: user.id
    }
  })
  
  return NextResponse.json(feedback)
}
```

#### 4.2 Automatic Project Context Injection

```javascript
// lib/projectUtils.js
export async function getProjectFromRequest(request, projectId) {
  const user = await getCurrentUser(request)
  
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId: user.id
    }
  })
  
  if (!project) {
    throw new Error('Project not found or access denied')
  }
  
  return project
}
```

### 5. Middleware Enhancements

```javascript
// middleware.js - Enhanced
export async function middleware(request) {
  const { pathname } = request.nextUrl
  
  // Handle project context routes
  if (pathname.startsWith('/project/')) {
    const projectId = pathname.split('/')[2]
    const hasAccess = await validateProjectAccess(request, projectId)
    
    if (!hasAccess) {
      return NextResponse.redirect(new URL('/projects', request.url))
    }
  }
  
  // Handle dashboard redirect logic
  if (pathname === '/dashboard') {
    const userProjects = await getUserProjects(request)
    
    if (userProjects.length === 0) {
      return NextResponse.redirect(new URL('/projects?create=true', request.url))
    } else if (userProjects.length === 1) {
      const defaultProject = userProjects[0]
      return NextResponse.redirect(new URL(`/project/${defaultProject.id}/dashboard`, request.url))
    } else {
      return NextResponse.redirect(new URL('/projects', request.url))
    }
  }
  
  return NextResponse.next()
}
```

### 6. Project Context Management

#### 6.1 Project Provider

```javascript
// contexts/ProjectProvider.js
export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()
  
  const switchProject = (newProjectId) => {
    // Extract current page from pathname
    const currentPage = pathname.split('/').slice(3).join('/') || 'dashboard'
    const newPath = `/project/${newProjectId}/${currentPage}`
    router.push(newPath)
  }
  
  const value = {
    project,
    projects,
    switchProject,
    loading,
    refetch: () => fetchProject(projectId)
  }
  
  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}
```

#### 6.2 Project Hook

```javascript
// hooks/useProject.js
export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider')
  }
  return context
}
```

### 7. Navigation Updates

#### 7.1 Project-Specific Sidebar

```javascript
// components/ProjectSidebar.js
export default function ProjectSidebar() {
  const { project } = useProject()
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Dashboard', href: `/project/${project.id}/dashboard`, icon: AnalyticsIcon },
    { name: 'Feedback', href: `/project/${project.id}/feedback`, icon: DocumentTextIcon },
    { name: 'Analytics', href: `/project/${project.id}/analytics`, icon: ChartBarIcon },
    { name: 'Settings', href: `/project/${project.id}/settings`, icon: CogIcon },
  ]
  
  return (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`${pathname === item.href ? 'bg-teal-50 text-teal-700' : 'text-gray-600'} ...`}
        >
          <item.icon className="h-5 w-5" />
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
```

### 8. Migration Strategy

#### Phase 1: Route Structure (Week 1)
1. Create `app/projects/page.js` - Project selection page
2. Create `app/project/[projectId]/layout.js` - Project layout
3. Create project-specific page components
4. Create project-scoped API routes

#### Phase 2: Component Migration (Week 2)
1. Create ProjectHeader with switcher
2. Create ProjectSidebar
3. Update Dashboard components for project context
4. Create ProjectContext and hooks

#### Phase 3: Integration (Week 3)
1. Update middleware for redirects
2. Implement project switching logic
3. Update all API consumers
4. Add project access validation

#### Phase 4: Cleanup (Week 4)
1. Remove old ProjectSelector from dashboard
2. Clean up unused components
3. Add comprehensive testing
4. Update documentation

### 9. Security Considerations

1. **Project Access Validation**: Every project route validates ownership
2. **API Security**: All project-scoped APIs check user permissions
3. **Data Isolation**: Database queries automatically filter by project
4. **Rate Limiting**: Implement per-project rate limiting

### 10. Performance Optimizations

1. **Lazy Loading**: Load project data only when needed
2. **Caching**: Cache project list and current project
3. **Prefetching**: Prefetch common project data
4. **Optimistic Updates**: Update UI before API confirmation

### 11. Testing Strategy

1. **Unit Tests**: Test individual components and utilities
2. **Integration Tests**: Test project switching and data isolation
3. **E2E Tests**: Test complete user flows
4. **Security Tests**: Test access control and data isolation

## Implementation Checklist

### Phase 1: Foundation
- [ ] Create project selection page
- [ ] Create project layout structure
- [ ] Set up project context
- [ ] Create project-scoped API routes

### Phase 2: Components
- [ ] ProjectHeader with switcher
- [ ] ProjectSidebar
- [ ] ProjectSwitcher dropdown
- [ ] Update Dashboard components

### Phase 3: Integration
- [ ] Enhanced middleware
- [ ] Project switching logic
- [ ] API consumer updates
- [ ] Access validation

### Phase 4: Polish
- [ ] Error handling
- [ ] Loading states
- [ ] Testing
- [ ] Documentation

## Success Criteria

1. **Isolated Experience**: Each project feels like a separate application
2. **Seamless Switching**: Users can quickly switch between projects
3. **Data Isolation**: No cross-project data leakage
4. **Performance**: Fast navigation and loading
5. **Security**: Proper access control and validation

## Technical Debt Considerations

1. **Backward Compatibility**: Maintain during transition
2. **API Versioning**: Plan for future API changes
3. **Database Optimization**: Ensure efficient queries
4. **Monitoring**: Add project-specific analytics

This redesign transforms FeedbackSense into a true multi-project platform that provides the isolated, professional experience users expect from modern SaaS applications.