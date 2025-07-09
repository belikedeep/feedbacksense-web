'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import FeedbackForm from './FeedbackForm'
import CSVImport from './CSVImport'
import FeedbackList from './FeedbackList'
import Analytics from './Analytics'
import CategoryAnalytics from './CategoryAnalytics'
import AIPerformanceMetrics from './AIPerformanceMetrics'
import ProjectSelector from './ProjectSelector'
import ProjectManager from './ProjectManager'
import CreateProjectModal from './CreateProjectModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import AnalyticsIcon from '@/components/icons/AnalyticsIcon'
import AIIcon from '@/components/icons/AIIcon'
import {
  PlusIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowPathIcon,
  FolderOpenIcon
} from '@heroicons/react/24/outline'

function DashboardContent({ user, onSignOut }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentProject, setCurrentProject] = useState(null)
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false)
  const { getMainContentMargin, isDesktop } = useSidebar()

  useEffect(() => {
    initializeUser()
    
    // Listen for tab switch events from Analytics empty state
    const handleTabSwitch = (event) => {
      setActiveTab(event.detail)
    }
    
    window.addEventListener('switchTab', handleTabSwitch)
    
    return () => {
      window.removeEventListener('switchTab', handleTabSwitch)
    }
  }, [])

  // Fetch current project on component mount
  useEffect(() => {
    fetchCurrentProject()
  }, [])

  const initializeUser = async () => {
    try {
      // Ensure user profile exists
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // Create or get user profile
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      // Then fetch feedback
      await fetchFeedback()
    } catch (error) {
      console.error('Error initializing user:', error)
      setLoading(false)
    }
  }

  const fetchCurrentProject = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const projects = await response.json()
        // Find default project or first project
        const defaultProject = projects.find(p => p.isDefault) || projects[0]
        setCurrentProject(defaultProject || null)
      }
    } catch (error) {
      console.error('Error fetching current project:', error)
    }
  }

  const fetchFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      const response = await fetch('/api/feedback', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch feedback')
      const data = await response.json()
      setFeedback(data || [])
    } catch (error) {
      console.error('Error fetching feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut()
    } else {
      await supabase.auth.signOut()
    }
  }

  const addFeedback = (newFeedback) => {
    setFeedback([newFeedback, ...feedback])
  }

  const addBulkFeedback = (newFeedbacks) => {
    setFeedback([...newFeedbacks, ...feedback])
  }

  const reanalyzeAllFeedback = async () => {
    if (!confirm('This will re-analyze all your feedback with improved sentiment analysis. Continue?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch('/api/feedback/reanalyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Success! Re-analyzed ${result.count} feedback entries.`)
        // Refresh feedback data
        fetchFeedback()
      } else {
        throw new Error('Failed to re-analyze feedback')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  const handleProjectChange = (newProject) => {
    setCurrentProject(newProject)
    // Refresh feedback when project changes
    fetchFeedback()
  }

  const handleCreateProject = () => {
    setShowCreateProjectModal(true)
  }

  const handleProjectCreated = (newProject) => {
    setCurrentProject(newProject)
    fetchCurrentProject() // Refresh project list
    fetchFeedback() // Refresh feedback for new project
  }

  const handleProjectUpdate = () => {
    fetchCurrentProject()
    fetchFeedback()
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar
        user={user}
        onSignOut={onSignOut}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        feedback={feedback}
        reanalyzeAllFeedback={reanalyzeAllFeedback}
        currentProject={currentProject}
        onProjectChange={handleProjectChange}
        onCreateProject={handleCreateProject}
      />

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          marginLeft: isDesktop ? getMainContentMargin() : '0px'
        }}
      >
        {/* Mobile Header */}
        <MobileHeader user={user} />

        {/* Desktop Header */}
        {isDesktop && (
          <header className="border-b border-stone-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
                  {activeTab === 'dashboard' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                        <AnalyticsIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      Analytics Dashboard
                    </>
                  )}
                  {activeTab === 'add-feedback' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg">
                        <PlusIcon className="h-6 w-6 text-amber-700" />
                      </div>
                      Add New Feedback
                    </>
                  )}
                  {activeTab === 'import-csv' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-stone-100 to-stone-200 rounded-lg">
                        <DocumentArrowUpIcon className="h-6 w-6 text-stone-700" />
                      </div>
                      Import CSV Data
                    </>
                  )}
                  {activeTab === 'feedback-list' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg">
                        <DocumentTextIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      All Feedback
                    </>
                  )}
                  {activeTab === 'category-analytics' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg">
                        <ChartBarIcon className="h-6 w-6 text-amber-700" />
                      </div>
                      Category Analytics
                    </>
                  )}
                  {activeTab === 'ai-performance' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-teal-100 to-teal-200 rounded-lg">
                        <AIIcon className="h-6 w-6 text-teal-700" />
                      </div>
                      AI Performance
                    </>
                  )}
                  {activeTab === 'projects' && (
                    <>
                      <div className="p-2 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg">
                        <FolderOpenIcon className="h-6 w-6 text-purple-700" />
                      </div>
                      Project Management
                    </>
                  )}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  {activeTab === 'dashboard' && 'Comprehensive insights and performance metrics'}
                  {activeTab === 'add-feedback' && 'Create a new feedback entry with AI categorization'}
                  {activeTab === 'import-csv' && 'Bulk import feedback data from CSV files'}
                  {activeTab === 'feedback-list' && 'View and manage all feedback entries'}
                  {activeTab === 'category-analytics' && 'Deep dive into category performance'}
                  {activeTab === 'ai-performance' && 'Monitor AI categorization performance'}
                  {activeTab === 'projects' && 'Manage your projects and organize feedback collection'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {feedback.length > 0 && (
                <div className="flex items-center gap-3">
                  <Badge className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800">
                    <span className="h-2 w-2 rounded-full bg-amber-300"></span>
                    {feedback.length} entries
                  </Badge>
                  <Badge className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700">
                    <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse"></span>
                    Live
                  </Badge>
                </div>
              )}
              {activeTab === 'dashboard' && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
                    onClick={fetchFeedback}
                  >
                    <ArrowPathIcon className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
          <div className="p-6">
            {/* Project Selector - Show on all tabs except projects */}
            {activeTab !== 'projects' && (
              <div className="mb-6">
                <ProjectSelector
                  currentProject={currentProject}
                  onProjectChange={handleProjectChange}
                  onCreateProject={handleCreateProject}
                />
              </div>
            )}

            {loading ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                <CardContent className="flex justify-center items-center h-64">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {activeTab === 'dashboard' && <Analytics feedback={feedback} />}
                {activeTab === 'add-feedback' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <FeedbackForm onFeedbackAdded={addFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'import-csv' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <CSVImport onFeedbackImported={addBulkFeedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'feedback-list' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <FeedbackList
                        feedback={feedback}
                        onUpdate={fetchFeedback}
                        currentProject={currentProject}
                      />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'category-analytics' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <CategoryAnalytics feedback={feedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'ai-performance' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <AIPerformanceMetrics feedback={feedback} />
                    </CardContent>
                  </Card>
                )}
                {activeTab === 'projects' && (
                  <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
                    <CardContent className="p-6">
                      <ProjectManager onProjectUpdate={handleProjectUpdate} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={showCreateProjectModal}
        onClose={() => setShowCreateProjectModal(false)}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  )
}

export default function Dashboard({ user, onSignOut }) {
  return (
    <SidebarProvider>
      <DashboardContent user={user} onSignOut={onSignOut} />
    </SidebarProvider>
  )
}