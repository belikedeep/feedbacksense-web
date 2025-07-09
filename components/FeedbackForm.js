'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'

export default function FeedbackForm({ onFeedbackAdded, projectId }) {
  const [content, setContent] = useState('')
  const [source, setSource] = useState('manual')
  const [category, setCategory] = useState('') // Empty by default to let AI categorize
  const [feedbackDate, setFeedbackDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [aiAnalysisResult, setAiAnalysisResult] = useState(null)
  const [showAiResults, setShowAiResults] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    setAiAnalysisResult(null)
    setShowAiResults(false)

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      // Insert feedback via API (AI analysis happens server-side)
      const apiUrl = projectId ? `/project/${projectId}/api/feedback` : '/api/feedback'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          content,
          source,
          category: category || undefined, // Only send category if manually selected
          feedbackDate
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add feedback')
      }
      
      const data = await response.json()

      // Store AI analysis results for display
      if (data.aiCategoryConfidence !== null) {
        setAiAnalysisResult({
          category: data.category,
          confidence: data.aiCategoryConfidence,
          sentiment: data.sentimentLabel,
          sentimentScore: data.sentimentScore,
          topics: data.topics,
          wasManualOverride: data.manualOverride
        })
        setShowAiResults(true)
      }

      setMessage('Feedback added successfully!')
      setContent('')
      setCategory('')
      onFeedbackAdded(data)
    } catch (error) {
      setMessage('Error adding feedback: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence) => {
    if (confidence >= 0.8) return 'High'
    if (confidence >= 0.6) return 'Medium'
    return 'Low'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                Feedback Details
              </CardTitle>
              <CardDescription>
                Enter the feedback content and let our AI analyze it automatically
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="content">Feedback Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter customer feedback here... Our AI will automatically analyze sentiment and categorize it."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px]"
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    {content.length} characters • AI analysis enabled
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select value={source} onValueChange={setSource}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feedback source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">📝 Manual Entry</SelectItem>
                        <SelectItem value="email">📧 Email</SelectItem>
                        <SelectItem value="chat">💬 Chat</SelectItem>
                        <SelectItem value="social">📱 Social Media</SelectItem>
                        <SelectItem value="survey">📊 Survey</SelectItem>
                        <SelectItem value="phone">📞 Phone</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedbackDate">Date</Label>
                    <Input
                      type="date"
                      id="feedbackDate"
                      value={feedbackDate}
                      onChange={(e) => setFeedbackDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (Optional)</Label>
                  <Select value={category || "auto"} onValueChange={(value) => setCategory(value === "auto" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="🤖 Let AI categorize automatically" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">🤖 AI Auto-categorization</SelectItem>
                      <SelectItem value="general_inquiry">❓ General Inquiry</SelectItem>
                      <SelectItem value="product_feedback">💭 Product Feedback</SelectItem>
                      <SelectItem value="service_complaint">⚠️ Service Complaint</SelectItem>
                      <SelectItem value="billing_issue">💰 Billing Issue</SelectItem>
                      <SelectItem value="technical_support">🔧 Technical Support</SelectItem>
                      <SelectItem value="feature_request">💡 Feature Request</SelectItem>
                      <SelectItem value="bug_report">🐛 Bug Report</SelectItem>
                      <SelectItem value="compliment">👏 Compliment</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Leave empty to let our AI automatically categorize the feedback
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      🤖 AI Analyzing & Saving...
                    </>
                  ) : (
                    <>
                      ➕ Add Feedback
                    </>
                  )}
                </Button>
              </form>

              {message && (
                <Alert className={message.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                  <AlertDescription className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Info Card */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <span className="text-xl">🤖</span>
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">What our AI analyzes:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Sentiment analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Automatic categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Topic extraction
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Confidence scoring
                  </li>
                </ul>
              </div>
              <Separator />
              <div>
                <p className="text-blue-600 text-xs">
                  Powered by Google Gemini AI for accurate and fast analysis
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium mb-1">For better AI analysis:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Be specific and detailed</li>
                  <li>• Include context when possible</li>
                  <li>• Use natural language</li>
                  <li>• Minimum 10-15 words recommended</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Analysis Results */}
      {showAiResults && aiAnalysisResult && (
        <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-green-900">
                <span className="text-xl">🎉</span>
                AI Analysis Complete
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAiResults(false)}
                className="text-green-700 hover:text-green-900"
              >
                ✕
              </Button>
            </CardTitle>
            <CardDescription className="text-green-700">
              Your feedback has been successfully analyzed and categorized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-green-900">Category</Label>
                  <div className="mt-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {aiAnalysisResult.category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                    {aiAnalysisResult.wasManualOverride && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Manual Override
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-green-900">Confidence Level</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">
                        {getConfidenceLabel(aiAnalysisResult.confidence)}
                      </span>
                      <span>{Math.round(aiAnalysisResult.confidence * 100)}%</span>
                    </div>
                    <Progress
                      value={aiAnalysisResult.confidence * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-green-900">Sentiment</Label>
                  <div className="mt-1">
                    <Badge
                      className={
                        aiAnalysisResult.sentiment === 'positive' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        aiAnalysisResult.sentiment === 'negative' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    >
                      {aiAnalysisResult.sentiment === 'positive' ? '😊' :
                       aiAnalysisResult.sentiment === 'negative' ? '😔' : '😐'} {aiAnalysisResult.sentiment} ({Math.round(aiAnalysisResult.sentimentScore * 100)}%)
                    </Badge>
                  </div>
                </div>

                {aiAnalysisResult.topics && aiAnalysisResult.topics.length > 0 && (
                  <div>
                    <Label className="text-green-900">Extracted Topics</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {aiAnalysisResult.topics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}