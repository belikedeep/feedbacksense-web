'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function BulkRecategorization({ feedback, onUpdate }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBulkPanel, setShowBulkPanel] = useState(false)
  const [bulkAction, setBulkAction] = useState('reanalyze')
  const [targetCategory, setTargetCategory] = useState('')
  const [progress, setProgress] = useState({ processed: 0, total: 0, percentage: 0 })
  const [processingLog, setProcessingLog] = useState([])

  const categories = [
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'shipping_complaint', label: 'Shipping Complaint' },
    { value: 'product_quality', label: 'Product Quality' },
    { value: 'customer_service', label: 'Customer Service' },
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'refund_request', label: 'Refund Request' },
    { value: 'compliment', label: 'Compliment' }
  ]

  // Load custom categories from localStorage
  const [customCategories, setCustomCategories] = useState([])

  useEffect(() => {
    loadCustomCategories()
  }, [])

  const loadCustomCategories = () => {
    try {
      const storedCategories = localStorage.getItem('feedbacksense_custom_categories')
      if (storedCategories) {
        const custom = JSON.parse(storedCategories)
        setCustomCategories(custom.filter(cat => cat.isActive !== false))
      }
    } catch (error) {
      console.warn('Error loading custom categories:', error)
    }
  }

  const allCategories = [...categories, ...customCategories.map(cat => ({
    value: cat.id,
    label: cat.name
  }))]

  const handleSelectAll = () => {
    if (selectedItems.length === feedback.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(feedback.map(item => item.id))
    }
  }

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const handleBulkProcess = async () => {
    if (selectedItems.length === 0) {
      alert('Please select items to process')
      return
    }

    if (bulkAction === 'assign_category' && !targetCategory) {
      alert('Please select a target category')
      return
    }

    setIsProcessing(true)
    setProgress({ processed: 0, total: selectedItems.length, percentage: 0 })
    setProcessingLog([])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      if (bulkAction === 'reanalyze') {
        await performBulkReanalysis(selectedItems, session.access_token)
      } else if (bulkAction === 'assign_category') {
        await performBulkCategoryAssignment(selectedItems, targetCategory, session.access_token)
      }

      onUpdate() // Refresh the feedback list
      setSelectedItems([])
      setShowBulkPanel(false)
      
    } catch (error) {
      console.error('Bulk processing failed:', error)
      alert('Bulk processing failed: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const performBulkReanalysis = async (itemIds, accessToken) => {
    const batchSize = 10 // Process in smaller batches to avoid overwhelming the server
    
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize)
      
      try {
        const response = await fetch('/api/feedback/reanalyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({ 
            feedbackIds: batch,
            bulkOperation: true
          })
        })

        if (!response.ok) {
          throw new Error(`Batch ${Math.floor(i / batchSize) + 1} failed`)
        }

        const result = await response.json()
        
        // Update progress
        const processed = Math.min(i + batchSize, itemIds.length)
        const percentage = Math.round((processed / itemIds.length) * 100)
        setProgress({ processed, total: itemIds.length, percentage })
        
        // Add to log
        setProcessingLog(prev => [...prev, 
          `✅ Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} items reanalyzed successfully`
        ])
        
        // Small delay between batches
        if (i + batchSize < itemIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (error) {
        console.error(`Batch processing error:`, error)
        setProcessingLog(prev => [...prev, 
          `❌ Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`
        ])
      }
    }
  }

  const performBulkCategoryAssignment = async (itemIds, category, accessToken) => {
    const batchSize = 20 // Larger batch size for simple category updates
    
    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize)
      
      try {
        const promises = batch.map(id => 
          fetch(`/api/feedback/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ 
              category,
              manualOverride: true,
              bulkOperation: true
            })
          })
        )

        const responses = await Promise.all(promises)
        const failedCount = responses.filter(r => !r.ok).length
        const successCount = responses.length - failedCount
        
        // Update progress
        const processed = Math.min(i + batchSize, itemIds.length)
        const percentage = Math.round((processed / itemIds.length) * 100)
        setProgress({ processed, total: itemIds.length, percentage })
        
        // Add to log
        if (failedCount === 0) {
          setProcessingLog(prev => [...prev, 
            `✅ Batch ${Math.floor(i / batchSize) + 1}: ${successCount} items updated successfully`
          ])
        } else {
          setProcessingLog(prev => [...prev, 
            `⚠️ Batch ${Math.floor(i / batchSize) + 1}: ${successCount} succeeded, ${failedCount} failed`
          ])
        }
        
      } catch (error) {
        console.error(`Batch update error:`, error)
        setProcessingLog(prev => [...prev, 
          `❌ Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`
        ])
      }
    }
  }

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-700'
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const formatCategoryName = (category) => {
    return category?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'
  }

  if (!feedback || feedback.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No feedback available for bulk operations.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Bulk Re-categorization</h3>
          <p className="text-sm text-gray-500">
            Select feedback items for bulk processing ({selectedItems.length} selected)
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedItems.length === feedback.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={() => setShowBulkPanel(!showBulkPanel)}
            disabled={selectedItems.length === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Bulk Actions ({selectedItems.length})
          </button>
        </div>
      </div>

      {/* Bulk Actions Panel */}
      {showBulkPanel && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-md font-medium text-gray-900 mb-4">Bulk Actions</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Action Type
              </label>
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              >
                <option value="reanalyze">Re-analyze with AI</option>
                <option value="assign_category">Assign Category</option>
              </select>
            </div>

            {bulkAction === 'assign_category' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Category
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  <option value="">Select a category</option>
                  {allCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {selectedItems.length} items selected for processing
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowBulkPanel(false)}
                  disabled={isProcessing}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkProcess}
                  disabled={isProcessing || (bulkAction === 'assign_category' && !targetCategory)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress Panel */}
      {isProcessing && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h4 className="text-md font-medium text-gray-900 mb-4">Processing Progress</h4>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progress.processed} / {progress.total} ({progress.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress.percentage}%` }}
                ></div>
              </div>
            </div>

            {processingLog.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Processing Log</h5>
                <div className="bg-gray-50 rounded-md p-3 max-h-40 overflow-y-auto">
                  {processingLog.map((entry, index) => (
                    <div key={index} className="text-xs text-gray-600 mb-1">
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback List with Selection */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-md font-medium text-gray-900">Feedback Items</h4>
        </div>
        
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {feedback.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedItems.includes(item.id)}
                  onChange={() => handleSelectItem(item.id)}
                  disabled={isProcessing}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCategoryName(item.category)}
                    </span>
                    
                    {item.aiCategoryConfidence !== null && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConfidenceColor(item.aiCategoryConfidence)}`}>
                        AI: {Math.round(item.aiCategoryConfidence * 100)}%
                      </span>
                    )}
                    
                    {item.manualOverride && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                        Manual
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {item.content}
                  </p>
                  
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{item.source}</span>
                    <span>
                      {(() => {
                        const date = item.feedbackDate || item.feedback_date
                        if (!date) return 'No date'
                        const dateObj = new Date(date)
                        return isNaN(dateObj.getTime()) ? 'Invalid date' : dateObj.toLocaleDateString()
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}