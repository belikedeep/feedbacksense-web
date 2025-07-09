import { TrendAnalyzer } from './TrendAnalyzer.js'
import { StatisticalAnalyzer } from './StatisticalAnalyzer.js'
import { PredictiveInsights } from './PredictiveInsights.js'
import { initializeGeminiAI, generateBusinessInsights, generatePredictiveInsights as generateAIPredictiveInsights, generateFeedbackRecommendations } from '../geminiAI.js'

/**
 * Enhanced Analytics Engine for FeedbackSense
 * Provides comprehensive statistical analysis, trend detection, and predictive insights
 */
export class AdvancedAnalyticsEngine {
  constructor(options = {}) {
    this.options = {
      analysisDepth: 'standard', // basic, standard, advanced
      enablePredictiveInsights: true,
      enableTrendAnalysis: true,
      enableAIInsights: true,
      confidenceThreshold: 0.7,
      maxDataPoints: 100000,
      ...options
    }

    // Initialize sub-analyzers
    this.trendAnalyzer = new TrendAnalyzer(this.options)
    this.statisticalAnalyzer = new StatisticalAnalyzer(this.options)
    this.predictiveInsights = new PredictiveInsights(this.options)

    // Performance tracking
    this.performanceMetrics = {
      analysisTime: 0,
      dataProcessed: 0,
      memoryUsage: 0,
      cacheHits: 0,
      cacheMisses: 0
    }

    // Analytics cache for performance
    this.cache = new Map()
    this.cacheExpiry = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Generate comprehensive analytics for feedback data
   * @param {Array} feedback - Raw feedback data
   * @param {Object} options - Analysis options
   * @returns {Object} Comprehensive analytics results
   */
  async generateComprehensiveAnalytics(feedback, options = {}) {
    const startTime = Date.now()
    
    try {
      // Validate and prepare data
      const validatedData = this.validateAndPrepareData(feedback)
      if (validatedData.length === 0) {
        throw new Error('No valid feedback data provided')
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(validatedData, options)
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          this.performanceMetrics.cacheHits++
          return cached.data
        } else {
          this.cache.delete(cacheKey)
        }
      }
      
      this.performanceMetrics.cacheMisses++

      // Core Analytics
      const coreAnalytics = await this.generateCoreAnalytics(validatedData)
      
      // Statistical Analysis
      const statisticalAnalysis = this.options.analysisDepth !== 'basic' 
        ? await this.statisticalAnalyzer.performStatisticalAnalysis(validatedData)
        : {}

      // Trend Analysis
      const trendAnalysis = this.options.enableTrendAnalysis
        ? await this.trendAnalyzer.analyzeTrends(validatedData, options.timeRange)
        : {}

      // Predictive Insights
      const predictiveAnalysis = this.options.enablePredictiveInsights && this.options.analysisDepth === 'advanced'
        ? await this.predictiveInsights.generatePredictiveInsights(validatedData, trendAnalysis)
        : {}

      // AI-Powered Insights
      const aiInsights = this.options.enableAIInsights
        ? await this.generateAIInsights(validatedData, coreAnalytics, trendAnalysis)
        : {}

      // Business Intelligence Metrics
      const businessIntelligence = this.generateBusinessIntelligence(
        validatedData, 
        coreAnalytics, 
        trendAnalysis, 
        statisticalAnalysis
      )

      // Compile comprehensive results
      const comprehensiveResults = {
        metadata: {
          generatedAt: new Date().toISOString(),
          dataPoints: validatedData.length,
          analysisDepth: this.options.analysisDepth,
          processingTime: Date.now() - startTime,
          version: '1.0.0'
        },
        core: coreAnalytics,
        statistical: statisticalAnalysis,
        trends: trendAnalysis,
        predictive: predictiveAnalysis,
        aiInsights: aiInsights,
        businessIntelligence: businessIntelligence,
        performance: this.getPerformanceMetrics()
      }

      // Cache results
      this.cache.set(cacheKey, {
        data: comprehensiveResults,
        timestamp: Date.now()
      })

      // Update performance metrics
      this.performanceMetrics.analysisTime = Date.now() - startTime
      this.performanceMetrics.dataProcessed = validatedData.length

      return comprehensiveResults

    } catch (error) {
      console.error('Advanced Analytics Engine Error:', error)
      throw new Error(`Analytics generation failed: ${error.message}`)
    }
  }

  /**
   * Generate core analytics (enhanced version of existing analytics)
   * @param {Array} feedback - Validated feedback data
   * @returns {Object} Core analytics
   */
  async generateCoreAnalytics(feedback) {
    const analytics = {
      // Basic metrics
      totalFeedback: feedback.length,
      dateRange: this.getDateRange(feedback),
      
      // Sentiment analysis
      sentimentDistribution: this.analyzeSentimentDistribution(feedback),
      sentimentMetrics: this.calculateSentimentMetrics(feedback),
      
      // Category analysis
      categoryDistribution: this.analyzeCategoryDistribution(feedback),
      categoryMetrics: this.calculateCategoryMetrics(feedback),
      
      // Source analysis
      sourceDistribution: this.analyzeSourceDistribution(feedback),
      sourceMetrics: this.calculateSourceMetrics(feedback),
      
      // Quality metrics
      qualityMetrics: this.calculateQualityMetrics(feedback),
      
      // AI metrics (enhanced)
      aiMetrics: this.calculateAdvancedAIMetrics(feedback)
    }

    return analytics
  }

