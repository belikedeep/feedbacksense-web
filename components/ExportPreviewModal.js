'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExportValidator } from './ExportValidator'
import { format } from 'date-fns'

/**
 * ExportPreviewModal Component
 * Provides live preview of export data with format-specific previews,
 * custom field mapping, and file size/processing time estimates
 */

export default function ExportPreviewModal({
  isOpen,
  onClose,
  onConfirm,
  data = [],
  exportOptions = {},
  exportType = 'csv',
  analytics = {}
}) {
  const [activeTab, setActiveTab] = useState('preview')
  const [fieldMapping, setFieldMapping] = useState({})
  const [validationResult, setValidationResult] = useState(null)

  // Helper functions
  const getFieldType = (value) => {
    if (value === null || value === undefined) return 'unknown'
    if (typeof value === 'number') return 'number'
    if (typeof value === 'boolean') return 'boolean'
    if (value instanceof Date || (!isNaN(Date.parse(value)) && value.includes('-'))) return 'date'
    return 'text'
  }

  const getDefaultFieldOrder = (key) => {
    const orderMap = {
      'id': 1,
      'content': 2,
      'category': 3,
      'sentimentLabel': 4,
      'sentimentScore': 5,
      'feedbackDate': 6,
      'createdAt': 7,
      'updatedAt': 8,
      'userId': 9,
      'source': 10,
      'topics': 11,
      'status': 12,
      'priority': 13
    }
    return orderMap[key] || 999
  }

  const formatFieldValue = (value, key) => {
    if (value === null || value === undefined) return ''
    
    if (key.includes('date') || key.includes('_at')) {
      try {
        return format(new Date(value), exportOptions.dateFormat || 'yyyy-MM-dd')
      } catch {
        return value
      }
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    
    return String(value)
  }

  // Available fields for mapping
  const availableFields = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const sampleRecord = data[0]
    return Object.keys(sampleRecord).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: getFieldType(sampleRecord[key]),
      required: ['id', 'content', 'createdAt'].includes(key)
    }))
  }, [data])

  // Default field mapping
  useEffect(() => {
    if (availableFields.length > 0) {
      const defaultMapping = {}
      availableFields.forEach(field => {
        defaultMapping[field.key] = {
          include: field.required || ['content', 'category', 'sentimentLabel', 'createdAt'].includes(field.key),
          displayName: field.label,
          order: getDefaultFieldOrder(field.key)
        }
      })
      setFieldMapping(defaultMapping)
    }
  }, [availableFields])

  // Validation effect
  useEffect(() => {
    if (data.length > 0) {
      const result = ExportValidator.validateExport(data, exportOptions, exportType)
      setValidationResult(result)
    }
  }, [data, exportOptions, exportType])

  // Preview data (first 10 rows)
  const previewData = useMemo(() => {
    if (!data || data.length === 0) return []
    
    const mappedFields = Object.entries(fieldMapping)
      .filter(([, config]) => config.include)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([key]) => key)
    
    return data.slice(0, 10).map(record => {
      const mappedRecord = {}
      mappedFields.forEach(key => {
        const displayName = fieldMapping[key]?.displayName || key
        mappedRecord[displayName] = formatFieldValue(record[key], key)
      })
      return mappedRecord
    })
  }, [data, fieldMapping])


  const handleFieldMappingChange = (fieldKey, property, value) => {
    setFieldMapping(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        [property]: value
      }
    }))
  }

  const renderCSVPreview = () => {
    if (previewData.length === 0) return <div className="text-gray-500">No data to preview</div>

    const headers = Object.keys(previewData[0])
    
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          CSV Preview (First 10 rows of {data.length} total records)
        </div>
        
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {headers.map(header => (
                  <th key={header} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {headers.map(header => (
                    <td key={header} className="px-3 py-2 text-gray-600 border-b max-w-32 truncate">
                      {row[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {data.length > 10 && (
          <div className="text-xs text-gray-500 text-center">
            ... and {data.length - 10} more rows
          </div>
        )}
      </div>
    )
  }

  const renderPDFPreview = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          PDF Report Preview Layout
        </div>
        
        <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
          {/* Header Section */}
          <div className="border-b pb-3">
            <h3 className="font-bold text-lg">Feedback Analytics Report</h3>
            <p className="text-sm text-gray-600">
              {exportOptions.useFilteredData ? 
                `Filtered Results (${data.length} entries)` : 
                `Complete Dataset (${data.length} entries)`
              }
            </p>
            <p className="text-xs text-gray-500">Generated on {format(new Date(), 'PPP')}</p>
          </div>

          {/* Charts Section */}
          {exportOptions.includeCharts && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">📊 Charts & Visualizations</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-blue-100 p-3 rounded text-center text-xs">
                  Sentiment Distribution Chart
                </div>
                <div className="bg-green-100 p-3 rounded text-center text-xs">
                  Category Breakdown Chart
                </div>
                <div className="bg-purple-100 p-3 rounded text-center text-xs">
                  Trends Over Time Chart
                </div>
                <div className="bg-orange-100 p-3 rounded text-center text-xs">
                  Key Metrics Summary
                </div>
              </div>
            </div>
          )}

          {/* Insights Section */}
          {exportOptions.includeInsights && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">💡 Key Insights</h4>
              <div className="bg-white p-3 rounded border text-xs space-y-1">
                <p>• Overall sentiment: {analytics.sentimentDistribution?.positive || 0}% positive</p>
                <p>• Most common category: {analytics.topCategories?.[0]?.category || 'N/A'}</p>
                <p>• Total feedback entries: {data.length}</p>
                <p>• Average feedback length: ~150 characters</p>
              </div>
            </div>
          )}

          {/* Feedback Table Section */}
          {exportOptions.includeFeedbackTable && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">
                📝 Feedback Entries (Top {Math.min(exportOptions.maxFeedbackEntries || 20, data.length)})
              </h4>
              <div className="bg-white rounded border">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left">Date</th>
                      <th className="px-2 py-1 text-left">Category</th>
                      <th className="px-2 py-1 text-left">Sentiment</th>
                      <th className="px-2 py-1 text-left">Feedback</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b">
                        <td className="px-2 py-1">{Object.values(row)[4] || 'N/A'}</td>
                        <td className="px-2 py-1">{Object.values(row)[2] || 'N/A'}</td>
                        <td className="px-2 py-1">{Object.values(row)[3] || 'N/A'}</td>
                        <td className="px-2 py-1 max-w-40 truncate">{Object.values(row)[1] || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-2 text-center text-gray-500">
                  ... and more entries in the full report
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderFieldMapping = () => {
    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Customize which fields to include and how they appear in your export
        </div>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {availableFields.map(field => (
            <div key={field.key} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={fieldMapping[field.key]?.include || false}
                  onChange={(e) => handleFieldMappingChange(field.key, 'include', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                  disabled={field.required}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{field.label}</span>
                    {field.required && <Badge variant="secondary" className="text-xs">Required</Badge>}
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                  </div>
                  <div className="text-xs text-gray-500">Field: {field.key}</div>
                </div>
              </div>
              
              {fieldMapping[field.key]?.include && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={fieldMapping[field.key]?.displayName || field.label}
                    onChange={(e) => handleFieldMappingChange(field.key, 'displayName', e.target.value)}
                    className="text-sm border rounded px-2 py-1 w-32"
                    placeholder="Display name"
                  />
                  <input
                    type="number"
                    value={fieldMapping[field.key]?.order || 999}
                    onChange={(e) => handleFieldMappingChange(field.key, 'order', parseInt(e.target.value))}
                    className="text-sm border rounded px-2 py-1 w-16"
                    placeholder="Order"
                    min="1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderValidationSummary = () => {
    if (!validationResult) return null

    const { isValid, errors, warnings, sizeEstimate } = validationResult

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {isValid ? 'Ready to Export' : 'Issues Found'}
          </span>
        </div>

        {/* File Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Export Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Records:</span>
              <span className="font-medium">{sizeEstimate.recordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Size:</span>
              <span className="font-medium">{sizeEstimate.estimatedSizeMB}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Time:</span>
              <span className="font-medium">~{sizeEstimate.estimatedProcessingSeconds}s</span>
            </div>
          </CardContent>
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">❌ Errors ({errors.length})</h4>
            <div className="space-y-2">
              {errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="font-medium text-sm text-red-800">{error.message}</div>
                  {error.suggestion && (
                    <div className="text-xs text-red-600 mt-1">{error.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-600">⚠️ Warnings ({warnings.length})</h4>
            <div className="space-y-2">
              {warnings.map((warning, index) => (
                <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="font-medium text-sm text-yellow-800">{warning.message}</div>
                  {warning.suggestion && (
                    <div className="text-xs text-yellow-600 mt-1">{warning.suggestion}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        aria-describedby="export-preview-description"
      >
        <DialogHeader>
          <DialogTitle>Export Preview - {exportType.toUpperCase()}</DialogTitle>
          <div id="export-preview-description" className="sr-only">
            Preview and configure your export settings before generating the {exportType.toUpperCase()} file.
            Review data, customize field mappings, and validate export configuration.
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="fields">Field Mapping</TabsTrigger>
              <TabsTrigger value="validation">Validation</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="preview" className="h-full">
                {exportType === 'csv' ? renderCSVPreview() : renderPDFPreview()}
              </TabsContent>
              
              <TabsContent value="fields" className="h-full">
                {renderFieldMapping()}
              </TabsContent>
              
              <TabsContent value="validation" className="h-full">
                {renderValidationSummary()}
              </TabsContent>
              
              <TabsContent value="summary" className="h-full">
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Review your export configuration before proceeding
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Export Configuration</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Format:</span>
                          <span className="font-medium">{exportType.toUpperCase()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Data Source:</span>
                          <span className="font-medium">
                            {exportOptions.useFilteredData ? 'Filtered' : 'All Data'}
                          </span>
                        </div>
                        {exportType === 'csv' && (
                          <>
                            <div className="flex justify-between">
                              <span>Include Headers:</span>
                              <span className="font-medium">{exportOptions.includeHeaders ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Date Format:</span>
                              <span className="font-medium">{exportOptions.dateFormat}</span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Selected Fields</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm">
                        <div className="space-y-1">
                          {Object.entries(fieldMapping)
                            .filter(([, config]) => config.include)
                            .sort(([, a], [, b]) => a.order - b.order)
                            .map(([key, config]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-gray-600">{config.displayName}</span>
                                <span className="text-xs text-gray-400">#{config.order}</span>
                              </div>
                            ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={() => onConfirm(fieldMapping)} 
            disabled={validationResult && !validationResult.isValid}
          >
            Confirm Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}