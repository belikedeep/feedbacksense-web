'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { format } from 'date-fns'

/**
 * ExportHistoryPanel Component
 * Manages export history with metadata display, re-export functionality,
 * and export management (delete, share, favorite)
 */

// Mock storage for demo - in real app this would be localStorage/API
let exportHistoryStorage = []

export default function ExportHistoryPanel({ onReExport, onExportHistoryUpdate }) {
  const [exportHistory, setExportHistory] = useState([])
  const [selectedExport, setSelectedExport] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [sortBy, setSortBy] = useState('date') // date, name, type, size
  const [sortOrder, setSortOrder] = useState('desc') // asc, desc
  const [filterType, setFilterType] = useState('all') // all, csv, pdf
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)

  useEffect(() => {
    loadExportHistory()
  }, [])

  const loadExportHistory = () => {
    // In real app, this would fetch from API/localStorage
    const savedHistory = localStorage.getItem('feedbacksense_export_history')
    if (savedHistory) {
      try {
        exportHistoryStorage = JSON.parse(savedHistory)
        setExportHistory(exportHistoryStorage)
      } catch (error) {
        console.error('Error loading export history:', error)
        exportHistoryStorage = []
        setExportHistory([])
      }
    }
  }

  const saveExportHistory = (history) => {
    exportHistoryStorage = history
    setExportHistory(history)
    localStorage.setItem('feedbacksense_export_history', JSON.stringify(history))
    onExportHistoryUpdate?.(history)
  }

  // Public method to add new export to history
  const addExportToHistory = (exportData) => {
    const newExport = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      type: exportData.type,
      filename: exportData.filename,
      recordCount: exportData.recordCount,
      fileSize: exportData.fileSize,
      configuration: exportData.configuration,
      status: 'completed',
      isFavorite: false,
      downloadCount: 0,
      notes: ''
    }
    
    const updatedHistory = [newExport, ...exportHistoryStorage].slice(0, 50) // Keep last 50 exports
    saveExportHistory(updatedHistory)
  }

  // Expose the addExportToHistory method
  ExportHistoryPanel.addExportToHistory = addExportToHistory

  const filteredAndSortedHistory = exportHistory
    .filter(exp => {
      if (filterType !== 'all' && exp.type !== filterType) return false
      if (showFavoritesOnly && !exp.isFavorite) return false
      return true
    })
    .sort((a, b) => {
      let aValue, bValue
      
      switch (sortBy) {
        case 'name':
          aValue = a.filename.toLowerCase()
          bValue = b.filename.toLowerCase()
          break
        case 'type':
          aValue = a.type
          bValue = b.type
          break
        case 'size':
          aValue = a.fileSize || 0
          bValue = b.fileSize || 0
          break
        case 'date':
        default:
          aValue = new Date(a.timestamp)
          bValue = new Date(b.timestamp)
          break
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const handleReExport = (exportItem) => {
    onReExport?.(exportItem.configuration, exportItem.type)
    updateDownloadCount(exportItem.id)
  }

  const handleToggleFavorite = (exportId) => {
    const updatedHistory = exportHistory.map(exp =>
      exp.id === exportId ? { ...exp, isFavorite: !exp.isFavorite } : exp
    )
    saveExportHistory(updatedHistory)
  }

  const handleDeleteExport = (exportId) => {
    const updatedHistory = exportHistory.filter(exp => exp.id !== exportId)
    saveExportHistory(updatedHistory)
  }

  const handleViewDetails = (exportItem) => {
    setSelectedExport(exportItem)
    setShowDetailsModal(true)
  }

  const updateDownloadCount = (exportId) => {
    const updatedHistory = exportHistory.map(exp =>
      exp.id === exportId ? { ...exp, downloadCount: (exp.downloadCount || 0) + 1 } : exp
    )
    saveExportHistory(updatedHistory)
  }

  const handleUpdateNotes = (exportId, notes) => {
    const updatedHistory = exportHistory.map(exp =>
      exp.id === exportId ? { ...exp, notes } : exp
    )
    saveExportHistory(updatedHistory)
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { variant: 'default', label: 'Completed', color: 'bg-green-100 text-green-800' },
      failed: { variant: 'destructive', label: 'Failed', color: 'bg-red-100 text-red-800' },
      cancelled: { variant: 'secondary', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' }
    }
    
    const config = statusConfig[status] || statusConfig.completed
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'csv':
        return '📊'
      case 'pdf':
        return '📄'
      default:
        return '📋'
    }
  }

  const clearAllHistory = () => {
    if (confirm('Are you sure you want to clear all export history? This action cannot be undone.')) {
      saveExportHistory([])
    }
  }

  if (exportHistory.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Export History</h3>
            <p className="text-gray-500 mb-4">
              Your export history will appear here once you start exporting data.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Export History</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={showFavoritesOnly ? 'bg-yellow-50 text-yellow-700' : ''}
              >
                ⭐ {showFavoritesOnly ? 'Show All' : 'Favorites'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllHistory}
                className="text-red-600 hover:text-red-700"
              >
                Clear All
              </Button>
            </div>
          </div>
          
          {/* Filters and Sorting */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All</option>
                <option value="csv">CSV</option>
                <option value="pdf">PDF</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="size">Size</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {filteredAndSortedHistory.map((exportItem) => (
              <div key={exportItem.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-lg">{getTypeIcon(exportItem.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{exportItem.filename}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{format(new Date(exportItem.timestamp), 'MMM dd, yyyy HH:mm')}</span>
                          <span>•</span>
                          <span>{exportItem.recordCount?.toLocaleString()} records</span>
                          <span>•</span>
                          <span>{formatFileSize(exportItem.fileSize)}</span>
                          {exportItem.downloadCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{exportItem.downloadCount} downloads</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusBadge(exportItem.status)}
                      <Badge variant="outline">{exportItem.type.toUpperCase()}</Badge>
                      {exportItem.isFavorite && <span className="text-yellow-500">⭐</span>}
                    </div>
                    
                    {exportItem.notes && (
                      <p className="text-sm text-gray-600 mt-2 italic">"{exportItem.notes}"</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleFavorite(exportItem.id)}
                      className="text-yellow-600 hover:text-yellow-700"
                    >
                      {exportItem.isFavorite ? '⭐' : '☆'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(exportItem)}
                    >
                      Details
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReExport(exportItem)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Re-export
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteExport(exportItem.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredAndSortedHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {showFavoritesOnly ? 'No favorite exports found' : 'No exports match the current filter'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Details</DialogTitle>
          </DialogHeader>
          
          {selectedExport && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Filename:</span>
                      <span className="font-medium">{selectedExport.filename}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{selectedExport.type.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span className="font-medium">
                        {format(new Date(selectedExport.timestamp), 'PPP p')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Records:</span>
                      <span className="font-medium">{selectedExport.recordCount?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>File Size:</span>
                      <span className="font-medium">{formatFileSize(selectedExport.fileSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Downloads:</span>
                      <span className="font-medium">{selectedExport.downloadCount || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Configuration</h4>
                  <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                    {selectedExport.configuration && Object.entries(selectedExport.configuration).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <textarea
                  value={selectedExport.notes || ''}
                  onChange={(e) => handleUpdateNotes(selectedExport.id, e.target.value)}
                  placeholder="Add notes about this export..."
                  className="w-full p-3 border rounded-lg text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
            {selectedExport && (
              <Button onClick={() => {
                handleReExport(selectedExport)
                setShowDetailsModal(false)
              }}>
                Re-export
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}