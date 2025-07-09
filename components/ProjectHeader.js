'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useProject } from '@/contexts/ProjectContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  ChevronRightIcon,
  FolderOpenIcon,
  ArrowLeftIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'

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

export default function ProjectHeader({ 
  showBackButton = false, 
  title,
  subtitle,
  actions = null 
}) {
  const { project, projects, switchProject, loading } = useProject()
  const [switching, setSwitching] = useState(false)

  const getBusinessTypeIcon = (businessType) => {
    return BUSINESS_TYPES[businessType]?.icon || '🏢'
  }

  const formatBusinessType = (businessType) => {
    return BUSINESS_TYPES[businessType]?.label || 'Other'
  }

  const handleProjectSwitch = async (newProjectId) => {
    if (!newProjectId || newProjectId === project?.id) return
    
    setSwitching(true)
    try {
      switchProject(newProjectId)
    } finally {
      // Reset switching state after a delay to account for navigation
      setTimeout(() => setSwitching(false), 1000)
    }
  }

  if (loading) {
    return (
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-gray-600">Loading project...</span>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side: Breadcrumb and Project Info */}
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Back to Projects Button */}
          {showBackButton && (
            <Link 
              href="/projects"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to Projects</span>
            </Link>
          )}

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <Link 
              href="/projects" 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Projects
            </Link>
            <ChevronRightIcon className="h-4 w-4 text-gray-400" />
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {project ? getBusinessTypeIcon(project.businessType) : '📁'}
              </span>
              <span className="font-semibold text-gray-900 truncate">
                {project?.name || 'Loading...'}
              </span>
            </div>
          </div>

          {/* Project Badge */}
          {project && (
            <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-200 text-xs">
              {formatBusinessType(project.businessType)}
            </Badge>
          )}

          {/* Default Project Badge */}
          {project?.isDefault && (
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-xs">
              ⭐ Default
            </Badge>
          )}
        </div>

        {/* Center: Title and Subtitle (if provided) */}
        {(title || subtitle) && (
          <div className="flex-1 text-center">
            {title && (
              <h1 className="text-xl font-semibold text-gray-900">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Right side: Project Switcher and Actions */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Project Switcher */}
          {projects.length > 1 && (
            <Select
              value={project?.id || ''}
              onValueChange={handleProjectSwitch}
              disabled={switching}
            >
              <SelectTrigger className="w-64 bg-white border-stone-300">
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
                {projects.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    <div className="flex items-center gap-3 w-full">
                      <span className="text-sm">
                        {getBusinessTypeIcon(proj.businessType)}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{proj.name}</span>
                          {proj.isDefault && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatBusinessType(proj.businessType)}
                        </span>
                      </div>
                      {proj.id === project?.id && (
                        <div className="h-2 w-2 bg-teal-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Project Count Badge */}
          {projects.length > 0 && (
            <Badge className="bg-stone-100 text-stone-700 hover:bg-stone-200">
              📁 {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Badge>
          )}

          {/* Custom Actions */}
          {actions}

          {/* View All Projects Button */}
          <Button
            variant="outline"
            size="sm"
            asChild
            className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
          >
            <Link href="/projects">
              <BuildingOfficeIcon className="h-4 w-4" />
              All Projects
            </Link>
          </Button>
        </div>
      </div>

      {/* Project Description */}
      {project?.description && (
        <div className="px-6 pb-4">
          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
            {project.description}
          </p>
        </div>
      )}
    </header>
  )
}