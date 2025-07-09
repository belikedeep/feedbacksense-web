import Papa from 'papaparse'
import { format } from 'date-fns'
import { AdvancedAnalyticsEngine } from '../analytics/AdvancedAnalyticsEngine.js'

export class CSVExporter {
  static generateCSV(feedback, options = {}) {
    const {
      includeFields = ['all'],
      dateFormat = 'yyyy-MM-dd',
      includeHeaders = true,
      customFields = []
    } = options

    // Define available fields
    const availableFields = {
      id: 'ID',
      content: 'Feedback Content',
      category: 'Category',
      source: 'Source',
      sentimentLabel: 'Sentiment',
      sentimentScore: 'Sentiment Score',
      feedbackDate: 'Feedback Date',
      createdAt: 'Created Date',
      topics: 'Topics',
      aiCategoryConfidence: 'AI Confidence',
      manualOverride: 'Manual Override'
    }

    // Determine which fields to include
    let fieldsToInclude
    if (includeFields.includes('all')) {
      fieldsToInclude = Object.keys(availableFields)
    } else {
      fieldsToInclude = includeFields.filter(field => availableFields[field])
    }

    // Add custom fields
    if (customFields.length > 0) {
      customFields.forEach(field => {
        if (!fieldsToInclude.includes(field.key)) {
          fieldsToInclude.push(field.key)
          availableFields[field.key] = field.label
        }
      })
    }

    // Format data for CSV
    const csvData = feedback.map(item => {
      const row = {}
      
      fieldsToInclude.forEach(field => {
        switch (field) {
          case 'id':
            row[availableFields[field]] = item.id
            break
          case 'content':
            row[availableFields[field]] = item.content || ''
            break
          case 'category':
            row[availableFields[field]] = item.category || ''
            break
          case 'source':
            row[availableFields[field]] = item.source || ''
            break
          case 'sentimentLabel':
            row[availableFields[field]] = item.sentimentLabel || item.sentiment_label || ''
            break
          case 'sentimentScore':
            const score = item.sentimentScore || item.sentiment_score || 0
            row[availableFields[field]] = typeof score === 'number' ?
              (score * 100).toFixed(1) + '%' : score
            break
          case 'feedbackDate':
            const feedbackDate = item.feedbackDate || item.feedback_date
            row[availableFields[field]] = feedbackDate ?
              format(new Date(feedbackDate), dateFormat) : ''
            break
          case 'createdAt':
            const createdAt = item.createdAt || item.created_at
            row[availableFields[field]] = createdAt ?
              format(new Date(createdAt), dateFormat + ' HH:mm:ss') : ''
            break
          case 'topics':
            row[availableFields[field]] = Array.isArray(item.topics) ?
              item.topics.join(', ') : (item.topics || '')
            break
          case 'aiCategoryConfidence':
            const confidence = item.aiCategoryConfidence
            row[availableFields[field]] = confidence !== null && confidence !== undefined ?
              (confidence * 100).toFixed(1) + '%' : ''
            break
          case 'manualOverride':
            row[availableFields[field]] = item.manualOverride ? 'Yes' : 'No'
            break
          default:
            // Handle custom fields
            row[availableFields[field] || field] = item[field] || ''
        }
      })
      
      return row
    })

    // Generate CSV string
    const csv = Papa.unparse(csvData, {
      header: includeHeaders,
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      newline: '\r\n'
    })

    return csv
  }

  static downloadCSV(csvData, filename = 'feedback_export.csv') {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
  }

