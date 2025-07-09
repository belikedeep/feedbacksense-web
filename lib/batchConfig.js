/**
 * Batch processing configuration for AI analysis
 * Centralized configuration to easily adjust batch sizes and limits
 */

// Batch processing configuration
export const BATCH_CONFIG = {
  // Default batch sizes for different operations
  DEFAULT_BATCH_SIZE: 15,
  CSV_IMPORT_BATCH_SIZE: 15,
  REANALYSIS_BATCH_SIZE: 15,
  
  // Maximum batch sizes (safety limits)
  MAX_BATCH_SIZE: 20,
  MIN_BATCH_SIZE: 5,
  
  // Rate limiting settings
  DELAY_BETWEEN_BATCHES: 2000, // 2 seconds between batches
  
  // Token estimation (rough estimates for Gemini API)
  ESTIMATED_TOKENS_PER_FEEDBACK: 100,
  MAX_TOKENS_PER_REQUEST: 30000, // Conservative limit
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  
  // Progress reporting
  REPORT_PROGRESS_EVERY: 1, // Report progress after every batch
};

/**
 * Calculate optimal batch size based on content length
 * @param {string[]} texts - Array of feedback texts
 * @param {number} maxBatchSize - Maximum allowed batch size
 * @returns {number} Optimal batch size
 */
export function calculateOptimalBatchSize(texts, maxBatchSize = BATCH_CONFIG.MAX_BATCH_SIZE) {
  if (!Array.isArray(texts) || texts.length === 0) {
    return BATCH_CONFIG.DEFAULT_BATCH_SIZE;
  }
  
  // Calculate average text length
  const averageLength = texts.reduce((sum, text) => sum + text.length, 0) / texts.length;
  
  // Estimate tokens based on character count (rough approximation)
  const estimatedTokensPerItem = Math.max(50, Math.ceil(averageLength / 4));
  
  // Calculate how many items can fit in a single request
  const maxItemsPerRequest = Math.floor(BATCH_CONFIG.MAX_TOKENS_PER_REQUEST / estimatedTokensPerItem);
  
  // Return the smaller of maxBatchSize and calculated optimal size
  const optimalSize = Math.min(maxBatchSize, maxItemsPerRequest, BATCH_CONFIG.MAX_BATCH_SIZE);
  
  // Ensure we don't go below minimum
  return Math.max(BATCH_CONFIG.MIN_BATCH_SIZE, optimalSize);
}

/**
 * Get batch configuration for specific operation type
 * @param {string} operationType - Type of operation ('csv_import', 'reanalysis', 'default')
 * @returns {Object} Configuration object
 */
export function getBatchConfig(operationType = 'default') {
  const baseConfig = {
    delayBetweenBatches: BATCH_CONFIG.DELAY_BETWEEN_BATCHES,
    maxRetries: BATCH_CONFIG.MAX_RETRIES,
    retryDelay: BATCH_CONFIG.RETRY_DELAY,
  };
  
  switch (operationType) {
    case 'csv_import':
      return {
        ...baseConfig,
        batchSize: BATCH_CONFIG.CSV_IMPORT_BATCH_SIZE,
        description: 'CSV Import Batch Processing'
      };
      
    case 'reanalysis':
      return {
        ...baseConfig,
        batchSize: BATCH_CONFIG.REANALYSIS_BATCH_SIZE,
        description: 'Feedback Re-analysis Batch Processing'
      };
      
    default:
      return {
        ...baseConfig,
        batchSize: BATCH_CONFIG.DEFAULT_BATCH_SIZE,
        description: 'General Batch Processing'
      };
  }
}

/**
 * Validate batch size against limits
 * @param {number} batchSize - Proposed batch size
 * @returns {number} Validated batch size within limits
 */
export function validateBatchSize(batchSize) {
  const size = parseInt(batchSize, 10);
  
  if (isNaN(size) || size < BATCH_CONFIG.MIN_BATCH_SIZE) {
    return BATCH_CONFIG.MIN_BATCH_SIZE;
  }
  
  if (size > BATCH_CONFIG.MAX_BATCH_SIZE) {
    return BATCH_CONFIG.MAX_BATCH_SIZE;
  }
  
  return size;
}

/**
 * Log batch processing statistics
 * @param {Object} stats - Processing statistics
 */
export function logBatchStats(stats) {
  const {
    operation = 'Unknown',
    totalItems = 0,
    totalBatches = 0,
    averageBatchSize = 0,
    processingTime = 0,
    successRate = 0
  } = stats;
  
  console.log(`
🚀 Batch Processing Complete - ${operation}
📊 Total Items: ${totalItems}
📦 Total Batches: ${totalBatches}
📏 Average Batch Size: ${averageBatchSize.toFixed(1)}
⏱️  Processing Time: ${(processingTime / 1000).toFixed(2)}s
✅ Success Rate: ${(successRate * 100).toFixed(1)}%
⚡ Items/Second: ${(totalItems / (processingTime / 1000)).toFixed(2)}
  `);
}