'use client'

import { useState, useEffect } from 'react'
import { useProject } from '@/contexts/ProjectContext'
import { supabase } from '@/lib/supabase/client'
import CategoryAnalytics from '@/components/CategoryAnalytics'
import AIPerformanceMetrics from '@/components/AIPerformanceMetrics'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ExclamationTriangleIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import AIIcon from '@/components/icons/AIIcon'

export default function ProjectAnalyticsPage({ params }) {
  const { project, loading: projectLoading } = useProject()
  const [allFeedback, setAllFeedback] = useState([])
  const [filteredFeedback, setFilteredFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
      setAllFeedback(data || [])
      setFilteredFeedback(data || [])
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (projectLoading || loading) {
    return (
      <div className="p-6">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
          <CardContent className="flex justify-center items-center h-64">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
              <p className="text-gray-600 font-medium">Loading analytics...</p>
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
        <div className="flex flex-col gap-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-stone-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl">
                <ChartBarIcon className="h-8 w-8 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {project?.name} Analytics
                </h1>
                <p className="text-gray-600">
                  Deep insights and performance metrics for this project
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
              onClick={fetchFeedback}
            >
              <ArrowPathIcon className="h-4 w-4" />
              Refresh Data
            </Button>
          </div>
          </div>
          
          {/* Time Range Selector */}
          {allFeedback.length > 0 && (
            <TimeRangeSelector
              feedback={allFeedback}
              onRangeChange={(start, end) => {
                const filtered = allFeedback.filter(f => {
                  const date = new Date(f.createdAt || f.created_at)
                  return date >= start && date <= end
                })
                setFilteredFeedback(filtered)
              }}
            />
          )}
        </div>
      </div>

      {/* Analytics Content */}
      {allFeedback.length === 0 ? (
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2">No Data for Analytics</h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              Add some feedback to this project to see detailed analytics and insights.
            </p>
            <Button
              onClick={() => window.location.href = `/project/${params.projectId}/feedback`}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              Add Feedback
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="categories" className="gap-2">
              <ChartBarIcon className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="ai-performance" className="gap-2">
              <AIIcon className="h-4 w-4" />
              AI Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Category Analytics</h3>
                  <p className="text-gray-600 text-sm">
                    Analyze feedback distribution and trends across categories for this project
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Showing analytics for {filteredFeedback.length} out of {allFeedback.length} total feedback items
                  </p>
                </div>
                <CategoryAnalytics feedback={filteredFeedback} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-performance">
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-stone-200">
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Performance Metrics</h3>
                  <p className="text-gray-600 text-sm">
                    Monitor AI categorization accuracy and performance for this project
                  </p>
                </div>
                <AIPerformanceMetrics feedback={filteredFeedback} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}