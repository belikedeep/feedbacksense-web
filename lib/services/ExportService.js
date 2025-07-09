import prisma from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import CSVExporter from '@/lib/exporters/CSVExporter';
import PDFReportGenerator from '@/lib/exporters/PDFReportGenerator';
import AdvancedAnalyticsEngine from '@/lib/analytics/AdvancedAnalyticsEngine';
import path from 'path';
import fs from 'fs/promises';

/**
 * Export Service - Orchestrates export operations with progress tracking
 */
class ExportService {
  constructor() {
    this.csvExporter = new CSVExporter();
    this.pdfGenerator = new PDFReportGenerator();
    this.analyticsEngine = new AdvancedAnalyticsEngine();
  }

  /**
   * Create a new export with template support
   */
  async createExport(userId, exportConfig) {
    try {
      // Validate export configuration
      this.validateExportConfig(exportConfig);

      // Create export history record
      const exportHistory = await prisma.exportHistory.create({
        data: {
          userId,
          exportType: exportConfig.type,
          configuration: exportConfig,
          status: 'pending'
        }
      });

      // Create initial progress record
      await this.updateProgress(exportHistory.id, 'initialization', 0, 'Export initialized');

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId,
          action: 'export_created',
          details: {
            exportId: exportHistory.id,
            exportType: exportConfig.type,
            configuration: exportConfig
          }
        }
      });

      return exportHistory;
    } catch (error) {
      console.error('Export creation error:', error);
      throw error;
    }
  }

  /**
   * Process export with progress tracking
   */
  async processExport(exportId) {
    try {
      const exportRecord = await prisma.exportHistory.findUnique({
        where: { id: exportId },
        include: {
          user: {
            select: { id: true, email: true }
          }
        }
      });

      if (!exportRecord) {
        throw new Error('Export record not found');
      }

      // Update status to processing
      await prisma.exportHistory.update({
        where: { id: exportId },
        data: { status: 'processing' }
      });

      await this.updateProgress(exportId, 'data_collection', 10, 'Starting data collection');

      // Get data based on export configuration
      const data = await this.collectData(exportRecord.userId, exportRecord.configuration);
      
      await this.updateProgress(exportId, 'data_collection', 30, `Collected ${data.length} records`);

      // Apply filters and transformations
      const processedData = await this.processData(data, exportRecord.configuration);
      
      await this.updateProgress(exportId, 'processing', 50, 'Processing data');

      // Generate analytics if requested
      let analyticsData = null;
      if (exportRecord.configuration.includeAnalytics) {
        analyticsData = await this.generateAnalytics(processedData, exportRecord.configuration);
        await this.updateProgress(exportId, 'processing', 70, 'Generating analytics');
      }

      await this.updateProgress(exportId, 'file_generation', 80, 'Generating export file');

      // Generate file based on export type
      const fileResult = await this.generateFile(
        processedData, 
        analyticsData, 
        exportRecord.configuration, 
        exportId
      );

      await this.updateProgress(exportId, 'file_generation', 95, 'Finalizing export');

      // Update export record with file information
      await prisma.exportHistory.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          filePath: fileResult.filePath,
          fileSize: fileResult.fileSize,
          recordCount: processedData.length,
          completedAt: new Date(),
          metadata: {
            originalRecordCount: data.length,
            processedRecordCount: processedData.length,
            fileInfo: fileResult.metadata,
            ...(analyticsData && { analyticsIncluded: true })
          }
        }
      });

      await this.updateProgress(exportId, 'completion', 100, 'Export completed successfully');

      // Log completion
      await prisma.activityLog.create({
        data: {
          userId: exportRecord.userId,
          action: 'export_completed',
          details: {
            exportId,
            filePath: fileResult.filePath,
            fileSize: fileResult.fileSize,
            recordCount: processedData.length
          }
        }
      });

      return {
        success: true,
        exportId,
        filePath: fileResult.filePath,
        fileSize: fileResult.fileSize,
        recordCount: processedData.length
      };

    } catch (error) {
      console.error('Export processing error:', error);
      
      // Update export as failed
      await prisma.exportHistory.update({
        where: { id: exportId },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      });

      await this.updateProgress(exportId, 'error', 0, `Export failed: ${error.message}`);

      throw error;
    }
  }

  /**
   * Collect data based on export configuration
   */
  async collectData(userId, configuration) {
    const { 
      dateRange, 
      filters = {}, 
      categories = [], 
      sentiments = [],
      statuses = [],
      includeArchived = false 
    } = configuration;

    // Build where clause
    const where = {
      userId,
      ...(dateRange && {
        createdAt: {
          gte: new Date(dateRange.start),
          lte: new Date(dateRange.end)
        }
      }),
      ...(categories.length > 0 && { category: { in: categories } }),
      ...(sentiments.length > 0 && { sentimentLabel: { in: sentiments } }),
      ...(statuses.length > 0 && { status: { in: statuses } }),
      ...(!includeArchived && { isArchived: false })
    };

    // Apply additional filters
    if (filters.search) {
      where.content = {
        contains: filters.search,
        mode: 'insensitive'
      };
    }

    if (filters.minSentimentScore !== undefined) {
      where.sentimentScore = {
        gte: filters.minSentimentScore
      };
    }

    if (filters.topics && filters.topics.length > 0) {
      where.topics = {
        hasSome: filters.topics
      };
    }

    // Fetch data with related information
    const data = await prisma.feedback.findMany({
      where,
      include: {
        notes: configuration.includeNotes ? {
          where: { isInternal: false }
        } : false,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return data;
  }

  /**
   * Process and transform data based on configuration
   */
  async processData(data, configuration) {
    let processedData = [...data];

    // Apply sorting
    if (configuration.sorting) {
      const { field, direction } = configuration.sorting;
      processedData.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        
        if (direction === 'desc') {
          return bVal > aVal ? 1 : -1;
        }
        return aVal > bVal ? 1 : -1;
      });
    }

    // Apply pagination/limiting
    if (configuration.limit) {
      processedData = processedData.slice(0, configuration.limit);
    }

    // Transform data based on selected fields
    if (configuration.fields && configuration.fields.length > 0) {
      processedData = processedData.map(item => {
        const transformed = {};
        configuration.fields.forEach(field => {
          if (field.includes('.')) {
            // Handle nested fields
            const parts = field.split('.');
            let value = item;
            parts.forEach(part => {
              value = value?.[part];
            });
            transformed[field] = value;
          } else {
            transformed[field] = item[field];
          }
        });
        return transformed;
      });
    }

    return processedData;
  }

  /**
   * Generate analytics for export data
   */
  async generateAnalytics(data, configuration) {
    const analyticsConfig = configuration.analytics || {};
    
    // Generate comprehensive analytics
    const analytics = await this.analyticsEngine.generateComprehensiveAnalytics(data, {
      includeSentimentAnalysis: analyticsConfig.includeSentiment !== false,
      includeCategoryAnalysis: analyticsConfig.includeCategories !== false,
      includeTrendAnalysis: analyticsConfig.includeTrends !== false,
      includeTopics: analyticsConfig.includeTopics !== false,
      includeInsights: analyticsConfig.includeInsights !== false
    });

    return analytics;
  }

  /**
   * Generate export file based on type
   */
  async generateFile(data, analyticsData, configuration, exportId) {
    const exportDir = path.join(process.cwd(), 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export_${exportId}_${timestamp}`;

    switch (configuration.type) {
      case 'csv':
        return await this.generateCSVFile(data, analyticsData, configuration, exportDir, filename);
      
      case 'pdf':
        return await this.generatePDFFile(data, analyticsData, configuration, exportDir, filename);
      
      case 'json':
        return await this.generateJSONFile(data, analyticsData, configuration, exportDir, filename);
      
      case 'excel':
        return await this.generateExcelFile(data, analyticsData, configuration, exportDir, filename);
      
      default:
        throw new Error(`Unsupported export type: ${configuration.type}`);
    }
  }

  /**
   * Generate CSV file
   */
  async generateCSVFile(data, analyticsData, configuration, exportDir, filename) {
    const filePath = path.join(exportDir, `${filename}.csv`);
    
    const csvContent = await this.csvExporter.generateCSV(data, {
      includeAnalytics: configuration.includeAnalytics,
      analyticsData,
      customFields: configuration.fields
    });

    await fs.writeFile(filePath, csvContent);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      metadata: {
        type: 'csv',
        encoding: 'utf-8',
        recordCount: data.length
      }
    };
  }

  /**
   * Generate PDF file
   */
  async generatePDFFile(data, analyticsData, configuration, exportDir, filename) {
    const filePath = path.join(exportDir, `${filename}.pdf`);
    
    const pdfBuffer = await this.pdfGenerator.generateReport(data, {
      includeAnalytics: configuration.includeAnalytics,
      analyticsData,
      title: configuration.title || 'Feedback Export Report',
      includeCharts: configuration.includeCharts !== false
    });

    await fs.writeFile(filePath, pdfBuffer);
    const stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      metadata: {
        type: 'pdf',
        recordCount: data.length,
        includesCharts: configuration.includeCharts !== false
      }
    };
  }

  /**
   * Generate JSON file
   */
  async generateJSONFile(data, analyticsData, configuration, exportDir, filename) {
    const filePath = path.join(exportDir, `${filename}.json`);
    
    const jsonData = {
      exportInfo: {
        exportId: filename,
        timestamp: new Date().toISOString(),
        recordCount: data.length,
        configuration
      },
      data,
      ...(analyticsData && { analytics: analyticsData })
    };

    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
    const stats = await fs.stat(filePath);

    return {
      filePath,
      fileSize: stats.size,
      metadata: {
        type: 'json',
        recordCount: data.length,
        includesAnalytics: !!analyticsData
      }
    };
  }

  /**
   * Generate Excel file (placeholder - would need excel library)
   */
  async generateExcelFile(data, analyticsData, configuration, exportDir, filename) {
    // For now, generate CSV as fallback
    // In production, you'd use a library like xlsx or exceljs
    return await this.generateCSVFile(data, analyticsData, configuration, exportDir, filename);
  }

  /**
   * Update export progress
   */
  async updateProgress(exportId, stage, progressPercent, message = null) {
    try {
      await prisma.exportProgress.create({
        data: {
          exportId,
          stage,
          progressPercent,
          message
        }
      });
    } catch (error) {
      console.error('Progress update error:', error);
      // Don't throw error for progress updates to avoid breaking export
    }
  }

  /**
   * Validate export configuration
   */
  validateExportConfig(config) {
    if (!config.type) {
      throw new Error('Export type is required');
    }

    const validTypes = ['csv', 'pdf', 'json', 'excel'];
    if (!validTypes.includes(config.type)) {
      throw new Error(`Invalid export type: ${config.type}`);
    }

    if (config.dateRange) {
      if (!config.dateRange.start || !config.dateRange.end) {
        throw new Error('Date range must include start and end dates');
      }
      
      const startDate = new Date(config.dateRange.start);
      const endDate = new Date(config.dateRange.end);
      
      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }
    }

    if (config.limit && (config.limit < 1 || config.limit > 10000)) {
      throw new Error('Limit must be between 1 and 10000');
    }
  }

  /**
   * Get export template by ID
   */
  async getTemplate(templateId, userId) {
    const template = await prisma.exportTemplate.findFirst({
      where: {
        id: templateId,
        OR: [
          { userId },
          { isShared: true }
        ]
      }
    });

    if (!template) {
      throw new Error('Template not found or access denied');
    }

    return template;
  }

  /**
   * Apply template to export configuration
   */
  async applyTemplate(templateId, userId, overrides = {}) {
    const template = await this.getTemplate(templateId, userId);
    
    // Increment template usage
    await prisma.exportTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    // Merge template configuration with overrides
    const configuration = {
      ...template.configuration,
      ...overrides
    };

    return configuration;
  }

  /**
   * Retry failed export
   */
  async retryExport(exportId, userId) {
    const exportRecord = await prisma.exportHistory.findFirst({
      where: {
        id: exportId,
        userId
      }
    });

    if (!exportRecord) {
      throw new Error('Export record not found');
    }

    if (exportRecord.status !== 'failed') {
      throw new Error('Only failed exports can be retried');
    }

    // Update retry count and reset status
    await prisma.exportHistory.update({
      where: { id: exportId },
      data: {
        status: 'pending',
        retryCount: {
          increment: 1
        },
        errorMessage: null
      }
    });

    // Process the export
    return await this.processExport(exportId);
  }
}

export default ExportService;