'use client'

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * ExportProgressTracker Component
 * Provides multi-stage progress tracking for export operations with
 * real-time status updates, cancellation support, and visual feedback
 */

const EXPORT_STAGES = {
  VALIDATION: {
    name: 'Validation',
    description: 'Validating data and configuration',
    duration: 5 // percentage of total time
  },
  DATA_PROCESSING: {
    name: 'Data Processing',
    description: 'Processing and transforming data',
    duration: 40
  },
  FORMAT_GENERATION: {
    name: 'Format Generation',
    description: 'Generating export format',
    duration: 45
  },
  FILE_CREATION: {
    name: 'File Creation',
    description: 'Creating and preparing download',
    duration: 10
  }
}

const STAGE_ORDER = ['VALIDATION', 'DATA_PROCESSING', 'FORMAT_GENERATION', 'FILE_CREATION']

export default function ExportProgressTracker({ 
  isActive, 
  onCancel, 
  onComplete, 
  onError,
  exportType,
  recordCount = 0,
  estimatedTimeMs = 5000
}) {
  const [currentStage, setCurrentStage] = useState('VALIDATION')
  const [stageProgress, setStageProgress] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)
  const [startTime, setStartTime] = useState(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [status, setStatus] = useState('idle') // idle, running, completed, cancelled, error
  const [statusMessage, setStatusMessage] = useState('')
  const [canCancel, setCanCancel] = useState(true)

  // Timer for elapsed time tracking
  useEffect(() => {
    let interval = null
    
    if (isActive && status === 'running') {
      if (!startTime) {
        setStartTime(Date.now())
      }
      
      interval = setInterval(() => {
        setElapsedTime(Date.now() - (startTime || Date.now()))
      }, 100)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [isActive, status, startTime])

  // Main progress simulation effect
  useEffect(() => {
    if (!isActive) {
      resetProgress()
      return
    }

    setStatus('running')
    setStartTime(Date.now())
    simulateProgress()
  }, [isActive])

  const resetProgress = () => {
    setCurrentStage('VALIDATION')
    setStageProgress(0)
    setOverallProgress(0)
    setStartTime(null)
    setElapsedTime(0)
    setStatus('idle')
    setStatusMessage('')
    setCanCancel(true)
  }

  const simulateProgress = async () => {
    const totalStages = STAGE_ORDER.length
    let cumulativeProgress = 0

    for (let i = 0; i < totalStages; i++) {
      const stageKey = STAGE_ORDER[i]
      const stage = EXPORT_STAGES[stageKey]
      
      setCurrentStage(stageKey)
      setStatusMessage(stage.description)
      
      // Special handling for different stages
      if (stageKey === 'VALIDATION') {
        setCanCancel(true)
      } else if (stageKey === 'FILE_CREATION') {
        setCanCancel(false) // Can't cancel during file creation
      }

      // Simulate stage progress
      const stageDuration = (estimatedTimeMs * stage.duration) / 100
      const progressStep = 100 / (stageDuration / 50) // Update every 50ms
      
      for (let progress = 0; progress <= 100; progress += progressStep) {
        if (status === 'cancelled') return
        
        const currentStageProgress = Math.min(100, progress)
        const currentOverallProgress = cumulativeProgress + (stage.duration * currentStageProgress) / 100
        
        setStageProgress(currentStageProgress)
        setOverallProgress(Math.min(100, currentOverallProgress))
        
        // Add some realistic variation to progress speed
        const delay = getVariableDelay(stageKey, progress)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      
      cumulativeProgress += stage.duration
    }

    // Complete the export
    if (status !== 'cancelled') {
      setStatus('completed')
      setStatusMessage('Export completed successfully!')
      setOverallProgress(100)
      setStageProgress(100)
      onComplete?.()
    }
  }

  const getVariableDelay = (stageKey, progress) => {
    let baseDelay = 50

    // Adjust delay based on stage and progress
    switch (stageKey) {
      case 'VALIDATION':
        return baseDelay * 0.5 // Validation is quick
      case 'DATA_PROCESSING':
        // Slower for large datasets
        return baseDelay + (recordCount > 1000 ? 20 : 0)
      case 'FORMAT_GENERATION':
        // PDF generation is slower
        return baseDelay + (exportType === 'pdf' ? 30 : 10)
      case 'FILE_CREATION':
        return baseDelay * 2 // File creation has more variation
      default:
        return baseDelay
    }
  }

  const handleCancel = () => {
    if (canCancel) {
      setStatus('cancelled')
      setStatusMessage('Export cancelled by user')
      onCancel?.()
    }
  }

  const formatElapsedTime = (ms) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const getEstimatedTimeRemaining = () => {
    if (!startTime || overallProgress === 0) return null
    
    const elapsedMs = Date.now() - startTime
    const estimatedTotalMs = (elapsedMs / overallProgress) * 100
    const remainingMs = Math.max(0, estimatedTotalMs - elapsedMs)
    
    return formatElapsedTime(remainingMs)
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
        )
      case 'completed':
        return (
          <div className="flex items-center justify-center w-4 h-4 bg-green-100 rounded-full">
            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'cancelled':
        return (
          <div className="flex items-center justify-center w-4 h-4 bg-yellow-100 rounded-full">
            <svg className="w-3 h-3 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center justify-center w-4 h-4 bg-red-100 rounded-full">
            <svg className="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  if (!isActive && status === 'idle') {
    return null
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getStatusIcon()}
          Export Progress
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Overall Progress</span>
            <span className="text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>

        {/* Current Stage */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">
              Current Stage: {EXPORT_STAGES[currentStage]?.name}
            </span>
            <span className="text-gray-600">{Math.round(stageProgress)}%</span>
          </div>
          <Progress value={stageProgress} className="h-2" />
          <p className="text-xs text-gray-500">{statusMessage}</p>
        </div>

        {/* Stage Indicators */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          {STAGE_ORDER.map((stageKey, index) => {
            const stage = EXPORT_STAGES[stageKey]
            const isActive = currentStage === stageKey
            const isCompleted = STAGE_ORDER.indexOf(currentStage) > index
            const isCurrent = currentStage === stageKey
            
            return (
              <div key={stageKey} className="text-center">
                <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-medium mb-1 ${
                  isCompleted 
                    ? 'bg-green-100 text-green-700 border-2 border-green-200' 
                    : isCurrent
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                    : 'bg-gray-100 text-gray-500 border-2 border-gray-200'
                }`}>
                  {index + 1}
                </div>
                <div className={`text-xs ${
                  isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {stage.name}
                </div>
              </div>
            )
          })}
        </div>

        {/* Time Information */}
        <div className="flex justify-between items-center text-sm text-gray-600 pt-2 border-t">
          <div>
            Elapsed: {formatElapsedTime(elapsedTime)}
          </div>
          {status === 'running' && getEstimatedTimeRemaining() && (
            <div>
              Remaining: ~{getEstimatedTimeRemaining()}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2">
          {status === 'running' && canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Cancel Export
            </Button>
          )}
          
          {status === 'completed' && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Export completed in {formatElapsedTime(elapsedTime)}
            </div>
          )}
          
          {status === 'cancelled' && (
            <div className="text-sm text-yellow-600 font-medium">
              Export was cancelled
            </div>
          )}
        </div>

        {/* Additional Information */}
        {recordCount > 0 && (
          <div className="text-xs text-gray-500 pt-2 border-t">
            Processing {recordCount.toLocaleString()} records • {exportType.toUpperCase()} format
          </div>
        )}
      </CardContent>
    </Card>
  )
}