  static async generateSummaryCSV(feedback, analytics, options = {}) {
    const {
      includeAdvancedAnalytics = true,
      analysisDepth = 'standard'
    } = options

    // Generate basic summary data with safe property access
    const sentimentDist = analytics.sentimentDistribution || {}
    const summaryData = [
      { Metric: 'Total Feedback', Value: feedback.length },
      { Metric: 'Positive Feedback', Value: sentimentDist.positive || 0 },
      { Metric: 'Negative Feedback', Value: sentimentDist.negative || 0 },
      { Metric: 'Neutral Feedback', Value: sentimentDist.neutral || 0 },
      { Metric: 'Average Sentiment Score', Value: `${((analytics.averageSentiment || 0) * 100).toFixed(1)}%` },
      { Metric: 'Date Range', Value: this.getDateRange(feedback) },
      { Metric: 'Most Common Category', Value: this.getMostCommonValue(feedback, 'category') },
      { Metric: 'Most Common Source', Value: this.getMostCommonValue(feedback, 'source') }
    ]

    // Add advanced analytics if enabled
    if (includeAdvancedAnalytics && feedback.length > 0) {
      try {
        const advancedEngine = new AdvancedAnalyticsEngine({ analysisDepth })
        const advancedAnalytics = await advancedEngine.generateComprehensiveAnalytics(feedback)
        
        // Add statistical metrics
        if (advancedAnalytics.statistical && advancedAnalytics.statistical.descriptiveStatistics) {
          const sentimentStats = advancedAnalytics.statistical.descriptiveStatistics.sentiment
          if (sentimentStats && sentimentStats.count > 0) {
            summaryData.push(
              { Metric: 'Sentiment Std Deviation', Value: sentimentStats.standardDeviation.toFixed(3) },
              { Metric: 'Sentiment Median', Value: sentimentStats.median.toFixed(3) },
              { Metric: 'Sentiment Skewness', Value: sentimentStats.skewness.toFixed(3) }
            )
          }
        }

        // Add trend metrics
        if (advancedAnalytics.trends && advancedAnalytics.trends.overallTrend) {
          const trend = advancedAnalytics.trends.overallTrend
          summaryData.push(
            { Metric: 'Trend Direction', Value: trend.direction },
            { Metric: 'Trend Strength', Value: trend.strength.toFixed(3) },
            { Metric: 'Trend Confidence', Value: `${(trend.confidence * 100).toFixed(1)}%` }
          )
        }

        // Add AI insights summary
        if (advancedAnalytics.aiInsights && advancedAnalytics.aiInsights.confidenceScore > 0) {
          summaryData.push(
            { Metric: 'AI Insights Available', Value: 'Yes' },
            { Metric: 'AI Confidence Score', Value: `${(advancedAnalytics.aiInsights.confidenceScore * 100).toFixed(1)}%` }
          )
        }

        // Add business intelligence KPIs
        if (advancedAnalytics.businessIntelligence && advancedAnalytics.businessIntelligence.kpis) {
          const kpis = advancedAnalytics.businessIntelligence.kpis
          summaryData.push(
            { Metric: 'Customer Satisfaction Score', Value: `${kpis.customerSatisfactionScore}%` },
            { Metric: 'Quality Score', Value: kpis.qualityScore },
            { Metric: 'Feedback Velocity (per day)', Value: kpis.feedbackVelocity }
          )
        }

      } catch (error) {
        console.error('Error generating advanced analytics for CSV:', error)
        summaryData.push({ Metric: 'Advanced Analytics', Value: 'Generation Failed' })
      }
    }

    return Papa.unparse(summaryData, {
      header: true,
      quotes: true
    })
  }

