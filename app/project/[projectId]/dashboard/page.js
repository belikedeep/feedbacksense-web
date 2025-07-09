'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useProject } from '@/contexts/ProjectContext'
import { supabase } from '@/lib/supabase/client'
import Dashboard from '@/components/Dashboard'
import Analytics from '@/components/Analytics'
import FeedbackFormComponent from '@/components/FeedbackForm'
import CSVImportComponent from '@/components/CSVImport'
import FeedbackListComponent from '@/components/FeedbackList'
import CategoryAnalyticsComponent from '@/components/CategoryAnalytics'
import AIPerformanceMetricsComponent from '@/components/AIPerformanceMetrics'
import { Card, CardContent } from '@/components/ui/card'

function DashboardContent() {
  const { projectId } = useParams()
  const searchParams = useSearchParams()
  const { project } = useProject()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [feedback, setFeedback] = useState([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Set active tab based on URL parameter
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    } else {
      setActiveTab('dashboard')
    }
  }, [searchParams])

  useEffect(() => {
    if (project && user) {
      fetchProjectFeedback()
    }
  }, [project, user])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        window.location.href = '/login'
        return
      }

      setUser(session.user)
    } catch (error) {
      console.error('Auth check error:', error)
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectFeedback = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || !project) return

      const response = await fetch(`/project/${projectId}/api/feedback`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFeedback(data || [])
      }
    } catch (error) {
      console.error('Error fetching project feedback:', error)
    }
  }

  const addFeedback = (newFeedback) => {
    setFeedback([newFeedback, ...feedback])
  }

  const addBulkFeedback = (newFeedbacks) => {
    setFeedback([...newFeedbacks, ...feedback])
  }

  const reanalyzeAllFeedback = async () => {
    if (!confirm('This will re-analyze all feedback in this project with improved sentiment analysis. Continue?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      // TODO: Implement project-specific reanalysis API
      const response = await fetch('/api/feedback/reanalyze', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Success! Re-analyzed ${result.count} feedback entries.`)
        fetchProjectFeedback()
      } else {
        throw new Error('Failed to re-analyze feedback')
      }
    } catch (error) {
      alert('Error: ' + error.message)
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-teal-600 mx-auto"></div>
          <p className="mt-6 text-lg font-medium text-gray-800">Loading project dashboard...</p>
          <p className="mt-2 text-sm text-gray-600">Preparing your analytics environment</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100">
      <div className="p-6">
        {/* Content based on active tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <span className="text-2xl">{project.businessType === 'e-commerce' ? '🛒' : project.businessType === 'saas' ? '💻' : project.businessType === 'healthcare' ? '🏥' : '🏢'}</span>
              {project.name} - Analytics Dashboard
            </h1>
            <ProjectDashboard
              feedback={feedback}
              project={project}
              onFeedbackUpdate={fetchProjectFeedback}
            />
          </div>
        )}
        
        {activeTab === 'add-feedback' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Add New Feedback</h1>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <FeedbackForm 
                  onFeedbackAdded={addFeedback}
                  projectId={projectId}
                />
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'import-csv' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Import CSV Data</h1>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <CSVImport 
                  onFeedbackImported={addBulkFeedback}
                  projectId={projectId}
                />
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'feedback-list' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">All Feedback</h1>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <FeedbackList
                  feedback={feedback}
                  onUpdate={fetchProjectFeedback}
                  currentProject={project}
                />
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'category-analytics' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Category Analytics</h1>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <CategoryAnalytics feedback={feedback} />
              </CardContent>
            </Card>
          </div>
        )}
        
        {activeTab === 'ai-performance' && (
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-6">AI Performance</h1>
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <AIPerformanceMetrics feedback={feedback} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Component wrappers using proper ES6 imports
function ProjectDashboard({ feedback, project, onFeedbackUpdate }) {
  return <Analytics feedback={feedback} />
}

function FeedbackForm({ onFeedbackAdded, projectId }) {
  return <FeedbackFormComponent onFeedbackAdded={onFeedbackAdded} projectId={projectId} />
}

function CSVImport({ onFeedbackImported, projectId }) {
  return <CSVImportComponent onFeedbackImported={onFeedbackImported} projectId={projectId} />
}

function FeedbackList({ feedback, onUpdate, currentProject }) {
  return <FeedbackListComponent feedback={feedback} onUpdate={onUpdate} currentProject={currentProject} />
}

function CategoryAnalytics({ feedback }) {
  return <CategoryAnalyticsComponent feedback={feedback} />
}

function AIPerformanceMetrics({ feedback }) {
  return <AIPerformanceMetricsComponent feedback={feedback} />
}

export default function ProjectDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-teal-600"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}