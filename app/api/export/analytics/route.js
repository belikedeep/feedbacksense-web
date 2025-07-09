import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

// GET /api/export/analytics - Export usage analytics and metadata
export async function GET(request) {
  try {
    const { supabase } = createClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('time_range') || '30d'; // 7d, 30d, 90d, 1y
    const includeDetails = searchParams.get('include_details') === 'true';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get export analytics
    const exports = await prisma.exportHistory.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: startDate
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate analytics
    const totalExports = exports.length;
    const successfulExports = exports.filter(e => e.status === 'completed').length;
    const failedExports = exports.filter(e => e.status === 'failed').length;
    const pendingExports = exports.filter(e => e.status === 'pending').length;
    const processingExports = exports.filter(e => e.status === 'processing').length;

    // Success rate
    const successRate = totalExports > 0 ? (successfulExports / totalExports) * 100 : 0;

    // Export types breakdown
    const exportTypeBreakdown = exports.reduce((acc, exp) => {
      acc[exp.exportType] = (acc[exp.exportType] || 0) + 1;
      return acc;
    }, {});

    // Most used export type
    const mostUsedExportType = Object.entries(exportTypeBreakdown)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // File size analytics
    const completedExports = exports.filter(e => e.status === 'completed' && e.fileSize);
    const totalFileSize = completedExports.reduce((sum, exp) => sum + (exp.fileSize || 0), 0);
    const avgFileSize = completedExports.length > 0 ? totalFileSize / completedExports.length : 0;
    const largestExport = completedExports.reduce((max, exp) => 
      (exp.fileSize || 0) > (max?.fileSize || 0) ? exp : max, null);

    // Record count analytics
    const exportsWithRecords = exports.filter(e => e.recordCount);
    const totalRecordsExported = exportsWithRecords.reduce((sum, exp) => sum + (exp.recordCount || 0), 0);
    const avgRecordsPerExport = exportsWithRecords.length > 0 ? totalRecordsExported / exportsWithRecords.length : 0;

    // Time-based analytics
    const dailyExports = {};
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days.push(dateStr);
      dailyExports[dateStr] = 0;
    }

    exports.forEach(exp => {
      const dateStr = exp.createdAt.toISOString().split('T')[0];
      if (dailyExports.hasOwnProperty(dateStr)) {
        dailyExports[dateStr]++;
      }
    });

    // Error analytics
    const errorMessages = exports
      .filter(e => e.status === 'failed' && e.errorMessage)
      .reduce((acc, exp) => {
        acc[exp.errorMessage] = (acc[exp.errorMessage] || 0) + 1;
        return acc;
      }, {});

    // Average processing time for completed exports
    const completedWithTimes = exports.filter(e => 
      e.status === 'completed' && e.completedAt && e.createdAt
    );
    const avgProcessingTime = completedWithTimes.length > 0 
      ? completedWithTimes.reduce((sum, exp) => {
          const processingTime = exp.completedAt.getTime() - exp.createdAt.getTime();
          return sum + processingTime;
        }, 0) / completedWithTimes.length
      : 0;

    // Peak usage hours
    const hourlyDistribution = exports.reduce((acc, exp) => {
      const hour = exp.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHour = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

    // Get template usage analytics
    const templates = await prisma.exportTemplate.findMany({
      where: { userId: session.user.id },
      select: {
        id: true,
        name: true,
        usageCount: true,
        isDefault: true,
        createdAt: true
      },
      orderBy: { usageCount: 'desc' }
    });

    const mostUsedTemplate = templates[0] || null;
    const totalTemplates = templates.length;

    // Recent export trends
    const thisMonth = exports.filter(e => {
      const exportMonth = e.createdAt.getMonth();
      const exportYear = e.createdAt.getFullYear();
      return exportMonth === now.getMonth() && exportYear === now.getFullYear();
    }).length;

    const lastMonth = exports.filter(e => {
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      const exportMonth = e.createdAt.getMonth();
      const exportYear = e.createdAt.getFullYear();
      return exportMonth === lastMonthDate.getMonth() && exportYear === lastMonthDate.getFullYear();
    }).length;

    const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Build response
    const analytics = {
      summary: {
        totalExports,
        successfulExports,
        failedExports,
        pendingExports,
        processingExports,
        successRate: Math.round(successRate * 100) / 100,
        timeRange
      },
      exportTypes: {
        breakdown: exportTypeBreakdown,
        mostUsed: mostUsedExportType
      },
      fileMetrics: {
        totalFileSize,
        avgFileSize: Math.round(avgFileSize),
        largestExport: largestExport ? {
          id: largestExport.id,
          size: largestExport.fileSize,
          type: largestExport.exportType,
          createdAt: largestExport.createdAt
        } : null
      },
      recordMetrics: {
        totalRecordsExported,
        avgRecordsPerExport: Math.round(avgRecordsPerExport)
      },
      timeAnalytics: {
        dailyExports: last7Days.map(date => ({
          date,
          count: dailyExports[date]
        })),
        avgProcessingTime: Math.round(avgProcessingTime / 1000), // in seconds
        peakHour: peakHour ? parseInt(peakHour) : null,
        monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
      },
      templates: {
        total: totalTemplates,
        mostUsed: mostUsedTemplate,
        list: templates.slice(0, 5) // Top 5 templates
      },
      errors: {
        totalFailed: failedExports,
        commonErrors: Object.entries(errorMessages)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([message, count]) => ({ message, count }))
      }
    };

    // Include detailed export list if requested
    if (includeDetails) {
      analytics.recentExports = exports.slice(0, 10).map(exp => ({
        id: exp.id,
        exportType: exp.exportType,
        status: exp.status,
        fileSize: exp.fileSize,
        recordCount: exp.recordCount,
        createdAt: exp.createdAt,
        completedAt: exp.completedAt,
        errorMessage: exp.errorMessage
      }));
    }

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Export analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch export analytics', details: error.message },
      { status: 500 }
    );
  }
}