  static getDateRange(feedback) {
    if (feedback.length === 0) return 'No data'
    
    const dates = feedback
      .map(f => new Date(f.feedbackDate || f.feedback_date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b)
    
    if (dates.length === 0) return 'No valid dates'
    
    const earliest = format(dates[0], 'yyyy-MM-dd')
    const latest = format(dates[dates.length - 1], 'yyyy-MM-dd')
    
    return earliest === latest ? earliest : `${earliest} to ${latest}`
  }

  static getMostCommonValue(feedback, field) {
    const counts = {}
    feedback.forEach(item => {
      const value = item[field]
      if (value) {
        counts[value] = (counts[value] || 0) + 1
      }
    })
    
    const entries = Object.entries(counts)
    if (entries.length === 0) return 'N/A'
    
    const mostCommon = entries.reduce((a, b) => a[1] > b[1] ? a : b)
    return `${mostCommon[0]} (${mostCommon[1]})`
  }

  static async exportWithAnalytics(feedback, analytics, options = {}) {
    const {
      includeRawData = true,
      includeSummary = true,
      includeAdvancedAnalytics = true,
      includeStatisticalAnalysis = false,
      includeTrendAnalysis = false,
      includePredictiveInsights = false,
      separateFiles = false,
      analysisDepth = 'standard'
    } = options

    if (separateFiles) {
      // Export as separate files
      if (includeRawData) {
        const rawCSV = this.generateCSV(feedback, options)
        this.downloadCSV(rawCSV, 'feedback_raw_data.csv')
      }
      
      if (includeSummary) {
        const summaryCSV = await this.generateSummaryCSV(feedback, analytics, {
          includeAdvancedAnalytics,
          analysisDepth
        })
        this.downloadCSV(summaryCSV, 'feedback_summary.csv')
      }

      // Export advanced analytics sections if requested
      if (includeAdvancedAnalytics && feedback.length > 0) {
        await this.exportAdvancedAnalyticsSections(feedback, options)
      }
    } else {
      // Export as single file with multiple sheets (as separate sections)
      let combinedCSV = ''
      
      if (includeSummary) {
        combinedCSV += '# FEEDBACK SUMMARY\n'
        combinedCSV += await this.generateSummaryCSV(feedback, analytics, {
          includeAdvancedAnalytics,
          analysisDepth
        })
        combinedCSV += '\n\n'
      }

      // Add advanced analytics sections
      if (includeAdvancedAnalytics && feedback.length > 0) {
        const advancedSections = await this.generateAdvancedAnalyticsSections(feedback, options)
        combinedCSV += advancedSections
      }
      
      if (includeRawData) {
        combinedCSV += '# RAW FEEDBACK DATA\n'
        combinedCSV += this.generateCSV(feedback, options)
      }
      
      this.downloadCSV(combinedCSV, 'feedback_complete_export.csv')
    }
  }

  /**
   * Generate advanced analytics sections for CSV export
   * @param {Array} feedback - Feedback data
   * @param {Object} options - Export options
   * @returns {string} CSV sections
   */
  static async generateAdvancedAnalyticsSections(feedback, options = {}) {
    const {
      includeStatisticalAnalysis = false,
      includeTrendAnalysis = false,
      includePredictiveInsights = false,
      analysisDepth = 'standard'
    } = options

    let sections = ''

    try {
      const advancedEngine = new AdvancedAnalyticsEngine({ analysisDepth })
      const advancedAnalytics = await advancedEngine.generateComprehensiveAnalytics(feedback)

      // Statistical Analysis Section
      if (includeStatisticalAnalysis && advancedAnalytics.statistical) {
        sections += '# STATISTICAL ANALYSIS\n'
        sections += await this.generateStatisticalAnalysisCSV(advancedAnalytics.statistical)
        sections += '\n\n'
      }

      // Trend Analysis Section
      if (includeTrendAnalysis && advancedAnalytics.trends) {
        sections += '# TREND ANALYSIS\n'
        sections += await this.generateTrendAnalysisCSV(advancedAnalytics.trends)
        sections += '\n\n'
      }

      // Predictive Insights Section
      if (includePredictiveInsights && advancedAnalytics.predictive) {
        sections += '# PREDICTIVE INSIGHTS\n'
        sections += await this.generatePredictiveInsightsCSV(advancedAnalytics.predictive)
        sections += '\n\n'
      }

      // Business Intelligence Section
      if (advancedAnalytics.businessIntelligence) {
        sections += '# BUSINESS INTELLIGENCE\n'
        sections += await this.generateBusinessIntelligenceCSV(advancedAnalytics.businessIntelligence)
        sections += '\n\n'
      }

    } catch (error) {
      console.error('Error generating advanced analytics sections:', error)
      sections += '# ADVANCED ANALYTICS\n'
      sections += 'Error,Details\n'
      sections += `"Generation Failed","${error.message}"\n\n`
    }

    return sections
  }

  /**
   * Export advanced analytics as separate files
   * @param {Array} feedback - Feedback data
   * @param {Object} options - Export options
   */
  static async exportAdvancedAnalyticsSections(feedback, options = {}) {
    const {
      includeStatisticalAnalysis = false,
      includeTrendAnalysis = false,
      includePredictiveInsights = false,
      analysisDepth = 'standard'
    } = options

    try {
      const advancedEngine = new AdvancedAnalyticsEngine({ analysisDepth })
      const advancedAnalytics = await advancedEngine.generateComprehensiveAnalytics(feedback)

      if (includeStatisticalAnalysis && advancedAnalytics.statistical) {
        const statsCSV = await this.generateStatisticalAnalysisCSV(advancedAnalytics.statistical)
        this.downloadCSV(statsCSV, 'feedback_statistical_analysis.csv')
      }

      if (includeTrendAnalysis && advancedAnalytics.trends) {
        const trendsCSV = await this.generateTrendAnalysisCSV(advancedAnalytics.trends)
        this.downloadCSV(trendsCSV, 'feedback_trend_analysis.csv')
      }

      if (includePredictiveInsights && advancedAnalytics.predictive) {
        const predictiveCSV = await this.generatePredictiveInsightsCSV(advancedAnalytics.predictive)
        this.downloadCSV(predictiveCSV, 'feedback_predictive_insights.csv')
      }

      if (advancedAnalytics.businessIntelligence) {
        const biCSV = await this.generateBusinessIntelligenceCSV(advancedAnalytics.businessIntelligence)
        this.downloadCSV(biCSV, 'feedback_business_intelligence.csv')
      }

    } catch (error) {
      console.error('Error exporting advanced analytics sections:', error)
    }
  }

  /**
   * Generate statistical analysis CSV
   * @param {Object} statisticalAnalysis - Statistical analysis results
   * @returns {string} CSV content
   */
  static async generateStatisticalAnalysisCSV(statisticalAnalysis) {
    const data = []

    // Descriptive statistics
    if (statisticalAnalysis.descriptiveStatistics) {
      const sentimentStats = statisticalAnalysis.descriptiveStatistics.sentiment
      if (sentimentStats && sentimentStats.count > 0) {
        data.push(
          { Category: 'Sentiment Statistics', Metric: 'Count', Value: sentimentStats.count },
          { Category: 'Sentiment Statistics', Metric: 'Mean', Value: sentimentStats.mean.toFixed(4) },
          { Category: 'Sentiment Statistics', Metric: 'Median', Value: sentimentStats.median.toFixed(4) },
          { Category: 'Sentiment Statistics', Metric: 'Standard Deviation', Value: sentimentStats.standardDeviation.toFixed(4) },
          { Category: 'Sentiment Statistics', Metric: 'Skewness', Value: sentimentStats.skewness.toFixed(4) },
          { Category: 'Sentiment Statistics', Metric: 'Kurtosis', Value: sentimentStats.kurtosis.toFixed(4) }
        )

        // Add percentiles
        if (sentimentStats.percentiles) {
          Object.keys(sentimentStats.percentiles).forEach(percentile => {
            data.push({
              Category: 'Sentiment Percentiles',
              Metric: percentile.toUpperCase(),
              Value: sentimentStats.percentiles[percentile].toFixed(4)
            })
          })
        }
      }
    }

    // Distribution analysis
    if (statisticalAnalysis.distributions) {
      data.push({
        Category: 'Distribution Analysis',
        Metric: 'Sentiment Distribution Type',
        Value: statisticalAnalysis.distributions.sentiment?.distributionType || 'Unknown'
      })
    }

    // Correlation analysis
    if (statisticalAnalysis.correlations && statisticalAnalysis.correlations.significantCorrelations) {
      Object.keys(statisticalAnalysis.correlations.significantCorrelations).forEach(correlation => {
        const corr = statisticalAnalysis.correlations.significantCorrelations[correlation]
        data.push({
          Category: 'Correlations',
          Metric: correlation.replace(/_vs_/g, ' vs '),
          Value: `${corr.coefficient.toFixed(3)} (${corr.strength})`
        })
      })
    }

    return Papa.unparse(data, { header: true, quotes: true })
  }

  /**
   * Generate trend analysis CSV
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {string} CSV content
   */
  static async generateTrendAnalysisCSV(trendAnalysis) {
    const data = []

    // Overall trend
    if (trendAnalysis.overallTrend) {
      const trend = trendAnalysis.overallTrend
      data.push(
        { Category: 'Overall Trend', Metric: 'Direction', Value: trend.direction },
        { Category: 'Overall Trend', Metric: 'Strength', Value: trend.strength.toFixed(3) },
        { Category: 'Overall Trend', Metric: 'Confidence', Value: `${(trend.confidence * 100).toFixed(1)}%` }
      )
    }

    // Growth rates
    if (trendAnalysis.growthRates) {
      const rates = trendAnalysis.growthRates
      data.push(
        { Category: 'Growth Rates', Metric: 'Daily Growth Rate', Value: `${rates.daily.toFixed(2)}%` },
        { Category: 'Growth Rates', Metric: 'Weekly Growth Rate', Value: `${rates.weekly.toFixed(2)}%` },
        { Category: 'Growth Rates', Metric: 'Monthly Growth Rate', Value: `${rates.monthly.toFixed(2)}%` }
      )
    }

    // Volatility
    if (trendAnalysis.volatility) {
      const vol = trendAnalysis.volatility
      data.push(
        { Category: 'Volatility', Metric: 'Coefficient of Variation', Value: vol.coefficient.toFixed(3) },
        { Category: 'Volatility', Metric: 'Standard Deviation', Value: vol.standardDeviation.toFixed(2) },
        { Category: 'Volatility', Metric: 'Interpretation', Value: vol.interpretation }
      )
    }

    // Seasonality
    if (trendAnalysis.seasonality && trendAnalysis.seasonality.detected) {
      data.push(
        { Category: 'Seasonality', Metric: 'Detected', Value: 'Yes' },
        { Category: 'Seasonality', Metric: 'Strength', Value: trendAnalysis.seasonality.strength.toFixed(3) }
      )
    }

    // Anomalies
    if (trendAnalysis.anomalies && trendAnalysis.anomalies.detected) {
      data.push(
        { Category: 'Anomalies', Metric: 'Count', Value: trendAnalysis.anomalies.count },
        { Category: 'Anomalies', Metric: 'Threshold', Value: trendAnalysis.anomalies.threshold.toFixed(2) }
      )
    }

    return Papa.unparse(data, { header: true, quotes: true })
  }

  /**
   * Generate predictive insights CSV
   * @param {Object} predictiveInsights - Predictive insights results
   * @returns {string} CSV content
   */
  static async generatePredictiveInsightsCSV(predictiveInsights) {
    const data = []

    // Volume forecasts
    if (predictiveInsights.volumeForecasts && predictiveInsights.volumeForecasts.recommended) {
      const forecast = predictiveInsights.volumeForecasts.recommended
      data.push(
        { Category: 'Volume Forecast', Metric: 'Method', Value: forecast.name },
        { Category: 'Volume Forecast', Metric: 'Confidence', Value: `${(forecast.forecast.confidence * 100).toFixed(1)}%` }
      )
    }

    // Sentiment forecasts
    if (predictiveInsights.sentimentForecasts && predictiveInsights.sentimentForecasts.available) {
      const sentimentForecast = predictiveInsights.sentimentForecasts.overall
      if (sentimentForecast && sentimentForecast.forecasts) {
        sentimentForecast.forecasts.forEach(forecast => {
          data.push({
            Category: 'Sentiment Forecast',
            Metric: `${forecast.period} Prediction`,
            Value: `${forecast.predicted.toFixed(3)} (${forecast.confidence}% confidence)`
          })
        })
      }
    }

    // Risk assessment
    if (predictiveInsights.riskAssessment) {
      const risk = predictiveInsights.riskAssessment.overallRisk
      data.push(
        { Category: 'Risk Assessment', Metric: 'Overall Risk Level', Value: risk.level },
        { Category: 'Risk Assessment', Metric: 'Risk Score', Value: risk.score.toFixed(3) },
        { Category: 'Risk Assessment', Metric: 'Confidence', Value: `${(risk.confidence * 100).toFixed(1)}%` }
      )
    }

    // Key predictions
    if (predictiveInsights.keyPredictions && predictiveInsights.keyPredictions.predictions) {
      predictiveInsights.keyPredictions.predictions.slice(0, 5).forEach((prediction, index) => {
        data.push({
          Category: 'Key Predictions',
          Metric: `Prediction ${index + 1}`,
          Value: `${prediction.prediction} (${(prediction.confidence * 100).toFixed(1)}% confidence)`
        })
      })
    }

    return Papa.unparse(data, { header: true, quotes: true })
  }

  /**
   * Generate business intelligence CSV
   * @param {Object} businessIntelligence - Business intelligence results
   * @returns {string} CSV content
   */
  static async generateBusinessIntelligenceCSV(businessIntelligence) {
    const data = []

    // KPIs
    if (businessIntelligence.kpis) {
      const kpis = businessIntelligence.kpis
      Object.keys(kpis).forEach(kpi => {
        data.push({
          Category: 'Key Performance Indicators',
          Metric: kpi.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          Value: kpis[kpi]
        })
      })
    }

    // Risk factors
    if (businessIntelligence.riskFactors && businessIntelligence.riskFactors.length > 0) {
      businessIntelligence.riskFactors.slice(0, 5).forEach((risk, index) => {
        data.push({
          Category: 'Risk Factors',
          Metric: `Risk ${index + 1}`,
          Value: risk
        })
      })
    }

    // Opportunities
    if (businessIntelligence.opportunities && businessIntelligence.opportunities.length > 0) {
      businessIntelligence.opportunities.slice(0, 5).forEach((opportunity, index) => {
        data.push({
          Category: 'Opportunities',
          Metric: `Opportunity ${index + 1}`,
          Value: opportunity
        })
      })
    }

    // Action items
    if (businessIntelligence.actionItems && businessIntelligence.actionItems.length > 0) {
      businessIntelligence.actionItems.slice(0, 5).forEach((action, index) => {
        data.push({
          Category: 'Action Items',
          Metric: `Action ${index + 1}`,
          Value: `${action.action} (Priority: ${action.priority}, Timeline: ${action.timeline})`
        })
      })
    }

    return Papa.unparse(data, { header: true, quotes: true })
  }
}

export default CSVExporter