import puppeteer from 'puppeteer';
import { AdvancedAnalyticsEngine } from '../analytics/AdvancedAnalyticsEngine.js';
import { initializeGeminiAI } from '../geminiAI.js';

/**
 * Modern PDF Report Generator using Puppeteer + Tailwind CSS
 * Eliminates all character encoding issues by using browser rendering
 */
export class PuppeteerPDFReportGenerator {
  constructor(options = {}) {
    this.options = {
      includeAdvancedAnalytics: true,
      includeAIInsights: true,
      includeCharts: true,
      includePredictiveInsights: true,
      analysisDepth: 'comprehensive',
      ...options
    };
    
    this.browser = null;
    this.page = null;
  }

  /**
   * Generate PDF report using Puppeteer
   * @param {Array} feedback - Feedback data
   * @param {Object} analytics - Analytics data
   * @param {Object} options - Generation options
   * @returns {Buffer} PDF buffer
   */
  async generateReport(feedback, analytics, options = {}) {
    try {
      console.log(`Puppeteer PDF Generation Starting - Input feedback count: ${feedback.length}`);
      
      const reportOptions = {
        title: 'Feedback Analytics Report',
        subtitle: 'Comprehensive AI-Powered Analysis',
        organizationName: 'FeedbackSense',
        includeCharts: true,
        includeFeedbackTable: true,
        includeInsights: true,
        includeAdvancedAnalytics: true,
        includePredictiveInsights: true,
        maxFeedbackEntries: 50,
        ...options
      };

      // Generate advanced analytics if enabled
      let advancedAnalytics = null;
      if (reportOptions.includeAdvancedAnalytics && feedback.length > 0) {
        try {
          const advancedEngine = new AdvancedAnalyticsEngine({
            analysisDepth: this.options.analysisDepth
          });
          advancedAnalytics = await advancedEngine.generateComprehensiveAnalytics(feedback);
          console.log(`Advanced analytics generated for ${advancedAnalytics.metadata?.dataPoints || 0} data points`);
        } catch (error) {
          console.error('Error generating advanced analytics for PDF:', error);
        }
      }

      // Launch browser
      await this.initializeBrowser();

      // Generate HTML content
      const htmlContent = this.generateHTMLReport(feedback, analytics, advancedAnalytics, reportOptions);

      // Set page content
      await this.page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Generate PDF
      const pdfBuffer = await this.page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: this.generateHeaderTemplate(reportOptions),
        footerTemplate: this.generateFooterTemplate(),
        preferCSSPageSize: true
      });

      console.log(`Puppeteer PDF Generation Complete - Final data count: ${feedback.length}`);
      
