'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  FolderOpenIcon,
  PlusIcon,
  BuildingOfficeIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

export default function ProjectSelector({ 
  currentProject, 
  onProjectChange, 
  onCreateProject,
  className = "" 
}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState(null)

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

  const handleProjectSwitch = async (projectId) => {
    if (!projectId || projectId === currentProject?.id) return
    
    try {
      setSwitching(true)
      setError(null)
      
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No session found')
      }

      const response = await fetch(`/api/projects/${projectId}/switch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to switch project')
      }

      const updatedProject = await response.json()
      
      // Call the callback with the new project
      if (onProjectChange) {
        onProjectChange(updatedProject)
      }
      
      // Optionally refresh the page to ensure all components update
      window.location.reload()
    } catch (error) {
      console.error('Error switching project:', error)
      setError(error.message)
    } finally {
      setSwitching(false)
    }
  }

  const getBusinessTypeIcon = (businessType) => {
    switch (businessType?.toLowerCase()) {
      case 'e-commerce':
        return '🛒'
      case 'saas':
        return '💻'
      case 'healthcare':
        return '🏥'
      case 'education':
        return '🎓'
      case 'finance':
        return '💰'
      case 'real_estate':
        return '🏠'
      case 'food_beverage':
        return '🍽️'
      case 'retail':
        return '🏪'
      case 'consulting':
        return '💼'
      case 'manufacturing':
        return '🏭'
      default:
        return '🏢'
    }
  }

  const formatBusinessType = (businessType) => {
    if (!businessType) return 'General'
    return businessType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <Card className={`bg-white/80 backdrop-blur-sm shadow-sm border border-stone-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
            <span className="text-sm text-gray-600">Loading projects...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-red-50 border-red-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-red-600 text-sm">⚠️ {error}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProjects}
              className="ml-auto"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-white/80 backdrop-blur-sm shadow-sm border border-stone-200 hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Current Project Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg flex-shrink-0">
                {currentProject ? (
                  <span className="text-lg">
                    {getBusinessTypeIcon(currentProject.businessType)}
                  </span>
                ) : (
                  <FolderOpenIcon className="h-5 w-5 text-teal-700" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {currentProject?.name || 'No Project Selected'}
                  </h3>
                  {currentProject && (
                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 text-xs">
                      {getBusinessTypeIcon(currentProject.businessType)} {formatBusinessType(currentProject.businessType)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate">
                  {currentProject?.description || 'Select a project to continue'}
                </p>
              </div>
            </div>
          </div>

          {/* Project Selector and Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {projects.length > 0 && (
              <>
                <Select
                  value={currentProject?.id || ''}
                  onValueChange={handleProjectSwitch}
                  disabled={switching}
                >
                  <SelectTrigger className="w-48 bg-white">
                    <SelectValue placeholder="Switch project">
                      {switching ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                          <span>Switching...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FolderOpenIcon className="h-4 w-4" />
                          <span>Switch Project</span>
                        </div>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-sm">
                            {getBusinessTypeIcon(project.businessType)}
                          </span>
                          <div className="flex flex-col">
                            <span className="font-medium">{project.name}</span>
                            <span className="text-xs text-gray-500">
                              {formatBusinessType(project.businessType)}
                            </span>
                          </div>
                          {project.isDefault && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs ml-auto">
                              Default
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="h-6 w-px bg-stone-200"></div>
              </>
            )}

            {/* Quick Stats */}
            {projects.length > 0 && (
              <Badge className="bg-stone-100 text-stone-700 hover:bg-stone-200">
                📁 {projects.length} project{projects.length !== 1 ? 's' : ''}
              </Badge>
            )}

            {/* Create New Project Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onCreateProject}
              className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
            >
              <PlusIcon className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        {/* Project Stats Row */}
        {currentProject && (
          <div className="mt-3 pt-3 border-t border-stone-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  📊 Created {new Date(currentProject.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  🔄 Updated {new Date(currentProject.updatedAt).toLocaleDateString()}
                </span>
              </div>
              {currentProject.isDefault && (
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs">
                  ⭐ Default Project
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}