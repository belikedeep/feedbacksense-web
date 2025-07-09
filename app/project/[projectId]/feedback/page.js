'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { supabase } from '@/lib/supabase/client'
import FeedbackList from '@/components/FeedbackList'
import FeedbackForm from '@/components/FeedbackForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PlusIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/24/outline'

export default function ProjectFeedbackPage({ params }) {
  const { project, loading: projectLoading } = useProject()
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('list')

  useEffect(() => {
    if (project) {
      fetchFeedback()
    }
  }, [project])

  const fetchFeedback = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      // Use project-scoped API endpoint
      const response = await fetch(`/project/${params.projectId}/api/feedback`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setFeedback(data || [])
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedbackAdded = (newFeedback) => {
    setFeedback([newFeedback, ...feedback])
    setActiveTab('list') // Switch to list view after adding
  }

  const handleFeedbackUpdate = () => {
    fetchFeedback() // Refresh the list
  }

  if (projectLoading || loading) {
    return (
      <div className="p-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
          <CardContent className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="text-gray-600 font-medium">Loading feedback...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFeedback}
              className="ml-4"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl">
                <DocumentTextIcon className="h-8 w-8 text-teal-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.name} Feedback
                </h1>
                <p className="text-gray-600">
                  Manage and analyze feedback for this project
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setActiveTab('add')}
                className="gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Add Feedback
              </Button>
              <Button
                onClick={() => setActiveTab('import')}
                className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
              >
                <DocumentArrowUpIcon className="h-4 w-4" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="list">
            <DocumentTextIcon className="h-4 w-4 mr-2" />
            All Feedback
          </TabsTrigger>
          <TabsTrigger value="add">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add New
          </TabsTrigger>
          <TabsTrigger value="import">
            <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
            Import
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {feedback.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold mb-2">No Feedback Yet</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Start collecting feedback for this project to see it here.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('add')}
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Feedback
                  </Button>
                  <Button
                    onClick={() => setActiveTab('import')}
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                  >
                    <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <FeedbackList
                  feedback={feedback}
                  onUpdate={handleFeedbackUpdate}
                  currentProject={project}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
            <CardContent className="p-6">
              <FeedbackForm onFeedbackAdded={handleFeedbackAdded} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
            <CardContent className="p-6">
              {/* Import functionality - placeholder for now */}
              <div className="text-center py-8">
                <DocumentArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">CSV Import</h3>
                <p className="text-gray-600 mb-4">
                  Bulk import feedback data from CSV files
                </p>
                <p className="text-sm text-gray-500">
                  CSV import functionality will be implemented to work with project-scoped data.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}