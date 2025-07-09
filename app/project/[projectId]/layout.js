'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { ProjectProvider } from '@/contexts/ProjectContext'
import ProjectHeader from '@/components/ProjectHeader'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import ProjectSidebar from '@/components/ProjectSidebar'
import MobileHeader from '@/components/MobileHeader'
import { Card, CardContent } from '@/components/ui/card'

function ProjectLayoutContent({ children, projectId }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
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
          <p className="mt-6 text-lg font-medium text-gray-800">Loading project workspace...</p>
          <p className="mt-2 text-sm text-gray-600">Preparing your analytics environment</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 flex items-center justify-center">
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border border-stone-200">
          <CardContent className="text-center p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-6">Please log in to access your project.</p>
            <a
              href="/login"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Go to Login
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProjectProvider projectId={projectId}>
      <SidebarProvider>
        <ProjectLayoutInner user={user} onSignOut={handleSignOut}>
          {children}
        </ProjectLayoutInner>
      </SidebarProvider>
    </ProjectProvider>
  )
}

function ProjectLayoutInner({ children, user, onSignOut }) {
  const { isDesktop, getMainContentMargin } = useSidebar()

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 overflow-hidden">
      {/* Project-aware Sidebar */}
      <ProjectSidebar user={user} onSignOut={onSignOut} />

      {/* Main Content Area */}
      <main
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isDesktop ? getMainContentMargin() : '0px'
        }}
      >
        {/* Mobile Header */}
        <MobileHeader user={user} />

        {/* Project Header */}
        <ProjectHeader />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  )
}

export default async function ProjectLayout({ children, params }) {
  const { projectId } = await params

  return (
    <ProjectLayoutContent projectId={projectId}>
      {children}
    </ProjectLayoutContent>
  )
}