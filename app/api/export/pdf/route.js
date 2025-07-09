import { NextResponse } from 'next/server';
import { PuppeteerPDFReportGenerator } from '@/lib/exporters/PuppeteerPDFReportGenerator';

export async function POST(request) {
  try {
    const body = await request.json();
    const { feedback, analytics, options } = body;

    console.log(`PDF API - Received request for ${feedback?.length || 0} feedback entries`);

    // Validate input
    if (!feedback || !Array.isArray(feedback)) {
      return NextResponse.json(
        { error: 'Invalid feedback data provided' },
        { status: 400 }
      );
    }

    if (!analytics || typeof analytics !== 'object') {
      return NextResponse.json(
        { error: 'Invalid analytics data provided' },
        { status: 400 }
      );
    }

    // Initialize the Puppeteer PDF generator
    const generator = new PuppeteerPDFReportGenerator();

    // Generate the PDF
    const pdfBuffer = await generator.generateReport(feedback, analytics, {
      title: 'Feedback Analytics Report',
      subtitle: options?.subtitle || 'Comprehensive Analysis',
      organizationName: 'FeedbackSense',
      includeCharts: options?.includeCharts || false,
      includeFeedbackTable: options?.includeFeedbackTable || true,
      includeInsights: options?.includeInsights || true,
      includeAdvancedAnalytics: options?.includeAdvancedAnalytics || true,
      includePredictiveInsights: options?.includePredictiveInsights || true,
      maxFeedbackEntries: options?.maxFeedbackEntries || 50,
      ...options
    });

    console.log(`PDF API - Successfully generated PDF (${pdfBuffer.length} bytes)`);

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${options?.filename || 'feedback-report.pdf'}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('PDF generation API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}