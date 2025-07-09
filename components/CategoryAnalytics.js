'use client'

import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'
import { format, isWithinInterval, subDays, startOfDay, endOfDay } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
)

export default function CategoryAnalytics({ feedback }) {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const analytics = useMemo(() => {
    if (!feedback || feedback.length === 0) {
      return {
        categories: {},
        categoryTrends: {},
        topKeywords: {}
      }
    }

    // Group feedback by category
    const categories = feedback.reduce((acc, f) => {
      const category = f.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          sentiment: { positive: 0, negative: 0, neutral: 0 },
          aiAnalyzed: 0,
          confidenceSum: 0,
          manualOverrides: 0,
          topics: []
        }
      }
      
      acc[category].count++
      
      // Sentiment breakdown
      const sentiment = f.sentimentLabel || f.sentiment_label || 'neutral'
      acc[category].sentiment[sentiment]++
      
      // AI metrics
      if (f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined) {
        acc[category].aiAnalyzed++
        acc[category].confidenceSum += parseFloat(f.aiCategoryConfidence || 0)
      }
      
      if (f.manualOverride) {
        acc[category].manualOverrides++
      }
      
      // Collect topics
      if (f.topics && f.topics.length > 0) {
        acc[category].topics.push(...f.topics)
      }
      
      return acc
    }, {})

    // Calculate averages and top topics for each category
    Object.keys(categories).forEach(category => {
      const cat = categories[category]
      cat.avgConfidence = cat.aiAnalyzed > 0 ? cat.confidenceSum / cat.aiAnalyzed : 0
      cat.avgSentiment = cat.count > 0 ? 
        (cat.sentiment.positive * 1 + cat.sentiment.neutral * 0.5 + cat.sentiment.negative * 0) / cat.count : 0
      
      // Top topics (most frequent)
      const topicCounts = cat.topics.reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1
        return acc
      }, {})
      
      cat.topTopics = Object.entries(topicCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([topic, count]) => ({ topic, count }))
    })

    // Category trends over last 30 days
    const last30Days = subDays(new Date(), 30)
    const categoryTrends = Object.keys(categories).reduce((acc, category) => {
      const categoryFeedback = feedback.filter(f => 
        (f.category || 'uncategorized') === category &&
        isWithinInterval(new Date(f.feedbackDate || f.feedback_date), {
          start: startOfDay(last30Days),
          end: endOfDay(new Date())
        })
      )
      
      acc[category] = categoryFeedback.reduce((trends, f) => {
        const date = format(new Date(f.feedbackDate || f.feedback_date), 'yyyy-MM-dd')
        if (!trends[date]) {
          trends[date] = { count: 0, sentiment: 0 }
        }
        trends[date].count++
        trends[date].sentiment += parseFloat(f.sentimentScore || f.sentiment_score || 0.5)
        return trends
      }, {})
      
      return acc
    }, {})

    return {
      categories,
      categoryTrends
    }
  }, [feedback])

  const formatCategoryName = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  const categoryNames = Object.keys(analytics.categories)
  const filteredData = selectedCategory === 'all' ? analytics.categories : 
    { [selectedCategory]: analytics.categories[selectedCategory] }

  // Chart data for category comparison
  const categoryComparisonData = {
    labels: categoryNames.map(formatCategoryName),
    datasets: [
      {
        label: 'Feedback Count',
        data: categoryNames.map(cat => analytics.categories[cat].count),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
      {
        label: 'AI Confidence (%)',
        data: categoryNames.map(cat => analytics.categories[cat].avgConfidence * 100),
        backgroundColor: '#10B981',
        borderColor: '#059669',
        borderWidth: 1,
        yAxisID: 'y1',
      },
    ],
  }

  // Sentiment breakdown for selected category
  const sentimentData = selectedCategory === 'all' 
    ? {
        positive: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.positive, 0),
        negative: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.negative, 0),
        neutral: Object.values(analytics.categories).reduce((sum, cat) => sum + cat.sentiment.neutral, 0),
      }
    : analytics.categories[selectedCategory]?.sentiment || { positive: 0, negative: 0, neutral: 0 }

  // Create consistent sentiment chart data with proper color mapping
  const getSentimentChartData = () => {
    const sentimentOrder = ['positive', 'negative', 'neutral']
    const sentimentColors = {
      positive: '#10B981', // green
      negative: '#EF4444', // red
      neutral: '#6B7280'   // gray
    }
    const sentimentLabels = {
      positive: 'Positive',
      negative: 'Negative',
      neutral: 'Neutral'
    }

    const labels = []
    const data = []
    const backgroundColor = []

    sentimentOrder.forEach(sentiment => {
      if (sentimentData[sentiment] > 0) {
        labels.push(sentimentLabels[sentiment])
        data.push(sentimentData[sentiment])
        backgroundColor.push(sentimentColors[sentiment])
      }
    })

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    }
  }

  const sentimentChartData = getSentimentChartData()

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  }

  const exportCategoryReport = () => {
    const reportData = Object.entries(analytics.categories).map(([category, data]) => ({
      category: formatCategoryName(category),
      feedbackCount: data.count,
      aiAnalyzed: data.aiAnalyzed,
      avgConfidence: Math.round(data.avgConfidence * 100) + '%',
      manualOverrides: data.manualOverrides,
      positiveCount: data.sentiment.positive,
      negativeCount: data.sentiment.negative,
      neutralCount: data.sentiment.neutral,
      avgSentiment: (data.avgSentiment * 100).toFixed(1) + '%',
      topTopics: data.topTopics.map(t => t.topic).join('; ')
    }))

    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent(
      'Category,Feedback Count,AI Analyzed,Avg Confidence,Manual Overrides,Positive,Negative,Neutral,Avg Sentiment,Top Topics\n' +
      reportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n')
    )
    
    const link = document.createElement('a')
    link.href = csv
    link.download = 'category-analytics-report.csv'
    link.click()
  }

  if (!feedback || feedback.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Category Data Available</h3>
          <p className="text-muted-foreground text-center mb-6">
            Start by adding some feedback to see detailed category analytics and insights.
          </p>
          <div className="flex gap-3">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'add-feedback' }))}
            >
              <span>➕</span>
              Add Feedback
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'import-csv' }))}
            >
              <span>📁</span>
              Import CSV
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Analyzing {Object.keys(analytics.categories).length} categories with {feedback.length} total feedback entries
            </p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 gap-1">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              {Object.keys(analytics.categories).length} Categories
            </Badge>
            <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 gap-1">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              {Object.values(analytics.categories).reduce((sum, cat) => sum + cat.aiAnalyzed, 0)} AI Analyzed
            </Badge>
          </div>
        </div>
        
        <Button
          onClick={exportCategoryReport}
          variant="outline"
          className="gap-2"
        >
          📊 Export Report
        </Button>
      </div>

      {/* Category Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            Category Analysis
          </CardTitle>
          <CardDescription>
            Select a specific category to view detailed analytics or analyze all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Label htmlFor="category-select" className="text-sm font-medium min-w-fit">
              Focus on Category:
            </Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select category to analyze" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">📊 All Categories</SelectItem>
                {categoryNames.map(category => (
                  <SelectItem key={category} value={category}>
                    📂 {formatCategoryName(category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(filteredData).map(([category, data]) => (
          <Card key={category} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                📂 {formatCategoryName(category)}
              </CardTitle>
              <CardDescription>
                Category performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Total Feedback</Label>
                  <div className="text-2xl font-bold text-blue-600">{data.count}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">AI Analyzed</Label>
                  <div className="text-lg font-semibold text-purple-600">
                    {data.aiAnalyzed}
                    <span className="text-sm text-muted-foreground ml-1">
                      ({Math.round((data.aiAnalyzed / data.count) * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label className="text-xs text-muted-foreground">AI Confidence</Label>
                    <Badge
                      className={
                        data.avgConfidence >= 0.8 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                        data.avgConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                        'bg-red-100 text-red-700 hover:bg-red-200'
                      }
                    >
                      {Math.round(data.avgConfidence * 100)}%
                    </Badge>
                  </div>
                  <Progress
                    value={data.avgConfidence * 100}
                    className={`h-2 ${
                      data.avgConfidence >= 0.8 ? '[&>div]:bg-green-500' :
                      data.avgConfidence >= 0.6 ? '[&>div]:bg-yellow-500' :
                      '[&>div]:bg-red-500'
                    }`}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Manual Overrides</Label>
                  <Badge variant="outline" className="text-xs">
                    {data.manualOverrides} / {data.count}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <Label className="text-xs text-muted-foreground">Avg Sentiment</Label>
                  <Badge
                    className={
                      data.avgSentiment >= 0.6 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      data.avgSentiment >= 0.4 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                      'bg-red-100 text-red-700 hover:bg-red-200'
                    }
                  >
                    {(data.avgSentiment * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              Category Performance Comparison
            </CardTitle>
            <CardDescription>
              Compare feedback count and AI confidence across categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Bar data={categoryComparisonData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🎭</span>
              Sentiment Distribution
              {selectedCategory !== 'all' && (
                <Badge variant="outline" className="ml-2">
                  {formatCategoryName(selectedCategory)}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {selectedCategory === 'all' ? 'Overall sentiment breakdown across all categories' : `Sentiment analysis for ${formatCategoryName(selectedCategory)}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <Pie data={sentimentChartData} options={{ responsive: true }} />
            </div>
            <div className="mt-4 flex justify-center gap-4">
              {sentimentData.positive > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm">Positive ({sentimentData.positive})</span>
                </div>
              )}
              {sentimentData.negative > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Negative ({sentimentData.negative})</span>
                </div>
              )}
              {sentimentData.neutral > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-sm">Neutral ({sentimentData.neutral})</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Topics for Selected Category */}
      {selectedCategory !== 'all' && analytics.categories[selectedCategory]?.topTopics?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              Top Topics - {formatCategoryName(selectedCategory)}
            </CardTitle>
            <CardDescription>
              Most frequently mentioned topics in this category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.categories[selectedCategory].topTopics.map(({ topic, count }, index) => (
                <Badge
                  key={index}
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  🔖 {topic} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Category Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            Detailed Category Breakdown
          </CardTitle>
          <CardDescription>
            Complete analytics overview for all categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">📂 Category</th>
                  <th className="text-left py-3 px-4 font-medium">📊 Count</th>
                  <th className="text-left py-3 px-4 font-medium">🤖 AI Coverage</th>
                  <th className="text-left py-3 px-4 font-medium">🎯 Confidence</th>
                  <th className="text-left py-3 px-4 font-medium">😊 Sentiment</th>
                  <th className="text-left py-3 px-4 font-medium">👤 Manual</th>
                  <th className="text-left py-3 px-4 font-medium">🏷️ Topics</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(analytics.categories).map(([category, data]) => (
                  <tr key={category} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="font-medium">{formatCategoryName(category)}</div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="font-mono">
                        {data.count}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <Progress
                          value={(data.aiAnalyzed / data.count) * 100}
                          className="w-16 h-2 [&>div]:bg-purple-500"
                        />
                        <span className="text-sm font-medium text-purple-600">
                          {Math.round((data.aiAnalyzed / data.count) * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={
                          data.avgConfidence >= 0.8 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          data.avgConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                          'bg-red-100 text-red-700 hover:bg-red-200'
                        }
                      >
                        {Math.round(data.avgConfidence * 100)}%
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={
                          data.avgSentiment >= 0.6 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                          data.avgSentiment >= 0.4 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                          'bg-red-100 text-red-700 hover:bg-red-200'
                        }
                      >
                        {(data.avgSentiment * 100).toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <span className="font-medium">{data.manualOverrides}</span>
                        <span className="text-muted-foreground"> / {data.count}</span>
                        <div className="text-xs text-muted-foreground">
                          ({Math.round((data.manualOverrides / data.count) * 100)}%)
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {data.topTopics.slice(0, 2).map(({ topic }, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {data.topTopics.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{data.topTopics.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}