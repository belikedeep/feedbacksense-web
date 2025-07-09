'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { batchAnalyzeAndCategorizeFeedback } from '@/lib/sentimentAnalysis'
import { getBatchConfig } from '@/lib/batchConfig'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { track } from '@vercel/analytics'

export default function CSVImport({ onFeedbackImported, projectId }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [totalRows, setTotalRows] = useState(0)
  const [columnMapping, setColumnMapping] = useState({
    content: '',
    source: '',
    category: '',
    date: ''
  })

  const handleFileChange = (e) => {
    console.log('File change event triggered:', e.target.files);
    const selectedFile = e.target.files[0]
    
    if (!selectedFile) {
      setMessage('No file selected')
      return
    }
    
    console.log('Selected file:', selectedFile.name, selectedFile.type, selectedFile.size);
    
    // Accept both .csv files and text/csv MIME type, and also allow text/plain for CSV files
    const isCSV = selectedFile.type === 'text/csv' ||
                  selectedFile.type === 'application/vnd.ms-excel' ||
                  selectedFile.type === 'text/plain' ||
                  selectedFile.name.toLowerCase().endsWith('.csv');
    
    if (isCSV) {
      setFile(selectedFile)
      setMessage('')
      
      // Track CSV file selection
      track('csv_file_selected', {
        fileSize: selectedFile.size,
        fileName: selectedFile.name
      })
      
      console.log('Parsing CSV file for preview...');
      
      // First, parse the entire file to get total row count
      Papa.parse(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (fullResults) => {
          console.log('Full CSV parsed for count:', fullResults.data.length, 'rows');
          const actualRowCount = fullResults.data.length;
          const limitedRowCount = Math.min(actualRowCount, 100);
          setTotalRows(limitedRowCount);
          
          // Track CSV parsing and row count
          track('csv_parsed', {
            totalRows: actualRowCount,
            limitedRows: limitedRowCount,
            wasLimited: actualRowCount > 100
          })
          
          // Show warning if file has more than 100 rows
          if (actualRowCount > 100) {
            setMessage(`Note: CSV contains ${actualRowCount} rows, but only the first 100 rows will be processed due to current limit.`);
          }
          
          // Then parse just first few rows for preview
          Papa.parse(selectedFile, {
            header: true,
            preview: 3,
            complete: (previewResults) => {
              console.log('CSV preview parsed:', previewResults);
              if (previewResults.errors && previewResults.errors.length > 0) {
                console.warn('CSV parsing warnings:', previewResults.errors);
              }
              setPreview(previewResults)
            },
            error: (error) => {
              console.error('CSV preview parsing failed:', error);
              setMessage('Error reading CSV file: ' + error.message);
            }
          })
        },
        error: (error) => {
          console.error('CSV full parsing failed:', error);
          setMessage('Error reading CSV file: ' + error.message);
        }
      })
    } else {
      setMessage(`Please select a valid CSV file. Selected file type: ${selectedFile.type}`)
      console.log('Invalid file type:', selectedFile.type);
    }
  }

  const handleButtonClick = () => {
    console.log('Button clicked, triggering file input...');
    const fileInput = document.getElementById('csv-file');
    if (fileInput) {
      fileInput.click();
    }
  }

  const handleImport = async () => {
    if (!file || !columnMapping.content) {
      setMessage('Please select a file and map the content column')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // Validate session first
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        throw new Error(`Authentication error: ${sessionError.message}`)
      }
      if (!session || !session.access_token) {
        throw new Error('User not authenticated. Please log in again.')
      }

      // Refresh token if needed
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('Session expired. Please log in again.')
      }

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          // Check for parsing errors
          if (results.errors && results.errors.length > 0) {
            const criticalErrors = results.errors.filter(err => err.type === 'Delimiter' || err.type === 'FieldMismatch');
            if (criticalErrors.length > 0) {
              setMessage(`CSV parsing errors: ${criticalErrors.map(e => e.message).join(', ')}`);
              setLoading(false);
              return;
            }
          }
          // Extract and validate feedback content, limit to 100 rows
          const allValidRows = results.data.filter(row =>
            row[columnMapping.content] && row[columnMapping.content].trim()
          );
          
          // Apply 100 row limit
          const validRows = allValidRows.slice(0, 100);
          
          // Show info about row limitation
          if (allValidRows.length > 100) {
            console.log(`Limiting processing from ${allValidRows.length} to 100 rows`);
          }
          
          if (validRows.length === 0) {
            setMessage('No valid feedback content found in the CSV file')
            setLoading(false)
            return
          }
          
          const total = validRows.length
          setMessage(`Processing ${total} feedback entries with AI batch analysis...`)
          
          try {
            // Get batch configuration for CSV import
            const batchConfig = getBatchConfig('csv_import')
            
            // Extract content for batch processing
            const contentTexts = validRows.map(row => row[columnMapping.content].trim())
            
            // Adjust batch size for large files to prevent timeouts
            const adjustedBatchSize = total > 100 ? Math.min(batchConfig.batchSize, 10) : batchConfig.batchSize
            
            setMessage(`🚀 Starting batch analysis with optimized processing (${adjustedBatchSize} items per batch)...`)
            
            // Use batch analysis with progress tracking
            const analysisResults = await batchAnalyzeAndCategorizeFeedback(
              contentTexts,
              adjustedBatchSize,
              (progress) => {
                setMessage(
                  `⚡ ${batchConfig.description}: Batch ${progress.batchesCompleted}/${progress.totalBatches} - ` +
                  `${progress.processed}/${progress.total} entries analyzed (${progress.percentage}%)`
                )
              }
            )
            
            // Create feedback objects with analysis results
            const feedbacks = validRows.map((row, index) => {
              const analysisResult = analysisResults[index]
              
              return {
                content: row[columnMapping.content].trim(),
                source: row[columnMapping.source] || 'csv_import',
                category: row[columnMapping.category] || analysisResult.aiCategory,
                sentimentScore: analysisResult.sentimentScore,
                sentimentLabel: analysisResult.sentimentLabel,
                feedbackDate: row[columnMapping.date] || new Date().toISOString(),
                topics: analysisResult.topics || [],
                // Include AI analysis data
                aiCategoryConfidence: analysisResult.aiCategoryConfidence,
                aiClassificationMeta: analysisResult.classificationMeta,
                classificationHistory: [analysisResult.historyEntry],
                manualOverride: row[columnMapping.category] ? true : false // True if CSV had a category
              }
            })

            if (feedbacks.length > 0) {
              setMessage(`Saving ${feedbacks.length} analyzed feedback entries to database...`)
              
              try {
                const apiUrl = projectId ? `/project/${projectId}/api/feedback/bulk` : '/api/feedback/bulk'
                const response = await fetch(apiUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({ feedbacks })
                })

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
                  throw new Error(`Database save failed (${response.status}): ${errorData.error || 'Unknown error'}`)
                }
                
                const result = await response.json()

                // Track successful import
                track('csv_import_success', {
                  importedCount: result.count,
                  totalRows: feedbacks.length,
                  hadSourceMapping: !!columnMapping.source,
                  hadCategoryMapping: !!columnMapping.category,
                  hadDateMapping: !!columnMapping.date
                })
                
                setMessage(`🎉 Successfully imported ${result.count} feedback entries with AI batch analysis! All entries were processed efficiently using batch processing.`)
                if (onFeedbackImported) {
                  onFeedbackImported(result.feedbacks)
                }
                setFile(null)
                setPreview(null)
                setTotalRows(0)
                setColumnMapping({ content: '', source: '', category: '', date: '' })
              } catch (saveError) {
                console.error('Database save error:', saveError)
                
                // Track import failure
                track('csv_import_error', {
                  error: 'database_save_failed',
                  message: saveError.message,
                  rowCount: feedbacks.length
                })
                
                setMessage(`Error saving to database: ${saveError.message}. Your data was analyzed but not saved.`)
              }
            } else {
              setMessage('No valid feedback found in the CSV file')
            }
            
          } catch (batchAnalysisError) {
            console.error('Batch analysis failed:', batchAnalysisError)
            
            // Track analysis failure
            track('csv_analysis_error', {
              error: 'batch_analysis_failed',
              message: batchAnalysisError.message,
              rowCount: validRows.length
            })
            
            setMessage(`Error during batch analysis: ${batchAnalysisError.message}. Please try with a smaller file.`)
          }
          
          setLoading(false)
        },
        error: (error) => {
          setMessage('Error parsing CSV: ' + error.message)
          setLoading(false)
        }
      })
    } catch (error) {
      setMessage('Error importing feedback: ' + error.message)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* File Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📁</span>
                Upload CSV File
              </CardTitle>
              <CardDescription>
                Select a CSV file containing feedback data for bulk import and AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-4xl">📄</div>
                    <div>
                      <input
                        id="csv-file"
                        type="file"
                        accept=".csv,text/csv,application/vnd.ms-excel,text/plain"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <Label htmlFor="csv-file" className="cursor-pointer">
                        <Button
                          variant="outline"
                          className="gap-2"
                          type="button"
                          onClick={handleButtonClick}
                        >
                          <span>📁</span>
                          Choose CSV File
                        </Button>
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {file ? `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : 'Click to browse or drag and drop your CSV file here'}
                    </p>
                    {message && !message.includes('🎉') && !message.includes('Processing') && (
                      <p className="text-sm text-red-600 mt-2">{message}</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Preview and Column Mapping */}
          {preview && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-900">
                  <span className="text-xl">🎯</span>
                  Smart Column Mapping
                </CardTitle>
                <CardDescription className="text-purple-700">
                  Map your CSV columns to feedback fields. We've detected {preview.meta.fields.length} columns and will process {totalRows} rows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Enhanced Column Mapping with Visual Indicators */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm font-medium text-purple-900">📋 Column Mapping</span>
                    <Badge variant="outline" className="text-xs">
                      {Object.values(columnMapping).filter(v => v).length} of 4 mapped
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Content Column - Most Important */}
                    <div className="space-y-3 p-4 border-2 border-red-200 rounded-lg bg-red-50/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        <Label className="font-medium text-red-900">
                          📝 Feedback Content *
                        </Label>
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      </div>
                      <Select
                        value={columnMapping.content || "none"}
                        onValueChange={(value) => setColumnMapping({...columnMapping, content: value === "none" ? "" : value})}
                      >
                        <SelectTrigger className="border-red-300 focus:border-red-500">
                          <SelectValue placeholder="Choose the column with feedback text..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-gray-500">
                            ❌ Select a column...
                          </SelectItem>
                          {preview.meta.fields.map(field => (
                            <SelectItem key={field} value={field} className="flex items-center gap-2">
                              📄 {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-red-700">
                        This should contain the main feedback text/comments
                      </p>
                    </div>

                    {/* Source Column */}
                    <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <Label className="font-medium text-blue-900">
                          📍 Feedback Source
                        </Label>
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      </div>
                      <Select
                        value={columnMapping.source || "none"}
                        onValueChange={(value) => setColumnMapping({...columnMapping, source: value === "none" ? "" : value})}
                      >
                        <SelectTrigger className="border-blue-300 focus:border-blue-500">
                          <SelectValue placeholder="Where did this feedback come from?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-gray-500">
                            ⏭️ Skip this field
                          </SelectItem>
                          {preview.meta.fields.map(field => (
                            <SelectItem key={field} value={field}>
                              📡 {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-700">
                        e.g., email, chat, survey, phone, etc.
                      </p>
                    </div>

                    {/* Category Column */}
                    <div className="space-y-3 p-4 border-2 border-green-200 rounded-lg bg-green-50/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <Label className="font-medium text-green-900">
                          🏷️ Category
                        </Label>
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      </div>
                      <Select
                        value={columnMapping.category || "none"}
                        onValueChange={(value) => setColumnMapping({...columnMapping, category: value === "none" ? "" : value})}
                      >
                        <SelectTrigger className="border-green-300 focus:border-green-500">
                          <SelectValue placeholder="Pre-categorized feedback?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-gray-500">
                            🤖 Let AI categorize automatically
                          </SelectItem>
                          {preview.meta.fields.map(field => (
                            <SelectItem key={field} value={field}>
                              🏷️ {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-green-700">
                        If empty, our AI will categorize automatically
                      </p>
                    </div>

                    {/* Date Column */}
                    <div className="space-y-3 p-4 border-2 border-orange-200 rounded-lg bg-orange-50/50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-orange-500 rounded-full"></div>
                        <Label className="font-medium text-orange-900">
                          📅 Date/Time
                        </Label>
                        <Badge variant="secondary" className="text-xs">Optional</Badge>
                      </div>
                      <Select
                        value={columnMapping.date || "none"}
                        onValueChange={(value) => setColumnMapping({...columnMapping, date: value === "none" ? "" : value})}
                      >
                        <SelectTrigger className="border-orange-300 focus:border-orange-500">
                          <SelectValue placeholder="When was this feedback given?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-gray-500">
                            📅 Use current date
                          </SelectItem>
                          {preview.meta.fields.map(field => (
                            <SelectItem key={field} value={field}>
                              📅 {field}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-orange-700">
                        If empty, we'll use today's date
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Enhanced Preview Table */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-purple-900 flex items-center gap-2">
                      👀 Data Preview
                      <Badge variant="outline" className="text-xs">
                        Showing first 3 rows
                      </Badge>
                    </h4>
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <span>📊 Rows to process: {totalRows}</span>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto border-2 border-purple-200 rounded-lg shadow-sm">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
                        <tr>
                          {preview.meta.fields.map(field => {
                            const isMapped = Object.values(columnMapping).includes(field);
                            const mappingType = Object.entries(columnMapping).find(([key, value]) => value === field)?.[0];
                            
                            return (
                              <th key={field} className="px-4 py-4 text-left text-sm font-semibold text-purple-900 border-r border-purple-200 last:border-r-0">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-purple-200 px-2 py-1 rounded">
                                      {field}
                                    </span>
                                  </div>
                                  {isMapped && (
                                    <div className="flex items-center gap-1">
                                      {mappingType === 'content' && <Badge variant="destructive" className="text-xs">📝 Content</Badge>}
                                      {mappingType === 'source' && <Badge className="text-xs bg-blue-500">📍 Source</Badge>}
                                      {mappingType === 'category' && <Badge className="text-xs bg-green-500">🏷️ Category</Badge>}
                                      {mappingType === 'date' && <Badge className="text-xs bg-orange-500">📅 Date</Badge>}
                                    </div>
                                  )}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.data.map((row, idx) => (
                          <tr key={idx} className={`border-t border-purple-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'}`}>
                            {preview.meta.fields.map(field => {
                              const isMappedAsContent = columnMapping.content === field;
                              return (
                                <td key={field} className={`px-4 py-3 text-sm border-r border-purple-100 last:border-r-0 max-w-[250px] ${
                                  isMappedAsContent ? 'bg-red-50 font-medium text-red-900' : 'text-gray-700'
                                }`}>
                                  <div className="truncate" title={row[field]}>
                                    {row[field] || <span className="text-gray-400 italic">empty</span>}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {!columnMapping.content && (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertDescription className="text-red-700 flex items-center gap-2">
                        <span>⚠️</span>
                        Please select a content column to proceed with the import.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* Enhanced Import Button Section */}
                <div className="space-y-4">
                  <Separator />
                  
                  {columnMapping.content ? (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h4 className="font-semibold text-green-900 flex items-center gap-2">
                            ✅ Ready to Import
                          </h4>
                          <p className="text-sm text-green-700">
                            Your CSV is properly mapped and ready for processing with AI analysis.
                          </p>
                          <div className="flex items-center gap-4 text-xs text-green-600">
                            <span>📝 Content: {columnMapping.content}</span>
                            {columnMapping.source && <span>📍 Source: {columnMapping.source}</span>}
                            {columnMapping.category && <span>🏷️ Category: {columnMapping.category}</span>}
                            {columnMapping.date && <span>📅 Date: {columnMapping.date}</span>}
                          </div>
                        </div>
                        <Button
                          onClick={handleImport}
                          disabled={loading}
                          size="lg"
                          className="gap-2 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-lg"
                        >
                          {loading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              🚀 Import & Analyze ({totalRows} rows)
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6">
                      <div className="text-center space-y-2">
                        <h4 className="font-semibold text-yellow-900 flex items-center justify-center gap-2">
                          ⏳ Almost Ready
                        </h4>
                        <p className="text-sm text-yellow-700">
                          Please select a content column above to proceed with the import.
                        </p>
                        <Button
                          disabled
                          size="lg"
                          variant="outline"
                          className="gap-2 opacity-50"
                        >
                          🚀 Import & Analyze
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Message */}
          {message && (
            <Alert className={message.includes('Error') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              <AlertDescription className={message.includes('Error') ? 'text-red-600' : 'text-green-600'}>
                {message}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Processing Info */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <span className="text-xl">🤖</span>
                AI Batch Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">What happens during import:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    CSV data validation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Batch AI analysis (15 items/batch)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Sentiment classification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Auto-categorization
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full"></span>
                    Database storage
                  </li>
                </ul>
              </div>
              <Separator />
              <div>
                <Badge variant="secondary" className="text-xs">
                  ⚡ 10-15x faster than individual processing
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                CSV Format Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Requirements:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Header row with column names</li>
                  <li>• At least one content column</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Optional columns:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Source (email, chat, survey, etc.)</li>
                  <li>• Category (overrides AI)</li>
                  <li>• Date (ISO format preferred)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Example structure:</h4>
                <div className="bg-muted/50 p-3 rounded text-xs font-mono">
                  content,source,date<br/>
                  "Great service!",email,2024-01-01<br/>
                  "Issue with billing",chat,2024-01-02
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">📊</span>
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Row limit:</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">100 rows max</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch size:</span>
                <Badge variant="outline">15 items</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing speed:</span>
                <Badge variant="outline">~1-2 sec/batch</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rate limit friendly:</span>
                <Badge variant="default">✓ Yes</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}