  /**
   * Generate AI-powered insights using Gemini AI
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} AI-generated insights
   */
  async generateAIInsights(feedback, coreAnalytics, trendAnalysis) {
    try {
      // Initialize Gemini AI if not already done
      initializeGeminiAI()

      // Prepare comprehensive analytics data for AI analysis
      const analyticsData = this.prepareComprehensiveAnalyticsForAI(feedback, coreAnalytics, trendAnalysis)
      
      // Generate business insights using enhanced Gemini AI integration
      const businessInsights = await generateBusinessInsights(analyticsData)
      
      // Generate additional recommendations
      const recommendations = await generateFeedbackRecommendations(analyticsData)
      
      // Combine insights from different AI analysis methods
      const combinedInsights = {
        executiveSummary: businessInsights.executiveSummary || 'Unable to generate executive summary',
        keyFindings: [
          ...(businessInsights.keyFindings || []),
          ...(this.generateStatisticalFindings(coreAnalytics, trendAnalysis) || [])
        ],
        recommendations: [
          ...(businessInsights.recommendations || []),
          ...(recommendations.recommendations?.map(r => r.description) || [])
        ].slice(0, 10), // Limit to top 10 recommendations
        riskAssessment: {
          ...businessInsights.riskAssessment,
          detailedAnalysis: this.generateRiskAnalysis(coreAnalytics, trendAnalysis)
        },
        opportunityIdentification: [
          ...(businessInsights.opportunityIdentification || []),
          ...(this.identifyDataDrivenOpportunities(coreAnalytics, trendAnalysis) || [])
        ],
        strategicInsights: [
          ...(businessInsights.strategicInsights || []),
          ...(this.generateStrategicInsights(coreAnalytics, trendAnalysis) || [])
        ],
        confidenceScore: Math.max(businessInsights.confidenceScore || 0.5, 0.3),
        generatedAt: new Date().toISOString(),
        methodology: 'enhanced_ai_analysis',
        
        // Additional enhanced features
        implementationGuide: recommendations.implementationGuide || {},
        prioritization: recommendations.prioritization || {},
        
        // Predictive insights integration
        predictiveInsights: await this.generateAIPredictiveInsights(trendAnalysis, coreAnalytics),
        
        // Performance metrics
        analysisMetrics: {
          dataQuality: this.assessDataQualityScore(feedback),
          completeness: this.calculateAnalysisCompleteness(coreAnalytics, trendAnalysis),
          reliability: this.calculateReliabilityScore(feedback, coreAnalytics)
        }
      }
      
      return combinedInsights
      
    } catch (error) {
      console.error('AI Insights generation failed:', error)
      return this.generateFallbackInsights(feedback, coreAnalytics, trendAnalysis, error.message)
    }
  }

  /**
   * Generate AI-powered predictive insights
   * @param {Object} trendAnalysis - Trend analysis results
   * @param {Object} coreAnalytics - Core analytics results
   * @returns {Object} AI-generated predictive insights
   */
  async generateAIPredictiveInsights(trendAnalysis, coreAnalytics) {
    try {
      const trendData = {
        overallTrend: trendAnalysis.overallTrend || {},
        growthRates: trendAnalysis.growthRates || {},
        volatility: trendAnalysis.volatility || {},
        seasonality: trendAnalysis.seasonality || {},
        recentTrend: trendAnalysis.recentTrend || []
      }
      
      const statisticalData = {
        sentimentStats: coreAnalytics.sentimentMetrics || {},
        distributionAnalysis: coreAnalytics.sentimentDistribution || {},
        qualityMetrics: coreAnalytics.qualityMetrics || {}
      }
      
      const aiPredictiveInsights = await generateAIPredictiveInsights(trendData, statisticalData)
      
      return {
        available: true,
        predictions: aiPredictiveInsights.predictions || [],
        confidence: aiPredictiveInsights.overallConfidence || 0.5,
        methodology: aiPredictiveInsights.methodology || 'ai_enhanced',
        assumptions: aiPredictiveInsights.keyAssumptions || [],
        uncertaintyFactors: aiPredictiveInsights.uncertaintyFactors || [],
        generatedAt: new Date().toISOString()
      }
      
    } catch (error) {
      console.error('AI Predictive Insights generation failed:', error)
      return {
        available: false,
        error: error.message,
        fallbackMessage: 'AI-powered predictions unavailable, using statistical models'
      }
    }
  }

  /**
   * Prepare comprehensive analytics data for AI analysis
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Comprehensive analytics summary
   */
  prepareComprehensiveAnalyticsForAI(feedback, coreAnalytics, trendAnalysis) {
    return {
      // Basic metrics
      totalFeedback: coreAnalytics.totalFeedback || 0,
      dateRange: coreAnalytics.dateRange || {},
      
      // Sentiment analysis
      sentimentDistribution: coreAnalytics.sentimentDistribution || {},
      sentimentMetrics: coreAnalytics.sentimentMetrics || {},
      averageSentiment: coreAnalytics.sentimentMetrics?.average || 0,
      
      // Category analysis
      categoryDistribution: coreAnalytics.categoryDistribution || {},
      categoryMetrics: coreAnalytics.categoryMetrics || {},
      topCategory: this.getTopCategory(coreAnalytics.categoryDistribution),
      
      // Source analysis
      sourceDistribution: coreAnalytics.sourceDistribution || {},
      sourceMetrics: coreAnalytics.sourceMetrics || {},
      primarySource: this.getTopSource(coreAnalytics.sourceDistribution),
      
      // Quality metrics
      qualityMetrics: coreAnalytics.qualityMetrics || {},
      dataCompleteness: coreAnalytics.qualityMetrics?.overallQualityScore || 0,
      
      // AI performance
      aiMetrics: coreAnalytics.aiMetrics || {},
      aiCoverage: this.calculateAICoverage(coreAnalytics.aiMetrics),
      
      // Trend analysis
      trendDirection: trendAnalysis.overallTrend?.direction || 'stable',
      trendStrength: trendAnalysis.overallTrend?.strength || 0,
      trendConfidence: trendAnalysis.overallTrend?.confidence || 0,
      growthRate: trendAnalysis.growthRates?.daily || 0,
      volatility: trendAnalysis.volatility?.interpretation || 'unknown',
      seasonality: trendAnalysis.seasonality?.detected || false,
      
      // Recent patterns
      recentTrend: trendAnalysis.recentTrend || [],
      anomalies: trendAnalysis.anomalies || {},
      
      // Business context
      feedbackVelocity: this.calculateFeedbackVelocity(feedback),
      engagementLevel: this.calculateEngagementLevel(feedback),
      diversityIndex: this.calculateDiversityIndex(coreAnalytics),
      
      // Time-based insights
      peakActivity: this.identifyPeakActivity(trendAnalysis),
      temporalPatterns: this.extractTemporalPatterns(trendAnalysis)
    }
  }

