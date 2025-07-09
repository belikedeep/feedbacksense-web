'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import AdvancedSearchPanel from './AdvancedSearchPanel'
import BulkRecategorization from './BulkRecategorization'
import EnhancedBulkOperations from './EnhancedBulkOperations'
import EditFeedbackModal from './EditFeedbackModal'
import { recordUserFeedback } from '@/lib/geminiAI'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function FeedbackList({ feedback, onUpdate, currentProject }) {
  const [filteredFeedback, setFilteredFeedback] = useState(feedback)
  const [currentFilters, setCurrentFilters] = useState({})
  const [editingCategory, setEditingCategory] = useState(null)
  const [newCategory, setNewCategory] = useState('')
  const [updatingFeedback, setUpdatingFeedback] = useState(null)
  const [showBulkPanel, setShowBulkPanel] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list', 'bulk', or 'enhanced'
  const [editingFeedback, setEditingFeedback] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const handleFilteredResults = (results) => {
    setFilteredFeedback(results)
  }

  const handleFiltersChange = (filters) => {
    setCurrentFilters(filters)
  }

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Med'
    return 'Low'
  }

  const getConfidenceIcon = (confidence) => {
    if (confidence >= 0.8) return '🟢'
    if (confidence >= 0.5) return '🟡'
    return '🔴'
  }

  const updateFeedbackCategory = async (id, category) => {
    setUpdatingFeedback(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // Find the original feedback item to record user feedback
      const originalItem = feedback.find(item => item.id === id)
      const originalAICategory = originalItem?.category
      const originalAIConfidence = originalItem?.aiCategoryConfidence

      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          category,
          manualOverride: true // Mark as manually categorized
        })
      })
      
      if (!response.ok) throw new Error('Failed to update feedback')
      
      // Record user feedback for AI improvement if this was an AI categorization
      if (originalAICategory && originalAIConfidence !== null) {
        recordUserFeedback(
          originalItem.content,
          originalAICategory,
          category,
          originalAIConfidence
        )
      }
      
      setEditingCategory(null)
      setNewCategory('')
      onUpdate() // Refresh the list
    } catch (error) {
      alert('Error updating feedback: ' + error.message)
    } finally {
      setUpdatingFeedback(null)
    }
  }

  const triggerReanalysis = async (id) => {
    setUpdatingFeedback(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      const response = await fetch(`/api/feedback/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ reanalyze: true })
      })
      
      if (!response.ok) throw new Error('Failed to reanalyze feedback')
      
      onUpdate() // Refresh the list
    } catch (error) {
      alert('Error reanalyzing feedback: ' + error.message)
    } finally {
      setUpdatingFeedback(null)
    }
  }

  const deleteFeedback = async (id) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) throw new Error('User not authenticated')

        const response = await fetch(`/api/feedback/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (!response.ok) throw new Error('Failed to delete feedback')
        onUpdate()
      } catch (error) {
        alert('Error deleting feedback: ' + error.message)
      }
    }
  }

  const handleEditFeedback = (feedback) => {
    setEditingFeedback(feedback)
    setShowEditModal(true)
  }

  const closeEditModal = () => {
    setEditingFeedback(null)
    setShowEditModal(false)
  }

  // Highlight search terms in content
  const highlightSearchTerms = (content, searchQuery) => {
    if (!searchQuery || !content) return content

    // Simple highlighting for now - can be enhanced for advanced search
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    return content.split(regex).map((part, index) =>
      regex.test(part) ?
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> :
        part
    )
  }

  const categories = [
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'product_feedback', label: 'Product Feedback' },
    { value: 'service_complaint', label: 'Service Complaint' },
    { value: 'billing_issue', label: 'Billing Issue' },
    { value: 'technical_support', label: 'Technical Support' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'compliment', label: 'Compliment' }
  ]

  const formatCategoryName = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'in_review': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'archived': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return '🔴'
      case 'medium': return '🟡'
      case 'low': return '🟢'
      default: return '🟡'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredFeedback.length} of {feedback.length} feedback entries
              {currentProject && (
                <span className="ml-2 text-purple-600">
                  • Project: {currentProject.name}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-200 gap-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              {feedback.filter(f => (f.sentimentLabel || f.sentiment_label) === 'positive').length} Positive
            </Badge>
            <Badge className="bg-red-100 text-red-700 hover:bg-red-200 gap-1">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              {feedback.filter(f => (f.sentimentLabel || f.sentiment_label) === 'negative').length} Negative
            </Badge>
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {feedback.filter(f => f.aiCategoryConfidence !== null).length} AI Analyzed
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="gap-2">
            📋 List View
          </TabsTrigger>
          <TabsTrigger value="bulk" className="gap-2">
            🔄 Legacy Bulk
          </TabsTrigger>
          <TabsTrigger value="enhanced" className="gap-2">
            ⚡ Enhanced Bulk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Search Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🔍</span>
                Advanced Search & Filters
              </CardTitle>
              <CardDescription>
                Search through your feedback using advanced filters and criteria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdvancedSearchPanel
                feedback={feedback}
                onFilteredResults={handleFilteredResults}
                onFiltersChange={handleFiltersChange}
              />
            </CardContent>
          </Card>

          {/* Feedback List */}
          <div className="space-y-4">
            {filteredFeedback.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No Feedback Found</h3>
                  <p className="text-muted-foreground text-center mb-6">
                    Try adjusting your search criteria or filters to find more feedback.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'add-feedback' }))}
                    className="gap-2"
                  >
                    <span>➕</span>
                    Add New Feedback
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFeedback.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {/* Header with badges and actions */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Sentiment Badge */}
                        <Badge
                          className={
                            (item.sentimentLabel || item.sentiment_label) === 'positive' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            (item.sentimentLabel || item.sentiment_label) === 'negative' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }
                        >
                          {(item.sentimentLabel || item.sentiment_label) === 'positive' ? '😊' :
                           (item.sentimentLabel || item.sentiment_label) === 'negative' ? '😔' : '😐'} {item.sentimentLabel || item.sentiment_label}
                        </Badge>
                        
                        {/* Status Badge */}
                        <Badge
                          className={
                            item.status === 'new' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                            item.status === 'in_review' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                            item.status === 'resolved' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                            item.status === 'archived' ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' :
                            'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          }
                        >
                          {item.status === 'new' ? '🆕' :
                           item.status === 'in_review' ? '👀' :
                           item.status === 'resolved' ? '✅' :
                           item.status === 'archived' ? '📁' : '🆕'} {item.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New'}
                        </Badge>
                        
                        {/* Priority Badge */}
                        <Badge
                          className={
                            item.priority === 'high' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                            item.priority === 'medium' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' :
                            'bg-green-100 text-green-700 hover:bg-green-200'
                          }
                        >
                          {getPriorityIcon(item.priority || 'medium')} {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1) || 'Medium'}
                        </Badge>
                        
                        {/* Archive Badge */}
                        {item.isArchived && (
                          <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                            📁 Archived
                          </Badge>
                        )}
                        
                        {/* Source Badge */}
                        <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">
                          📡 {item.source}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {(() => {
                            const date = item.feedbackDate || item.feedback_date
                            if (!date) return 'No date'
                            const dateObj = new Date(date)
                            return isNaN(dateObj.getTime()) ? 'Invalid date' : dateObj.toLocaleDateString()
                          })()}
                        </span>
                        
                        {/* Quick Actions */}
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditFeedback(item)}
                            title="Edit feedback"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => triggerReanalysis(item.id)}
                            disabled={updatingFeedback === item.id}
                            title="Re-analyze with AI"
                          >
                            {updatingFeedback === item.id ? '⏳' : '🤖'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFeedback(item.id)}
                            title="Delete feedback"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Category Section */}
                    <div className="mb-4">
                      {editingCategory === item.id ? (
                        <div className="flex items-center gap-2">
                          <Select
                            value={newCategory || "none"}
                            onValueChange={(value) => setNewCategory(value === "none" ? "" : value)}
                            disabled={updatingFeedback === item.id}
                          >
                            <SelectTrigger className="w-64">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Select category</SelectItem>
                              {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() => updateFeedbackCategory(item.id, newCategory)}
                            disabled={!newCategory || updatingFeedback === item.id}
                          >
                            {updatingFeedback === item.id ? '⏳' : '✓'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCategory(null)
                              setNewCategory('')
                            }}
                            disabled={updatingFeedback === item.id}
                          >
                            ✗
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            className="h-auto p-1 font-medium hover:bg-accent"
                            onClick={() => {
                              setEditingCategory(item.id)
                              setNewCategory(item.category || '')
                            }}
                          >
                            📂 {formatCategoryName(item.category)}
                          </Button>
                          
                          {/* AI Confidence Badge */}
                          {item.aiCategoryConfidence !== null && (
                            <div className="flex items-center gap-1">
                              <Badge
                                className={
                                  item.aiCategoryConfidence >= 0.8 ? 'bg-green-100 text-green-700 hover:bg-green-200 text-xs' :
                                  item.aiCategoryConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs' :
                                  'bg-red-100 text-red-700 hover:bg-red-200 text-xs'
                                }
                              >
                                🤖 {getConfidenceLabel(item.aiCategoryConfidence)} ({Math.round(item.aiCategoryConfidence * 100)}%)
                              </Badge>
                              
                              {item.method && (
                                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-xs" title={`Classification method: ${item.method}`}>
                                  {item.method === 'ai_enhanced' ? '🤖' : item.method === 'fallback_enhanced' ? '🔤' : '📊'}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          {/* Manual Override Indicator */}
                          {item.manualOverride && (
                            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-xs">
                              👤 Manual
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="mb-4">
                      <p className="text-foreground leading-relaxed">
                        {highlightSearchTerms(item.content, currentFilters.searchQuery)}
                      </p>
                    </div>

                    {/* Analytics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm text-muted-foreground">Sentiment Score</Label>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={parseFloat(item.sentimentScore || item.sentiment_score || 0) * 100}
                            className={`w-16 h-2 ${
                              (item.sentimentLabel || item.sentiment_label) === 'positive' ? '[&>div]:bg-green-500' :
                              (item.sentimentLabel || item.sentiment_label) === 'negative' ? '[&>div]:bg-red-500' :
                              '[&>div]:bg-gray-500'
                            }`}
                          />
                          <span className={`text-sm font-medium ${
                            (item.sentimentLabel || item.sentiment_label) === 'positive' ? 'text-green-600' :
                            (item.sentimentLabel || item.sentiment_label) === 'negative' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {(parseFloat(item.sentimentScore || item.sentiment_score || 0) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      {item.aiCategoryConfidence !== null && (
                        <div className="flex items-center justify-between">
                          <Label className="text-sm text-muted-foreground">AI Confidence</Label>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={item.aiCategoryConfidence * 100}
                              className={`w-16 h-2 ${
                                item.aiCategoryConfidence >= 0.8 ? '[&>div]:bg-green-500' :
                                item.aiCategoryConfidence >= 0.6 ? '[&>div]:bg-yellow-500' :
                                '[&>div]:bg-red-500'
                              }`}
                            />
                            <span className={`text-sm font-medium ${
                              item.aiCategoryConfidence >= 0.8 ? 'text-green-600' :
                              item.aiCategoryConfidence >= 0.6 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {Math.round(item.aiCategoryConfidence * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Topics */}
                    {item.topics && item.topics.length > 0 && (
                      <div className="mb-4">
                        <Label className="text-sm text-muted-foreground mb-2 block">Extracted Topics</Label>
                        <div className="flex flex-wrap gap-1">
                          {item.topics.map((topic, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Classification History */}
                    {item.classificationHistory && item.classificationHistory.length > 1 && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                          📊 View Classification History ({item.classificationHistory.length} entries)
                        </summary>
                        <div className="mt-3 space-y-2 pl-4">
                          {item.classificationHistory.slice(-3).map((history, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex justify-between items-center mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {formatCategoryName(history.category)}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(history.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {history.method} - {Math.round(history.confidence * 100)}% confidence
                              </div>
                              {history.reasoning && (
                                <div className="text-xs text-muted-foreground italic mt-1">
                                  {history.reasoning}
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="bulk">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🔄</span>
                Legacy Bulk Operations
              </CardTitle>
              <CardDescription>
                Traditional bulk categorization and management tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BulkRecategorization
                feedback={filteredFeedback.length > 0 ? filteredFeedback : feedback}
                onUpdate={onUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                Enhanced Bulk Operations
              </CardTitle>
              <CardDescription>
                Advanced bulk operations with AI-powered features and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EnhancedBulkOperations
                feedback={filteredFeedback.length > 0 ? filteredFeedback : feedback}
                onUpdate={onUpdate}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Feedback Modal */}
      <EditFeedbackModal
        feedback={editingFeedback}
        isOpen={showEditModal}
        onClose={closeEditModal}
        onUpdate={onUpdate}
      />
    </div>
  )
}