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
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2'
import TimeRangeSelector from './TimeRangeSelector'
import ExportPanel from './ExportPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { format, isWithinInterval, subDays, subMonths, subYears, startOfDay, endOfDay, parseISO, isValid } from 'date-fns'

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

export default function Analytics({ feedback }) {
  const [selectedTimeRange, setSelectedTimeRange] = useState({
    start: startOfDay(subDays(new Date(), 29)),
    end: endOfDay(new Date()),
    rangeId: 'last30days'
  })
  const [showExportPanel, setShowExportPanel] = useState(false)

  // Filter feedback by selected time range
  const filteredFeedback = useMemo(() => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return feedback

    return feedback.filter(item => {
      try {
        // Standardize date field handling
        const dateValue = item.feedbackDate || item.feedback_date
        if (!dateValue) return false

        // Parse date properly handling both ISO strings and Date objects
        let feedbackDate
        if (typeof dateValue === 'string') {
          // Handle both full ISO strings and date-only strings
          feedbackDate = dateValue.includes('T') ? parseISO(dateValue) : parseISO(dateValue + 'T00:00:00.000Z')
        } else {
          feedbackDate = new Date(dateValue)
        }

        // Validate parsed date
        if (!isValid(feedbackDate)) return false

        return isWithinInterval(feedbackDate, {
          start: selectedTimeRange.start,
          end: selectedTimeRange.end
        })
      } catch (error) {
        console.warn('Error parsing feedback date:', error, item)
        return false
      }
    })
  }, [feedback, selectedTimeRange])

  // Calculate previous period data for comparison
  const previousPeriodData = useMemo(() => {
    if (!selectedTimeRange.start || !selectedTimeRange.end) return []

    let previousStart, previousEnd
    
    // Calculate previous period based on range type, handling month boundaries properly
    if (selectedTimeRange.rangeId === 'last3months') {
      previousStart = subMonths(selectedTimeRange.start, 3)
      previousEnd = subMonths(selectedTimeRange.end, 3)
    } else if (selectedTimeRange.rangeId === 'last6months') {
      previousStart = subMonths(selectedTimeRange.start, 6)
      previousEnd = subMonths(selectedTimeRange.end, 6)
    } else if (selectedTimeRange.rangeId === '1year') {
      previousStart = subYears(selectedTimeRange.start, 1)
      previousEnd = subYears(selectedTimeRange.end, 1)
    } else {
      // For day-based ranges, use day subtraction
      const rangeDays = Math.ceil((selectedTimeRange.end - selectedTimeRange.start) / (1000 * 60 * 60 * 24))
      previousStart = subDays(selectedTimeRange.start, rangeDays)
      previousEnd = subDays(selectedTimeRange.end, rangeDays)
    }

    return feedback.filter(item => {
      try {
        // Use same date parsing logic as filteredFeedback
        const dateValue = item.feedbackDate || item.feedback_date
        if (!dateValue) return false

        let feedbackDate
        if (typeof dateValue === 'string') {
          feedbackDate = dateValue.includes('T') ? parseISO(dateValue) : parseISO(dateValue + 'T00:00:00.000Z')
        } else {
          feedbackDate = new Date(dateValue)
        }

        if (!isValid(feedbackDate)) return false

        return isWithinInterval(feedbackDate, {
          start: previousStart,
          end: previousEnd
        })
      } catch (error) {
        console.warn('Error parsing feedback date for previous period:', error, item)
        return false
      }
    })
  }, [feedback, selectedTimeRange])

  const analytics = useMemo(() => {
    if (!filteredFeedback || filteredFeedback.length === 0) {
      return {
        totalFeedback: 0,
        sentimentDistribution: { positive: 0, negative: 0, neutral: 0 },
        categoryDistribution: {},
        sourceDistribution: {},
        recentTrend: [],
        averageSentiment: 0,
        aiMetrics: {
          totalAIAnalyzed: 0,
          averageConfidence: 0,
          highConfidenceCount: 0,
          manualOverrideCount: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 }
        },
        categoryConfidenceStats: {},
        aiCategoryTrends: []
      }
    }

    // Basic metrics
    const totalFeedback = filteredFeedback.length
    const averageSentiment = totalFeedback > 0
      ? filteredFeedback.reduce((sum, f) => {
          const score = parseFloat(f.sentimentScore || f.sentiment_score || 0)
          return sum + score
        }, 0) / totalFeedback
      : 0

    // Sentiment distribution
    const sentimentDistribution = filteredFeedback.reduce((acc, f) => {
      const label = f.sentimentLabel || f.sentiment_label || 'neutral'
      acc[label] = (acc[label] || 0) + 1
      return acc
    }, {})

    // Category distribution
    const categoryDistribution = filteredFeedback.reduce((acc, f) => {
      acc[f.category] = (acc[f.category] || 0) + 1
      return acc
    }, {})

    // Source distribution
    const sourceDistribution = filteredFeedback.reduce((acc, f) => {
      acc[f.source] = (acc[f.source] || 0) + 1
      return acc
    }, {})

    // AI Analytics
    const aiAnalyzedFeedback = filteredFeedback.filter(f => f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined)
    const totalAIAnalyzed = aiAnalyzedFeedback.length
    
    const averageConfidence = totalAIAnalyzed > 0
      ? aiAnalyzedFeedback.reduce((sum, f) => sum + parseFloat(f.aiCategoryConfidence || 0), 0) / totalAIAnalyzed
      : 0

    const highConfidenceCount = aiAnalyzedFeedback.filter(f => parseFloat(f.aiCategoryConfidence || 0) > 0.8).length
    const manualOverrideCount = filteredFeedback.filter(f => f.manualOverride).length

    // Confidence distribution
    const confidenceDistribution = aiAnalyzedFeedback.reduce((acc, f) => {
      const confidence = parseFloat(f.aiCategoryConfidence || 0)
      if (confidence > 0.8) acc.high++
      else if (confidence > 0.5) acc.medium++
      else acc.low++
      return acc
    }, { high: 0, medium: 0, low: 0 })

    // Category confidence statistics
    const categoryConfidenceStats = Object.keys(categoryDistribution).reduce((acc, category) => {
      const categoryFeedback = filteredFeedback.filter(f => f.category === category)
      const aiCategoryFeedback = categoryFeedback.filter(f => f.aiCategoryConfidence !== null)
      
      acc[category] = {
        total: categoryFeedback.length,
        aiAnalyzed: aiCategoryFeedback.length,
        avgConfidence: aiCategoryFeedback.length > 0
          ? aiCategoryFeedback.reduce((sum, f) => sum + parseFloat(f.aiCategoryConfidence || 0), 0) / aiCategoryFeedback.length
          : 0,
        manualOverrides: categoryFeedback.filter(f => f.manualOverride).length,
        sentiment: categoryFeedback.reduce((acc, f) => {
          const label = f.sentimentLabel || f.sentiment_label || 'neutral'
          acc[label] = (acc[label] || 0) + 1
          return acc
        }, { positive: 0, negative: 0, neutral: 0 })
      }
      return acc
    }, {})

    const aiMetrics = {
      totalAIAnalyzed,
      averageConfidence,
      highConfidenceCount,
      manualOverrideCount,
      confidenceDistribution
    }

    // Generate trend data based on selected time range
    const generateTrendData = (startDate, endDate, data) => {
      const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1
      const trendData = []

      for (let i = 0; i < days; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split('T')[0]

        const dayFeedback = data.filter(f => {
          try {
            const dateValue = f.feedbackDate || f.feedback_date
            if (!dateValue) return false
            
            let feedbackDate
            if (typeof dateValue === 'string') {
              feedbackDate = dateValue.includes('T') ? parseISO(dateValue) : parseISO(dateValue + 'T00:00:00.000Z')
            } else {
              feedbackDate = new Date(dateValue)
            }
            
            if (!isValid(feedbackDate)) return false
            
            const feedbackDateStr = feedbackDate.toISOString().split('T')[0]
            return feedbackDateStr === dateStr
          } catch (error) {
            console.warn('Error parsing date in trend generation:', error, f)
            return false
          }
        })

        trendData.push({
          date: dateStr,
          count: dayFeedback.length,
          sentiment: dayFeedback.length > 0 ?
            dayFeedback.reduce((sum, f) => sum + parseFloat(f.sentimentScore || f.sentiment_score || 0), 0) / dayFeedback.length : 0
        })
      }

      return trendData
    }

    const recentTrend = generateTrendData(selectedTimeRange.start, selectedTimeRange.end, filteredFeedback)
    
    // AI Category Trends over time
    const aiCategoryTrends = generateTrendData(selectedTimeRange.start, selectedTimeRange.end, filteredFeedback)
      .map(trend => ({
        ...trend,
        aiAnalyzed: filteredFeedback.filter(f => {
          try {
            const dateValue = f.feedbackDate || f.feedback_date
            if (!dateValue) return false
            
            let feedbackDate
            if (typeof dateValue === 'string') {
              feedbackDate = dateValue.includes('T') ? parseISO(dateValue) : parseISO(dateValue + 'T00:00:00.000Z')
            } else {
              feedbackDate = new Date(dateValue)
            }
            
            if (!isValid(feedbackDate)) return false
            
            const feedbackDateStr = feedbackDate.toISOString().split('T')[0]
            return feedbackDateStr === trend.date && f.aiCategoryConfidence !== null
          } catch (error) {
            return false
          }
        }).length,
        avgConfidence: (() => {
          const dayAIFeedback = filteredFeedback.filter(f => {
            try {
              const dateValue = f.feedbackDate || f.feedback_date
              if (!dateValue) return false
              
              let feedbackDate
              if (typeof dateValue === 'string') {
                feedbackDate = dateValue.includes('T') ? parseISO(dateValue) : parseISO(dateValue + 'T00:00:00.000Z')
              } else {
                feedbackDate = new Date(dateValue)
              }
              
              if (!isValid(feedbackDate)) return false
              
              const feedbackDateStr = feedbackDate.toISOString().split('T')[0]
              return feedbackDateStr === trend.date && f.aiCategoryConfidence !== null
            } catch (error) {
              return false
            }
          })
          return dayAIFeedback.length > 0
            ? dayAIFeedback.reduce((sum, f) => sum + parseFloat(f.aiCategoryConfidence || 0), 0) / dayAIFeedback.length
            : 0
        })()
      }))

    return {
      totalFeedback,
      sentimentDistribution,
      categoryDistribution,
      sourceDistribution,
      recentTrend,
      averageSentiment,
      previousPeriodData,
      selectedTimeRange,
      aiMetrics,
      categoryConfidenceStats,
      aiCategoryTrends
    }
  }, [filteredFeedback, previousPeriodData, selectedTimeRange])

  // Calculate period-over-period comparison
  const periodComparison = useMemo(() => {
    const currentTotal = analytics.totalFeedback
    const previousTotal = previousPeriodData.length
    
    const currentPositive = analytics.sentimentDistribution.positive || 0
    const previousPositive = previousPeriodData.filter(f =>
      (f.sentimentLabel || f.sentiment_label) === 'positive'
    ).length
    
    const currentAvgSentiment = analytics.averageSentiment
    const previousAvgSentiment = previousTotal > 0 ?
      previousPeriodData.reduce((sum, f) => sum + parseFloat(f.sentimentScore || f.sentiment_score || 0), 0) / previousTotal : 0

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      totalChange: calculateChange(currentTotal, previousTotal),
      positiveChange: calculateChange(currentPositive, previousPositive),
      sentimentChange: calculateChange(currentAvgSentiment, previousAvgSentiment),
      hasPreviousData: previousTotal > 0
    }
  }, [analytics, previousPeriodData])

  const handleTimeRangeChange = (start, end, rangeId) => {
    setSelectedTimeRange({ start, end, rangeId })
  }

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
      if (analytics.sentimentDistribution[sentiment] > 0) {
        labels.push(sentimentLabels[sentiment])
        data.push(analytics.sentimentDistribution[sentiment])
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

  const categoryChartData = {
    labels: Object.keys(analytics.categoryDistribution),
    datasets: [
      {
        label: 'Feedback Count',
        data: Object.values(analytics.categoryDistribution),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  }

  const trendChartData = {
    labels: analytics.recentTrend.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Feedback Count',
        data: analytics.recentTrend.map(d => d.count),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.1,
      },
      {
        label: 'AI Analyzed',
        data: analytics.aiCategoryTrends.map(d => d.aiAnalyzed),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
      },
    ],
  }

  // AI Confidence Distribution Chart
  const confidenceChartData = {
    labels: ['High (>80%)', 'Medium (50-80%)', 'Low (<50%)'],
    datasets: [
      {
        data: [
          analytics.aiMetrics.confidenceDistribution.high,
          analytics.aiMetrics.confidenceDistribution.medium,
          analytics.aiMetrics.confidenceDistribution.low
        ],
        backgroundColor: [
          '#10B981', // green
          '#F59E0B', // yellow
          '#EF4444', // red
        ],
        borderWidth: 1,
      },
    ],
  }

  // Category AI Performance Chart
  const categoryAIChartData = {
    labels: Object.keys(analytics.categoryConfidenceStats).map(cat =>
      cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Average AI Confidence (%)',
        data: Object.values(analytics.categoryConfidenceStats).map(stat => stat.avgConfidence * 100),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
      },
    ],
  }

  // AI Confidence Trend Chart
  const aiConfidenceTrendData = {
    labels: analytics.aiCategoryTrends.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Average AI Confidence (%)',
        data: analytics.aiCategoryTrends.map(d => d.avgConfidence * 100),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  }

  const formatChange = (change) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const getChangeColor = (change) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">No Data Available</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            Start by adding some feedback to see comprehensive analytics and insights. You can add individual entries or import bulk data from CSV files.
          </p>
          <div className="flex gap-3">
            <Button
              variant="default"
              className="gap-2"
              onClick={() => window.dispatchEvent(new CustomEvent('switchTab', { detail: 'add-feedback' }))}
            >
              <span>➕</span>
              Add First Feedback
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
      <div className="flex items-center justify-between">
        <Button
          onClick={() => setShowExportPanel(!showExportPanel)}
          variant="outline"
          className="gap-2 ml-auto"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Data
        </Button>
      </div>

      {/* Time Range Selector */}
      <TimeRangeSelector
        onRangeChange={handleTimeRangeChange}
        initialRange={selectedTimeRange.rangeId}
      />

      {/* Date Range Display */}
      {selectedTimeRange.start && selectedTimeRange.end && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-900">Analytics Period</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="text-lg font-semibold text-blue-900">
                  {format(selectedTimeRange.start, 'MMM dd, yyyy')} - {format(selectedTimeRange.end, 'MMM dd, yyyy')}
                </div>
                <Badge variant="outline" className="text-xs bg-white/70 text-blue-700 border-blue-300 w-fit">
                  {Math.ceil((selectedTimeRange.end - selectedTimeRange.start) / (1000 * 60 * 60 * 24)) + 1} days
                </Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-700">
              Showing data from {format(selectedTimeRange.start, 'EEEE, MMMM do, yyyy')} to {format(selectedTimeRange.end, 'EEEE, MMMM do, yyyy')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Panel */}
      {showExportPanel && (
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>Export your analytics data in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <ExportPanel
              feedback={feedback}
              analytics={analytics}
              filteredFeedback={filteredFeedback}
            />
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <span className="text-blue-500">#</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {periodComparison.hasPreviousData ? (
                <>
                  <Badge
                    className={
                      periodComparison.totalChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      periodComparison.totalChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  >
                    {formatChange(periodComparison.totalChange)}
                  </Badge>
                  <span>from previous period</span>
                </>
              ) : (
                <Badge variant="outline" className="text-xs">
                  No historical data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Feedback</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <span className="text-green-500">😊</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sentimentDistribution.positive || 0}</div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {periodComparison.hasPreviousData ? (
                <>
                  <Badge
                    className={
                      periodComparison.positiveChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      periodComparison.positiveChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  >
                    {formatChange(periodComparison.positiveChange)}
                  </Badge>
                  <span>from previous period</span>
                </>
              ) : (
                <Badge variant="outline" className="text-xs">
                  No comparison data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Feedback</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <span className="text-red-500">😞</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.sentimentDistribution.negative || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.totalFeedback > 0 ?
                `${((analytics.sentimentDistribution.negative || 0) / analytics.totalFeedback * 100).toFixed(1)}% of total` :
                'No data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">
              <span className="text-blue-500">📊</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isNaN(analytics.averageSentiment) ? '0.0' : (analytics.averageSentiment * 100).toFixed(1)}%
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {periodComparison.hasPreviousData ? (
                <>
                  <Badge
                    className={
                      periodComparison.sentimentChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                      periodComparison.sentimentChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  >
                    {formatChange(periodComparison.sentimentChange)}
                  </Badge>
                  <span>from previous period</span>
                </>
              ) : (
                <Badge variant="outline" className="text-xs">
                  No trend data
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Summary Cards */}
      {analytics.aiMetrics.totalAIAnalyzed > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold">🤖 AI Analysis Insights</h3>
            <Badge variant="secondary" className="text-xs">
              Powered by Gemini AI
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Analyzed</CardTitle>
                <span className="text-purple-500">🤖</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.aiMetrics.totalAIAnalyzed}</div>
                <div className="flex items-center gap-2">
                  <Progress
                    value={(analytics.aiMetrics.totalAIAnalyzed / analytics.totalFeedback) * 100}
                    className="flex-1 h-2 [&>div]:bg-purple-500"
                  />
                  <span className="text-xs text-purple-600 font-medium">
                    {Math.round((analytics.aiMetrics.totalAIAnalyzed / analytics.totalFeedback) * 100)}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg AI Confidence</CardTitle>
                <span className="text-green-500">🎯</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(analytics.aiMetrics.averageConfidence * 100)}%</div>
                <Progress
                  value={analytics.aiMetrics.averageConfidence * 100}
                  className={`mt-2 h-2 ${
                    analytics.aiMetrics.averageConfidence >= 0.8 ? '[&>div]:bg-green-500' :
                    analytics.aiMetrics.averageConfidence >= 0.6 ? '[&>div]:bg-yellow-500' :
                    '[&>div]:bg-red-500'
                  }`}
                />
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
                <span className="text-blue-500">⭐</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.aiMetrics.highConfidenceCount}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((analytics.aiMetrics.highConfidenceCount / Math.max(analytics.aiMetrics.totalAIAnalyzed, 1)) * 100)}% of AI analyzed
                </p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-gradient-to-br from-orange-50 to-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manual Overrides</CardTitle>
                <span className="text-orange-500">✋</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics.aiMetrics.manualOverrideCount}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((analytics.aiMetrics.manualOverrideCount / analytics.totalFeedback) * 100)}% of total feedback
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Sentiment Distribution
                  <Badge variant="outline" className="text-xs">Real-time</Badge>
                </CardTitle>
                <CardDescription>
                  Breakdown of feedback sentiment across your selected timeframe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64" data-chart-export data-chart-title="Sentiment Distribution">
                  <Pie data={sentimentChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feedback by Category</CardTitle>
                <CardDescription>
                  Volume of feedback across different categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64" data-chart-export data-chart-title="Feedback by Category">
                  <Bar data={categoryChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          {analytics.aiMetrics.totalAIAnalyzed > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AI Confidence Distribution
                    <Badge variant="secondary" className="text-xs">🤖 AI</Badge>
                  </CardTitle>
                  <CardDescription>
                    Distribution of AI confidence levels across analyzed feedback
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64" data-chart-export data-chart-title="AI Confidence Distribution">
                    <Doughnut data={confidenceChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Performance by Category</CardTitle>
                  <CardDescription>
                    Average AI confidence score for each feedback category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64" data-chart-export data-chart-title="AI Performance by Category">
                    <Bar data={categoryAIChartData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-lg font-semibold mb-2">No AI Analysis Data</h3>
                <p className="text-muted-foreground text-center">
                  Start analyzing your feedback with AI to see insights here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  Feedback Trend ({selectedTimeRange.rangeId === 'custom' ? 'Custom Range' :
                    selectedTimeRange.rangeId.replace('last', 'Last ').replace('days', ' Days').replace('months', ' Months').replace('1year', '1 Year')})
                </CardTitle>
                <CardDescription>
                  Volume and AI analysis trends over your selected time period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64" data-chart-export data-chart-title="Feedback Trend">
                  <Line data={trendChartData} options={chartOptions} />
                </div>
              </CardContent>
            </Card>

            {analytics.aiMetrics.totalAIAnalyzed > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    AI Confidence Trend Over Time
                    <Badge variant="secondary" className="text-xs">🤖 AI</Badge>
                  </CardTitle>
                  <CardDescription>
                    Track how AI confidence levels change over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64" data-chart-export data-chart-title="AI Confidence Trend">
                    <Line data={aiConfidenceTrendData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>


      {/* Category Performance Analytics */}
      {analytics.aiMetrics.totalAIAnalyzed > 0 && Object.keys(analytics.categoryConfidenceStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Category Performance Analytics
              <Badge variant="secondary" className="text-xs">🤖 AI</Badge>
            </CardTitle>
            <CardDescription>
              Detailed breakdown of AI performance and sentiment analysis by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-sm">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">AI Analyzed</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Avg Confidence</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Manual Overrides</th>
                    <th className="text-left py-3 px-4 font-medium text-sm">Sentiment Split</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.categoryConfidenceStats).map(([category, stats]) => (
                    <tr key={category} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">
                        {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {stats.total}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{stats.aiAnalyzed}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((stats.aiAnalyzed / stats.total) * 100)}%
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          className={
                            stats.avgConfidence >= 0.8 ? 'bg-green-100 text-green-700 hover:bg-green-200 text-xs' :
                            stats.avgConfidence >= 0.6 ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 text-xs' :
                            'bg-red-100 text-red-700 hover:bg-red-200 text-xs'
                          }
                        >
                          {Math.round(stats.avgConfidence * 100)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{stats.manualOverrides}</span>
                          <Badge variant="outline" className="text-xs">
                            {Math.round((stats.manualOverrides / stats.total) * 100)}%
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Badge variant="outline" className="text-xs text-green-600">
                            +{stats.sentiment.positive}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-gray-600">
                            ~{stats.sentiment.neutral}
                          </Badge>
                          <Badge variant="outline" className="text-xs text-red-600">
                            -{stats.sentiment.negative}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Source Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Sources</CardTitle>
          <CardDescription>
            Distribution of feedback across different collection sources
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(analytics.sourceDistribution).map(([source, count]) => (
            <div key={source} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">{source}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {Math.round((count / analytics.totalFeedback) * 100)}%
                  </Badge>
                  <span className="text-sm text-muted-foreground">{count}</span>
                </div>
              </div>
              <Progress
                value={(count / analytics.totalFeedback) * 100}
                className="h-2"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Period Comparison Summary */}
      {periodComparison.hasPreviousData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Period-over-Period Comparison
              <Badge variant="outline" className="text-xs">
                📈 Trends
              </Badge>
            </CardTitle>
            <CardDescription>
              Performance changes compared to the previous {selectedTimeRange.rangeId === 'custom' ? 'period' :
                selectedTimeRange.rangeId.replace('last', '').replace('days', ' days').replace('months', ' months').replace('1year', ' year')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">
                  <Badge
                    className={
                      periodComparison.totalChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200 text-lg px-3 py-1' :
                      periodComparison.totalChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200 text-lg px-3 py-1' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg px-3 py-1'
                    }
                  >
                    {formatChange(periodComparison.totalChange)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Total Feedback</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">
                  <Badge
                    className={
                      periodComparison.positiveChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200 text-lg px-3 py-1' :
                      periodComparison.positiveChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200 text-lg px-3 py-1' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg px-3 py-1'
                    }
                  >
                    {formatChange(periodComparison.positiveChange)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Positive Feedback</div>
              </div>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold">
                  <Badge
                    className={
                      periodComparison.sentimentChange > 0 ? 'bg-green-100 text-green-700 hover:bg-green-200 text-lg px-3 py-1' :
                      periodComparison.sentimentChange < 0 ? 'bg-red-100 text-red-700 hover:bg-red-200 text-lg px-3 py-1' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200 text-lg px-3 py-1'
                    }
                  >
                    {formatChange(periodComparison.sentimentChange)}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground font-medium">Avg Sentiment</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}