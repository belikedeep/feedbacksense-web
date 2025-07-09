import prisma from '@/lib/prisma';
import { promises as fs } from 'fs';

/**
 * Export Metadata Manager - Handles export metadata storage, retrieval, and analytics
 */
class ExportMetadataManager {
  constructor() {
    this.performanceMetrics = new Map();
  }

  /**
   * Store export metadata
   */
  async storeMetadata(exportId, metadata) {
    try {
      const existingExport = await prisma.exportHistory.findUnique({
        where: { id: exportId }
      });

      if (!existingExport) {
        throw new Error('Export record not found');
      }

      // Merge new metadata with existing
      const updatedMetadata = {
        ...existingExport.metadata,
        ...metadata,
        updatedAt: new Date().toISOString()
      };

      await prisma.exportHistory.update({
        where: { id: exportId },
        data: {
          metadata: updatedMetadata
        }
      });

      return updatedMetadata;
    } catch (error) {
      console.error('Metadata storage error:', error);
      throw error;
    }
  }

  /**
   * Retrieve export metadata
   */
  async getMetadata(exportId, userId) {
    try {
      const exportRecord = await prisma.exportHistory.findFirst({
        where: {
          id: exportId,
          userId
        },
        select: {
          id: true,
          exportType: true,
          status: true,
          createdAt: true,
          completedAt: true,
          fileSize: true,
          recordCount: true,
          metadata: true,
          configuration: true
        }
      });

      if (!exportRecord) {
        throw new Error('Export record not found or access denied');
      }

      // Calculate processing time if completed
      let processingTime = null;
      if (exportRecord.completedAt && exportRecord.createdAt) {
        processingTime = exportRecord.completedAt.getTime() - exportRecord.createdAt.getTime();
      }

      return {
        ...exportRecord,
        processingTime,
        metadata: exportRecord.metadata || {}
      };
    } catch (error) {
      console.error('Metadata retrieval error:', error);
      throw error;
    }
  }

