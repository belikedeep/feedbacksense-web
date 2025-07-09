'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import CreateProjectModal from './CreateProjectModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  ArchiveBoxIcon,
  FolderOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

const BUSINESS_TYPES = [
  { value: 'e-commerce', label: 'E-commerce', icon: '🛒' },
  { value: 'saas', label: 'SaaS', icon: '💻' },
  { value: 'healthcare', label: 'Healthcare', icon: '🏥' },
  { value: 'education', label: 'Education', icon: '🎓' },
  { value: 'finance', label: 'Finance', icon: '💰' },
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'food_beverage', label: 'Food & Beverage', icon: '🍽️' },
  { value: 'retail', label: 'Retail', icon: '🏪' },
  { value: 'consulting', label: 'Consulting', icon: '💼' },
  { value: 'manufacturing', label: 'Manufacturing', icon: '🏭' },
  { value: 'other', label: 'Other', icon: '🏢' }
]

export default function ProjectManager({ onProjectUpdate }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [deletingProject, setDeletingProject] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

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
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = (newProject) => {
    setProjects(prev => [newProject, ...prev])
    if (onProjectUpdate) {
      onProjectUpdate()
    }
  }

  const handleEditProject = (project) => {
    setEditingProject({
      id: project.id,
      name: project.name,
      description: project.description || '',
      businessType: project.businessType
    })
    setShowEditModal(true)
  }

  const handleUpdateProject = async () => {
    if (!editingProject) return

    try {
      setActionLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: editingProject.name.trim(),
          description: editingProject.description.trim() || null,
          businessType: editingProject.businessType
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update project')
      }

      const updatedProject = await response.json()
      
      setProjects(prev => 
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      )
      
      setShowEditModal(false)
      setEditingProject(null)
      
      if (onProjectUpdate) {
        onProjectUpdate()
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!deletingProject) return

    try {
      setActionLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/projects/${deletingProject.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete project')
      }

      setProjects(prev => prev.filter(p => p.id !== deletingProject.id))
      setShowDeleteModal(false)
      setDeletingProject(null)
      
      if (onProjectUpdate) {
        onProjectUpdate()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleSetDefault = async (projectId) => {
    try {
      setActionLoading(true)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          isDefault: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set default project')
      }

      const updatedProject = await response.json()
      
      // Update projects list - remove default from others and set on selected
      setProjects(prev => 
        prev.map(p => ({
          ...p,
          isDefault: p.id === projectId
        }))
      )
      
      if (onProjectUpdate) {
        onProjectUpdate()
      }
    } catch (error) {
      console.error('Error setting default project:', error)
      setError(error.message)
    } finally {
      setActionLoading(false)
    }
  }

  const getBusinessTypeIcon = (businessType) => {
    const type = BUSINESS_TYPES.find(t => t.value === businessType)
    return type ? type.icon : '🏢'
  }

  const formatBusinessType = (businessType) => {
    const type = BUSINESS_TYPES.find(t => t.value === businessType)
    return type ? type.label : 'Other'
  }

  const getFeedbackCount = (project) => {
    // This would normally come from the API response
    // For now, return a placeholder
    return 0 // project.feedbackCount || 0
  }

  if (loading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
        <CardContent className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
            <p className="text-gray-600 font-medium">Loading projects...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
              <FolderOpenIcon className="h-6 w-6 text-teal-700" />
            </div>
            Project Management
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Manage your projects and organize your feedback collection
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
        >
          <PlusIcon className="h-4 w-4" />
          Create Project
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {projects.reduce((acc, p) => acc + getFeedbackCount(p), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-xl font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first project to start organizing your feedback collection.
            </p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="gap-2"
            >
              <PlusIcon className="h-4 w-4" />
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getBusinessTypeIcon(project.businessType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {project.name}
                        {project.isDefault && (
                          <StarSolidIcon className="h-4 w-4 text-amber-500" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {project.description || 'No description provided'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      title="Edit project"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeletingProject(project)
                        setShowDeleteModal(true)
                      }}
                      title="Delete project"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                      {getBusinessTypeIcon(project.businessType)} {formatBusinessType(project.businessType)}
                    </Badge>
                    {project.isDefault && (
                      <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                        ⭐ Default
                      </Badge>
                    )}
                    <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                      📊 {getFeedbackCount(project)} feedback
                    </Badge>
                  </div>

                  {/* Stats */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>📅 Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                    <p>🔄 Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                  </div>

                  <Separator />

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!project.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(project.id)}
                        disabled={actionLoading}
                        className="gap-2 flex-1"
                      >
                        <StarIcon className="h-4 w-4" />
                        Set as Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProject(project)}
                      className="gap-2 flex-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProjectCreated={handleCreateProject}
      />

      {/* Edit Project Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update your project information and settings.
            </DialogDescription>
          </DialogHeader>
          
          {editingProject && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Project Name</Label>
                <Input
                  id="edit-name"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject(prev => ({
                    ...prev,
                    name: e.target.value
                  }))}
                  placeholder="Enter project name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProject.description}
                  onChange={(e) => setEditingProject(prev => ({
                    ...prev,
                    description: e.target.value
                  }))}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Business Type</Label>
                <Select
                  value={editingProject.businessType}
                  onValueChange={(value) => setEditingProject(prev => ({
                    ...prev,
                    businessType: value
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProject}
              disabled={actionLoading || !editingProject?.name.trim()}
            >
              {actionLoading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Delete Project
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingProject?.name}"? This action cannot be undone and will permanently remove all associated feedback.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProject}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}