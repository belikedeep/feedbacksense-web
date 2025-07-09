'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import { 
  FolderOpenIcon,
  PlusIcon,
  ChevronDownIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

export default function ProjectSelectorSidebar({ 
  currentProject, 
  onProjectChange, 
  onCreateProject,
  isCollapsed = false
}) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState(null)
  const [isOpen, setIsOpen] = useState(false)

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
      setIsOpen(false)
      
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
      
      // Navigate to the new project's dashboard
      window.location.href = `/project/${projectId}/dashboard`
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
      <div className={`p-3 border-b border-teal-600/30 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-300"></div>
          {!isCollapsed && <span className="text-sm text-stone-300">Loading projects...</span>}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-3 border-b border-teal-600/30 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <span className="text-red-300 text-sm">⚠️</span>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <span className="text-red-300 text-sm truncate block">Project Error</span>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchProjects}
                className="mt-2 w-full text-xs bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-400/30"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 border-b border-teal-600/30 ${isCollapsed ? 'px-2' : ''}`}>
      {!isCollapsed && (
        <div className="text-xs font-semibold text-stone-300 uppercase tracking-wider mb-3">
          Current Project
        </div>
      )}
      
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={`w-full ${isCollapsed ? 'p-2' : 'justify-start gap-3 p-3'} bg-teal-600/20 hover:bg-teal-500/30 text-stone-200 hover:text-stone-50 border border-teal-500/30 hover:border-teal-400/50 transition-all duration-200`}
            disabled={switching}
            title={isCollapsed ? currentProject?.name || 'Select Project' : undefined}
          >
            <div className={`flex items-center gap-2 ${isCollapsed ? '' : 'flex-1 min-w-0'}`}>
              <div className="p-1.5 bg-teal-500/30 rounded-md flex-shrink-0">
                {switching ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-200"></div>
                ) : currentProject ? (
                  <span className="text-sm">
                    {getBusinessTypeIcon(currentProject.businessType)}
                  </span>
                ) : (
                  <FolderOpenIcon className="h-4 w-4 text-teal-200" />
                )}
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <div className="font-medium text-stone-50 truncate">
                    {switching ? 'Switching...' : currentProject?.name || 'Select Project'}
                  </div>
                  <div className="text-xs text-stone-300 truncate">
                    {currentProject ? formatBusinessType(currentProject.businessType) : 'No project selected'}
                  </div>
                </div>
              )}
            </div>
            
            {!isCollapsed && !switching && (
              <ChevronDownIcon className="h-4 w-4 text-stone-400 flex-shrink-0" />
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-80 bg-teal-900/95 backdrop-blur-md border-teal-600/50 shadow-xl"
          align={isCollapsed ? "center" : "start"}
          side={isCollapsed ? "right" : "bottom"}
        >
          <DropdownMenuLabel className="text-stone-200 font-semibold">
            Switch Project ({projects.length})
          </DropdownMenuLabel>
          
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => handleProjectSwitch(project.id)}
              className="cursor-pointer text-stone-200 hover:bg-teal-700/50 focus:bg-teal-700/50 p-3"
            >
              <div className="flex items-center gap-3 w-full">
                <div className="p-2 bg-teal-600/30 rounded-lg flex-shrink-0">
                  <span className="text-lg">
                    {getBusinessTypeIcon(project.businessType)}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-stone-50 truncate">
                      {project.name}
                    </span>
                    {project.id === currentProject?.id && (
                      <CheckIcon className="h-4 w-4 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-sm text-stone-300 truncate">
                    {formatBusinessType(project.businessType)}
                  </div>
                  {project.description && (
                    <div className="text-xs text-stone-400 truncate mt-1">
                      {project.description}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {project.isDefault && (
                    <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs">
                      Default
                    </Badge>
                  )}
                  <span className="text-xs text-stone-400">
                    {project._count?.feedback || 0} feedback
                  </span>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuSeparator className="bg-teal-600/30" />
          
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false)
              if (onCreateProject) onCreateProject()
            }}
            className="cursor-pointer text-stone-200 hover:bg-teal-700/50 focus:bg-teal-700/50 p-3"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-gradient-to-br from-green-500/30 to-green-600/30 rounded-lg flex-shrink-0">
                <PlusIcon className="h-5 w-5 text-green-200" />
              </div>
              <div>
                <span className="font-medium text-green-200">Create New Project</span>
                <div className="text-sm text-stone-300">
                  Add a new business project
                </div>
              </div>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-teal-600/30" />
          
          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false)
              window.location.href = '/projects'
            }}
            className="cursor-pointer text-stone-200 hover:bg-teal-700/50 focus:bg-teal-700/50 p-3"
          >
            <div className="flex items-center gap-3 w-full">
              <div className="p-2 bg-teal-600/30 rounded-lg flex-shrink-0">
                <FolderOpenIcon className="h-5 w-5 text-teal-200" />
              </div>
              <div>
                <span className="font-medium text-stone-50">Manage All Projects</span>
                <div className="text-sm text-stone-300">
                  View project overview
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {!isCollapsed && currentProject && (
        <div className="mt-3 pt-3 border-t border-teal-600/30">
          <div className="flex items-center justify-between text-xs text-stone-400">
            <span>📊 {projects.length} total projects</span>
            {currentProject.isDefault && (
              <Badge className="bg-amber-500/20 text-amber-200 border-amber-400/30 text-xs">
                ⭐ Default
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}