  /**
   * Generate export usage analytics
   */
  async generateUsageAnalytics(userId, options = {}) {
    try {
      const {
        timeRange = '30d',
        includeDetails = false,
        groupBy = 'day'
      } = options;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Get exports within range
      const exports = await prisma.exportHistory.findMany({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Calculate basic metrics
      const totalExports = exports.length;
      const successfulExports = exports.filter(e => e.status === 'completed').length;
      const failedExports = exports.filter(e => e.status === 'failed').length;
      const avgProcessingTime = this.calculateAverageProcessingTime(exports);

      // Export type distribution
      const typeDistribution = exports.reduce((acc, exp) => {
        acc[exp.exportType] = (acc[exp.exportType] || 0) + 1;
        return acc;
      }, {});

      // File size analytics
      const completedExports = exports.filter(e => e.status === 'completed' && e.fileSize);
      const fileSizeStats = this.calculateFileSizeStats(completedExports);

      // Time-based grouping
      const timeSeriesData = this.groupExportsByTime(exports, groupBy);

      // Performance trends
      const performanceTrends = this.calculatePerformanceTrends(exports);

      // Error analysis
      const errorAnalysis = this.analyzeErrors(exports.filter(e => e.status === 'failed'));

      const analytics = {
        summary: {
          totalExports,
          successfulExports,
          failedExports,
          successRate: totalExports > 0 ? (successfulExports / totalExports) * 100 : 0,
          avgProcessingTime,
          timeRange
        },
        typeDistribution,
        fileSizeStats,
        timeSeriesData,
        performanceTrends,
        errorAnalysis
      };

      if (includeDetails) {
        analytics.exportDetails = exports.slice(0, 20).map(exp => ({
          id: exp.id,
          type: exp.exportType,
          status: exp.status,
          createdAt: exp.createdAt,
          completedAt: exp.completedAt,
          fileSize: exp.fileSize,
          recordCount: exp.recordCount,
          processingTime: exp.completedAt && exp.createdAt 
            ? exp.completedAt.getTime() - exp.createdAt.getTime() 
            : null
        }));
      }

      return analytics;
    } catch (error) {
      console.error('Usage analytics error:', error);
      throw error;
    }
  }

  /**
   * Track export performance metrics
   */
  async trackPerformanceMetrics(exportId, metrics) {
    try {
      const performanceData = {
        exportId,
        timestamp: new Date().toISOString(),
        ...metrics
      };

      // Store in memory for real-time access
      this.performanceMetrics.set(exportId, performanceData);

      // Store in database metadata
      await this.storeMetadata(exportId, {
        performance: performanceData
      });

      return performanceData;
    } catch (error) {
      console.error('Performance tracking error:', error);
      throw error;
    }
  }

  /**
   * Generate audit trail for exports
   */
  async generateAuditTrail(userId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        actions = ['export_created', 'export_completed', 'export_failed', 'export_deleted'],
        limit = 100
      } = options;

      const where = {
        userId,
        action: { in: actions },
        ...(startDate && endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      };

      const auditLogs = await prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      // Enrich audit logs with export details
      const enrichedLogs = await Promise.all(
        auditLogs.map(async (log) => {
          const exportId = log.details?.exportId;
          let exportDetails = null;

          if (exportId) {
            try {
              exportDetails = await prisma.exportHistory.findUnique({
                where: { id: exportId },
                select: {
                  id: true,
                  exportType: true,
                  status: true,
                  createdAt: true,
                  completedAt: true,
                  fileSize: true,
                  recordCount: true
                }
              });
            } catch (error) {
              // Export might have been deleted
              console.warn(`Export ${exportId} not found for audit log ${log.id}`);
            }
          }

          return {
            ...log,
            exportDetails
          };
        })
      );

      return {
        auditLogs: enrichedLogs,
        summary: {
          totalActions: auditLogs.length,
          actionBreakdown: auditLogs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
          }, {}),
          dateRange: {
            earliest: auditLogs[auditLogs.length - 1]?.createdAt,
            latest: auditLogs[0]?.createdAt
          }
        }
      };
    } catch (error) {
      console.error('Audit trail generation error:', error);
      throw error;
    }
  }

  /**
   * Calculate export quotas and usage limits
   */
  async calculateUsageLimits(userId, limits = {}) {
    try {
      const {
        dailyLimit = 50,
        monthlyLimit = 1000,
        fileSizeLimit = 100 * 1024 * 1024 // 100MB
      } = limits;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get today's exports
      const todayExports = await prisma.exportHistory.count({
        where: {
          userId,
          createdAt: { gte: startOfDay }
        }
      });

      // Get this month's exports
      const monthlyExports = await prisma.exportHistory.count({
        where: {
          userId,
          createdAt: { gte: startOfMonth }
        }
      });

      // Calculate total file size for the month
      const monthlyFileSizeResult = await prisma.exportHistory.aggregate({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
          status: 'completed',
          fileSize: { not: null }
        },
        _sum: {
          fileSize: true
        }
      });

      const monthlyFileSize = monthlyFileSizeResult._sum.fileSize || 0;

      return {
        daily: {
          used: todayExports,
          limit: dailyLimit,
          remaining: Math.max(0, dailyLimit - todayExports),
          percentage: (todayExports / dailyLimit) * 100
        },
        monthly: {
          used: monthlyExports,
          limit: monthlyLimit,
          remaining: Math.max(0, monthlyLimit - monthlyExports),
          percentage: (monthlyExports / monthlyLimit) * 100
        },
        storage: {
          used: monthlyFileSize,
          limit: fileSizeLimit,
          remaining: Math.max(0, fileSizeLimit - monthlyFileSize),
          percentage: (monthlyFileSize / fileSizeLimit) * 100
        }
      };
    } catch (error) {
      console.error('Usage limits calculation error:', error);
      throw error;
    }
  }

  /**
   * Clean up old export metadata
   */
  async cleanupOldMetadata(retentionDays = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Get old completed exports
      const oldExports = await prisma.exportHistory.findMany({
        where: {
          createdAt: { lt: cutoffDate },
          status: 'completed'
        },
        select: { id: true, filePath: true }
      });

      const cleanupResults = {
        totalFound: oldExports.length,
        metadataCleared: 0,
        filesDeleted: 0,
        errors: []
      };

      for (const exportRecord of oldExports) {
        try {
          // Clear metadata but keep basic record
          await prisma.exportHistory.update({
            where: { id: exportRecord.id },
            data: {
              metadata: {},
              filePath: null
            }
          });

          cleanupResults.metadataCleared++;

          // Attempt to delete physical file
          if (exportRecord.filePath) {
            try {
              await fs.unlink(exportRecord.filePath);
              cleanupResults.filesDeleted++;
            } catch (fileError) {
              cleanupResults.errors.push({
                exportId: exportRecord.id,
                error: `File deletion failed: ${fileError.message}`
              });
            }
          }
        } catch (dbError) {
          cleanupResults.errors.push({
            exportId: exportRecord.id,
            error: `Database update failed: ${dbError.message}`
          });
        }
      }

      return cleanupResults;
    } catch (error) {
      console.error('Metadata cleanup error:', error);
      throw error;
    }
  }

  // Helper methods

  calculateAverageProcessingTime(exports) {
    const completedExports = exports.filter(e => 
      e.status === 'completed' && e.completedAt && e.createdAt
    );

    if (completedExports.length === 0) return 0;

    const totalTime = completedExports.reduce((sum, exp) => {
      return sum + (exp.completedAt.getTime() - exp.createdAt.getTime());
    }, 0);

    return Math.round(totalTime / completedExports.length);
  }

  calculateFileSizeStats(exports) {
    if (exports.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0 };
    }

    const fileSizes = exports.map(e => e.fileSize).filter(size => size > 0);
    
    if (fileSizes.length === 0) {
      return { total: 0, average: 0, min: 0, max: 0 };
    }

    return {
      total: fileSizes.reduce((sum, size) => sum + size, 0),
      average: Math.round(fileSizes.reduce((sum, size) => sum + size, 0) / fileSizes.length),
      min: Math.min(...fileSizes),
      max: Math.max(...fileSizes)
    };
  }

  groupExportsByTime(exports, groupBy) {
    const grouped = {};

    exports.forEach(exp => {
      let key;
      const date = exp.createdAt;

      switch (groupBy) {
        case 'hour':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate()) / 7)).padStart(2, '0')}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { total: 0, successful: 0, failed: 0, pending: 0 };
      }

      grouped[key].total++;
      grouped[key][exp.status]++;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, stats]) => ({ period, ...stats }));
  }

  calculatePerformanceTrends(exports) {
    const completedExports = exports.filter(e => 
      e.status === 'completed' && e.completedAt && e.createdAt
    );

    if (completedExports.length < 2) {
      return { trend: 'insufficient_data', improvement: 0 };
    }

    // Sort by creation date
    completedExports.sort((a, b) => a.createdAt - b.createdAt);

    // Calculate processing times
    const processingTimes = completedExports.map(exp => 
      exp.completedAt.getTime() - exp.createdAt.getTime()
    );

    // Calculate trend (simple linear regression slope)
    const n = processingTimes.length;
    const sumX = (n * (n - 1)) / 2; // sum of indices
    const sumY = processingTimes.reduce((sum, time) => sum + time, 0);
    const sumXY = processingTimes.reduce((sum, time, index) => sum + (index * time), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squared indices

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

    return {
      trend: slope < 0 ? 'improving' : slope > 0 ? 'degrading' : 'stable',
      improvement: -slope, // negative slope means improvement
      avgProcessingTime: sumY / n,
      dataPoints: n
    };
  }

  analyzeErrors(failedExports) {
    const errorTypes = {};
    const errorTrends = {};

    failedExports.forEach(exp => {
      const errorMsg = exp.errorMessage || 'Unknown error';
      const errorType = this.categorizeError(errorMsg);
      
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;

      const dateKey = exp.createdAt.toISOString().split('T')[0];
      if (!errorTrends[dateKey]) {
        errorTrends[dateKey] = {};
      }
      errorTrends[dateKey][errorType] = (errorTrends[dateKey][errorType] || 0) + 1;
    });

    return {
      totalErrors: failedExports.length,
      errorTypes,
      commonError: Object.entries(errorTypes).sort(([,a], [,b]) => b - a)[0]?.[0],
      errorTrends: Object.entries(errorTrends)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, errors]) => ({ date, ...errors }))
    };
  }

  categorizeError(errorMessage) {
    const msg = errorMessage.toLowerCase();
    
    if (msg.includes('timeout') || msg.includes('time out')) {
      return 'timeout';
    } else if (msg.includes('memory') || msg.includes('out of memory')) {
      return 'memory';
    } else if (msg.includes('permission') || msg.includes('unauthorized')) {
      return 'permission';
    } else if (msg.includes('file') || msg.includes('disk')) {
      return 'file_system';
    } else if (msg.includes('network') || msg.includes('connection')) {
      return 'network';
    } else if (msg.includes('validation') || msg.includes('invalid')) {
      return 'validation';
    } else {
      return 'unknown';
    }
  }
}

export default ExportMetadataManager;