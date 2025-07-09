'use client'

import { useState, useEffect } from 'react'
import { getAIPerformanceMetrics } from '@/lib/geminiAI'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
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

export default function AIPerformanceMetrics({ feedback }) {
  const [metrics, setMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    loadMetrics()
  }, [feedback])

  const loadMetrics = async () => {
    try {
      setIsLoading(true)
// Debugging: Log metrics data
// Debugging: Log updated metrics state
console.log('Updated metrics state:', metrics);
console.log('Metrics fetched:', performanceMetrics);
      const performanceMetrics = await getAIPerformanceMetrics();
      setMetrics(performanceMetrics)
    } catch (error) {
      console.error('Error loading AI performance metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateConfidenceDistribution = () => {
    if (!feedback || feedback.length === 0) return { high: 0, medium: 0, low: 0 }
    
    const aiAnalyzedFeedback = feedback.filter(f => f.aiCategoryConfidence !== null)
    return aiAnalyzedFeedback.reduce((acc, f) => {
      const confidence = parseFloat(f.aiCategoryConfidence || 0)
      if (confidence >= 0.8) acc.high++
      else if (confidence >= 0.6) acc.medium++
      else acc.low++
      return acc
    }, { high: 0, medium: 0, low: 0 })
  }

  const calculateMethodDistribution = () => {
    if (!feedback || feedback.length === 0) return {}
    
    return feedback.reduce((acc, f) => {
      const method = f.method || 'unknown'
      acc[method] = (acc[method] || 0) + 1
      return acc
    }, {})
  }

  const calculateCategoryAccuracy = () => {
    if (!feedback || feedback.length === 0) return {}
    
    const categoryStats = {}
    feedback.forEach(f => {
      if (f.category && f.aiCategoryConfidence !== null) {
        if (!categoryStats[f.category]) {
          categoryStats[f.category] = {
            total: 0,
            highConfidence: 0,
            avgConfidence: 0,
            confidenceSum: 0
          }
        }
        categoryStats[f.category].total++
        categoryStats[f.category].confidenceSum += parseFloat(f.aiCategoryConfidence || 0)
        if (parseFloat(f.aiCategoryConfidence || 0) >= 0.8) {
          categoryStats[f.category].highConfidence++
        }
      }
    })
    
    Object.keys(categoryStats).forEach(category => {
      categoryStats[category].avgConfidence = 
        categoryStats[category].confidenceSum / categoryStats[category].total
    })
    
    return categoryStats
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  const confidenceDistribution = calculateConfidenceDistribution()
  const methodDistribution = calculateMethodDistribution()
  const categoryAccuracy = calculateCategoryAccuracy()

  // Chart data
  const confidenceChartData = {
    labels: ['High (≥80%)', 'Medium (60-79%)', 'Low (<60%)'],
    datasets: [
      {
        data: [confidenceDistribution.high, confidenceDistribution.medium, confidenceDistribution.low],
        backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
        borderWidth: 1,
      },
    ],
  }

  const methodChartData = {
    labels: Object.keys(methodDistribution).map(method => {
      switch (method) {
        case 'ai_enhanced': return 'AI Enhanced'
        case 'ai_batch_enhanced': return 'AI Batch'
        case 'fallback_enhanced': return 'Keyword Fallback'
        default: return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      }
    }),
    datasets: [
      {
        label: 'Number of Classifications',
        data: Object.values(methodDistribution),
        backgroundColor: '#3B82F6',
        borderColor: '#2563EB',
        borderWidth: 1,
      },
    ],
  }

  const categoryAccuracyData = {
    labels: Object.keys(categoryAccuracy).map(cat => 
      cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    ),
    datasets: [
      {
        label: 'Average Confidence (%)',
        data: Object.values(categoryAccuracy).map(stat => stat.avgConfidence * 100),
        backgroundColor: '#8B5CF6',
        borderColor: '#7C3AED',
        borderWidth: 1,
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
    scales: {
      y: {
        beginAtZero: true
      }
    }
  }

  const formatCategoryName = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Performance Metrics</h2>
          <p className="text-gray-500 mt-1">Analytics and insights about AI categorization performance</p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow border border-blue-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">🤖</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total AI Feedback</dt>
                <dd className="text-lg font-medium text-gray-900">{metrics?.totalFeedback || 0}</dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg shadow border border-green-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">✓</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Accuracy Rate</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {metrics?.totalFeedback > 0 ? Math.round(metrics.accuracy * 100) : 0}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-lg shadow border border-purple-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">📊</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Avg Confidence</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {Math.round((metrics?.averageConfidence || 0) * 100)}%
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg shadow border border-orange-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-medium">💡</span>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Correct Predictions</dt>
                <dd className="text-lg font-medium text-gray-900">{metrics?.correctPredictions || 0}</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Confidence Distribution */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Confidence Distribution</h3>
          <div className="h-64">
            <Doughnut data={confidenceChartData} options={chartOptions} />
          </div>
        </div>

        {/* Classification Methods */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Classification Methods</h3>
          <div className="h-64">
            <Bar data={methodChartData} options={chartOptions} />
          </div>
        </div>

        {/* Category Performance */}
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
          <div className="h-64">
            <Bar data={categoryAccuracyData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {metrics?.improvementSuggestions && metrics.improvementSuggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-amber-800 mb-3">💡 AI Improvement Suggestions</h3>
          <ul className="space-y-2">
            {metrics.improvementSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="text-amber-600 mr-2">•</span>
                <span className="text-amber-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Detailed Analytics */}
      {showDetails && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detailed Category Analytics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High Confidence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(categoryAccuracy).map(([category, stats]) => (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCategoryName(category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stats.avgConfidence > 0.8 ? 'bg-green-100 text-green-800' :
                          stats.avgConfidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {Math.round(stats.avgConfidence * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stats.highConfidence} / {stats.total} ({Math.round((stats.highConfidence / stats.total) * 100)}%)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(stats.highConfidence / stats.total) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}