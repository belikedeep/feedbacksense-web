import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { format } from 'date-fns'

export class PDFReportGenerator {
  constructor() {
    this.doc = new jsPDF()
    this.pageWidth = this.doc.internal.pageSize.width
    this.pageHeight = this.doc.internal.pageSize.height
    this.margin = 20
    this.currentY = this.margin
  }

  // Add header to PDF
  addHeader(title, subtitle = '') {
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 15

    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, this.margin, this.currentY)
      this.currentY += 10
    }

    // Add date
    this.doc.setFontSize(10)
    this.doc.setTextColor(100)
    this.doc.text(`Generated on ${format(new Date(), 'PPP')}`, this.margin, this.currentY)
    this.currentY += 20
    this.doc.setTextColor(0)
  }

  // Add section header
  addSectionHeader(title) {
    this.checkPageBreak(30)
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(title, this.margin, this.currentY)
    this.currentY += 15
  }

  // Add key metrics summary
  addMetricsSummary(analytics) {
    this.addSectionHeader('Executive Summary')
    
    const metrics = [
      { label: 'Total Feedback Entries', value: analytics.totalFeedback },
      { label: 'Positive Feedback', value: analytics.sentimentDistribution.positive || 0 },
      { label: 'Negative Feedback', value: analytics.sentimentDistribution.negative || 0 },
      { label: 'Neutral Feedback', value: analytics.sentimentDistribution.neutral || 0 },
      { label: 'Average Sentiment Score', value: `${(analytics.averageSentiment * 100).toFixed(1)}%` }
    ]

    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    metrics.forEach(metric => {
      this.checkPageBreak(8)
      this.doc.text(`${metric.label}:`, this.margin, this.currentY)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(String(metric.value), this.margin + 100, this.currentY)
      this.doc.setFont('helvetica', 'normal')
      this.currentY += 8
    })

    this.currentY += 10
  }

  // Add chart image to PDF
  async addChartImage(chartElement, title, width = 160, height = 100) {
    try {
      this.addSectionHeader(title)
      
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = width
      const imgHeight = height

      this.checkPageBreak(imgHeight + 20)
      
      this.doc.addImage(
        imgData,
        'PNG',
        this.margin,
        this.currentY,
        imgWidth,
        imgHeight
      )

      this.currentY += imgHeight + 15
    } catch (error) {
      console.error('Error adding chart to PDF:', error)
      this.doc.setFontSize(10)
      this.doc.setTextColor(100)
      this.doc.text(`[Chart could not be generated: ${title}]`, this.margin, this.currentY)
      this.currentY += 15
      this.doc.setTextColor(0)
    }
  }

  // Add feedback table
  addFeedbackTable(feedback, maxEntries = 20) {
    this.addSectionHeader(`Recent Feedback (${Math.min(feedback.length, maxEntries)} of ${feedback.length} entries)`)
    
    const tableData = feedback.slice(0, maxEntries).map(item => ({
      date: format(new Date(item.feedbackDate || item.feedback_date), 'MM/dd/yyyy'),
      sentiment: item.sentimentLabel || item.sentiment_label || 'neutral',
      category: item.category || 'general',
      content: this.truncateText(item.content, 100)
    }))

    this.addTable(
      ['Date', 'Sentiment', 'Category', 'Feedback Content'],
      tableData.map(row => [row.date, row.sentiment, row.category, row.content])
    )
  }

  // Add insights and recommendations
  addInsights(feedback, analytics) {
    this.addSectionHeader('Key Insights & Recommendations')
    
    const insights = this.generateInsights(feedback, analytics)
    
    this.doc.setFontSize(10)
    this.doc.setFont('helvetica', 'normal')

    insights.forEach(insight => {
      this.checkPageBreak(20)
      
      // Add bullet point
      this.doc.text('•', this.margin, this.currentY)
      
      // Add insight text with word wrapping
      const lines = this.doc.splitTextToSize(insight, this.pageWidth - this.margin * 2 - 10)
      this.doc.text(lines, this.margin + 10, this.currentY)
      this.currentY += lines.length * 5 + 5
    })
  }

  // Generate insights based on data
  generateInsights(feedback, analytics) {
    const insights = []
    const total = analytics.totalFeedback
    
    if (total === 0) {
      insights.push('No feedback data available for analysis.')
      return insights
    }

    // Sentiment insights
    const positiveRatio = (analytics.sentimentDistribution.positive || 0) / total
    const negativeRatio = (analytics.sentimentDistribution.negative || 0) / total

    if (positiveRatio > 0.7) {
      insights.push('Excellent customer satisfaction with over 70% positive feedback. Continue current practices.')
    } else if (positiveRatio > 0.5) {
      insights.push('Good customer satisfaction with majority positive feedback. Look for opportunities to improve.')
    } else if (negativeRatio > 0.5) {
      insights.push('High negative feedback detected. Immediate attention required to address customer concerns.')
    }

    // Category insights
    const categoryDistribution = analytics.categoryDistribution
    const topCategory = Object.entries(categoryDistribution).reduce((a, b) => a[1] > b[1] ? a : b)
    if (topCategory) {
      insights.push(`Most feedback relates to "${topCategory[0]}" category (${topCategory[1]} entries). Focus improvement efforts here.`)
    }

    // Trend insights
    if (analytics.recentTrend && analytics.recentTrend.length > 1) {
      const recentFeedback = analytics.recentTrend.slice(-3).reduce((sum, day) => sum + day.count, 0)
      const olderFeedback = analytics.recentTrend.slice(0, 3).reduce((sum, day) => sum + day.count, 0)
      
      if (recentFeedback > olderFeedback * 1.2) {
        insights.push('Feedback volume is increasing. Ensure adequate resources for response management.')
      } else if (recentFeedback < olderFeedback * 0.8) {
        insights.push('Feedback volume is decreasing. Consider proactive outreach to gather more customer input.')
      }
    }

    // Source insights
    const sourceDistribution = analytics.sourceDistribution
    const sources = Object.keys(sourceDistribution)
    if (sources.length > 1) {
      insights.push(`Feedback is coming from ${sources.length} different sources. Ensure consistent monitoring across all channels.`)
    }

    return insights
  }

  // Add simple table
  addTable(headers, rows) {
    const colWidth = (this.pageWidth - this.margin * 2) / headers.length
    const rowHeight = 8
    
    this.checkPageBreak((rows.length + 2) * rowHeight)

    // Headers
    this.doc.setFont('helvetica', 'bold')
    this.doc.setFontSize(9)
    headers.forEach((header, i) => {
      this.doc.text(header, this.margin + i * colWidth, this.currentY)
    })
    this.currentY += rowHeight

    // Draw header line
    this.doc.line(this.margin, this.currentY - 2, this.pageWidth - this.margin, this.currentY - 2)
    this.currentY += 3

    // Rows
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(8)
    rows.forEach(row => {
      this.checkPageBreak(rowHeight + 5)
      row.forEach((cell, i) => {
        const cellText = this.doc.splitTextToSize(String(cell), colWidth - 5)
        this.doc.text(cellText, this.margin + i * colWidth, this.currentY)
      })
      this.currentY += rowHeight
    })

    this.currentY += 10
  }

  // Utility functions
  checkPageBreak(requiredSpace) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage()
      this.currentY = this.margin
    }
  }

  truncateText(text, maxLength) {
    if (!text) return ''
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  // Generate complete report
  async generateReport(feedback, analytics, options = {}) {
    const {
      title = 'Feedback Analytics Report',
      subtitle = '',
      includeCharts = true,
      includeFeedbackTable = true,
      includeInsights = true,
      maxFeedbackEntries = 20
    } = options

    // Initialize PDF
    this.currentY = this.margin

    // Add header
    this.addHeader(title, subtitle)

    // Add metrics summary
    this.addMetricsSummary(analytics)

    // Add charts if elements are provided and charts are enabled
    if (includeCharts && options.chartElements) {
      for (const chart of options.chartElements) {
        await this.addChartImage(chart.element, chart.title, chart.width, chart.height)
      }
    }

    // Add feedback table
    if (includeFeedbackTable && feedback.length > 0) {
      this.addFeedbackTable(feedback, maxFeedbackEntries)
    }

    // Add insights
    if (includeInsights) {
      this.addInsights(feedback, analytics)
    }

    return this.doc
  }

  // Download PDF
  downloadPDF(filename = 'feedback_report.pdf') {
    this.doc.save(filename)
  }

  // Get PDF as blob
  getPDFBlob() {
    return this.doc.output('blob')
  }
}

export default PDFReportGenerator