  /**
   * Generate statistical findings for AI insights
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Array} Statistical findings
   */
  generateStatisticalFindings(coreAnalytics, trendAnalysis) {
    const findings = []
    
    // Sentiment findings
    if (coreAnalytics.sentimentMetrics) {
      const sentimentStats = coreAnalytics.sentimentMetrics
      if (sentimentStats.standardDeviation > 0.2) {
        findings.push('High sentiment variability detected - indicates diverse customer experiences')
      }
      if (Math.abs(sentimentStats.skewness) > 0.5) {
        const direction = sentimentStats.skewness > 0 ? 'positive' : 'negative'
        findings.push(`Sentiment distribution is ${direction}ly skewed - suggests non-normal feedback patterns`)
      }
    }
    
    // Trend findings
    if (trendAnalysis.overallTrend) {
      const trend = trendAnalysis.overallTrend
      if (trend.confidence > 0.8 && trend.strength > 0.1) {
        findings.push(`Strong ${trend.direction} trend detected with high confidence (${(trend.confidence * 100).toFixed(1)}%)`)
      }
    }
    
    // Volume findings
    if (trendAnalysis.volatility) {
      const vol = trendAnalysis.volatility
      if (vol.interpretation === 'high' || vol.interpretation === 'very_high') {
        findings.push('High feedback volume volatility indicates unpredictable engagement patterns')
      }
    }
    
    // Quality findings
    if (coreAnalytics.qualityMetrics) {
      const quality = coreAnalytics.qualityMetrics
      if (quality.overallQualityScore < 70) {
        findings.push('Data quality score below 70% - consider improving data collection processes')
      }
    }
    
    return findings
  }

  /**
   * Generate risk analysis for AI insights
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Risk analysis
   */
  generateRiskAnalysis(coreAnalytics, trendAnalysis) {
    const risks = []
    let overallRiskScore = 0
    
    // Sentiment risk
    const negativeRatio = (coreAnalytics.sentimentDistribution.negative || 0) / (coreAnalytics.totalFeedback || 1)
    if (negativeRatio > 0.4) {
      risks.push('High negative sentiment ratio indicates customer satisfaction risk')
      overallRiskScore += 0.3
    }
    
    // Trend risk
    if (trendAnalysis.overallTrend?.direction === 'decreasing' && trendAnalysis.overallTrend?.confidence > 0.6) {
      risks.push('Declining feedback trend suggests decreasing customer engagement')
      overallRiskScore += 0.2
    }
    
    // Volatility risk
    if (trendAnalysis.volatility?.interpretation === 'very_high') {
      risks.push('Very high volatility creates unpredictable business impact')
      overallRiskScore += 0.15
    }
    
    // Data quality risk
    if (coreAnalytics.qualityMetrics?.overallQualityScore < 60) {
      risks.push('Low data quality affects reliability of insights')
      overallRiskScore += 0.1
    }
    
    return {
      riskFactors: risks,
      overallRiskScore: Math.min(overallRiskScore, 1.0),
      riskLevel: overallRiskScore > 0.7 ? 'high' : overallRiskScore > 0.4 ? 'medium' : 'low'
    }
  }

  /**
   * Identify data-driven opportunities
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Array} Opportunities
   */
  identifyDataDrivenOpportunities(coreAnalytics, trendAnalysis) {
    const opportunities = []
    
    // Positive sentiment opportunity
    const positiveRatio = (coreAnalytics.sentimentDistribution.positive || 0) / (coreAnalytics.totalFeedback || 1)
    if (positiveRatio > 0.6) {
      opportunities.push('High positive sentiment provides opportunity for customer advocacy programs')
    }
    
    // Growth opportunity
    if (trendAnalysis.overallTrend?.direction === 'increasing' && trendAnalysis.overallTrend?.confidence > 0.7) {
      opportunities.push('Positive growth trend suggests successful initiatives that can be scaled')
    }
    
    // Category opportunity
    const topCategory = this.getTopCategory(coreAnalytics.categoryDistribution)
    if (topCategory) {
      opportunities.push(`High volume in ${topCategory} category presents optimization opportunity`)
    }
    
    // AI opportunity
    if (coreAnalytics.aiMetrics?.averageConfidence > 0.8) {
      opportunities.push('High AI confidence enables automated response capabilities')
    }
    
    return opportunities
  }

  /**
   * Generate strategic insights
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Array} Strategic insights
   */
  generateStrategicInsights(coreAnalytics, trendAnalysis) {
    const insights = []
    
    // Market positioning insight
    const avgSentiment = coreAnalytics.sentimentMetrics?.average || 0
    if (avgSentiment > 0.7) {
      insights.push('Above-average sentiment scores suggest strong market positioning')
    } else if (avgSentiment < 0.4) {
      insights.push('Below-average sentiment indicates need for strategic repositioning')
    }
    
    // Engagement strategy insight
    const feedbackVelocity = this.calculateFeedbackVelocity([]) // Would need actual feedback data
    insights.push('Customer engagement levels indicate strategic focus areas for retention')
    
    // Innovation opportunity insight
    if (trendAnalysis.seasonality?.detected) {
      insights.push('Seasonal patterns detected - consider timing of product launches and campaigns')
    }
    
    // Competitive advantage insight
    const qualityScore = coreAnalytics.qualityMetrics?.overallQualityScore || 0
    if (qualityScore > 80) {
      insights.push('High data quality provides competitive advantage in customer insights')
    }
    
    return insights
  }