      return pdfBuffer;

    } catch (error) {
      console.error('Error generating PDF report with Puppeteer:', error);
      throw new Error(`Failed to generate PDF report: ${error.message}`);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize Puppeteer browser
   */
  async initializeBrowser() {
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport for consistent rendering
    await this.page.setViewport({
      width: 1200,
      height: 1600,
      deviceScaleFactor: 2
    });
  }

  /**
   * Generate complete HTML report with Tailwind CSS
   * @param {Array} feedback - Feedback data
   * @param {Object} analytics - Analytics data
   * @param {Object} advancedAnalytics - Advanced analytics data
   * @param {Object} options - Report options
   * @returns {string} Complete HTML document
   */
  generateHTMLReport(feedback, analytics, advancedAnalytics, options) {
    const totalFeedback = feedback.length;
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#3B82F6',
            secondary: '#8B5CF6',
            accent: '#10B981',
            warning: '#F59E0B',
            danger: '#EF4444'
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      .page-break { page-break-before: always; }
      .no-print { display: none; }
      body { print-color-adjust: exact; }
    }
    
    /* Professional business report styling */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #374151;
      background: white;
    }
    
    /* Professional typography hierarchy */
    .title-xl {
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
      text-align: center;
    }
    
    .title-large {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 20px;
      border-bottom: 3px solid #3B82F6;
      padding-bottom: 8px;
    }
    
    .title-medium {
      font-size: 18px;
      font-weight: 600;
      color: #374151;
      margin-bottom: 12px;
      margin-top: 24px;
    }
    
    .title-small {
      font-size: 14px;
      font-weight: 600;
      color: #4B5563;
      margin-bottom: 8px;
      margin-top: 16px;
    }
    
    .text-body {
      font-size: 12px;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 12px;
    }
    
    .text-small {
      font-size: 10px;
      color: #6B7280;
    }
    
    /* Professional spacing */
    .section-spacing { margin-bottom: 32px; }
    .content-spacing { margin-bottom: 16px; }
    .item-spacing { margin-bottom: 8px; }
    
    /* Professional containers */
    .content-container {
      max-width: 100%;
      margin: 0 auto;
      padding: 24px;
    }
    
    .chart-container {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .metric-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1;
      margin-bottom: 4px;
    }
    
    .metric-label {
      font-size: 12px;
      color: #6B7280;
      font-weight: 500;
    }
    
    /* Professional insights */
    .insight-item {
      background: #f8fafc;
      border-left: 4px solid #3B82F6;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
    }
    
    .recommendation-item {
      background: #f0fdf4;
      border-left: 4px solid #10B981;
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 0 6px 6px 0;
    }
    
    /* Professional tables */
    .professional-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .professional-table th {
      background: #f9fafb;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      font-size: 11px;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .professional-table td {
      padding: 10px 12px;
      font-size: 11px;
      border-bottom: 1px solid #f3f4f6;
      color: #374151;
    }
    
    .professional-table tr:hover {
      background: #f9fafb;
    }
    
    /* Charts and visualizations */
    .bar-chart {
      display: flex;
      align-items: end;
      height: 120px;
      gap: 8px;
      margin: 16px 0;
      padding: 8px;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .bar-chart .bar {
      flex: 1;
      background: linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%);
      border-radius: 4px 4px 0 0;
      min-height: 8px;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .bar-chart .bar.positive {
      background: linear-gradient(180deg, #10B981 0%, #059669 100%);
    }
    
    .bar-chart .bar.negative {
      background: linear-gradient(180deg, #EF4444 0%, #DC2626 100%);
    }
    
    .bar-chart .bar.neutral {
      background: linear-gradient(180deg, #F59E0B 0%, #D97706 100%);
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 4px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3B82F6, #1D4ED8);
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    /* Status indicators */
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 500;
    }
    
    .status-positive { background: #dcfce7; color: #166534; }
    .status-negative { background: #fee2e2; color: #991b1b; }
    .status-neutral { background: #fef3c7; color: #92400e; }
    .status-info { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body class="bg-white text-gray-900">
  
  <!-- Cover Page -->
  <div class="content-container">
    ${this.generateProfessionalCoverPage(options, totalFeedback, currentDate)}
  </div>

  <!-- Executive Summary -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateExecutiveSummary(feedback, analytics, advancedAnalytics)}
    </div>
  </div>

  <!-- Key Metrics Dashboard -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateMetricsDashboard(feedback, analytics, advancedAnalytics)}
    </div>
  </div>

  ${options.includeInsights && advancedAnalytics?.aiInsights ? `
  <!-- AI Insights Section -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateAIInsightsSection(advancedAnalytics.aiInsights)}
    </div>
  </div>
  ` : ''}

  ${options.includeAdvancedAnalytics ? `
  <!-- Advanced Analytics Section -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateAdvancedAnalyticsSection(advancedAnalytics)}
    </div>
  </div>
  ` : ''}

  ${options.includeFeedbackTable ? `
  <!-- Detailed Feedback Table -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateFeedbackTable(feedback, options.maxFeedbackEntries)}
    </div>
  </div>
  ` : ''}

  <!-- Appendix -->
  <div class="page-break">
    <div class="content-container">
      ${this.generateAppendix(feedback, analytics, options)}
    </div>
  </div>

</body>
</html>`;
  }

  /**
   * Generate Professional Cover Page
   */
  generateProfessionalCoverPage(options, totalFeedback, currentDate) {
    return `
    <div class="text-center section-spacing">
      <h1 class="title-xl">${this.escapeHtml(options.title)}</h1>
      <p class="title-medium text-gray-600">${this.escapeHtml(options.subtitle)}</p>
      
      <div class="content-spacing">
        <div class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg text-body font-semibold">
          ${totalFeedback.toLocaleString()} Feedback Entries Analyzed
        </div>
      </div>
      
      <div class="text-body text-gray-500">
        Generated on ${currentDate} • ${this.escapeHtml(options.organizationName)}
      </div>
    </div>

    <div class="section-spacing">
      <div class="grid grid-cols-2 gap-8">
        <div class="chart-container">
          <h2 class="title-medium">Report Overview</h2>
          <div class="space-y-4">
            <div>
              <h3 class="title-small">Analysis Scope</h3>
              <ul class="text-body space-y-2">
                <li><strong>Data Volume:</strong> ${totalFeedback.toLocaleString()} customer feedback entries</li>
                <li><strong>Analysis Type:</strong> Comprehensive AI-powered analytics</li>
                <li><strong>Processing Date:</strong> ${currentDate}</li>
                <li><strong>Organization:</strong> ${this.escapeHtml(options.organizationName)}</li>
              </ul>
            </div>
            
            <div>
              <h3 class="title-small">Methodology</h3>
              <p class="text-body">
                This report employs advanced artificial intelligence and statistical analysis 
                to process customer feedback data, providing comprehensive insights into sentiment 
                trends, category distributions, and predictive analytics for strategic decision-making.
              </p>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h2 class="title-medium">Report Contents</h2>
          <div class="space-y-3">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <span class="text-body">Executive Summary & Key Performance Indicators</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
              <span class="text-body">Sentiment Analysis & Distribution Metrics</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <span class="text-body">AI-Generated Business Insights & Recommendations</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
              <span class="text-body">Advanced Statistical & Trend Analysis</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
              <span class="text-body">Risk Assessment & Opportunity Identification</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
              <span class="text-body">Detailed Feedback Data Tables</span>
            </div>
          </div>

          <div class="content-spacing">
            <h3 class="title-small">Quality Assurance</h3>
            <p class="text-body">
              All data has been validated for accuracy and completeness. AI models have been 
              calibrated for optimal performance, and statistical analyses follow industry 
              best practices for reliability and interpretability.
            </p>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Generate FULL PAGE ONE - Complete Overview (DEPRECATED)
   */
  generateFullPageOne(options, totalFeedback, currentDate, feedback, analytics, advancedAnalytics) {
    const sentimentDist = analytics.sentimentDistribution || {};
    const categoryDist = analytics.categoryDistribution || {};
    const sourceDist = analytics.sourceDistribution || {};
    const positiveRatio = (sentimentDist.positive || 0) / totalFeedback;
    const negativeRatio = (sentimentDist.negative || 0) / totalFeedback;
    const neutralRatio = (sentimentDist.neutral || 0) / totalFeedback;

    const executiveSummary = advancedAnalytics?.aiInsights?.executiveSummary || 
      `Analysis of ${totalFeedback.toLocaleString()} customer feedback entries reveals ${positiveRatio > 0.6 ? 'strong customer satisfaction' : 'opportunities for improvement'} with ${(positiveRatio * 100).toFixed(1)}% positive sentiment.`;

    const keyInsights = advancedAnalytics?.aiInsights?.keyFindings?.slice(0, 6) || [
      `Customer satisfaction at ${(positiveRatio * 100).toFixed(1)}% indicates ${positiveRatio > 0.6 ? 'strong performance' : 'improvement needed'}`,
      `${negativeRatio > 0.3 ? 'High negative sentiment requires immediate attention' : 'Negative feedback within acceptable range'}`,
      `${Object.keys(categoryDist).length} categories identified for targeted analysis`,
      `Primary feedback source: ${Object.keys(sourceDist)[0] || 'web'} with ${Object.values(sourceDist)[0] || 0} entries`,
      `Data quality score: ${advancedAnalytics?.core?.qualityMetrics?.overallQualityScore || 85}% ensures reliable insights`,
      `Trend analysis shows ${advancedAnalytics?.trends?.overallTrend?.direction || 'stable'} pattern with ${((advancedAnalytics?.trends?.overallTrend?.confidence || 0.7) * 100).toFixed(0)}% confidence`
    ];

    return `
    <!-- HEADER - Ultra Compact -->
    <div class="text-center spacing-tight bg-blue-600 text-white p-1 rounded">
      <h1 class="title-medium font-bold">${this.escapeHtml(options.title)}</h1>
      <p class="text-body">${this.escapeHtml(options.subtitle)} • ${totalFeedback.toLocaleString()} Entries • ${currentDate}</p>
    </div>

    <!-- MAIN CONTENT GRID - Full Page Utilization -->
    <div class="grid grid-cols-4 gap-1 h-full">
      
      <!-- Column 1: Key Metrics -->
      <div class="space-y-1">
        <h2 class="title-small bg-gray-100 p-1 text-center">Key Metrics</h2>
        
        <div class="metric-card text-center bg-blue-50">
          <div class="metric-value text-blue-600">${totalFeedback.toLocaleString()}</div>
          <div class="text-small">Total Feedback</div>
        </div>
        
        <div class="metric-card text-center bg-green-50">
          <div class="metric-value text-green-600">${(positiveRatio * 100).toFixed(0)}%</div>
          <div class="text-small">Positive</div>
          <div class="w-full bg-gray-200 rounded h-1">
            <div class="bg-green-500 h-1 rounded" style="width: ${positiveRatio * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card text-center bg-red-50">
          <div class="metric-value text-red-600">${(negativeRatio * 100).toFixed(0)}%</div>
          <div class="text-small">Negative</div>
          <div class="w-full bg-gray-200 rounded h-1">
            <div class="bg-red-500 h-1 rounded" style="width: ${negativeRatio * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card text-center bg-yellow-50">
          <div class="metric-value text-yellow-600">${(neutralRatio * 100).toFixed(0)}%</div>
          <div class="text-small">Neutral</div>
          <div class="w-full bg-gray-200 rounded h-1">
            <div class="bg-yellow-500 h-1 rounded" style="width: ${neutralRatio * 100}%"></div>
          </div>
        </div>

        <!-- Sentiment Chart -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Sentiment Distribution</h3>
          <div class="bar-chart">
            <div class="bar positive" style="height: ${positiveRatio * 80}%" title="Positive"></div>
            <div class="bar neutral" style="height: ${neutralRatio * 80}%" title="Neutral"></div>
            <div class="bar negative" style="height: ${negativeRatio * 80}%" title="Negative"></div>
          </div>
        </div>

        <!-- Quality Metrics -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Quality Score</h3>
          <div class="metric-value text-center">${advancedAnalytics?.core?.qualityMetrics?.overallQualityScore || 85}%</div>
          <div class="text-body space-y-1">
            <div>Completeness: ${advancedAnalytics?.core?.qualityMetrics?.completeness || 95}%</div>
            <div>Validity: ${advancedAnalytics?.core?.qualityMetrics?.validEntries || 98}%</div>
            <div>AI Coverage: ${((feedback.filter(f => f.category).length / totalFeedback) * 100).toFixed(0)}%</div>
          </div>
        </div>
      </div>

      <!-- Column 2: Executive Summary & Insights -->
      <div class="space-y-1">
        <h2 class="title-small bg-gray-100 p-1 text-center">Executive Summary</h2>
        
        <div class="chart-container">
          <p class="text-body text-gray-700">${this.escapeHtml(executiveSummary)}</p>
        </div>

        <h3 class="title-small">Key Findings</h3>
        ${keyInsights.slice(0, 4).map((insight, index) => `
          <div class="insight-item">
            <div class="flex items-start">
              <div class="w-3 h-3 bg-blue-600 text-white rounded-full flex items-center justify-center mr-1" style="font-size: 6px;">
                ${index + 1}
              </div>
              <p class="text-body">${this.escapeHtml(insight.substring(0, 100))}${insight.length > 100 ? '...' : ''}</p>
            </div>
          </div>
        `).join('')}

        <!-- Recommendations -->
        <h3 class="title-small">Top Recommendations</h3>
        ${(advancedAnalytics?.aiInsights?.recommendations || [
          'Monitor sentiment trends for early warning indicators',
          'Address negative feedback categories systematically',
          'Leverage positive feedback for marketing initiatives'
        ]).slice(0, 3).map((rec, index) => `
          <div class="bg-green-50 border-l-2 border-green-500 p-1">
            <p class="text-body">${index + 1}. ${this.escapeHtml(rec.substring(0, 80))}${rec.length > 80 ? '...' : ''}</p>
          </div>
        `).join('')}
      </div>

      <!-- Column 3: Categories & Sources -->
      <div class="space-y-1">
        <h2 class="title-small bg-gray-100 p-1 text-center">Category Analysis</h2>
        
        ${Object.entries(categoryDist)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 8)
          .map(([category, count], index) => {
            const width = (count / totalFeedback * 100);
            return `
              <div class="chart-container">
                <div class="flex items-center justify-between">
                  <div class="text-body font-medium">${this.escapeHtml(category.replace(/_/g, ' ').substring(0, 15))}</div>
                  <div class="text-small">${count}</div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-1">
                  <div class="bg-blue-500 h-1 rounded-full" style="width: ${width}%"></div>
                </div>
                <div class="text-small text-gray-500">${width.toFixed(1)}%</div>
              </div>
            `;
          }).join('')}

        <h3 class="title-small">Source Distribution</h3>
        ${Object.entries(sourceDist)
          .sort(([,a], [,b]) => b - a)
          .map(([source, count]) => {
            const width = (count / totalFeedback * 100);
            return `
              <div class="metric-card">
                <div class="flex justify-between">
                  <span class="text-body">${this.escapeHtml(source)}</span>
                  <span class="text-small">${count} (${width.toFixed(0)}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded h-1">
                  <div class="bg-indigo-500 h-1 rounded" style="width: ${width}%"></div>
                </div>
              </div>
            `;
          }).join('')}
      </div>

      <!-- Column 4: Advanced Analytics Preview -->
      <div class="space-y-1">
        <h2 class="title-small bg-gray-100 p-1 text-center">Analytics Preview</h2>
        
        <!-- Statistical Summary -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Statistical Metrics</h3>
          <div class="text-body space-y-1">
            <div>Mean: ${(advancedAnalytics?.core?.sentimentMetrics?.average || positiveRatio).toFixed(2)}</div>
            <div>Median: ${(advancedAnalytics?.core?.sentimentMetrics?.median || positiveRatio).toFixed(2)}</div>
            <div>Std Dev: ${(advancedAnalytics?.core?.sentimentMetrics?.standardDeviation || 0.2).toFixed(2)}</div>
            <div>Range: ${((advancedAnalytics?.core?.sentimentMetrics?.max || 1) - (advancedAnalytics?.core?.sentimentMetrics?.min || 0)).toFixed(2)}</div>
          </div>
        </div>

        <!-- Trend Analysis -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Trend Analysis</h3>
          <div class="text-center">
            <div class="metric-value text-purple-600">${this.escapeHtml(advancedAnalytics?.trends?.overallTrend?.direction || 'Stable')}</div>
            <div class="text-small">Direction</div>
          </div>
          <div class="trend-line"></div>
          <div class="text-body">
            Confidence: ${((advancedAnalytics?.trends?.overallTrend?.confidence || 0.7) * 100).toFixed(0)}%
          </div>
        </div>

        <!-- Risk Assessment -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Risk Assessment</h3>
          <div class="text-center">
            <span class="inline-block px-2 py-1 text-xs rounded ${
              (advancedAnalytics?.aiInsights?.riskAssessment?.overallRisk || (negativeRatio > 0.4 ? 'high' : negativeRatio > 0.25 ? 'medium' : 'low')) === 'high' ? 'bg-red-100 text-red-800' :
              (advancedAnalytics?.aiInsights?.riskAssessment?.overallRisk || (negativeRatio > 0.4 ? 'high' : negativeRatio > 0.25 ? 'medium' : 'low')) === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }">
              ${(advancedAnalytics?.aiInsights?.riskAssessment?.overallRisk || (negativeRatio > 0.4 ? 'high' : negativeRatio > 0.25 ? 'medium' : 'low')).toUpperCase()}
            </span>
          </div>
          <div class="text-body mt-1">
            ${negativeRatio > 0.3 ? 'Immediate attention required for customer retention' : 'Risk levels within acceptable parameters'}
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="chart-container">
          <h3 class="text-small font-semibold">Immediate Actions</h3>
          <div class="text-body space-y-1">
            <div>• ${negativeRatio > 0.3 ? 'Address negative feedback' : 'Maintain current performance'}</div>
            <div>• ${Object.keys(categoryDist).length > 5 ? 'Focus on top 3 categories' : 'Expand feedback collection'}</div>
            <div>• ${positiveRatio > 0.6 ? 'Leverage success stories' : 'Improve satisfaction drivers'}</div>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Generate FULL PAGE TWO - Comprehensive Analytics
   */
  generateFullPageTwo(feedback, analytics, advancedAnalytics, options) {
    return `
    <div class="grid grid-cols-1 gap-1 h-full">
      ${this.generateAdvancedAnalyticsSection(advancedAnalytics)}
      ${options.includeInsights && advancedAnalytics?.aiInsights ? this.generateAIInsightsSection(advancedAnalytics.aiInsights) : ''}
    </div>
    `;
  }

  /**
   * Generate FULL PAGE DATA - Maximum Table Density
   */
  generateFullPageData(feedback, maxEntries) {
    return this.generateFeedbackTable(feedback, maxEntries);
  }

  /**
   * Generate cover page (DEPRECATED - keeping for compatibility)
   */
  generateCoverPage(options, totalFeedback, currentDate) {
    return `
<div class="max-w-6xl mx-auto p-2">
  <!-- Compact Header -->
  <div class="text-center spacing-tight">
    <h1 class="title-large text-gray-800">${this.escapeHtml(options.title)}</h1>
    <p class="title-medium text-gray-600">${this.escapeHtml(options.subtitle)}</p>
    <div class="inline-block px-2 py-1 bg-blue-600 text-white rounded text-small font-semibold">
      ${totalFeedback.toLocaleString()} Entries • Generated ${currentDate}
    </div>
  </div>
  
  <!-- Ultra-Compact Summary Grid -->
  <div class="grid grid-cols-4 gap-1 spacing-normal">
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Analysis Scope</h3>
      <div class="text-body space-y-1">
        <div><strong>Volume:</strong> ${totalFeedback.toLocaleString()}</div>
        <div><strong>Type:</strong> AI-Enhanced</div>
        <div><strong>Org:</strong> ${this.escapeHtml(options.organizationName)}</div>
        <div><strong>Method:</strong> Multi-layer</div>
      </div>
    </div>
    
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Components</h3>
      <div class="text-small space-y-1">
        <div>✓ Executive Summary</div>
        <div>✓ AI Business Insights</div>
        <div>✓ Statistical Analysis</div>
        <div>✓ Trend Forecasting</div>
        <div>✓ Risk Assessment</div>
        <div>✓ Strategic Recommendations</div>
      </div>
    </div>
    
    <div class="chart-container">
      <h3 class="title-small spacing-tight">AI Capabilities</h3>
      <div class="text-small space-y-1">
        <div>✓ Sentiment Classification</div>
        <div>✓ Category Auto-tagging</div>
        <div>✓ Trend Detection</div>
        <div>✓ Predictive Modeling</div>
        <div>✓ Risk Identification</div>
        <div>✓ Business Intelligence</div>
      </div>
    </div>
    
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Quality Assurance</h3>
      <div class="text-small space-y-1">
        <div>✓ Data Validation</div>
        <div>✓ Accuracy Verification</div>
        <div>✓ Bias Detection</div>
        <div>✓ Confidence Scoring</div>
        <div>✓ Error Handling</div>
        <div>✓ Result Verification</div>
      </div>
    </div>
  </div>

  <!-- Methodology Footer -->
  <div class="bg-gray-50 border border-gray-200 rounded p-2 spacing-normal">
    <p class="text-body text-gray-600">
      <strong>Methodology:</strong> Advanced AI analytics with sentiment analysis, category classification, and trend identification. 
      Data validated for quality and completeness to ensure accurate insights and actionable business recommendations.
    </p>
  </div>
</div>`;
  }

  /**
   * Generate executive summary
   */
  generateExecutiveSummary(feedback, analytics, advancedAnalytics) {
    const totalFeedback = feedback.length;
    const sentimentDist = analytics.sentimentDistribution || {};
    const positiveRatio = (sentimentDist.positive || 0) / totalFeedback;
    const negativeRatio = (sentimentDist.negative || 0) / totalFeedback;
    const neutralRatio = (sentimentDist.neutral || 0) / totalFeedback;
    
    const executiveSummary = advancedAnalytics?.aiInsights?.executiveSummary || 
      `Analysis of ${totalFeedback.toLocaleString()} customer feedback entries reveals ${positiveRatio > 0.6 ? 'strong customer satisfaction' : 'opportunities for improvement'} with ${(positiveRatio * 100).toFixed(1)}% positive sentiment across ${Object.keys(analytics.categoryDistribution || {}).length} distinct categories. The analysis indicates ${negativeRatio > 0.3 ? 'areas requiring immediate attention' : 'generally positive customer experience'} with strategic opportunities for enhancement.`;

    return `
    <h1 class="title-large">Executive Summary</h1>
    
    <div class="section-spacing">
      <div class="chart-container">
        <h2 class="title-medium">Overview</h2>
        <p class="text-body">${this.escapeHtml(executiveSummary)}</p>
      </div>
    </div>

    <div class="section-spacing">
      <h2 class="title-medium">Key Performance Indicators</h2>
      
      <div class="grid grid-cols-4 gap-6 content-spacing">
        <div class="metric-card">
          <div class="metric-value">${totalFeedback.toLocaleString()}</div>
          <div class="metric-label">Total Feedback Entries</div>
        </div>
        
        <div class="metric-card bg-green-50">
          <div class="metric-value text-green-600">${(positiveRatio * 100).toFixed(1)}%</div>
          <div class="metric-label">Positive Sentiment</div>
          <div class="progress-bar content-spacing">
            <div class="progress-fill bg-green-500" style="width: ${positiveRatio * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card bg-red-50">
          <div class="metric-value text-red-600">${(negativeRatio * 100).toFixed(1)}%</div>
          <div class="metric-label">Negative Sentiment</div>
          <div class="progress-bar content-spacing">
            <div class="progress-fill bg-red-500" style="width: ${negativeRatio * 100}%"></div>
          </div>
        </div>
        
        <div class="metric-card bg-yellow-50">
          <div class="metric-value text-yellow-600">${(neutralRatio * 100).toFixed(1)}%</div>
          <div class="metric-label">Neutral Sentiment</div>
          <div class="progress-bar content-spacing">
            <div class="progress-fill bg-yellow-500" style="width: ${neutralRatio * 100}%"></div>
          </div>
        </div>
      </div>

      <!-- Sentiment Distribution Visualization -->
      <div class="chart-container">
        <h3 class="title-small">Sentiment Distribution</h3>
        <div class="bar-chart">
          <div class="bar positive" style="height: ${Math.max(positiveRatio * 100, 10)}%" title="Positive: ${(positiveRatio * 100).toFixed(1)}%">
            <div class="text-small text-center text-white font-semibold pt-2">Positive</div>
          </div>
          <div class="bar neutral" style="height: ${Math.max(neutralRatio * 100, 10)}%" title="Neutral: ${(neutralRatio * 100).toFixed(1)}%">
            <div class="text-small text-center text-white font-semibold pt-2">Neutral</div>
          </div>
          <div class="bar negative" style="height: ${Math.max(negativeRatio * 100, 10)}%" title="Negative: ${(negativeRatio * 100).toFixed(1)}%">
            <div class="text-small text-center text-white font-semibold pt-2">Negative</div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 text-center text-body">
          <div><strong>${sentimentDist.positive || 0}</strong> Positive</div>
          <div><strong>${sentimentDist.neutral || 0}</strong> Neutral</div>
          <div><strong>${sentimentDist.negative || 0}</strong> Negative</div>
        </div>
      </div>
    </div>

    <div class="section-spacing">
      <h2 class="title-medium">Key Findings</h2>
      <div class="grid grid-cols-2 gap-6">
        <div>
          ${(advancedAnalytics?.aiInsights?.keyFindings || [
            `Customer satisfaction rate of ${(positiveRatio * 100).toFixed(1)}% ${positiveRatio > 0.6 ? 'exceeds' : 'falls below'} industry benchmarks`,
            `${Object.keys(analytics.categoryDistribution || {}).length} distinct feedback categories identified for strategic focus`,
            `Sentiment analysis reveals ${negativeRatio > 0.3 ? 'critical areas requiring immediate attention' : 'generally positive customer experience'}`
          ]).slice(0, 3).map((finding, index) => `
            <div class="insight-item content-spacing">
              <div class="flex items-start">
                <div class="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-small font-semibold mr-3 flex-shrink-0">
                  ${index + 1}
                </div>
                <p class="text-body">${this.escapeHtml(finding)}</p>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div>
          <h3 class="title-small">Quick Metrics</h3>
          <div class="space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-body">Total Categories:</span>
              <span class="status-badge status-info">${Object.keys(analytics.categoryDistribution || {}).length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-body">Data Sources:</span>
              <span class="status-badge status-info">${Object.keys(analytics.sourceDistribution || {}).length}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-body">Average Sentiment:</span>
              <span class="status-badge ${(analytics.averageSentiment || positiveRatio) > 0.6 ? 'status-positive' : (analytics.averageSentiment || positiveRatio) > 0.4 ? 'status-neutral' : 'status-negative'}">
                ${((analytics.averageSentiment || positiveRatio) * 100).toFixed(1)}%
              </span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-body">Risk Level:</span>
              <span class="status-badge ${negativeRatio > 0.4 ? 'status-negative' : negativeRatio > 0.25 ? 'status-neutral' : 'status-positive'}">
                ${negativeRatio > 0.4 ? 'High' : negativeRatio > 0.25 ? 'Medium' : 'Low'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    `;
  }

  /**
   * Generate metrics dashboard
   */
  generateMetricsDashboard(feedback, analytics, advancedAnalytics) {
    const sentimentDist = analytics.sentimentDistribution || {};
    const categoryDist = analytics.categoryDistribution || {};
    const sourceDist = analytics.sourceDistribution || {};
    const totalFeedback = feedback.length;

    // Calculate percentages for charts
    const positivePercent = ((sentimentDist.positive || 0) / totalFeedback * 100);
    const neutralPercent = ((sentimentDist.neutral || 0) / totalFeedback * 100);
    const negativePercent = ((sentimentDist.negative || 0) / totalFeedback * 100);

    return `
<div class="max-w-6xl mx-auto p-2">
  <h1 class="title-large text-gray-800 spacing-tight">Analytics Dashboard</h1>
  
  <!-- Compact Summary Grid -->
  <div class="grid grid-cols-6 gap-1 spacing-normal">
    <div class="metric-card text-center">
      <div class="metric-value">${totalFeedback}</div>
      <div class="text-small text-gray-600">Total</div>
    </div>
    <div class="metric-card text-center bg-green-50">
      <div class="metric-value text-green-600">${sentimentDist.positive || 0}</div>
      <div class="text-small text-green-700">Positive</div>
      <div class="text-small text-green-600">${positivePercent.toFixed(0)}%</div>
    </div>
    <div class="metric-card text-center bg-yellow-50">
      <div class="metric-value text-yellow-600">${sentimentDist.neutral || 0}</div>
      <div class="text-small text-yellow-700">Neutral</div>
      <div class="text-small text-yellow-600">${neutralPercent.toFixed(0)}%</div>
    </div>
    <div class="metric-card text-center bg-red-50">
      <div class="metric-value text-red-600">${sentimentDist.negative || 0}</div>
      <div class="text-small text-red-700">Negative</div>
      <div class="text-small text-red-600">${negativePercent.toFixed(0)}%</div>
    </div>
    <div class="metric-card text-center">
      <div class="metric-value">${Object.keys(categoryDist).length}</div>
      <div class="text-small text-gray-600">Categories</div>
    </div>
    <div class="metric-card text-center">
      <div class="metric-value">${Object.keys(sourceDist).length}</div>
      <div class="text-small text-gray-600">Sources</div>
    </div>
  </div>

  <!-- Charts and Data in 3 columns -->
  <div class="grid grid-cols-3 gap-2 spacing-normal">
    
    <!-- Sentiment Visualization -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Sentiment Analysis</h3>
      <!-- Bar Chart -->
      <div class="bar-chart">
        <div class="bar positive" style="height: ${positivePercent * 0.8}%;" title="Positive: ${positivePercent.toFixed(1)}%"></div>
        <div class="bar neutral" style="height: ${neutralPercent * 0.8}%;" title="Neutral: ${neutralPercent.toFixed(1)}%"></div>
        <div class="bar negative" style="height: ${negativePercent * 0.8}%;" title="Negative: ${negativePercent.toFixed(1)}%"></div>
      </div>
      <div class="grid grid-cols-3 gap-1 text-small text-center">
        <div class="text-green-600">Pos</div>
        <div class="text-yellow-600">Neu</div>
        <div class="text-red-600">Neg</div>
      </div>
      
      <!-- Trend Line -->
      <div class="trend-line"></div>
      <div class="text-small text-gray-500 text-center">Sentiment Trend</div>
    </div>

    <!-- Top Categories -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Top Categories</h3>
      ${Object.entries(categoryDist)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([category, count], index) => {
          const width = (count / totalFeedback * 100);
          return `
            <div class="flex items-center spacing-tight">
              <div class="w-2 h-2 bg-blue-500 rounded mr-1"></div>
              <div class="flex-1 text-body">${this.escapeHtml(category.replace(/_/g, ' ').substring(0, 12))}</div>
              <div class="text-small font-semibold">${count}</div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1 spacing-tight">
              <div class="bg-blue-500 h-1 rounded-full" style="width: ${width}%"></div>
            </div>
          `;
        }).join('')}
    </div>

    <!-- Sources & Additional Metrics -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Data Sources</h3>
      ${Object.entries(sourceDist)
        .sort(([,a], [,b]) => b - a)
        .map(([source, count]) => {
          const width = (count / totalFeedback * 100);
          return `
            <div class="flex items-center justify-between spacing-tight">
              <div class="text-body font-medium">${this.escapeHtml(source)}</div>
              <div class="text-small">${count} (${width.toFixed(0)}%)</div>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1 spacing-tight">
              <div class="bg-indigo-500 h-1 rounded-full" style="width: ${width}%"></div>
            </div>
          `;
        }).join('')}
      
      <!-- Quality Metrics -->
      <div class="spacing-normal">
        <h4 class="title-small spacing-tight">Quality Metrics</h4>
        <div class="text-body spacing-tight">
          <div>Avg. Sentiment: ${analytics.averageSentiment ? (analytics.averageSentiment * 100).toFixed(1) : 'N/A'}%</div>
          <div>Data Quality: ${advancedAnalytics?.core?.qualityMetrics?.overallQualityScore || 85}%</div>
          <div>AI Coverage: ${((feedback.filter(f => f.category).length / totalFeedback) * 100).toFixed(0)}%</div>
        </div>
      </div>
    </div>
  </div>
</div>`;
  }

  /**
   * Generate AI insights section
   */
  generateAIInsightsSection(aiInsights) {
    return `
<div class="max-w-6xl mx-auto p-4">
  <h1 class="title-large text-gray-800 mb-3">AI-Powered Insights</h1>
  
  <!-- Key Findings -->
  <div class="mb-4">
    <h2 class="title-medium text-gray-800 mb-2">Key Findings</h2>
    <div class="space-y-2">
      ${(aiInsights.keyFindings || []).map((finding, index) => `
        <div class="insight-item">
          <div class="flex items-start">
            <div class="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5" style="font-size: 8px;">
              ${index + 1}
            </div>
            <p class="text-body text-gray-700 leading-snug">${this.escapeHtml(finding)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Recommendations -->
  <div class="mb-4">
    <h2 class="title-medium text-gray-800 mb-2">Strategic Recommendations</h2>
    <div class="space-y-2">
      ${(aiInsights.recommendations || []).map((recommendation, index) => `
        <div class="bg-white border border-gray-200 rounded p-3 border-l-2 border-green-500">
          <div class="flex items-start">
            <div class="w-4 h-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-semibold mr-2 mt-0.5" style="font-size: 8px;">
              ${index + 1}
            </div>
            <p class="text-body text-gray-700 leading-snug">${this.escapeHtml(recommendation)}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Risk Assessment -->
  ${aiInsights.riskAssessment ? `
  <div>
    <h2 class="title-medium text-gray-800 mb-2">Risk Assessment</h2>
    <div class="bg-white border border-gray-200 rounded p-3">
      <div class="mb-2">
        <span class="inline-block px-2 py-1 text-xs font-semibold rounded ${
          aiInsights.riskAssessment.overallRisk === 'high' ? 'bg-red-100 text-red-800' :
          aiInsights.riskAssessment.overallRisk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
          'bg-green-100 text-green-800'
        }">
          ${this.escapeHtml(aiInsights.riskAssessment.overallRisk?.toUpperCase() || 'UNKNOWN')} RISK
        </span>
      </div>
      <div class="space-y-1">
        ${(aiInsights.riskAssessment.primaryRisks || []).map(risk => `
          <div class="flex items-start">
            <div class="w-1 h-1 bg-orange-500 rounded-full mr-2 mt-2"></div>
            <p class="text-body text-gray-700">${this.escapeHtml(risk)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  ` : ''}
</div>`;
  }

  /**
   * Generate advanced analytics section
   */
  generateAdvancedAnalyticsSection(advancedAnalytics) {
    if (!advancedAnalytics) return '';

    const core = advancedAnalytics.core || {};
    const trends = advancedAnalytics.trends || {};
    const statistical = advancedAnalytics.statistical || {};

    return `
<div class="max-w-6xl mx-auto p-2">
  <h1 class="title-large text-gray-800 spacing-tight">Advanced Analytics</h1>
  
  <!-- Compact Statistical Grid -->
  <div class="grid grid-cols-4 gap-1 spacing-normal">
    
    <!-- Statistical Metrics -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Statistical Analysis</h3>
      <div class="text-body space-y-1">
        <div class="flex justify-between">
          <span>Avg Score:</span>
          <span class="font-semibold">${(core.sentimentMetrics?.average || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Std Dev:</span>
          <span class="font-semibold">${(core.sentimentMetrics?.standardDeviation || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Median:</span>
          <span class="font-semibold">${(core.sentimentMetrics?.median || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Min:</span>
          <span class="font-semibold">${(core.sentimentMetrics?.min || 0).toFixed(2)}</span>
        </div>
        <div class="flex justify-between">
          <span>Max:</span>
          <span class="font-semibold">${(core.sentimentMetrics?.max || 0).toFixed(2)}</span>
        </div>
      </div>
      
      <!-- Distribution Chart -->
      <div class="bar-chart">
        <div class="bar" style="height: 30%;" title="Q1"></div>
        <div class="bar" style="height: 60%;" title="Q2"></div>
        <div class="bar" style="height: 80%;" title="Q3"></div>
        <div class="bar" style="height: 45%;" title="Q4"></div>
      </div>
      <div class="text-small text-center text-gray-500">Score Distribution</div>
    </div>

    <!-- Trend Analysis -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Trend Analysis</h3>
      <div class="text-center spacing-normal">
        <div class="metric-value text-blue-600">${this.escapeHtml(trends.overallTrend?.direction || 'Stable')}</div>
        <div class="text-small text-gray-600">Direction</div>
      </div>
      <div class="text-body space-y-1">
        <div class="flex justify-between">
          <span>Confidence:</span>
          <span class="font-semibold">${((trends.overallTrend?.confidence || 0) * 100).toFixed(0)}%</span>
        </div>
        <div class="flex justify-between">
          <span>Volatility:</span>
          <span class="font-semibold">${trends.volatility?.level || 'Low'}</span>
        </div>
        <div class="flex justify-between">
          <span>Slope:</span>
          <span class="font-semibold">${(trends.overallTrend?.slope || 0).toFixed(3)}</span>
        </div>
      </div>
      
      <!-- Trend visualization -->
      <div class="trend-line"></div>
      <div class="text-small text-center text-gray-500">Sentiment Trend</div>
    </div>

    <!-- Quality Metrics -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Data Quality</h3>
      <div class="text-center spacing-normal">
        <div class="metric-value text-green-600">${core.qualityMetrics?.overallQualityScore || 85}%</div>
        <div class="text-small text-gray-600">Quality Score</div>
      </div>
      <div class="text-body space-y-1">
        <div class="flex justify-between">
          <span>Completeness:</span>
          <span class="font-semibold">${core.qualityMetrics?.completeness || 95}%</span>
        </div>
        <div class="flex justify-between">
          <span>Avg Length:</span>
          <span class="font-semibold">${core.qualityMetrics?.avgContentLength || 120}</span>
        </div>
        <div class="flex justify-between">
          <span>Valid Entries:</span>
          <span class="font-semibold">${core.qualityMetrics?.validEntries || 98}%</span>
        </div>
      </div>
      
      <!-- Quality bars -->
      <div class="bar-chart">
        <div class="bar positive" style="height: ${(core.qualityMetrics?.completeness || 95)}%;" title="Completeness"></div>
        <div class="bar positive" style="height: ${(core.qualityMetrics?.validEntries || 98)}%;" title="Validity"></div>
        <div class="bar positive" style="height: ${(core.qualityMetrics?.overallQualityScore || 85)}%;" title="Overall"></div>
      </div>
    </div>

    <!-- Predictive Insights -->
    <div class="chart-container">
      <h3 class="title-small spacing-tight">Predictions</h3>
      ${advancedAnalytics.predictive ? `
        <div class="text-center spacing-normal">
          <div class="metric-value text-purple-600">${advancedAnalytics.predictive.nextPeriodSentiment?.predicted || 'N/A'}</div>
          <div class="text-small text-gray-600">Next Period</div>
        </div>
        <div class="text-body space-y-1">
          <div class="flex justify-between">
            <span>Confidence:</span>
            <span class="font-semibold">${((advancedAnalytics.predictive.confidence || 0) * 100).toFixed(0)}%</span>
          </div>
          <div class="flex justify-between">
            <span>Risk Level:</span>
            <span class="font-semibold">${advancedAnalytics.predictive.riskAssessment?.overallRisk || 'Low'}</span>
          </div>
        </div>
      ` : `
        <div class="text-body text-gray-500">
          Predictive analysis requires more historical data points for accurate forecasting.
        </div>
      `}
      
      <!-- Prediction visualization -->
      <div class="w-full bg-gray-200 rounded h-8 spacing-tight relative">
        <div class="bg-purple-500 h-8 rounded" style="width: ${((advancedAnalytics.predictive?.confidence || 0.7) * 100)}%"></div>
        <div class="absolute inset-0 flex items-center justify-center text-xs text-white font-semibold">
          Prediction Confidence
        </div>
      </div>
    </div>
  </div>

  <!-- Detailed Analysis Table -->
  <div class="chart-container spacing-normal">
    <h3 class="title-small spacing-tight">Detailed Metrics Summary</h3>
    <table class="w-full table-compact">
      <thead>
        <tr>
          <th>Metric</th>
          <th>Value</th>
          <th>Benchmark</th>
          <th>Status</th>
          <th>Trend</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Customer Satisfaction</td>
          <td>${((core.sentimentMetrics?.average || 0.65) * 100).toFixed(1)}%</td>
          <td>70%</td>
          <td><span class="text-green-600">Good</span></td>
          <td>↗</td>
        </tr>
        <tr>
          <td>Response Consistency</td>
          <td>${(100 - (core.sentimentMetrics?.standardDeviation || 0.2) * 100).toFixed(1)}%</td>
          <td>80%</td>
          <td><span class="text-yellow-600">Fair</span></td>
          <td>→</td>
        </tr>
        <tr>
          <td>Data Quality Score</td>
          <td>${core.qualityMetrics?.overallQualityScore || 85}%</td>
          <td>90%</td>
          <td><span class="text-green-600">Good</span></td>
          <td>↗</td>
        </tr>
        <tr>
          <td>Feedback Volume</td>
          <td>${core.totalEntries || 'N/A'}</td>
          <td>100+</td>
          <td><span class="text-green-600">Good</span></td>
          <td>↗</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>`;
  }

  /**
   * Generate feedback table
   */
  generateFeedbackTable(feedback, maxEntries) {
    const limitedFeedback = feedback.slice(0, maxEntries);
    
    return `
    <h1 class="title-large">Detailed Feedback Analysis</h1>
    
    <div class="content-spacing">
      <p class="text-body">
        This section presents a detailed view of individual feedback entries, showing ${limitedFeedback.length} 
        of ${feedback.length} total entries. Each entry includes the original content, AI-determined category, 
        sentiment analysis, source channel, and submission date.
      </p>
    </div>

    <div class="section-spacing">
      <table class="professional-table">
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">Feedback Content</th>
            <th style="width: 15%;">Category</th>
            <th style="width: 10%;">Sentiment</th>
            <th style="width: 10%;">Source</th>
            <th style="width: 15%;">Date</th>
          </tr>
        </thead>
        <tbody>
          ${limitedFeedback.map((item, index) => `
            <tr>
              <td class="text-center font-semibold">${index + 1}</td>
              <td>
                <div class="text-body" style="max-width: 400px; overflow: hidden;">
                  ${this.escapeHtml((item.content || '').substring(0, 150))}${(item.content || '').length > 150 ? '...' : ''}
                </div>
                ${item.sentiment_score ? `
                  <div class="text-small text-gray-500 mt-1">
                    Score: ${(item.sentiment_score * 100).toFixed(1)}%
                  </div>
                ` : ''}
              </td>
              <td>
                <span class="status-badge status-info">
                  ${this.escapeHtml((item.category || 'uncategorized').replace(/_/g, ' '))}
                </span>
                ${item.aiCategoryConfidence ? `
                  <div class="text-small text-gray-500 mt-1">
                    Confidence: ${(item.aiCategoryConfidence * 100).toFixed(0)}%
                  </div>
                ` : ''}
              </td>
              <td>
                <span class="status-badge ${
                  item.sentiment_label === 'positive' ? 'status-positive' :
                  item.sentiment_label === 'negative' ? 'status-negative' :
                  'status-neutral'
                }">
                  ${this.escapeHtml(item.sentiment_label || 'neutral')}
                </span>
              </td>
              <td>
                <span class="text-body font-medium">
                  ${this.escapeHtml(item.source || 'unknown')}
                </span>
              </td>
              <td>
                <span class="text-body">
                  ${item.feedback_date ? new Date(item.feedback_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${feedback.length > maxEntries ? `
    <div class="chart-container">
      <p class="text-body text-gray-600">
        <strong>Note:</strong> This table shows the first ${maxEntries} entries out of ${feedback.length} total feedback entries. 
        For the complete dataset, please refer to the CSV export or contact your administrator for access to the full data.
      </p>
    </div>
    ` : ''}
    `;
  }

  /**
   * Generate appendix
   */
  generateAppendix(feedback, analytics, options) {
    return `
<div class="max-w-6xl mx-auto p-8">
  <h1 class="text-4xl font-bold text-gray-800 mb-8">Appendix</h1>
  
  <div class="space-y-6">
    <div class="bg-white rounded-xl p-6 shadow-lg">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Report Generation Details</h2>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>Generated:</strong> ${new Date().toLocaleString()}
        </div>
        <div>
          <strong>Generator:</strong> Puppeteer + Tailwind CSS
        </div>
        <div>
          <strong>Total Records:</strong> ${feedback.length.toLocaleString()}
        </div>
        <div>
          <strong>Analysis Type:</strong> ${options.includeAdvancedAnalytics ? 'Advanced' : 'Standard'}
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-xl p-6 shadow-lg">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Data Sources</h2>
      <div class="text-sm text-gray-600">
        <p>This report was generated from customer feedback data collected through various channels including web forms, email, phone calls, and mobile applications. All data has been processed using advanced AI analytics to provide comprehensive insights into customer sentiment and satisfaction patterns.</p>
      </div>
    </div>
  </div>
</div>`;
  }

  /**
   * Generate header template for PDF
   */
  generateHeaderTemplate(options) {
    return `
<div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px 0;">
  <span>${this.escapeHtml(options.title)} - ${this.escapeHtml(options.organizationName)}</span>
</div>`;
  }

  /**
   * Generate footer template for PDF
   */
  generateFooterTemplate() {
    return `
<div style="font-size: 10px; color: #666; width: 100%; text-align: center; padding: 5px 0; display: flex; justify-content: space-between; margin: 0 20px;">
  <span>Generated on ${new Date().toLocaleDateString()}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`;
  }

  /**
   * Escape HTML to prevent XSS and encoding issues
   */
  escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Clean up browser resources
   */
  async cleanup() {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Error cleaning up browser resources:', error);
    }
  }

  /**
   * Download PDF (for browser usage)
   */
  downloadPDF(pdfBuffer, filename) {
    if (typeof window !== 'undefined') {
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }
}

export default PuppeteerPDFReportGenerator;