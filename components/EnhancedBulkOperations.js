'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function EnhancedBulkOperations({ feedback, onUpdate }) {
  const [selectedItems, setSelectedItems] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [showBulkPanel, setShowBulkPanel] = useState(false)
  const [bulkAction, setBulkAction] = useState('updateStatus')
  const [actionData, setActionData] = useState({
    status: 'in_review',
    priority: 'medium',
    category: ''
  })
  const [progress, setProgress] = useState({ processed: 0, total: 0, percentage: 0 })
  const [processingLog, setProcessingLog] = useState([])
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)

  const statusOptions = [
    { value: 'new', label: 'New' },
    { value: 'in_review', label: 'In Review' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'archived', label: 'Archived' }
  ]

  const priorityOptions = [
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' }
  ]

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

  const bulkActions = [
    { value: 'updateStatus', label: 'Update Status' },
    { value: 'updatePriority', label: 'Update Priority' },
    { value: 'updateCategory', label: 'Update Category' },
    { value: 'archive', label: 'Archive Items' },
    { value: 'unarchive', label: 'Unarchive Items' },
    { value: 'delete', label: 'Delete Items (Permanent)' }
  ]

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

    // Special handling for delete action
    if (bulkAction === 'delete') {
      setShowDeleteConfirmation(true)
      return
    }

    await executeBulkAction()
  }

  const executeBulkAction = async (confirmDelete = false) => {
    setIsProcessing(true)
    setProgress({ processed: 0, total: selectedItems.length, percentage: 0 })
    setProcessingLog([])

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('User not authenticated')

      const requestData = {
        action: bulkAction,
        feedbackIds: selectedItems,
        data: getActionData(),
        confirmPermanentDelete: confirmDelete
      }

      const response = await fetch('/api/feedback/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresConfirmation) {
          setShowDeleteConfirmation(true)
          return
        }
        throw new Error(result.error || 'Bulk operation failed')
      }

      setProgress({ 
        processed: result.processed, 
        total: selectedItems.length, 
        percentage: 100 
      })

      setProcessingLog([
        `✅ Successfully processed ${result.processed} items`,
        `Action: ${getActionLabel(bulkAction)}`
      ])

      onUpdate() // Refresh the feedback list
      setSelectedItems([])
      
      // Auto-close panel after success
      setTimeout(() => {
        setShowBulkPanel(false)
        setShowDeleteConfirmation(false)
      }, 2000)

    } catch (error) {
      console.error('Bulk processing failed:', error)
      setProcessingLog([`❌ Error: ${error.message}`])
    } finally {
      setIsProcessing(false)
    }
  }

  const getActionData = () => {
    switch (bulkAction) {
      case 'updateStatus':
        return { status: actionData.status }
      case 'updatePriority':
        return { priority: actionData.priority }
      case 'updateCategory':
        return { category: actionData.category }
      default:
        return {}
    }
  }

  const getActionLabel = (action) => {
    return bulkActions.find(a => a.value === action)?.label || action
  }

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
          <h3 className="text-lg font-medium text-gray-900">Enhanced Bulk Operations</h3>
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
                {bulkActions.map(action => (
                  <option key={action.value} value={action.value}>{action.label}</option>
                ))}
              </select>
            </div>

            {/* Action-specific inputs */}
            {bulkAction === 'updateStatus' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Status
                </label>
                <select
                  value={actionData.status}
                  onChange={(e) => setActionData({ ...actionData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkAction === 'updatePriority' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Priority
                </label>
                <select
                  value={actionData.priority}
                  onChange={(e) => setActionData({ ...actionData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            )}

            {bulkAction === 'updateCategory' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Category
                </label>
                <select
                  value={actionData.category}
                  onChange={(e) => setActionData({ ...actionData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  disabled={isProcessing}
                >
                  <option value="">Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}

            {(bulkAction === 'archive' || bulkAction === 'unarchive') && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  {bulkAction === 'archive' 
                    ? 'Selected items will be archived and hidden from the main view.'
                    : 'Selected items will be unarchived and restored to the main view.'
                  }
                </p>
              </div>
            )}

            {bulkAction === 'delete' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Warning: This action will permanently delete the selected feedback items and cannot be undone.
                </p>
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
                  disabled={isProcessing || (bulkAction === 'updateCategory' && !actionData.category)}
                  className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                    bulkAction === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Execute'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Permanent Delete</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to permanently delete {selectedItems.length} feedback item(s)? 
              This action cannot be undone and will also delete all associated notes.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => executeBulkAction(true)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Delete Permanently
              </button>
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
                  <div className="flex items-center space-x-2 mb-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-900">
                      {formatCategoryName(item.category)}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'New'}
                    </span>
                    
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority?.charAt(0).toUpperCase() + item.priority?.slice(1) || 'Medium'}
                    </span>
                    
                    {item.isArchived && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                        Archived
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