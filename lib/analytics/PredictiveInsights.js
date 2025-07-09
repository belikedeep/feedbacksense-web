import { format, addDays, addMonths, differenceInDays } from 'date-fns'

/**
 * PredictiveInsights - Specialized component for predictive analytics
 * Provides sentiment forecasting, volume predictions, risk assessment, and opportunity identification
 */
export class PredictiveInsights {
  constructor(options = {}) {
    this.options = {
      forecastHorizon: 90, // Days to forecast into the future
      confidenceLevel: 0.8, // Confidence level for predictions
      minHistoricalData: 14, // Minimum days of historical data required
      seasonalityLookback: 30, // Days to look back for seasonal patterns
      volatilityWeight: 0.3, // Weight for volatility in risk calculations
      trendWeight: 0.7, // Weight for trend in predictions
      ...options
    }

    // Predictive models cache
    this.modelsCache = new Map()
    this.cacheExpiry = 30 * 60 * 1000 // 30 minutes
  }

  /**
   * Generate comprehensive predictive insights
   * @param {Array} feedback - Historical feedback data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Predictive insights
   */
  async generatePredictiveInsights(feedback, trendAnalysis = {}) {
    try {
      if (!feedback || feedback.length === 0) {
        return this.getEmptyPredictiveInsights()
      }

      // Validate minimum data requirements
      const timeSeriesData = this.prepareTimeSeriesData(feedback)
      if (timeSeriesData.length < this.options.minHistoricalData) {
        return this.getInsufficientDataInsights(timeSeriesData.length)
      }

      // Generate cache key
      const cacheKey = this.generatePredictiveCacheKey(feedback, trendAnalysis)
      
      // Check cache
      if (this.modelsCache.has(cacheKey)) {
        const cached = this.modelsCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data
        }
      }

      const insights = {
        metadata: {
          generatedAt: new Date().toISOString(),
          historicalDataPoints: timeSeriesData.length,
          forecastHorizon: this.options.forecastHorizon,
          analysisType: 'comprehensive_predictive'
        },

        // Volume predictions
        volumeForecasts: this.generateVolumeForecasts(timeSeriesData, trendAnalysis),
        
        // Sentiment forecasts
        sentimentForecasts: this.generateSentimentForecasts(timeSeriesData, feedback),
        
        // Category trend predictions
        categoryPredictions: this.generateCategoryPredictions(feedback, trendAnalysis),
        
        // Risk assessment
        riskAssessment: this.performRiskAssessment(feedback, timeSeriesData, trendAnalysis),
        
        // Opportunity identification
        opportunityIdentification: this.identifyOpportunities(feedback, timeSeriesData, trendAnalysis),
        
        // Performance projections
        performanceProjections: this.generatePerformanceProjections(feedback, timeSeriesData),
        
        // Confidence metrics
        confidenceMetrics: this.calculatePredictionConfidence(timeSeriesData, trendAnalysis),
        
        // Scenario analysis
        scenarioAnalysis: this.performScenarioAnalysis(timeSeriesData, trendAnalysis),
        
        // Key predictions summary
        keyPredictions: this.generateKeyPredictions(feedback, timeSeriesData, trendAnalysis)
      }

      // Cache results
      this.modelsCache.set(cacheKey, {
        data: insights,
        timestamp: Date.now()
      })

      return insights

    } catch (error) {
      console.error('Predictive Insights Error:', error)
      return this.getErrorPredictiveInsights(error.message)
    }
  }

  /**
   * Generate volume forecasts using multiple prediction methods
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Volume forecasts
   */
  generateVolumeForecasts(timeSeriesData, trendAnalysis) {
    const counts = timeSeriesData.map(d => d.count)
    const dates = timeSeriesData.map(d => d.date)
    
    // Linear trend forecast
    const linearForecast = this.forecastLinearTrend(counts)
    
    // Exponential smoothing forecast
    const exponentialForecast = this.forecastExponentialSmoothing(counts)
    
    // Seasonal forecast (if seasonal patterns detected)
    const seasonalForecast = this.forecastSeasonal(counts, trendAnalysis.seasonality)
    
    // Moving average forecast
    const movingAverageForecast = this.forecastMovingAverage(counts)
    
    // Ensemble forecast (combination of methods)
    const ensembleForecast = this.createEnsembleForecast([
      linearForecast,
      exponentialForecast,
      seasonalForecast,
      movingAverageForecast
    ])

    // Generate forecast periods
    const forecastPeriods = this.generateForecastPeriods(dates[dates.length - 1])
    
    return {
      methods: {
        linear: this.formatForecastResults(linearForecast, forecastPeriods, 'linear_trend'),
        exponential: this.formatForecastResults(exponentialForecast, forecastPeriods, 'exponential_smoothing'),
        seasonal: this.formatForecastResults(seasonalForecast, forecastPeriods, 'seasonal_decomposition'),
        movingAverage: this.formatForecastResults(movingAverageForecast, forecastPeriods, 'moving_average'),
        ensemble: this.formatForecastResults(ensembleForecast, forecastPeriods, 'ensemble')
      },
      recommended: this.selectBestForecastMethod([
        { name: 'linear', forecast: linearForecast },
        { name: 'exponential', forecast: exponentialForecast },
        { name: 'seasonal', forecast: seasonalForecast },
        { name: 'ensemble', forecast: ensembleForecast }
      ]),
      confidence: this.calculateForecastConfidence(counts, ensembleForecast),
      assumptions: this.listForecastAssumptions(trendAnalysis)
    }
  }

  /**
   * Generate sentiment forecasts
   * @param {Array} timeSeriesData - Time series data
   * @param {Array} feedback - Original feedback data
   * @returns {Object} Sentiment forecasts
   */
  generateSentimentForecasts(timeSeriesData, feedback) {
    const sentimentData = timeSeriesData.map(d => d.avgSentiment).filter(s => s > 0)
    
    if (sentimentData.length < this.options.minHistoricalData) {
      return {
        available: false,
        reason: 'insufficient_sentiment_data',
        minRequired: this.options.minHistoricalData,
        available: sentimentData.length
      }
    }

    // Sentiment trend forecast
    const trendForecast = this.forecastSentimentTrend(sentimentData)
    
    // Sentiment volatility forecast
    const volatilityForecast = this.forecastSentimentVolatility(sentimentData)
    
    // Category-specific sentiment forecasts
    const categoryForecasts = this.forecastCategorySentiment(feedback, timeSeriesData)
    
    // Generate forecast periods
    const forecastPeriods = [7, 30, 60, 90]
    
    return {
      available: true,
      overall: {
        trend: trendForecast,
        volatility: volatilityForecast,
        forecasts: forecastPeriods.map(days => ({
          period: `${days}_days`,
          predicted: this.extrapolateSentiment(sentimentData, days),
          confidence: this.calculateSentimentConfidence(sentimentData, days),
          range: this.calculateSentimentRange(sentimentData, days)
        }))
      },
      byCategory: categoryForecasts,
      riskFactors: this.identifySentimentRisks(sentimentData, trendForecast),
      opportunities: this.identifySentimentOpportunities(sentimentData, trendForecast)
    }
  }

  /**
   * Generate category trend predictions
   * @param {Array} feedback - Feedback data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Category predictions
   */
  generateCategoryPredictions(feedback, trendAnalysis) {
    const categoryTrends = trendAnalysis.categoryTrends || {}
    const categoryPredictions = {}
    
    Object.keys(categoryTrends).forEach(category => {
      const trend = categoryTrends[category]
      if (trend.dataPoints >= 7) { // Minimum data for prediction
        categoryPredictions[category] = {
          currentTrend: trend.trend,
          strength: trend.strength,
          confidence: trend.confidence,
          predictions: this.predictCategoryTrend(trend),
          riskLevel: this.assessCategoryRisk(trend, category),
          recommendations: this.generateCategoryRecommendations(trend, category)
        }
      }
    })
    
    // Identify emerging and declining categories
    const emergingCategories = this.identifyEmergingCategories(categoryPredictions)
    const decliningCategories = this.identifyDecliningCategories(categoryPredictions)
    
    return {
      individual: categoryPredictions,
      emerging: emergingCategories,
      declining: decliningCategories,
      insights: this.generateCategoryInsights(categoryPredictions),
      recommendations: this.generateOverallCategoryRecommendations(categoryPredictions)
    }
  }

  /**
   * Perform comprehensive risk assessment
   * @param {Array} feedback - Feedback data
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Risk assessment
   */
  performRiskAssessment(feedback, timeSeriesData, trendAnalysis) {
    const riskFactors = []
    const riskScores = {}
    
    // Volume risk assessment
    const volumeRisk = this.assessVolumeRisk(timeSeriesData, trendAnalysis)
    riskFactors.push(...volumeRisk.factors)
    riskScores.volume = volumeRisk.score
    
    // Sentiment risk assessment
    const sentimentRisk = this.assessSentimentRisk(feedback, timeSeriesData)
    riskFactors.push(...sentimentRisk.factors)
    riskScores.sentiment = sentimentRisk.score
    
    // Category concentration risk
    const concentrationRisk = this.assessConcentrationRisk(feedback)
    riskFactors.push(...concentrationRisk.factors)
    riskScores.concentration = concentrationRisk.score
    
    // Trend stability risk
    const stabilityRisk = this.assessTrendStabilityRisk(trendAnalysis)
    riskFactors.push(...stabilityRisk.factors)
    riskScores.stability = stabilityRisk.score
    
    // Data quality risk
    const qualityRisk = this.assessDataQualityRisk(feedback)
    riskFactors.push(...qualityRisk.factors)
    riskScores.quality = qualityRisk.score
    
    // Calculate overall risk score
    const overallRiskScore = this.calculateOverallRiskScore(riskScores)
    
    return {
      overallRisk: {
        score: overallRiskScore,
        level: this.interpretRiskLevel(overallRiskScore),
        confidence: this.calculateRiskConfidence(riskScores)
      },
      riskCategories: riskScores,
      riskFactors: riskFactors.sort((a, b) => b.severity - a.severity).slice(0, 10), // Top 10 risks
      mitigation: this.generateRiskMitigation(riskFactors),
      monitoring: this.generateRiskMonitoring(riskFactors),
      alerts: this.generateRiskAlerts(riskFactors, overallRiskScore)
    }
  }

  /**
   * Identify opportunities for improvement and growth
   * @param {Array} feedback - Feedback data
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Opportunity identification
   */
  identifyOpportunities(feedback, timeSeriesData, trendAnalysis) {
    const opportunities = []
    
    // Volume growth opportunities
    const volumeOpportunities = this.identifyVolumeOpportunities(timeSeriesData, trendAnalysis)
    opportunities.push(...volumeOpportunities)
    
    // Sentiment improvement opportunities
    const sentimentOpportunities = this.identifySentimentOpportunities(feedback, timeSeriesData)
    opportunities.push(...sentimentOpportunities)
    
    // Category optimization opportunities
    const categoryOpportunities = this.identifyCategoryOpportunities(feedback, trendAnalysis)
    opportunities.push(...categoryOpportunities)
    
    // Source optimization opportunities
    const sourceOpportunities = this.identifySourceOpportunities(feedback, trendAnalysis)
    opportunities.push(...sourceOpportunities)
    
    // Process improvement opportunities
    const processOpportunities = this.identifyProcessOpportunities(feedback)
    opportunities.push(...processOpportunities)
    
    // Prioritize opportunities
    const prioritizedOpportunities = this.prioritizeOpportunities(opportunities)
    
    return {
      total: opportunities.length,
      highPriority: prioritizedOpportunities.filter(o => o.priority === 'high'),
      mediumPriority: prioritizedOpportunities.filter(o => o.priority === 'medium'),
      lowPriority: prioritizedOpportunities.filter(o => o.priority === 'low'),
      byCategory: this.groupOpportunitiesByCategory(prioritizedOpportunities),
      quickWins: this.identifyQuickWins(prioritizedOpportunities),
      strategicInitiatives: this.identifyStrategicInitiatives(prioritizedOpportunities),
      recommendations: this.generateOpportunityRecommendations(prioritizedOpportunities)
    }
  }

  /**
   * Generate performance projections
   * @param {Array} feedback - Feedback data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Performance projections
   */
  generatePerformanceProjections(feedback, timeSeriesData) {
    const projectionPeriods = [30, 60, 90, 180, 365] // Days
    
    return {
      kpiProjections: projectionPeriods.map(days => ({
        period: days,
        projections: this.projectKPIs(feedback, timeSeriesData, days)
      })),
      scenarioProjections: {
        optimistic: this.projectOptimisticScenario(feedback, timeSeriesData),
        realistic: this.projectRealisticScenario(feedback, timeSeriesData),
        pessimistic: this.projectPessimisticScenario(feedback, timeSeriesData)
      },
      benchmarkComparisons: this.projectBenchmarkComparisons(feedback, timeSeriesData),
      goalTracking: this.projectGoalAchievement(feedback, timeSeriesData)
    }
  }

  /**
   * Calculate prediction confidence metrics
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Confidence metrics
   */
  calculatePredictionConfidence(timeSeriesData, trendAnalysis) {
    const dataQualityScore = this.assessDataQuality(timeSeriesData)
    const trendStabilityScore = this.assessTrendStability(trendAnalysis)
    const volatilityScore = this.assessVolatilityImpact(timeSeriesData)
    const historicalAccuracyScore = this.estimateHistoricalAccuracy(timeSeriesData)
    
    const overallConfidence = (
      dataQualityScore * 0.3 +
      trendStabilityScore * 0.3 +
      volatilityScore * 0.2 +
      historicalAccuracyScore * 0.2
    )
    
    return {
      overall: Math.round(overallConfidence * 100) / 100,
      components: {
        dataQuality: Math.round(dataQualityScore * 100) / 100,
        trendStability: Math.round(trendStabilityScore * 100) / 100,
        volatility: Math.round(volatilityScore * 100) / 100,
        historicalAccuracy: Math.round(historicalAccuracyScore * 100) / 100
      },
      interpretation: this.interpretConfidenceLevel(overallConfidence),
      recommendations: this.generateConfidenceRecommendations(overallConfidence)
    }
  }

  /**
   * Perform scenario analysis
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Scenario analysis
   */
  performScenarioAnalysis(timeSeriesData, trendAnalysis) {
    const baselineScenario = this.generateBaselineScenario(timeSeriesData, trendAnalysis)
    const optimisticScenario = this.generateOptimisticScenario(timeSeriesData, trendAnalysis)
    const pessimisticScenario = this.generatePessimisticScenario(timeSeriesData, trendAnalysis)
    const stressTestScenario = this.generateStressTestScenario(timeSeriesData, trendAnalysis)
    
    return {
      scenarios: {
        baseline: baselineScenario,
        optimistic: optimisticScenario,
        pessimistic: pessimisticScenario,
        stressTest: stressTestScenario
      },
      comparison: this.compareScenarios([baselineScenario, optimisticScenario, pessimisticScenario]),
      probabilityWeighted: this.calculateProbabilityWeightedOutcome([
        { scenario: baselineScenario, probability: 0.5 },
        { scenario: optimisticScenario, probability: 0.25 },
        { scenario: pessimisticScenario, probability: 0.25 }
      ]),
      sensitivityAnalysis: this.performSensitivityAnalysis(timeSeriesData, trendAnalysis)
    }
  }

  /**
   * Generate key predictions summary
   * @param {Array} feedback - Feedback data
   * @param {Array} timeSeriesData - Time series data
   * @param {Object} trendAnalysis - Trend analysis results
   * @returns {Object} Key predictions
   */
  generateKeyPredictions(feedback, timeSeriesData, trendAnalysis) {
    const predictions = []
    
    // Volume predictions
    const volumeTrend = trendAnalysis.overallTrend
    if (volumeTrend && volumeTrend.confidence > 0.6) {
      predictions.push({
        type: 'volume',
        prediction: `Feedback volume expected to ${volumeTrend.direction} over next 30 days`,
        confidence: volumeTrend.confidence,
        impact: 'high',
        timeline: '30 days'
      })
    }
    
    // Sentiment predictions
    const currentSentiment = this.calculateCurrentSentiment(feedback)
    const sentimentTrend = this.predictSentimentDirection(timeSeriesData)
    if (sentimentTrend.confidence > 0.6) {
      predictions.push({
        type: 'sentiment',
        prediction: `Customer sentiment likely to ${sentimentTrend.direction}`,
        confidence: sentimentTrend.confidence,
        impact: 'high',
        timeline: '60 days'
      })
    }
    
    // Category predictions
    const emergingCategories = this.identifyEmergingCategoryTrends(feedback, trendAnalysis)
    emergingCategories.forEach(category => {
      predictions.push({
        type: 'category',
        prediction: `${category.name} category showing ${category.trend} trend`,
        confidence: category.confidence,
        impact: category.impact,
        timeline: '90 days'
      })
    })
    
    // Risk predictions
    const riskPredictions = this.generateRiskPredictions(feedback, timeSeriesData, trendAnalysis)
    predictions.push(...riskPredictions)
    
    return {
      predictions: predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 10), // Top 10
      summary: this.generatePredictionsSummary(predictions),
      keyInsights: this.extractKeyInsights(predictions),
      actionItems: this.generatePredictionActionItems(predictions)
    }
  }

  // Core forecasting methods

  /**
   * Forecast using linear trend
   * @param {Array} values - Historical values
   * @returns {Object} Linear forecast
   */
  forecastLinearTrend(values) {
    if (values.length < 2) {
      return { predictions: [], confidence: 0, method: 'linear_trend' }
    }
    
    // Calculate linear regression
    const x = values.map((_, i) => i)
    const regression = this.calculateLinearRegression(x, values)
    
    // Generate predictions
    const predictions = []
    const forecastHorizon = this.options.forecastHorizon
    
    for (let i = 1; i <= forecastHorizon; i++) {
      const futureIndex = values.length + i - 1
      const predicted = regression.slope * futureIndex + regression.intercept
      predictions.push(Math.max(0, predicted)) // Ensure non-negative
    }
    
    return {
      predictions,
      confidence: regression.rSquared,
      method: 'linear_trend',
      parameters: {
        slope: regression.slope,
        intercept: regression.intercept,
        rSquared: regression.rSquared
      }
    }
  }

  /**
   * Forecast using exponential smoothing
   * @param {Array} values - Historical values
   * @returns {Object} Exponential smoothing forecast
   */
  forecastExponentialSmoothing(values) {
    if (values.length === 0) {
      return { predictions: [], confidence: 0, method: 'exponential_smoothing' }
    }
    
    const alpha = 0.3 // Smoothing parameter
    let smoothed = values[0]
    
    // Apply exponential smoothing
    for (let i = 1; i < values.length; i++) {
      smoothed = alpha * values[i] + (1 - alpha) * smoothed
    }
    
    // Generate predictions (flat forecast)
    const predictions = new Array(this.options.forecastHorizon).fill(smoothed)
    
    // Calculate confidence based on recent prediction errors
    const recentErrors = this.calculateRecentPredictionErrors(values, smoothed)
    const confidence = Math.max(0, 1 - (recentErrors.mape / 100))
    
    return {
      predictions,
      confidence,
      method: 'exponential_smoothing',
      parameters: {
        alpha,
        finalSmoothed: smoothed
      }
    }
  }

  /**
   * Forecast using seasonal decomposition
   * @param {Array} values - Historical values
   * @param {Object} seasonality - Seasonality information
   * @returns {Object} Seasonal forecast
   */
  forecastSeasonal(values, seasonality) {
    if (!seasonality || !seasonality.detected || values.length < 14) {
      return this.forecastLinearTrend(values) // Fallback to linear trend
    }
    
    // Use detected seasonal patterns for forecasting
    const seasonalPeriod = seasonality.patterns.length > 0 ? seasonality.patterns[0].period : 7
    const predictions = []
    
    for (let i = 1; i <= this.options.forecastHorizon; i++) {
      const seasonalIndex = (values.length + i - 1) % seasonalPeriod
      const historicalSeasonal = values.length >= seasonalPeriod ? 
        values[values.length - seasonalPeriod + seasonalIndex] : values[values.length - 1]
      
      // Apply trend adjustment
      const trendAdjustment = this.calculateTrendAdjustment(values, i)
      const predicted = historicalSeasonal * (1 + trendAdjustment)
      
      predictions.push(Math.max(0, predicted))
    }
    
    return {
      predictions,
      confidence: seasonality.strength,
      method: 'seasonal_decomposition',
      parameters: {
        seasonalPeriod,
        seasonalStrength: seasonality.strength
      }
    }
  }

  /**
   * Forecast using moving average
   * @param {Array} values - Historical values
   * @returns {Object} Moving average forecast
   */
  forecastMovingAverage(values) {
    if (values.length === 0) {
      return { predictions: [], confidence: 0, method: 'moving_average' }
    }
    
    const windowSize = Math.min(7, values.length) // 7-day moving average
    const recentValues = values.slice(-windowSize)
    const average = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length
    
    // Generate flat forecast based on recent average
    const predictions = new Array(this.options.forecastHorizon).fill(average)
    
    // Calculate confidence based on recent volatility
    const recentVolatility = this.calculateVolatility(recentValues)
    const confidence = Math.max(0, 1 - recentVolatility)
    
    return {
      predictions,
      confidence,
      method: 'moving_average',
      parameters: {
        windowSize,
        average,
        volatility: recentVolatility
      }
    }
  }

  /**
   * Create ensemble forecast combining multiple methods
   * @param {Array} forecasts - Array of forecast objects
   * @returns {Object} Ensemble forecast
   */
  createEnsembleForecast(forecasts) {
    const validForecasts = forecasts.filter(f => f.predictions.length > 0)
    
    if (validForecasts.length === 0) {
      return { predictions: [], confidence: 0, method: 'ensemble' }
    }
    
    const predictions = []
    const confidenceWeights = validForecasts.map(f => f.confidence)
    const totalWeight = confidenceWeights.reduce((sum, weight) => sum + weight, 0)
    
    // Normalize weights
    const normalizedWeights = totalWeight > 0 ? 
      confidenceWeights.map(weight => weight / totalWeight) : 
      confidenceWeights.map(() => 1 / confidenceWeights.length)
    
    // Combine predictions using weighted average
    for (let i = 0; i < this.options.forecastHorizon; i++) {
      let weightedSum = 0
      let weightSum = 0
      
      validForecasts.forEach((forecast, index) => {
        if (i < forecast.predictions.length) {
          weightedSum += forecast.predictions[i] * normalizedWeights[index]
          weightSum += normalizedWeights[index]
        }
      })
      
      predictions.push(weightSum > 0 ? weightedSum / weightSum : 0)
    }
    
    // Calculate ensemble confidence
    const averageConfidence = confidenceWeights.reduce((sum, conf) => sum + conf, 0) / confidenceWeights.length
    const diversityBonus = Math.min(0.1, validForecasts.length * 0.02) // Small bonus for method diversity
    const ensembleConfidence = Math.min(1, averageConfidence + diversityBonus)
    
    return {
      predictions,
      confidence: ensembleConfidence,
      method: 'ensemble',
      parameters: {
        methodCount: validForecasts.length,
        weights: normalizedWeights,
        componentMethods: validForecasts.map(f => f.method)
      }
    }
  }

  // Helper methods for data preparation and analysis

  /**
   * Prepare time series data from feedback
   * @param {Array} feedback - Feedback data
   * @returns {Array} Time series data
   */
  prepareTimeSeriesData(feedback) {
    const dailyData = {}
    
    feedback.forEach(item => {
      const date = new Date(item.feedbackDate || item.feedback_date)
      if (isNaN(date.getTime())) return
      
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: date,
          dateKey: dateKey,
          count: 0,
          sentimentScores: []
        }
      }
      
      dailyData[dateKey].count++
      
      const sentimentScore = parseFloat(item.sentimentScore || item.sentiment_score || 0)
      if (!isNaN(sentimentScore)) {
        dailyData[dateKey].sentimentScores.push(sentimentScore)
      }
    })
    
    return Object.values(dailyData)
      .map(dayData => ({
        ...dayData,
        avgSentiment: dayData.sentimentScores.length > 0
          ? dayData.sentimentScores.reduce((sum, score) => sum + score, 0) / dayData.sentimentScores.length
          : 0
      }))
      .sort((a, b) => a.date - b.date)
  }

  /**
   * Calculate linear regression
   * @param {Array} x - X values
   * @param {Array} y - Y values
   * @returns {Object} Regression results
   */
  calculateLinearRegression(x, y) {
    const n = x.length
    const sumX = x.reduce((sum, val) => sum + val, 0)
    const sumY = y.reduce((sum, val) => sum + val, 0)
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0)
    const sumXX = x.reduce((sum, val) => sum + val * val, 0)
    const sumYY = y.reduce((sum, val) => sum + val * val, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate R-squared
    const yMean = sumY / n
    const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0)
    const ssResidual = y.reduce((sum, val, i) => {
      const predicted = slope * x[i] + intercept
      return sum + Math.pow(val - predicted, 2)
    }, 0)
    
    const rSquared = ssTotal !== 0 ? 1 - (ssResidual / ssTotal) : 0
    
    return { slope, intercept, rSquared }
  }

  /**
   * Generate cache key for predictive insights
   * @param {Array} feedback - Feedback data
   * @param {Object} trendAnalysis - Trend analysis
   * @returns {string} Cache key
   */
  generatePredictiveCacheKey(feedback, trendAnalysis) {
    const dataHash = this.simpleHash(JSON.stringify(feedback.slice(0, 50))) // Sample for performance
    const trendHash = this.simpleHash(JSON.stringify(trendAnalysis))
    return `predictive_${dataHash}_${trendHash}`
  }

  /**
   * Simple hash function
   * @param {string} str - String to hash
   * @returns {string} Hash
   */
  simpleHash(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  // Placeholder methods for comprehensive predictive analysis
  // These would contain full implementations in a complete version

  getEmptyPredictiveInsights() {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisType: 'empty'
      },
      keyPredictions: { predictions: [], summary: 'No data available for predictions' }
    }
  }

  getInsufficientDataInsights(dataPoints) {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisType: 'insufficient_data',
        dataPoints,
        minRequired: this.options.minHistoricalData
      },
      keyPredictions: { 
        predictions: [], 
        summary: `Insufficient data for predictions. Need at least ${this.options.minHistoricalData} days, but only ${dataPoints} available.` 
      }
    }
  }

  getErrorPredictiveInsights(errorMessage) {
    return {
      metadata: {
        generatedAt: new Date().toISOString(),
        analysisType: 'error',
        error: errorMessage
      },
      keyPredictions: { predictions: [], summary: `Prediction failed: ${errorMessage}` }
    }
  }

  generateForecastPeriods(lastDate) {
    return [7, 30, 60, 90].map(days => ({
      days,
      endDate: addDays(lastDate, days),
      label: `${days} days`
    }))
  }

  formatForecastResults(forecast, periods, method) {
    return {
      method,
      confidence: forecast.confidence,
      predictions: periods.map((period, index) => ({
        period: period.days,
        endDate: period.endDate,
        predicted: index < forecast.predictions.length ? 
          Math.round(forecast.predictions[index] * 100) / 100 : null
      }))
    }
  }

  selectBestForecastMethod(methods) {
    return methods.reduce((best, current) => 
      current.forecast.confidence > best.forecast.confidence ? current : best
    )
  }

  calculateForecastConfidence(historical, forecast) {
    // Simplified confidence calculation
    return Math.min(1, forecast.confidence * 0.9) // Conservative adjustment
  }

  listForecastAssumptions(trendAnalysis) {
    return [
      'Historical patterns will continue',
      'No major external disruptions',
      'Data quality remains consistent',
      'Seasonal patterns remain stable'
    ]
  }

  calculateVolatility(values) {
    if (values.length <= 1) return 0
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    return mean > 0 ? stdDev / mean : 0
  }

  calculateRecentPredictionErrors(values, predicted) {
    if (values.length < 2) return { mape: 50 }
    
    const recent = values.slice(-5) // Last 5 values
    const errors = recent.map(actual => Math.abs(actual - predicted) / Math.max(actual, 1))
    const mape = (errors.reduce((sum, err) => sum + err, 0) / errors.length) * 100
    
    return { mape }
  }

  calculateTrendAdjustment(values, forecastPeriod) {
    if (values.length < 2) return 0
    
    const recent = values.slice(-7) // Last week
    const older = values.slice(-14, -7) // Previous week
    
    if (older.length === 0) return 0
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const olderAvg = older.reduce((sum, val) => sum + val, 0) / older.length
    
    const weeklyGrowthRate = olderAvg > 0 ? (recentAvg - olderAvg) / olderAvg : 0
    return weeklyGrowthRate * (forecastPeriod / 7) // Scale by forecast period
  }

  // Additional placeholder methods
  forecastSentimentTrend(sentimentData) { return { direction: 'stable', confidence: 0.5 } }
  forecastSentimentVolatility(sentimentData) { return { level: 'moderate', confidence: 0.5 } }
  forecastCategorySentiment(feedback, timeSeriesData) { return {} }
  extrapolateSentiment(sentimentData, days) { return 0.5 }
  calculateSentimentConfidence(sentimentData, days) { return 0.5 }
  calculateSentimentRange(sentimentData, days) { return { min: 0.3, max: 0.7 } }
  identifySentimentRisks(sentimentData, trendForecast) { return [] }
  identifySentimentOpportunities(sentimentData, trendForecast) { return [] }
  predictCategoryTrend(trend) { return { direction: 'stable', magnitude: 0 } }
  assessCategoryRisk(trend, category) { return 'low' }
  generateCategoryRecommendations(trend, category) { return [] }
  identifyEmergingCategories(categoryPredictions) { return [] }
  identifyDecliningCategories(categoryPredictions) { return [] }
  generateCategoryInsights(categoryPredictions) { return [] }
  generateOverallCategoryRecommendations(categoryPredictions) { return [] }
  
  // Risk assessment methods
  assessVolumeRisk(timeSeriesData, trendAnalysis) { return { factors: [], score: 0.3 } }
  assessSentimentRisk(feedback, timeSeriesData) { return { factors: [], score: 0.3 } }
  assessConcentrationRisk(feedback) { return { factors: [], score: 0.3 } }
  assessTrendStabilityRisk(trendAnalysis) { return { factors: [], score: 0.3 } }
  assessDataQualityRisk(feedback) { return { factors: [], score: 0.3 } }
  calculateOverallRiskScore(riskScores) { return 0.3 }
  interpretRiskLevel(score) { return score > 0.7 ? 'high' : score > 0.4 ? 'medium' : 'low' }
  calculateRiskConfidence(riskScores) { return 0.7 }
  generateRiskMitigation(riskFactors) { return [] }
  generateRiskMonitoring(riskFactors) { return [] }
  generateRiskAlerts(riskFactors, overallScore) { return [] }

  // Opportunity identification methods
  identifyVolumeOpportunities(timeSeriesData, trendAnalysis) { return [] }
  identifySentimentOpportunities(feedback, timeSeriesData) { return [] }
  identifyCategoryOpportunities(feedback, trendAnalysis) { return [] }
  identifySourceOpportunities(feedback, trendAnalysis) { return [] }
  identifyProcessOpportunities(feedback) { return [] }
  prioritizeOpportunities(opportunities) { return [] }
  groupOpportunitiesByCategory(opportunities) { return {} }
  identifyQuickWins(opportunities) { return [] }
  identifyStrategicInitiatives(opportunities) { return [] }
  generateOpportunityRecommendations(opportunities) { return [] }

  // Performance projection methods
  projectKPIs(feedback, timeSeriesData, days) { return {} }
  projectOptimisticScenario(feedback, timeSeriesData) { return {} }
  projectRealisticScenario(feedback, timeSeriesData) { return {} }
  projectPessimisticScenario(feedback, timeSeriesData) { return {} }
  projectBenchmarkComparisons(feedback, timeSeriesData) { return {} }
  projectGoalAchievement(feedback, timeSeriesData) { return {} }

  // Confidence and scenario methods
  assessDataQuality(timeSeriesData) { return 0.8 }
  assessTrendStability(trendAnalysis) { return 0.7 }
  assessVolatilityImpact(timeSeriesData) { return 0.6 }
  estimateHistoricalAccuracy(timeSeriesData) { return 0.7 }
  interpretConfidenceLevel(confidence) { return confidence > 0.8 ? 'high' : confidence > 0.5 ? 'medium' : 'low' }
  generateConfidenceRecommendations(confidence) { return [] }

  generateBaselineScenario(timeSeriesData, trendAnalysis) { return { type: 'baseline' } }
  generateOptimisticScenario(timeSeriesData, trendAnalysis) { return { type: 'optimistic' } }
  generatePessimisticScenario(timeSeriesData, trendAnalysis) { return { type: 'pessimistic' } }
  generateStressTestScenario(timeSeriesData, trendAnalysis) { return { type: 'stress_test' } }
  compareScenarios(scenarios) { return {} }
  calculateProbabilityWeightedOutcome(weightedScenarios) { return {} }
  performSensitivityAnalysis(timeSeriesData, trendAnalysis) { return {} }

  // Key predictions methods
  calculateCurrentSentiment(feedback) { return 0.5 }
  predictSentimentDirection(timeSeriesData) { return { direction: 'stable', confidence: 0.5 } }
  identifyEmergingCategoryTrends(feedback, trendAnalysis) { return [] }
  generateRiskPredictions(feedback, timeSeriesData, trendAnalysis) { return [] }
  generatePredictionsSummary(predictions) { return 'No significant trends detected' }
  extractKeyInsights(predictions) { return [] }
  generatePredictionActionItems(predictions) { return [] }

  /**
   * Clear predictive models cache
   */
  clearPredictiveCache() {
    this.modelsCache.clear()
  }
}

export default PredictiveInsights