'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

const ProjectContext = createContext({
  project: null,
  projects: [],
  loading: false,
  error: null,
  switchProject: () => {},
  refetchProject: () => {},
  refetchProjects: () => {}
})

export function ProjectProvider({ projectId, children }) {
  const [project, setProject] = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const router = useRouter()
  const pathname = usePathname()

  // Fetch current project data
  const fetchProject = async (id) => {
    if (!id) return

    try {
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          // Project not found or access denied - redirect to projects page
          router.push('/projects')
          return
        }
        throw new Error('Failed to fetch project')
      }

      const projectData = await response.json()
      setProject(projectData)
    } catch (err) {
      console.error('Error fetching project:', err)
      setError(err.message)
    }
  }

  // Fetch all user projects for switching
  const fetchProjects = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch projects')
      
      const projectsData = await response.json()
      setProjects(projectsData || [])
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err.message)
    }
  }

  // Switch to a different project while maintaining current path
  const switchProject = (newProjectId) => {
    if (!newProjectId || newProjectId === projectId) return

    // Extract the current page/path after /project/[projectId]/
    const pathParts = pathname.split('/')
    const currentPage = pathParts.length > 3 ? pathParts.slice(3).join('/') : 'dashboard'
    
    // Navigate to new project with same page
    const newPath = `/project/${newProjectId}/${currentPage}`
    router.push(newPath)
  }

  // Refetch current project data  
  const refetchProject = () => {
    if (projectId) {
      fetchProject(projectId)
    }
  }

  // Refetch all projects
  const refetchProjects = () => {
    fetchProjects()
  }

  // Initial data loading
  useEffect(() => {
    setLoading(true)
    
    Promise.all([
      projectId ? fetchProject(projectId) : Promise.resolve(),
      fetchProjects()
    ]).finally(() => {
      setLoading(false)
    })
  }, [projectId])

  const value = {
    project,
    projects,
    loading,
    error,
    switchProject,
    refetchProject,
    refetchProjects
  }

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider')
  }
  return context
}

export { ProjectContext }