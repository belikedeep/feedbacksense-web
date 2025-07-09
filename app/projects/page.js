'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import CreateProjectModal from '@/components/CreateProjectModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  PlusIcon,
  FolderOpenIcon,
  BuildingOfficeIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  StarIcon as StarOutlineIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

const BUSINESS_TYPES = {
  'e-commerce': { label: 'E-commerce', icon: '🛒' },
  'saas': { label: 'SaaS', icon: '💻' },
  'healthcare': { label: 'Healthcare', icon: '🏥' },
  'education': { label: 'Education', icon: '🎓' },
  'finance': { label: 'Finance', icon: '💰' },
  'real_estate': { label: 'Real Estate', icon: '🏠' },
  'food_beverage': { label: 'Food & Beverage', icon: '🍽️' },
  'retail': { label: 'Retail', icon: '🏪' },
  'consulting': { label: 'Consulting', icon: '💼' },
  'manufacturing': { label: 'Manufacturing', icon: '🏭' },
  'other': { label: 'Other', icon: '🏢' }
}

function ProjectCard({ project, onClick }) {
  const getBusinessTypeIcon = (businessType) => {
    return BUSINESS_TYPES[businessType]?.icon || '🏢'
  }

  const formatBusinessType = (businessType) => {
    return BUSINESS_TYPES[businessType]?.label || 'Other'
  }

  return (
    <Card 
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-stone-200 hover:border-teal-300 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="text-3xl flex-shrink-0">
              {getBusinessTypeIcon(project.businessType)}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="flex items-center gap-2 group-hover:text-teal-700 transition-colors">
                <span className="truncate">{project.name}</span>
                {project.isDefault && (
                  <StarSolidIcon className="h-4 w-4 text-amber-500 flex-shrink-0" />
                )}
              </CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {project.description || 'No description provided'}
              </CardDescription>
            </div>
          </div>
          <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all duration-300 flex-shrink-0" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
              {formatBusinessType(project.businessType)}
            </Badge>
            {project.isDefault && (
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                ⭐ Default
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{project._count?.feedback || 0} feedback</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <ChartBarIcon className="h-4 w-4" />
              <span>{project._count?.categories || 0} categories</span>
            </div>
          </div>

          {/* Timestamps */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>📅 Created: {new Date(project.createdAt).toLocaleDateString()}</p>
            <p>🔄 Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateProjectCard({ onClick }) {
  return (
    <Card 
      className="border-2 border-dashed border-gray-300 hover:border-teal-400 hover:bg-teal-50/50 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full min-h-[280px] text-center p-6">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-teal-200 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <PlusIcon className="h-8 w-8 text-teal-700" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Project</h3>
        <p className="text-gray-600 text-sm mb-4">
          Start organizing your feedback with a new project
        </p>
        <div className="flex items-center gap-2 text-teal-700 font-medium group-hover:gap-3 transition-all duration-300">
          <span>Get Started</span>
          <ArrowRightIcon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>  
  )
}

function ProjectsPageContent() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [user, setUser] = useState(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkAuthAndFetchProjects()
    
    // Auto-open create modal if ?create=true
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true)
    }
  }, [searchParams])

  const checkAuthAndFetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      // Check authentication
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Fetch projects
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch projects')
      }

      const data = await response.json()
      setProjects(data || [])

      // If user has no projects, auto-open create modal
      if (!data || data.length === 0) {
        setShowCreateModal(true)
      }
    } catch (err) {
      console.error('Error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectClick = (project) => {
    router.push(`/project/${project.id}/dashboard`)
  }

  const handleProjectCreated = (newProject) => {
    setProjects(prev => [newProject, ...prev])
    setShowCreateModal(false)
    
    // Redirect to the new project
    router.push(`/project/${newProject.id}/dashboard`)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-teal-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-800">Loading your projects...</p>
          <p className="mt-2 text-sm text-gray-600">Setting up your workspace</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl">
                <BuildingOfficeIcon className="h-8 w-8 text-teal-700" />
              </div>
              Your Projects
            </h1>
            <p className="text-gray-600 mt-2">
              Select a project to continue working with your feedback data
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="text-gray-600 hover:text-gray-800"
            >
              Sign Out
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50 mb-6">
            <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
              <Button
                variant="outline"
                size="sm"
                onClick={checkAuthAndFetchProjects}
                className="ml-4"
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="text-6xl mb-4">📁</div>
              <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
              <p className="text-gray-600 text-center mb-6 max-w-md">
                Create your first project to start organizing your feedback collection and analytics.
              </p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                <PlusIcon className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg">
                      <FolderOpenIcon className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                      <p className="text-sm text-gray-600">Total Projects</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {projects.reduce((acc, p) => acc + (p._count?.feedback || 0), 0)}
                      </p>
                      <p className="text-sm text-gray-600">Total Feedback</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                      <StarSolidIcon className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">
                        {projects.filter(p => p.isDefault).length}
                      </p>
                      <p className="text-sm text-gray-600">Default Project</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Projects Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleProjectClick(project)}
                />
              ))}
              
              {/* Create New Project Card */}
              <CreateProjectCard onClick={() => setShowCreateModal(true)} />
            </div>
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

// Loading fallback component
function ProjectsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-teal-600 mx-auto"></div>
        <p className="mt-6 text-lg font-medium text-gray-800">Loading your projects...</p>
        <p className="mt-2 text-sm text-gray-600">Setting up your workspace</p>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function ProjectsPage() {
  return (
    <Suspense fallback={<ProjectsLoading />}>
      <ProjectsPageContent />
    </Suspense>
  )
}