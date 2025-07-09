'use client'

import { useState } from 'react'
import { CSVExporter } from '@/lib/exporters/CSVExporter'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ExportPreviewModal from './ExportPreviewModal'
import ExportProgressTracker from './ExportProgressTracker'
import ExportHistoryPanel from './ExportHistoryPanel'
import { ExportValidator } from './ExportValidator'

export default function ExportPanel({ feedback, analytics, filteredFeedback }) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportType, setExportType] = useState('csv')
  const [activeTab, setActiveTab] = useState('export')
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [validationResult, setValidationResult] = useState(null)
  const [exportOptions, setExportOptions] = useState({
    // CSV options
    includeHeaders: true,
    dateFormat: 'yyyy-MM-dd',
    includeFields: ['all'],
    separateFiles: false,
    includeRawData: true,
    includeSummary: true,
    
    // PDF options
    includeCharts: true,
    includeFeedbackTable: true,
    includeInsights: true,
    maxFeedbackEntries: 100, // Increased from 20 to handle larger datasets
    
    // General options
    useFilteredData: true,
    filename: ''
  })

  const dataToExport = exportOptions.useFilteredData ? filteredFeedback : feedback
  const recordCount = dataToExport.length

  const handleExportOptionChange = (option, value) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: value
    }))
  }

  const generateFilename = (type) => {
    const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm')
    const dataType = exportOptions.useFilteredData ? 'filtered' : 'all'
    const base = exportOptions.filename || `feedback_${dataType}_${timestamp}`
    return `${base}.${type}`
  }

  const handlePreviewExport = () => {
    // Validate before showing preview
    const validation = ExportValidator.validateExport(dataToExport, exportOptions, exportType)
    setValidationResult(validation)
    setShowPreviewModal(true)
  }

  const handleConfirmExport = async (fieldMapping = null) => {
    setShowPreviewModal(false)
    
    // Final validation
    const validation = ExportValidator.validateExport(dataToExport, exportOptions, exportType)
    if (!validation.isValid) {
      alert('Export validation failed. Please check your configuration.')
      return
    }

    setIsExporting(true)
    
    try {
      if (exportType === 'csv') {
        await handleCSVExport(fieldMapping)
      } else {
        await handlePDFExport(fieldMapping)
      }
      
      // Add to export history
      const exportData = {
        type: exportType,
        filename: generateFilename(exportType),
        recordCount: dataToExport.length,
        fileSize: validation.sizeEstimate.estimatedSizeKB * 1024,
        configuration: { ...exportOptions, fieldMapping }
      }
      ExportHistoryPanel.addExportToHistory?.(exportData)
      
    } catch (error) {
      console.error('Export failed:', error)
      alert(`Failed to export ${exportType.toUpperCase()}. Please try again.`)
    } finally {
      setIsExporting(false)
    }
  }

  const handleCSVExport = async (fieldMapping = null) => {
    const exportOptionsWithMapping = { ...exportOptions, fieldMapping }

    if (exportOptions.includeSummary && exportOptions.includeRawData && exportOptions.separateFiles) {
      // Export as separate files
      await CSVExporter.exportWithAnalytics(dataToExport, analytics, {
        ...exportOptionsWithMapping,
        separateFiles: true
      })
    } else if (exportOptions.includeSummary && exportOptions.includeRawData) {
      // Export as combined file
      await CSVExporter.exportWithAnalytics(dataToExport, analytics, {
        ...exportOptionsWithMapping,
        separateFiles: false
      })
    } else if (exportOptions.includeRawData) {
      // Export raw data only
      const csvData = CSVExporter.generateCSV(dataToExport, exportOptionsWithMapping)
      CSVExporter.downloadCSV(csvData, generateFilename('csv'))
    } else if (exportOptions.includeSummary) {
      // Export summary only
      const summaryCSV = CSVExporter.generateSummaryCSV(dataToExport, analytics)
      CSVExporter.downloadCSV(summaryCSV, generateFilename('csv'))
    }
  }

  const handlePDFExport = async (fieldMapping = null) => {
    // CRITICAL: Log data counts for debugging pipeline issues
    console.log('ExportPanel - Starting Puppeteer PDF export via API')
    console.log(`ExportPanel - Original feedback count: ${feedback.length}`)
    console.log(`ExportPanel - Filtered feedback count: ${filteredFeedback.length}`)
    console.log(`ExportPanel - Data to export count: ${dataToExport.length}`)
    console.log(`ExportPanel - Record count: ${recordCount}`)
    console.log(`ExportPanel - Use filtered data: ${exportOptions.useFilteredData}`)

    // Ensure we have the exact data count in subtitle
    const actualCount = dataToExport.length
    const subtitle = exportOptions.useFilteredData ?
      `Filtered Results (${actualCount} entries selected from ${feedback.length} total)` :
      `Complete Dataset (${actualCount} entries processed)`

    console.log(`ExportPanel - Generating Puppeteer PDF with ${actualCount} entries`)

    try {
      // Call the API endpoint to generate PDF
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: dataToExport,
          analytics: analytics,
          options: {
            title: 'Feedback Analytics Report',
            subtitle: subtitle,
            organizationName: 'FeedbackSense',
            includeCharts: exportOptions.includeCharts,
            includeFeedbackTable: exportOptions.includeFeedbackTable,
            includeInsights: exportOptions.includeInsights,
            includeAdvancedAnalytics: true,
            includePredictiveInsights: true,
            maxFeedbackEntries: exportOptions.maxFeedbackEntries,
            filename: generateFilename('pdf'),
            fieldMapping,
            useFilteredData: exportOptions.useFilteredData
          }
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'PDF generation failed')
      }

      console.log('ExportPanel - Puppeteer PDF generation completed, downloading...')
      
      // Download the PDF
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generateFilename('pdf')
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Puppeteer PDF generation failed:', error)
      throw error
    }
  }

  const handleReExport = (savedConfiguration, savedExportType) => {
    // Restore saved configuration
    setExportOptions(savedConfiguration)
    setExportType(savedExportType)
    
    // Trigger export with saved settings
    setTimeout(() => {
      handlePreviewExport()
    }, 100)
  }

  const handleProgressComplete = () => {
    // Export completed successfully
    console.log('Export completed successfully')
  }

  const handleProgressCancel = () => {
    setIsExporting(false)
  }

  const handleProgressError = (error) => {
    console.error('Export progress error:', error)
    setIsExporting(false)
    alert('Export failed. Please try again.')
  }

  // Get validation result for current configuration
  const getCurrentValidation = () => {
    if (dataToExport.length === 0) return null
    return ExportValidator.validateExport(dataToExport, exportOptions, exportType)
  }

  const currentValidation = getCurrentValidation()
  const estimatedTime = currentValidation?.sizeEstimate?.estimatedProcessingTimeMs || 5000

  return (
    <div className="space-y-6">
      {/* Progress Tracker - Show when exporting */}
      {isExporting && (
        <ExportProgressTracker
          isActive={isExporting}
          onCancel={handleProgressCancel}
          onComplete={handleProgressComplete}
          onError={handleProgressError}
          exportType={exportType}
          recordCount={recordCount}
          estimatedTimeMs={estimatedTime}
        />
      )}

      {/* Main Export Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="export">Export Configuration</TabsTrigger>
              <TabsTrigger value="history">Export History</TabsTrigger>
            </TabsList>

            <TabsContent value="export" className="space-y-6 mt-6">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={exportType === 'csv'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">CSV (Data)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="pdf"
                      checked={exportType === 'pdf'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">PDF (Report)</span>
                  </label>
                </div>
              </div>

              {/* Data Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data to Export
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={exportOptions.useFilteredData}
                      onChange={() => handleExportOptionChange('useFilteredData', true)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Filtered results ({recordCount} entries)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!exportOptions.useFilteredData}
                      onChange={() => handleExportOptionChange('useFilteredData', false)}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      All feedback ({feedback.length} entries)
                    </span>
                  </label>
                </div>
              </div>

              {/* CSV Options */}
              {exportType === 'csv' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">CSV Options</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeHeaders}
                        onChange={(e) => handleExportOptionChange('includeHeaders', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include column headers</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeRawData}
                        onChange={(e) => handleExportOptionChange('includeRawData', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include raw feedback data</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeSummary}
                        onChange={(e) => handleExportOptionChange('includeSummary', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include analytics summary</span>
                    </label>

                    {exportOptions.includeRawData && exportOptions.includeSummary && (
                      <label className="flex items-center ml-4">
                        <input
                          type="checkbox"
                          checked={exportOptions.separateFiles}
                          onChange={(e) => handleExportOptionChange('separateFiles', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Export as separate files</span>
                      </label>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date Format
                    </label>
                    <select
                      value={exportOptions.dateFormat}
                      onChange={(e) => handleExportOptionChange('dateFormat', e.target.value)}
                      className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="yyyy-MM-dd">2024-01-15</option>
                      <option value="MM/dd/yyyy">01/15/2024</option>
                      <option value="dd/MM/yyyy">15/01/2024</option>
                      <option value="PPP">January 15th, 2024</option>
                    </select>
                  </div>
                </div>
              )}

              {/* PDF Options */}
              {exportType === 'pdf' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-700">PDF Report Options</h4>
                  
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeCharts}
                        onChange={(e) => handleExportOptionChange('includeCharts', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include charts and visualizations</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeFeedbackTable}
                        onChange={(e) => handleExportOptionChange('includeFeedbackTable', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include feedback entries table</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeInsights}
                        onChange={(e) => handleExportOptionChange('includeInsights', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">Include insights and recommendations</span>
                    </label>
                  </div>

                  {exportOptions.includeFeedbackTable && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max feedback entries in table
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={exportOptions.maxFeedbackEntries}
                        onChange={(e) => handleExportOptionChange('maxFeedbackEntries', parseInt(e.target.value))}
                        className="block w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Custom Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Filename (optional)
                </label>
                <input
                  type="text"
                  value={exportOptions.filename}
                  onChange={(e) => handleExportOptionChange('filename', e.target.value)}
                  placeholder="Leave empty for auto-generated name"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Preview: {generateFilename(exportType)}
                </p>
              </div>

              {/* Validation Summary */}
              {currentValidation && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${
                      currentValidation.isValid ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm font-medium">
                      {currentValidation.isValid ? 'Ready to Export' : 'Configuration Issues'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>Records: {currentValidation.sizeEstimate.recordCount.toLocaleString()}</div>
                    <div>Estimated Size: {currentValidation.sizeEstimate.estimatedSizeMB}MB</div>
                    <div>Estimated Time: ~{currentValidation.sizeEstimate.estimatedProcessingSeconds}s</div>
                  </div>
                  {currentValidation.errors.length > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      {currentValidation.errors.length} error(s) found
                    </div>
                  )}
                  {currentValidation.warnings.length > 0 && (
                    <div className="mt-1 text-xs text-yellow-600">
                      {currentValidation.warnings.length} warning(s)
                    </div>
                  )}
                </div>
              )}

              {/* Export Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Ready to export {recordCount} feedback entries
                </div>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={handlePreviewExport}
                    disabled={recordCount === 0}
                  >
                    Preview & Export
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <ExportHistoryPanel onReExport={handleReExport} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Preview Modal */}
      <ExportPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onConfirm={handleConfirmExport}
        data={dataToExport}
        exportOptions={exportOptions}
        exportType={exportType}
        analytics={analytics}
      />
    </div>
  )
}