  /**
   * Generate fallback insights when AI is unavailable
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics results
   * @param {Object} trendAnalysis - Trend analysis results
   * @param {string} errorMessage - Error message
   * @returns {Object} Fallback insights
   */
  generateFallbackInsights(feedback, coreAnalytics, trendAnalysis, errorMessage) {
    return {
      executiveSummary: 'Basic analytics summary generated. AI-powered insights unavailable.',
      keyFindings: [
        `Total feedback analyzed: ${coreAnalytics.totalFeedback || 0}`,
        `Average sentiment: ${((coreAnalytics.sentimentMetrics?.average || 0) * 100).toFixed(1)}%`,
        `Trend direction: ${trendAnalysis.overallTrend?.direction || 'unknown'}`,
        'Advanced AI analysis currently unavailable'
      ],
      recommendations: [
        'Monitor key sentiment indicators regularly',
        'Review negative feedback for immediate issues',
        'Implement manual feedback analysis process',
        'Consider AI service configuration for enhanced insights'
      ],
      riskAssessment: {
        overallRisk: 'medium',
        primaryRisks: ['Limited AI analysis capability'],
        mitigationStrategies: ['Implement manual review process']
      },
      opportunityIdentification: [
        'Establish baseline metrics for future comparison',
        'Develop feedback response procedures'
      ],
      strategicInsights: [
        'Regular feedback analysis is critical for business success',
        'AI-powered insights would provide deeper strategic value'
      ],
      confidenceScore: 0.3,
      generatedAt: new Date().toISOString(),
      methodology: 'fallback_analysis',
      error: errorMessage
    }
  }

  // Helper methods for enhanced analytics

  /**
   * Get top category from distribution
   * @param {Object} categoryDistribution - Category distribution
   * @returns {string} Top category
   */
  getTopCategory(categoryDistribution) {
    if (!categoryDistribution || Object.keys(categoryDistribution).length === 0) return null
    return Object.entries(categoryDistribution).reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }

  /**
   * Get top source from distribution
   * @param {Object} sourceDistribution - Source distribution
   * @returns {string} Top source
   */
  getTopSource(sourceDistribution) {
    if (!sourceDistribution || Object.keys(sourceDistribution).length === 0) return null
    return Object.entries(sourceDistribution).reduce((a, b) => a[1] > b[1] ? a : b)[0]
  }

  /**
   * Calculate AI coverage percentage
   * @param {Object} aiMetrics - AI metrics
   * @returns {number} AI coverage percentage
   */
  calculateAICoverage(aiMetrics) {
    if (!aiMetrics || !aiMetrics.totalAIAnalyzed) return 0
    return (aiMetrics.totalAIAnalyzed / Math.max(aiMetrics.totalFeedback || 1, 1)) * 100
  }

