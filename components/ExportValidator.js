'use client'

/**
 * Export Validation Utility
 * Provides comprehensive validation for export operations including
 * pre-export checks, data quality validation, and file size estimation
 */

export class ExportValidator {
  static VALIDATION_RULES = {
    minRecords: 1,
    maxRecords: 100000,
    maxFileSizeMB: 50,
    requiredFields: ['id', 'content', 'createdAt'],
    maxFieldLength: 10000
  }

  static FILE_SIZE_ESTIMATES = {
    csv: {
      baseKB: 1, // Base overhead
      bytesPerRecord: 150, // Average bytes per feedback record
      headerKB: 0.5
    },
    pdf: {
      baseKB: 50, // PDF overhead
      bytesPerRecord: 200, // More overhead for formatting
      chartKB: 15 // Per chart
    }
  }

  /**
   * Validates export configuration and data
   */
  static validateExport(data, exportOptions, exportType) {
    const errors = []
    const warnings = []

    // Data validation
    const dataValidation = this.validateData(data)
    errors.push(...dataValidation.errors)
    warnings.push(...dataValidation.warnings)

    // Configuration validation
    const configValidation = this.validateConfiguration(exportOptions, exportType)
    errors.push(...configValidation.errors)
    warnings.push(...configValidation.warnings)

    // File size estimation and validation
    const sizeEstimate = this.estimateFileSize(data, exportOptions, exportType)
    if (sizeEstimate.estimatedSizeMB > this.VALIDATION_RULES.maxFileSizeMB) {
      errors.push({
        type: 'file_size',
        message: `Estimated file size (${sizeEstimate.estimatedSizeMB.toFixed(1)}MB) exceeds maximum allowed size (${this.VALIDATION_RULES.maxFileSizeMB}MB)`,
        suggestion: 'Consider filtering your data or exporting in smaller batches'
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sizeEstimate
    }
  }

  /**
   * Validates the data array
   */
  static validateData(data) {
    const errors = []
    const warnings = []

    if (!Array.isArray(data)) {
      errors.push({
        type: 'data_format',
        message: 'Data must be an array',
        suggestion: 'Ensure your data is properly formatted'
      })
      return { errors, warnings }
    }

    if (data.length < this.VALIDATION_RULES.minRecords) {
      errors.push({
        type: 'insufficient_data',
        message: 'No data available for export',
        suggestion: 'Add some feedback data before exporting'
      })
      return { errors, warnings }
    }

    if (data.length > this.VALIDATION_RULES.maxRecords) {
      warnings.push({
        type: 'large_dataset',
        message: `Large dataset (${data.length} records). Export may take longer than usual.`,
        suggestion: 'Consider filtering your data for faster processing'
      })
    }

    // Check for required fields
    const sampleRecord = data[0]
    const missingFields = this.VALIDATION_RULES.requiredFields.filter(
      field => !(field in sampleRecord)
    )

    if (missingFields.length > 0) {
      errors.push({
        type: 'missing_fields',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        suggestion: 'Ensure all required fields are present in your data'
      })
    }

    // Data quality checks
    const qualityCheck = this.performDataQualityChecks(data)
    warnings.push(...qualityCheck.warnings)
    if (qualityCheck.errors.length > 0) {
      errors.push(...qualityCheck.errors)
    }

    return { errors, warnings }
  }

  /**
   * Validates export configuration
   */
  static validateConfiguration(exportOptions, exportType) {
    const errors = []
    const warnings = []

    if (!exportOptions) {
      errors.push({
        type: 'missing_config',
        message: 'Export configuration is required',
        suggestion: 'Please configure your export options'
      })
      return { errors, warnings }
    }

    // CSV-specific validation
    if (exportType === 'csv') {
      if (!exportOptions.includeRawData && !exportOptions.includeSummary) {
        errors.push({
          type: 'no_content',
          message: 'At least one content type must be selected (raw data or summary)',
          suggestion: 'Select either raw data or summary to export'
        })
      }

      if (exportOptions.separateFiles && (!exportOptions.includeRawData || !exportOptions.includeSummary)) {
        warnings.push({
          type: 'separate_files_ignored',
          message: 'Separate files option ignored - both raw data and summary must be selected',
          suggestion: 'Enable both raw data and summary to use separate files'
        })
      }
    }

    // PDF-specific validation
    if (exportType === 'pdf') {
      if (!exportOptions.includeCharts && !exportOptions.includeFeedbackTable && !exportOptions.includeInsights) {
        errors.push({
          type: 'no_content',
          message: 'At least one PDF content type must be selected',
          suggestion: 'Select charts, feedback table, or insights to include in the PDF'
        })
      }

      if (exportOptions.maxFeedbackEntries && (exportOptions.maxFeedbackEntries < 1 || exportOptions.maxFeedbackEntries > 1000)) {
        warnings.push({
          type: 'invalid_max_entries',
          message: 'Max feedback entries should be between 1 and 1000',
          suggestion: 'Adjust the maximum feedback entries to a reasonable number'
        })
      }
    }

    // Filename validation
    if (exportOptions.filename) {
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(exportOptions.filename)) {
        errors.push({
          type: 'invalid_filename',
          message: 'Filename contains invalid characters',
          suggestion: 'Remove special characters from the filename'
        })
      }

      if (exportOptions.filename.length > 100) {
        warnings.push({
          type: 'long_filename',
          message: 'Filename is very long',
          suggestion: 'Consider using a shorter filename'
        })
      }
    }

    return { errors, warnings }
  }

  /**
   * Performs data quality checks
   */
  static performDataQualityChecks(data) {
    const errors = []
    const warnings = []
    
    let emptyFeedbackCount = 0
    let longFeedbackCount = 0
    let invalidDateCount = 0

    data.forEach((record, index) => {
      // Check for empty feedback content
      if (!record.content || record.content.trim().length === 0) {
        emptyFeedbackCount++
      }

      // Check for extremely long feedback content
      if (record.content && record.content.length > this.VALIDATION_RULES.maxFieldLength) {
        longFeedbackCount++
      }

      // Check for invalid dates
      if (record.createdAt && isNaN(new Date(record.createdAt).getTime())) {
        invalidDateCount++
      }
    })

    // Generate warnings based on quality issues
    if (emptyFeedbackCount > 0) {
      const percentage = ((emptyFeedbackCount / data.length) * 100).toFixed(1)
      warnings.push({
        type: 'empty_feedback',
        message: `${emptyFeedbackCount} records (${percentage}%) have empty feedback`,
        suggestion: 'Consider filtering out empty feedback entries'
      })
    }

    if (longFeedbackCount > 0) {
      warnings.push({
        type: 'long_feedback',
        message: `${longFeedbackCount} records have very long feedback text`,
        suggestion: 'Long feedback may affect export formatting'
      })
    }

    if (invalidDateCount > 0) {
      warnings.push({
        type: 'invalid_dates',
        message: `${invalidDateCount} records have invalid date formats`,
        suggestion: 'Date formatting issues may occur in the export'
      })
    }

    return { errors, warnings }
  }

  /**
   * Estimates file size and processing time
   */
  static estimateFileSize(data, exportOptions, exportType) {
    const recordCount = data.length
    const estimates = this.FILE_SIZE_ESTIMATES[exportType]
    
    let estimatedSizeKB = estimates.baseKB

    // Add record-based size
    estimatedSizeKB += (recordCount * estimates.bytesPerRecord) / 1024

    // Add format-specific overhead
    if (exportType === 'csv') {
      if (exportOptions.includeHeaders) {
        estimatedSizeKB += estimates.headerKB
      }
      if (exportOptions.includeSummary) {
        estimatedSizeKB += 5 // Summary overhead
      }
      if (exportOptions.separateFiles) {
        estimatedSizeKB *= 1.2 // File separation overhead
      }
    } else if (exportType === 'pdf') {
      if (exportOptions.includeCharts) {
        // Estimate 3 charts on average
        estimatedSizeKB += estimates.chartKB * 3
      }
      if (exportOptions.includeInsights) {
        estimatedSizeKB += 10 // Insights section
      }
    }

    const estimatedSizeMB = estimatedSizeKB / 1024

    // Estimate processing time (rough approximation)
    let estimatedProcessingTimeMs = 500 // Base processing time
    estimatedProcessingTimeMs += recordCount * 2 // 2ms per record
    
    if (exportType === 'pdf') {
      estimatedProcessingTimeMs *= 3 // PDF generation is slower
      if (exportOptions.includeCharts) {
        estimatedProcessingTimeMs += 2000 // Chart processing time
      }
    }

    return {
      estimatedSizeKB: Math.round(estimatedSizeKB),
      estimatedSizeMB: Math.round(estimatedSizeMB * 10) / 10, // Round to 1 decimal
      estimatedProcessingTimeMs,
      estimatedProcessingSeconds: Math.round(estimatedProcessingTimeMs / 1000),
      recordCount
    }
  }

  /**
   * Gets validation summary for display
   */
  static getValidationSummary(validationResult) {
    const { isValid, errors, warnings, sizeEstimate } = validationResult

    const summary = {
      status: isValid ? 'valid' : 'invalid',
      totalIssues: errors.length + warnings.length,
      criticalIssues: errors.length,
      warnings: warnings.length,
      canProceed: isValid,
      estimatedSize: `${sizeEstimate.estimatedSizeMB}MB`,
      estimatedTime: `~${sizeEstimate.estimatedProcessingSeconds}s`,
      recordCount: sizeEstimate.recordCount
    }

    return summary
  }

  /**
   * Formats validation messages for display
   */
  static formatValidationMessages(validationResult) {
    const { errors, warnings } = validationResult
    
    return {
      errors: errors.map(error => ({
        ...error,
        severity: 'error',
        icon: '❌'
      })),
      warnings: warnings.map(warning => ({
        ...warning,
        severity: 'warning',
        icon: '⚠️'
      }))
    }
  }
}

export default ExportValidator