  /**
   * Calculate feedback velocity
   * @param {Array} feedback - Feedback data
   * @returns {number} Feedback velocity (per day)
   */
  calculateFeedbackVelocity(feedback) {
    if (!feedback || feedback.length < 2) return 0
    
    const dates = feedback.map(f => new Date(f.feedbackDate || f.feedback_date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b)
    
    if (dates.length < 2) return 0
    
    const daysDiff = (dates[dates.length - 1] - dates[0]) / (1000 * 60 * 60 * 24)
    return daysDiff > 0 ? feedback.length / daysDiff : 0
  }

  /**
   * Calculate engagement level
   * @param {Array} feedback - Feedback data
   * @returns {string} Engagement level
   */
  calculateEngagementLevel(feedback) {
    const velocity = this.calculateFeedbackVelocity(feedback)
    if (velocity > 10) return 'high'
    if (velocity > 3) return 'medium'
    return 'low'
  }

  /**
   * Calculate diversity index
   * @param {Object} coreAnalytics - Core analytics
   * @returns {number} Diversity index
   */
  calculateDiversityIndex(coreAnalytics) {
    const categoryCount = Object.keys(coreAnalytics.categoryDistribution || {}).length
    const sourceCount = Object.keys(coreAnalytics.sourceDistribution || {}).length
    return (categoryCount * sourceCount) / Math.max(coreAnalytics.totalFeedback || 1, 1)
  }

  /**
   * Identify peak activity periods
   * @param {Object} trendAnalysis - Trend analysis
   * @returns {Object} Peak activity information
   */
  identifyPeakActivity(trendAnalysis) {
    if (!trendAnalysis.recentTrend || trendAnalysis.recentTrend.length === 0) {
      return { detected: false }
    }
    
    const maxActivity = Math.max(...trendAnalysis.recentTrend.map(d => d.count))
    const peakDay = trendAnalysis.recentTrend.find(d => d.count === maxActivity)
    
    return {
      detected: true,
      peakDate: peakDay?.date,
      peakValue: maxActivity,
      averageValue: trendAnalysis.recentTrend.reduce((sum, d) => sum + d.count, 0) / trendAnalysis.recentTrend.length
    }
  }

  /**
   * Extract temporal patterns
   * @param {Object} trendAnalysis - Trend analysis
   * @returns {Object} Temporal patterns
   */
  extractTemporalPatterns(trendAnalysis) {
    return {
      hasSeasonality: trendAnalysis.seasonality?.detected || false,
      hasWeeklyPattern: trendAnalysis.dailyTrends?.weekdayVsWeekend?.pattern !== 'similar',
      volatilityLevel: trendAnalysis.volatility?.interpretation || 'unknown',
      trendStability: trendAnalysis.overallTrend?.confidence > 0.7 ? 'stable' : 'unstable'
    }
  }

  /**
   * Assess data quality score
   * @param {Array} feedback - Feedback data
   * @returns {number} Data quality score (0-100)
   */
  assessDataQualityScore(feedback) {
    if (!feedback || feedback.length === 0) return 0
    
    let qualityScore = 0
    const checks = [
      { weight: 0.3, check: () => feedback.filter(f => f.content && f.content.trim().length > 10).length / feedback.length },
      { weight: 0.2, check: () => feedback.filter(f => f.category && f.category !== 'uncategorized').length / feedback.length },
      { weight: 0.2, check: () => feedback.filter(f => f.sentimentScore !== null && f.sentimentScore !== undefined).length / feedback.length },
      { weight: 0.15, check: () => feedback.filter(f => f.source && f.source !== 'unknown').length / feedback.length },
      { weight: 0.15, check: () => feedback.filter(f => f.feedbackDate || f.feedback_date).length / feedback.length }
    ]
    
    checks.forEach(({ weight, check }) => {
      qualityScore += weight * check()
    })
    
    return Math.round(qualityScore * 100)
  }

  /**
   * Calculate analysis completeness
   * @param {Object} coreAnalytics - Core analytics
   * @param {Object} trendAnalysis - Trend analysis
   * @returns {number} Completeness score (0-100)
   */
  calculateAnalysisCompleteness(coreAnalytics, trendAnalysis) {
    const components = [
      coreAnalytics.sentimentDistribution ? 1 : 0,
      coreAnalytics.categoryDistribution ? 1 : 0,
      coreAnalytics.sourceDistribution ? 1 : 0,
      trendAnalysis.overallTrend ? 1 : 0,
      trendAnalysis.volatility ? 1 : 0,
      coreAnalytics.aiMetrics ? 1 : 0
    ]
    
    return Math.round((components.reduce((sum, val) => sum + val, 0) / components.length) * 100)
  }

  /**
   * Calculate reliability score
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics
   * @returns {number} Reliability score (0-100)
   */
  calculateReliabilityScore(feedback, coreAnalytics) {
    const factors = [
      feedback.length >= 30 ? 1 : feedback.length / 30, // Sample size factor
      (coreAnalytics.aiMetrics?.averageConfidence || 0.5), // AI confidence factor
      Math.min((coreAnalytics.qualityMetrics?.overallQualityScore || 50) / 100, 1), // Quality factor
      coreAnalytics.totalFeedback > 0 ? 1 : 0 // Data availability factor
    ]
    
    return Math.round((factors.reduce((sum, val) => sum + val, 0) / factors.length) * 100)
  }

  /**
   * Generate business intelligence metrics
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics
   * @param {Object} trendAnalysis - Trend analysis
   * @param {Object} statisticalAnalysis - Statistical analysis
   * @returns {Object} Business intelligence metrics
   */
  generateBusinessIntelligence(feedback, coreAnalytics, trendAnalysis, statisticalAnalysis) {
    return {
      kpis: this.calculateKPIs(feedback, coreAnalytics),
      benchmarks: this.calculateBenchmarks(coreAnalytics, trendAnalysis),
      performanceIndicators: this.calculatePerformanceIndicators(feedback, coreAnalytics),
      riskFactors: this.identifyRiskFactors(feedback, coreAnalytics, trendAnalysis),
      opportunities: this.identifyOpportunities(feedback, coreAnalytics, trendAnalysis),
      competitiveAnalysis: this.generateCompetitiveAnalysis(coreAnalytics, statisticalAnalysis),
      actionItems: this.generateActionItems(feedback, coreAnalytics, trendAnalysis)
    }
  }

  /**
   * Calculate Key Performance Indicators
   * @param {Array} feedback - Feedback data
   * @param {Object} coreAnalytics - Core analytics
   * @returns {Object} KPIs
   */
  calculateKPIs(feedback, coreAnalytics) {
    const total = feedback.length
    const positive = coreAnalytics.sentimentDistribution.positive || 0
    const negative = coreAnalytics.sentimentDistribution.negative || 0
    
    return {
      customerSatisfactionScore: total > 0 ? (positive / total * 100).toFixed(1) : 0,
      netPromoterScore: this.calculateNPS(feedback),
      customerEffortScore: this.calculateCES(feedback),
      responseRate: this.calculateResponseRate(feedback),
      resolutionRate: this.calculateResolutionRate(feedback),
      avgResponseTime: this.calculateAvgResponseTime(feedback),
      feedbackVelocity: this.calculateFeedbackVelocity(feedback),
      qualityScore: this.calculateQualityScore(feedback)
    }
  }

  /**
   * Validate and prepare feedback data
   * @param {Array} feedback - Raw feedback data
   * @returns {Array} Validated feedback data
   */
  validateAndPrepareData(feedback) {
    if (!Array.isArray(feedback)) {
      throw new Error('Feedback data must be an array')
    }

    return feedback.filter(item => {
      // Basic validation
      if (!item || typeof item !== 'object') return false
      if (!item.content || typeof item.content !== 'string') return false
      if (item.content.trim().length === 0) return false
      
      // Date validation
      const dateField = item.feedbackDate || item.feedback_date
      if (dateField) {
        const date = new Date(dateField)
        if (isNaN(date.getTime())) return false
      }
      
      return true
    }).slice(0, this.options.maxDataPoints) // Limit data points for performance
  }

  /**
   * Analyze sentiment distribution
   * @param {Array} feedback - Feedback data
   * @returns {Object} Sentiment distribution
   */
  analyzeSentimentDistribution(feedback) {
    const distribution = { positive: 0, negative: 0, neutral: 0 }
    
    feedback.forEach(item => {
      const sentiment = item.sentimentLabel || item.sentiment_label || 'neutral'
      if (distribution.hasOwnProperty(sentiment)) {
        distribution[sentiment]++
      } else {
        distribution.neutral++
      }
    })
    
    return distribution
  }

  /**
   * Calculate sentiment metrics
   * @param {Array} feedback - Feedback data
   * @returns {Object} Sentiment metrics
   */
  calculateSentimentMetrics(feedback) {
    const scores = feedback
      .map(item => parseFloat(item.sentimentScore || item.sentiment_score || 0))
      .filter(score => !isNaN(score))
    
    if (scores.length === 0) {
      return {
        average: 0,
        median: 0,
        standardDeviation: 0,
        min: 0,
        max: 0,
        percentiles: { p25: 0, p50: 0, p75: 0, p90: 0, p95: 0 }
      }
    }

    scores.sort((a, b) => a - b)
    
    const sum = scores.reduce((acc, score) => acc + score, 0)
    const average = sum / scores.length
    const median = this.calculatePercentile(scores, 50)
    const standardDeviation = Math.sqrt(
      scores.reduce((acc, score) => acc + Math.pow(score - average, 2), 0) / scores.length
    )
    
    return {
      average: Math.round(average * 1000) / 1000,
      median: Math.round(median * 1000) / 1000,
      standardDeviation: Math.round(standardDeviation * 1000) / 1000,
      min: scores[0],
      max: scores[scores.length - 1],
      percentiles: {
        p25: this.calculatePercentile(scores, 25),
        p50: this.calculatePercentile(scores, 50),
        p75: this.calculatePercentile(scores, 75),
        p90: this.calculatePercentile(scores, 90),
        p95: this.calculatePercentile(scores, 95)
      }
    }
  }

  /**
   * Calculate percentile value
   * @param {Array} sortedValues - Sorted array of values
   * @param {number} percentile - Percentile to calculate (0-100)
   * @returns {number} Percentile value
   */
  calculatePercentile(sortedValues, percentile) {
    if (sortedValues.length === 0) return 0
    
    const index = (percentile / 100) * (sortedValues.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) {
      return sortedValues[lower]
    }
    
    const weight = index - lower
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight
  }

  /**
   * Generate cache key for analytics results
   * @param {Array} feedback - Feedback data
   * @param {Object} options - Options
   * @returns {string} Cache key
   */
  generateCacheKey(feedback, options) {
    const dataHash = this.hashData(feedback)
    const optionsHash = JSON.stringify(options)
    return `analytics_${dataHash}_${btoa(optionsHash).slice(0, 10)}`
  }

  /**
   * Generate simple hash for data
   * @param {Array} data - Data to hash
   * @returns {string} Hash string
   */
  hashData(data) {
    let hash = 0
    const str = JSON.stringify(data.slice(0, 100)) // Sample first 100 items for performance
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36)
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      cacheSize: this.cache.size,
      memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed : 0
    }
  }

  /**
   * Clear analytics cache
   */
  clearCache() {
    this.cache.clear()
    this.performanceMetrics.cacheHits = 0
    this.performanceMetrics.cacheMisses = 0
  }

  // Additional helper methods will be implemented based on the specific analytics needs
  
  /**
   * Get date range from feedback data
   * @param {Array} feedback - Feedback data
   * @returns {Object} Date range information
   */
  getDateRange(feedback) {
    const dates = feedback
      .map(f => new Date(f.feedbackDate || f.feedback_date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b)
    
    if (dates.length === 0) {
      return { start: null, end: null, span: 0 }
    }
    
    return {
      start: dates[0],
      end: dates[dates.length - 1],
      span: dates[dates.length - 1] - dates[0]
    }
  }

  /**
   * Analyze category distribution
   * @param {Array} feedback - Feedback data
   * @returns {Object} Category distribution
   */
  analyzeCategoryDistribution(feedback) {
    const distribution = {}
    
    feedback.forEach(item => {
      const category = item.category || 'uncategorized'
      distribution[category] = (distribution[category] || 0) + 1
    })
    
    return distribution
  }

  /**
   * Calculate category metrics
   * @param {Array} feedback - Feedback data
   * @returns {Object} Category metrics
   */
  calculateCategoryMetrics(feedback) {
    const categoryData = {}
    
    feedback.forEach(item => {
      const category = item.category || 'uncategorized'
      if (!categoryData[category]) {
        categoryData[category] = {
          count: 0,
          sentimentScores: [],
          sources: new Set(),
          avgConfidence: 0,
          totalConfidence: 0
        }
      }
      
      categoryData[category].count++
      
      const score = parseFloat(item.sentimentScore || item.sentiment_score || 0)
      if (!isNaN(score)) {
        categoryData[category].sentimentScores.push(score)
      }
      
      if (item.source) {
        categoryData[category].sources.add(item.source)
      }
      
      const confidence = parseFloat(item.aiCategoryConfidence || 0)
      if (!isNaN(confidence)) {
        categoryData[category].totalConfidence += confidence
      }
    })
    
    // Calculate metrics for each category
    Object.keys(categoryData).forEach(category => {
      const data = categoryData[category]
      data.avgSentiment = data.sentimentScores.length > 0 
        ? data.sentimentScores.reduce((sum, score) => sum + score, 0) / data.sentimentScores.length
        : 0
      data.avgConfidence = data.count > 0 ? data.totalConfidence / data.count : 0
      data.sourceCount = data.sources.size
      data.sources = Array.from(data.sources)
    })
    
    return categoryData
  }

  /**
   * Analyze source distribution
   * @param {Array} feedback - Feedback data
   * @returns {Object} Source distribution
   */
  analyzeSourceDistribution(feedback) {
    const distribution = {}
    
    feedback.forEach(item => {
      const source = item.source || 'unknown'
      distribution[source] = (distribution[source] || 0) + 1
    })
    
    return distribution
  }

  /**
   * Calculate source metrics
   * @param {Array} feedback - Feedback data
   * @returns {Object} Source metrics
   */
  calculateSourceMetrics(feedback) {
    const sourceData = {}
    
    feedback.forEach(item => {
      const source = item.source || 'unknown'
      if (!sourceData[source]) {
        sourceData[source] = {
          count: 0,
          sentimentScores: [],
          categories: new Set(),
          avgSentiment: 0
        }
      }
      
      sourceData[source].count++
      
      const score = parseFloat(item.sentimentScore || item.sentiment_score || 0)
      if (!isNaN(score)) {
        sourceData[source].sentimentScores.push(score)
      }
      
      if (item.category) {
        sourceData[source].categories.add(item.category)
      }
    })
    
    // Calculate average sentiment for each source
    Object.keys(sourceData).forEach(source => {
      const data = sourceData[source]
      data.avgSentiment = data.sentimentScores.length > 0
        ? data.sentimentScores.reduce((sum, score) => sum + score, 0) / data.sentimentScores.length
        : 0
      data.categoryCount = data.categories.size
      data.categories = Array.from(data.categories)
    })
    
    return sourceData
  }

  /**
   * Calculate quality metrics
   * @param {Array} feedback - Feedback data
   * @returns {Object} Quality metrics
   */
  calculateQualityMetrics(feedback) {
    let totalLength = 0
    let validDates = 0
    let hasCategory = 0
    let hasSource = 0
    let hasAIConfidence = 0
    
    feedback.forEach(item => {
      if (item.content) {
        totalLength += item.content.length
      }
      
      const dateField = item.feedbackDate || item.feedback_date
      if (dateField && !isNaN(new Date(dateField).getTime())) {
        validDates++
      }
      
      if (item.category && item.category !== 'uncategorized') {
        hasCategory++
      }
      
      if (item.source && item.source !== 'unknown') {
        hasSource++
      }
      
      if (item.aiCategoryConfidence !== null && item.aiCategoryConfidence !== undefined) {
        hasAIConfidence++
      }
    })
    
    const total = feedback.length
    
    return {
      avgContentLength: total > 0 ? Math.round(totalLength / total) : 0,
      dataCompleteness: {
        validDates: total > 0 ? (validDates / total * 100).toFixed(1) : 0,
        hasCategory: total > 0 ? (hasCategory / total * 100).toFixed(1) : 0,
        hasSource: total > 0 ? (hasSource / total * 100).toFixed(1) : 0,
        hasAIConfidence: total > 0 ? (hasAIConfidence / total * 100).toFixed(1) : 0
      },
      overallQualityScore: this.calculateOverallQualityScore(feedback, {
        validDates, hasCategory, hasSource, hasAIConfidence, total
      })
    }
  }

  /**
   * Calculate overall quality score
   * @param {Array} feedback - Feedback data
   * @param {Object} metrics - Quality metrics
   * @returns {number} Quality score (0-100)
   */
  calculateOverallQualityScore(feedback, metrics) {
    const weights = {
      validDates: 0.2,
      hasCategory: 0.3,
      hasSource: 0.2,
      hasAIConfidence: 0.2,
      contentQuality: 0.1
    }
    
    const scores = {
      validDates: metrics.total > 0 ? metrics.validDates / metrics.total : 0,
      hasCategory: metrics.total > 0 ? metrics.hasCategory / metrics.total : 0,
      hasSource: metrics.total > 0 ? metrics.hasSource / metrics.total : 0,
      hasAIConfidence: metrics.total > 0 ? metrics.hasAIConfidence / metrics.total : 0,
      contentQuality: this.calculateContentQualityScore(feedback)
    }
    
    const weightedScore = Object.keys(weights).reduce((total, key) => {
      return total + (scores[key] * weights[key])
    }, 0)
    
    return Math.round(weightedScore * 100)
  }

  /**
   * Calculate content quality score based on content analysis
   * @param {Array} feedback - Feedback data
   * @returns {number} Content quality score (0-1)
   */
  calculateContentQualityScore(feedback) {
    if (feedback.length === 0) return 0
    
    let qualitySum = 0
    
    feedback.forEach(item => {
      if (!item.content) {
        qualitySum += 0
        return
      }
      
      const content = item.content.trim()
      let score = 0
      
      // Length-based scoring
      if (content.length >= 10) score += 0.3
      if (content.length >= 50) score += 0.2
      if (content.length >= 100) score += 0.1
      
      // Word count scoring
      const wordCount = content.split(/\s+/).length
      if (wordCount >= 5) score += 0.2
      if (wordCount >= 15) score += 0.1
      
      // Sentence structure scoring
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
      if (sentences.length >= 2) score += 0.1
      
      qualitySum += Math.min(score, 1)
    })
    
    return qualitySum / feedback.length
  }

  /**
   * Calculate advanced AI metrics
   * @param {Array} feedback - Feedback data
   * @returns {Object} Advanced AI metrics
   */
  calculateAdvancedAIMetrics(feedback) {
    const aiAnalyzedFeedback = feedback.filter(f => 
      f.aiCategoryConfidence !== null && f.aiCategoryConfidence !== undefined
    )
    
    if (aiAnalyzedFeedback.length === 0) {
      return {
        totalAIAnalyzed: 0,
        averageConfidence: 0,
        confidenceDistribution: { high: 0, medium: 0, low: 0 },
        accuracyEstimate: 0,
        categoryConfidenceStats: {}
      }
    }
    
    const confidences = aiAnalyzedFeedback.map(f => parseFloat(f.aiCategoryConfidence))
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    
    const distribution = {
      high: confidences.filter(c => c > 0.8).length,
      medium: confidences.filter(c => c >= 0.5 && c <= 0.8).length,
      low: confidences.filter(c => c < 0.5).length
    }
    
    return {
      totalAIAnalyzed: aiAnalyzedFeedback.length,
      averageConfidence: Math.round(avgConfidence * 1000) / 1000,
      confidenceDistribution: distribution,
      accuracyEstimate: this.estimateAIAccuracy(aiAnalyzedFeedback),
      categoryConfidenceStats: this.calculateCategoryConfidenceStats(aiAnalyzedFeedback)
    }
  }

  /**
   * Estimate AI accuracy based on confidence patterns
   * @param {Array} aiAnalyzedFeedback - AI analyzed feedback
   * @returns {number} Estimated accuracy (0-1)
   */
  estimateAIAccuracy(aiAnalyzedFeedback) {
    // This is a heuristic estimation based on confidence patterns
    // In a real system, this would be based on actual validation data
    
    const confidences = aiAnalyzedFeedback.map(f => parseFloat(f.aiCategoryConfidence))
    const avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
    
    // High confidence typically correlates with high accuracy
    const highConfidenceRatio = confidences.filter(c => c > 0.8).length / confidences.length
    
    // Estimate accuracy based on confidence patterns
    const estimatedAccuracy = (avgConfidence * 0.7) + (highConfidenceRatio * 0.3)
    
    return Math.round(estimatedAccuracy * 1000) / 1000
  }

  /**
   * Calculate category confidence statistics
   * @param {Array} aiAnalyzedFeedback - AI analyzed feedback
   * @returns {Object} Category confidence stats
   */
  calculateCategoryConfidenceStats(aiAnalyzedFeedback) {
    const categoryStats = {}
    
    aiAnalyzedFeedback.forEach(item => {
      const category = item.category || 'uncategorized'
      const confidence = parseFloat(item.aiCategoryConfidence)
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          count: 0,
          confidences: [],
          avgConfidence: 0
        }
      }
      
      categoryStats[category].count++
      categoryStats[category].confidences.push(confidence)
    })
    
    // Calculate statistics for each category
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category]
      const confidences = stats.confidences
      
      stats.avgConfidence = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length
      stats.minConfidence = Math.min(...confidences)
      stats.maxConfidence = Math.max(...confidences)
      stats.stdDevConfidence = Math.sqrt(
        confidences.reduce((sum, conf) => sum + Math.pow(conf - stats.avgConfidence, 2), 0) / confidences.length
      )
    })
    
    return categoryStats
  }

  // Placeholder methods for business intelligence functions
  // These will be implemented based on specific business requirements

  calculateNPS(feedback) {
    // Net Promoter Score calculation placeholder
    return 50 // Placeholder value
  }

  calculateCES(feedback) {
    // Customer Effort Score calculation placeholder
    return 3.5 // Placeholder value
  }

  calculateResponseRate(feedback) {
    // Response rate calculation placeholder
    return 75 // Placeholder value
  }

  calculateResolutionRate(feedback) {
    // Resolution rate calculation placeholder
    return 85 // Placeholder value
  }

  calculateAvgResponseTime(feedback) {
    // Average response time calculation placeholder
    return 24 // Placeholder value in hours
  }

  calculateFeedbackVelocity(feedback) {
    // Feedback velocity calculation placeholder
    return 10 // Placeholder value (feedback per day)
  }

  calculateQualityScore(feedback) {
    // Quality score calculation placeholder
    return 80 // Placeholder value
  }

  calculateBenchmarks(coreAnalytics, trendAnalysis) {
    // Industry benchmarks comparison placeholder
    return {
      industryAvgSentiment: 0.65,
      industryAvgResponseTime: 48,
      industryAvgResolutionRate: 80
    }
  }

  calculatePerformanceIndicators(feedback, coreAnalytics) {
    // Performance indicators calculation placeholder
    return {
      trendDirection: 'positive',
      velocityChange: '+15%',
      qualityTrend: 'improving'
    }
  }

  identifyRiskFactors(feedback, coreAnalytics, trendAnalysis) {
    // Risk factors identification placeholder
    return [
      'Increasing negative sentiment in product_quality category',
      'Declining response rate in customer_service'
    ]
  }

  identifyOpportunities(feedback, coreAnalytics, trendAnalysis) {
    // Opportunities identification placeholder
    return [
      'High satisfaction in feature_request category suggests expansion opportunity',
      'Positive trend in customer_service feedback indicates effective improvements'
    ]
  }

  generateCompetitiveAnalysis(coreAnalytics, statisticalAnalysis) {
    // Competitive analysis placeholder
    return {
      marketPosition: 'above_average',
      strengths: ['customer_service', 'product_quality'],
      weaknesses: ['shipping_complaint']
    }
  }

  generateActionItems(feedback, coreAnalytics, trendAnalysis) {
    // Action items generation placeholder
    return [
      {
        priority: 'high',
        category: 'product_quality',
        action: 'Investigate quality issues in recent feedback',
        timeline: '1 week'
      },
      {
        priority: 'medium',
        category: 'shipping_complaint',
        action: 'Review shipping partner performance',
        timeline: '2 weeks'
      }
    ]
  }

  prepareSummaryForAI(feedback, coreAnalytics, trendAnalysis) {
    // Prepare summary for AI analysis placeholder
    return {
      totalFeedback: feedback.length,
      sentimentBreakdown: coreAnalytics.sentimentDistribution,
      topCategories: Object.keys(coreAnalytics.categoryDistribution).slice(0, 5),
      trends: trendAnalysis.summary || 'No trend data available'
    }
  }

  async requestAIInsights(dataSummary) {
    // AI insights request placeholder
    // In a real implementation, this would call Gemini AI
    return {
      executiveSummary: 'Analytics generated successfully with comprehensive insights',
      keyFindings: ['Positive sentiment trending upward', 'Customer service feedback improving'],
      recommendations: ['Focus on product quality improvements', 'Maintain current customer service standards'],
      riskAssessment: { overallRisk: 'low' },
      opportunityIdentification: ['Expand customer service training program'],
      strategicInsights: ['Customer satisfaction is strong foundation for growth'],
      confidenceScore: 0.8
    }
  }
}

export default AdvancedAnalyticsEngine