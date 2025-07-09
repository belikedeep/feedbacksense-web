import { format, parseISO, isValid, subDays, subMonths, differenceInDays, startOfMonth, endOfMonth, eachDayOfInterval, eachMonthOfInterval } from 'date-fns'

/**
 * TrendAnalyzer - Specialized component for trend analysis and pattern detection
 * Provides time series analysis, seasonal patterns, growth rates, and anomaly detection
 */
export class TrendAnalyzer {
  constructor(options = {}) {
    this.options = {
      minDataPoints: 7, // Minimum data points for trend analysis
      seasonalityWindow: 30, // Days to look back for seasonal patterns
      anomalyThreshold: 2, // Standard deviations for anomaly detection
      smoothingFactor: 0.3, // Exponential smoothing factor
      confidenceLevel: 0.95, // Confidence level for statistical tests
      ...options
    }

    // Trend analysis cache
    this.trendCache = new Map()
    this.cacheExpiry = 10 * 60 * 1000 // 10 minutes
  }

  /**
   * Analyze trends in feedback data
   * @param {Array} feedback - Feedback data
   * @param {Object} timeRange - Time range for analysis
   * @returns {Object} Comprehensive trend analysis
   */
  async analyzeTrends(feedback, timeRange = null) {
    try {
      // Validate input data
      if (!feedback || feedback.length === 0) {
        return this.getEmptyTrendAnalysis()
      }

      // Generate cache key
      const cacheKey = this.generateTrendCacheKey(feedback, timeRange)
      
      // Check cache
      if (this.trendCache.has(cacheKey)) {
        const cached = this.trendCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data
        }
      }

      // Prepare time series data
      const timeSeriesData = this.prepareTimeSeriesData(feedback, timeRange)
      
      if (timeSeriesData.length < this.options.minDataPoints) {
        return this.getInsufficientDataAnalysis(timeSeriesData.length)
      }

      // Perform various trend analyses
      const trendAnalysis = {
        metadata: {
          analyzedAt: new Date().toISOString(),
          dataPoints: timeSeriesData.length,
          timeRange: this.getAnalysisTimeRange(timeSeriesData),
          analysisType: 'comprehensive'
        },
        
        // Core trend metrics
        overallTrend: this.calculateOverallTrend(timeSeriesData),
        growthRates: this.calculateGrowthRates(timeSeriesData),
        volatility: this.calculateVolatility(timeSeriesData),
        
        // Time-based analyses
        dailyTrends: this.analyzeDailyTrends(timeSeriesData),
        weeklyTrends: this.analyzeWeeklyTrends(timeSeriesData),
        monthlyTrends: this.analyzeMonthlyTrends(timeSeriesData),
        
        // Pattern detection
        seasonality: this.detectSeasonality(timeSeriesData),
        cyclicPatterns: this.detectCyclicPatterns(timeSeriesData),
        anomalies: this.detectAnomalies(timeSeriesData),
        
        // Sentiment trends
        sentimentTrends: this.analyzeSentimentTrends(feedback, timeSeriesData),
        
        // Category trends
        categoryTrends: this.analyzeCategoryTrends(feedback, timeSeriesData),
        
        // Source trends
        sourceTrends: this.analyzeSourceTrends(feedback, timeSeriesData),
        
        // Forecasting
        forecasts: this.generateForecasts(timeSeriesData),
        
        // Key insights
        insights: this.generateTrendInsights(timeSeriesData)
      }

      // Cache results
      this.trendCache.set(cacheKey, {
        data: trendAnalysis,
        timestamp: Date.now()
      })

      return trendAnalysis

    } catch (error) {
      console.error('Trend Analysis Error:', error)
      return this.getErrorAnalysis(error.message)
    }
  }

  /**
   * Prepare time series data from feedback
   * @param {Array} feedback - Feedback data
   * @param {Object} timeRange - Time range filter
   * @returns {Array} Time series data points
   */
  prepareTimeSeriesData(feedback, timeRange = null) {
    // Filter feedback by time range if provided
    let filteredFeedback = feedback
    if (timeRange && timeRange.start && timeRange.end) {
      filteredFeedback = feedback.filter(item => {
        const date = this.parseDate(item.feedbackDate || item.feedback_date)
        return date && date >= timeRange.start && date <= timeRange.end
      })
    }

    // Group feedback by date
    const dailyData = {}
    
    filteredFeedback.forEach(item => {
      const date = this.parseDate(item.feedbackDate || item.feedback_date)
      if (!date) return
      
      const dateKey = format(date, 'yyyy-MM-dd')
      
      if (!dailyData[dateKey]) {
        dailyData[dateKey] = {
          date: date,
          dateKey: dateKey,
          count: 0,
          sentimentScores: [],
          categories: {},
          sources: {},
          feedback: []
        }
      }
      
      dailyData[dateKey].count++
      dailyData[dateKey].feedback.push(item)
      
      // Track sentiment
      const sentimentScore = parseFloat(item.sentimentScore || item.sentiment_score || 0)
      if (!isNaN(sentimentScore)) {
        dailyData[dateKey].sentimentScores.push(sentimentScore)
      }
      
      // Track categories
      const category = item.category || 'uncategorized'
      dailyData[dateKey].categories[category] = (dailyData[dateKey].categories[category] || 0) + 1
      
      // Track sources
      const source = item.source || 'unknown'
      dailyData[dateKey].sources[source] = (dailyData[dateKey].sources[source] || 0) + 1
    })

    // Convert to array and sort by date
    const timeSeriesData = Object.values(dailyData)
      .map(dayData => ({
        ...dayData,
        avgSentiment: dayData.sentimentScores.length > 0
          ? dayData.sentimentScores.reduce((sum, score) => sum + score, 0) / dayData.sentimentScores.length
          : 0,
        topCategory: this.getTopValue(dayData.categories),
        topSource: this.getTopValue(dayData.sources)
      }))
      .sort((a, b) => a.date - b.date)

    return timeSeriesData
  }

  /**
   * Calculate overall trend direction and strength
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Overall trend analysis
   */
  calculateOverallTrend(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { direction: 'insufficient_data', strength: 0, confidence: 0 }
    }

    // Linear regression for trend line
    const regression = this.calculateLinearRegression(
      timeSeriesData.map((d, i) => i),
      timeSeriesData.map(d => d.count)
    )

    const direction = regression.slope > 0 ? 'increasing' : 
                     regression.slope < 0 ? 'decreasing' : 'stable'
    
    // Calculate trend strength (normalized slope)
    const maxCount = Math.max(...timeSeriesData.map(d => d.count))
    const strength = Math.abs(regression.slope) / (maxCount || 1)
    
    // Calculate confidence based on R-squared
    const confidence = regression.rSquared
    
    return {
      direction,
      strength: Math.round(strength * 1000) / 1000,
      confidence: Math.round(confidence * 1000) / 1000,
      slope: Math.round(regression.slope * 1000) / 1000,
      rSquared: Math.round(regression.rSquared * 1000) / 1000,
      equation: `y = ${regression.slope.toFixed(3)}x + ${regression.intercept.toFixed(3)}`
    }
  }

  /**
   * Calculate linear regression
   * @param {Array} x - X values
   * @param {Array} y - Y values
   * @returns {Object} Regression results
   */
  calculateLinearRegression(x, y) {
    if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length || x.length === 0) {
      return { slope: 0, intercept: 0, rSquared: 0 }
    }

    try {
      const n = x.length
      const sumX = x.reduce((sum, val) => sum + (val || 0), 0)
      const sumY = y.reduce((sum, val) => sum + (val || 0), 0)
      const sumXY = x.reduce((sum, val, i) => sum + (val || 0) * (y[i] || 0), 0)
      const sumXX = x.reduce((sum, val) => sum + (val || 0) * (val || 0), 0)
      const sumYY = y.reduce((sum, val) => sum + (val || 0) * (val || 0), 0)
      
      const denominator = (n * sumXX - sumX * sumX)
      const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0
      const intercept = n > 0 ? (sumY - slope * sumX) / n : 0
      
      // Calculate R-squared
      const yMean = n > 0 ? sumY / n : 0
      const ssTotal = y.reduce((sum, val) => sum + Math.pow((val || 0) - yMean, 2), 0)
      const ssResidual = y.reduce((sum, val, i) => {
        const predicted = slope * (x[i] || 0) + intercept
        return sum + Math.pow((val || 0) - predicted, 2)
      }, 0)
      
      const rSquared = ssTotal !== 0 ? Math.max(0, Math.min(1, 1 - (ssResidual / ssTotal))) : 0
      
      return {
        slope: isFinite(slope) ? slope : 0,
        intercept: isFinite(intercept) ? intercept : 0,
        rSquared: isFinite(rSquared) ? rSquared : 0
      }
    } catch (error) {
      console.error('Error in calculateLinearRegression:', error)
      return { slope: 0, intercept: 0, rSquared: 0 }
    }
  }

  /**
   * Calculate growth rates over different periods
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Growth rate analysis
   */
  calculateGrowthRates(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { daily: 0, weekly: 0, monthly: 0 }
    }

    const growthRates = {
      daily: this.calculateDailyGrowthRate(timeSeriesData),
      weekly: this.calculateWeeklyGrowthRate(timeSeriesData),
      monthly: this.calculateMonthlyGrowthRate(timeSeriesData)
    }

    return growthRates
  }

  /**
   * Calculate daily growth rate
   * @param {Array} timeSeriesData - Time series data
   * @returns {number} Average daily growth rate
   */
  calculateDailyGrowthRate(timeSeriesData) {
    let totalGrowthRate = 0
    let validDays = 0

    for (let i = 1; i < timeSeriesData.length; i++) {
      const previousCount = timeSeriesData[i - 1].count
      const currentCount = timeSeriesData[i].count
      
      if (previousCount > 0) {
        const growthRate = (currentCount - previousCount) / previousCount
        totalGrowthRate += growthRate
        validDays++
      }
    }

    return validDays > 0 ? (totalGrowthRate / validDays) * 100 : 0
  }

  /**
   * Calculate weekly growth rate
   * @param {Array} timeSeriesData - Time series data
   * @returns {number} Average weekly growth rate
   */
  calculateWeeklyGrowthRate(timeSeriesData) {
    if (timeSeriesData.length < 7) return 0

    // Group data by weeks
    const weeklyData = this.groupDataByWeeks(timeSeriesData)
    
    if (weeklyData.length < 2) return 0

    let totalGrowthRate = 0
    let validWeeks = 0

    for (let i = 1; i < weeklyData.length; i++) {
      const previousWeekTotal = weeklyData[i - 1].totalCount
      const currentWeekTotal = weeklyData[i].totalCount
      
      if (previousWeekTotal > 0) {
        const growthRate = (currentWeekTotal - previousWeekTotal) / previousWeekTotal
        totalGrowthRate += growthRate
        validWeeks++
      }
    }

    return validWeeks > 0 ? (totalGrowthRate / validWeeks) * 100 : 0
  }

  /**
   * Calculate monthly growth rate
   * @param {Array} timeSeriesData - Time series data
   * @returns {number} Average monthly growth rate
   */
  calculateMonthlyGrowthRate(timeSeriesData) {
    if (timeSeriesData.length < 30) return 0

    // Group data by months
    const monthlyData = this.groupDataByMonths(timeSeriesData)
    
    if (monthlyData.length < 2) return 0

    let totalGrowthRate = 0
    let validMonths = 0

    for (let i = 1; i < monthlyData.length; i++) {
      const previousMonthTotal = monthlyData[i - 1].totalCount
      const currentMonthTotal = monthlyData[i].totalCount
      
      if (previousMonthTotal > 0) {
        const growthRate = (currentMonthTotal - previousMonthTotal) / previousMonthTotal
        totalGrowthRate += growthRate
        validMonths++
      }
    }

    return validMonths > 0 ? (totalGrowthRate / validMonths) * 100 : 0
  }

  /**
   * Calculate volatility in feedback volume
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Volatility analysis
   */
  calculateVolatility(timeSeriesData) {
    if (timeSeriesData.length < 2) {
      return { coefficient: 0, standardDeviation: 0, meanAbsoluteDeviation: 0 }
    }

    const counts = timeSeriesData.map(d => d.count)
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length
    
    // Standard deviation
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length
    const standardDeviation = Math.sqrt(variance)
    
    // Coefficient of variation
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0
    
    // Mean absolute deviation
    const meanAbsoluteDeviation = counts.reduce((sum, count) => sum + Math.abs(count - mean), 0) / counts.length
    
    return {
      coefficient: Math.round(coefficientOfVariation * 1000) / 1000,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
      meanAbsoluteDeviation: Math.round(meanAbsoluteDeviation * 100) / 100,
      interpretation: this.interpretVolatility(coefficientOfVariation)
    }
  }

  /**
   * Interpret volatility level
   * @param {number} coefficientOfVariation - Coefficient of variation
   * @returns {string} Volatility interpretation
   */
  interpretVolatility(coefficientOfVariation) {
    if (coefficientOfVariation < 0.1) return 'very_low'
    if (coefficientOfVariation < 0.2) return 'low'
    if (coefficientOfVariation < 0.3) return 'moderate'
    if (coefficientOfVariation < 0.5) return 'high'
    return 'very_high'
  }

  /**
   * Analyze daily trends and patterns
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Daily trend analysis
   */
  analyzeDailyTrends(timeSeriesData) {
    const dayOfWeekPatterns = {}
    const dailyAverages = {}
    
    timeSeriesData.forEach(dayData => {
      const dayOfWeek = dayData.date.getDay() // 0 = Sunday, 1 = Monday, etc.
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]
      
      if (!dayOfWeekPatterns[dayName]) {
        dayOfWeekPatterns[dayName] = []
      }
      
      dayOfWeekPatterns[dayName].push(dayData.count)
    })
    
    // Calculate averages for each day of the week
    Object.keys(dayOfWeekPatterns).forEach(dayName => {
      const counts = dayOfWeekPatterns[dayName]
      dailyAverages[dayName] = counts.reduce((sum, count) => sum + count, 0) / counts.length
    })
    
    // Find peak and low days
    const sortedDays = Object.entries(dailyAverages).sort((a, b) => b[1] - a[1])
    
    return {
      dayOfWeekPatterns: dailyAverages,
      peakDay: sortedDays[0] ? { day: sortedDays[0][0], average: Math.round(sortedDays[0][1] * 100) / 100 } : null,
      lowDay: sortedDays[sortedDays.length - 1] ? { 
        day: sortedDays[sortedDays.length - 1][0], 
        average: Math.round(sortedDays[sortedDays.length - 1][1] * 100) / 100 
      } : null,
      weekdayVsWeekend: this.compareWeekdayVsWeekend(dailyAverages)
    }
  }

  /**
   * Compare weekday vs weekend patterns
   * @param {Object} dailyAverages - Daily averages by day name
   * @returns {Object} Weekday vs weekend comparison
   */
  compareWeekdayVsWeekend(dailyAverages) {
    const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const weekends = ['Saturday', 'Sunday']
    
    const weekdayAvg = weekdays.reduce((sum, day) => {
      return sum + (dailyAverages[day] || 0)
    }, 0) / weekdays.length
    
    const weekendAvg = weekends.reduce((sum, day) => {
      return sum + (dailyAverages[day] || 0)
    }, 0) / weekends.length
    
    const difference = weekdayAvg - weekendAvg
    const percentageDifference = weekendAvg > 0 ? (difference / weekendAvg) * 100 : 0
    
    return {
      weekdayAverage: Math.round(weekdayAvg * 100) / 100,
      weekendAverage: Math.round(weekendAvg * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      percentageDifference: Math.round(percentageDifference * 100) / 100,
      pattern: weekdayAvg > weekendAvg ? 'higher_weekdays' : 
               weekdayAvg < weekendAvg ? 'higher_weekends' : 'similar'
    }
  }

  /**
   * Analyze weekly trends
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Weekly trend analysis
   */
  analyzeWeeklyTrends(timeSeriesData) {
    const weeklyData = this.groupDataByWeeks(timeSeriesData)
    
    if (weeklyData.length < 2) {
      return { trend: 'insufficient_data', weeklyData: [] }
    }
    
    // Calculate week-over-week changes
    const weeklyChanges = []
    for (let i = 1; i < weeklyData.length; i++) {
      const previousWeek = weeklyData[i - 1]
      const currentWeek = weeklyData[i]
      const change = currentWeek.totalCount - previousWeek.totalCount
      const percentageChange = previousWeek.totalCount > 0 ? (change / previousWeek.totalCount) * 100 : 0
      
      weeklyChanges.push({
        week: currentWeek.week,
        change,
        percentageChange: Math.round(percentageChange * 100) / 100
      })
    }
    
    // Overall weekly trend
    const avgWeeklyChange = weeklyChanges.reduce((sum, change) => sum + change.percentageChange, 0) / weeklyChanges.length
    
    return {
      weeklyData: weeklyData.map(week => ({
        ...week,
        totalCount: Math.round(week.totalCount * 100) / 100,
        avgSentiment: Math.round(week.avgSentiment * 1000) / 1000
      })),
      weeklyChanges,
      avgWeeklyChange: Math.round(avgWeeklyChange * 100) / 100,
      trend: avgWeeklyChange > 2 ? 'increasing' : avgWeeklyChange < -2 ? 'decreasing' : 'stable'
    }
  }

  /**
   * Analyze monthly trends
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Monthly trend analysis
   */
  analyzeMonthlyTrends(timeSeriesData) {
    const monthlyData = this.groupDataByMonths(timeSeriesData)
    
    if (monthlyData.length < 2) {
      return { trend: 'insufficient_data', monthlyData: [] }
    }
    
    // Calculate month-over-month changes
    const monthlyChanges = []
    for (let i = 1; i < monthlyData.length; i++) {
      const previousMonth = monthlyData[i - 1]
      const currentMonth = monthlyData[i]
      const change = currentMonth.totalCount - previousMonth.totalCount
      const percentageChange = previousMonth.totalCount > 0 ? (change / previousMonth.totalCount) * 100 : 0
      
      monthlyChanges.push({
        month: currentMonth.month,
        change,
        percentageChange: Math.round(percentageChange * 100) / 100
      })
    }
    
    // Overall monthly trend
    const avgMonthlyChange = monthlyChanges.reduce((sum, change) => sum + change.percentageChange, 0) / monthlyChanges.length
    
    return {
      monthlyData: monthlyData.map(month => ({
        ...month,
        totalCount: Math.round(month.totalCount * 100) / 100,
        avgSentiment: Math.round(month.avgSentiment * 1000) / 1000
      })),
      monthlyChanges,
      avgMonthlyChange: Math.round(avgMonthlyChange * 100) / 100,
      trend: avgMonthlyChange > 5 ? 'increasing' : avgMonthlyChange < -5 ? 'decreasing' : 'stable'
    }
  }

  /**
   * Detect seasonal patterns in the data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Seasonality analysis
   */
  detectSeasonality(timeSeriesData) {
    if (timeSeriesData.length < this.options.seasonalityWindow) {
      return { detected: false, reason: 'insufficient_data' }
    }

    // Simple seasonal decomposition
    const seasonalComponents = this.performSeasonalDecomposition(timeSeriesData)
    
    // Detect recurring patterns
    const patterns = this.detectRecurringPatterns(timeSeriesData)
    
    return {
      detected: seasonalComponents.seasonalStrength > 0.3,
      strength: Math.round(seasonalComponents.seasonalStrength * 1000) / 1000,
      patterns: patterns,
      seasonalComponent: seasonalComponents.seasonal,
      trendComponent: seasonalComponents.trend,
      residualComponent: seasonalComponents.residual
    }
  }

  /**
   * Perform basic seasonal decomposition
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Decomposition components
   */
  performSeasonalDecomposition(timeSeriesData) {
    const counts = timeSeriesData.map(d => d.count)
    const length = counts.length
    
    // Calculate trend using moving average
    const windowSize = Math.min(7, Math.floor(length / 4))
    const trend = this.calculateMovingAverage(counts, windowSize)
    
    // Calculate seasonal component (simplified)
    const seasonal = counts.map((count, i) => count - (trend[i] || count))
    
    // Calculate residual
    const residual = counts.map((count, i) => count - (trend[i] || 0) - (seasonal[i] || 0))
    
    // Calculate seasonal strength
    const seasonalVariance = this.calculateVariance(seasonal)
    const residualVariance = this.calculateVariance(residual)
    const seasonalStrength = seasonalVariance > 0 ? seasonalVariance / (seasonalVariance + residualVariance) : 0
    
    return {
      trend,
      seasonal,
      residual,
      seasonalStrength
    }
  }

  /**
   * Detect recurring patterns
   * @param {Array} timeSeriesData - Time series data
   * @returns {Array} Detected patterns
   */
  detectRecurringPatterns(timeSeriesData) {
    const patterns = []
    const counts = timeSeriesData.map(d => d.count)
    
    // Check for weekly patterns (7-day cycle)
    const weeklyPattern = this.detectCyclicPattern(counts, 7)
    if (weeklyPattern.strength > 0.3) {
      patterns.push({
        type: 'weekly',
        period: 7,
        strength: weeklyPattern.strength,
        description: 'Weekly recurring pattern detected'
      })
    }
    
    // Check for monthly patterns (30-day cycle)
    if (counts.length >= 30) {
      const monthlyPattern = this.detectCyclicPattern(counts, 30)
      if (monthlyPattern.strength > 0.2) {
        patterns.push({
          type: 'monthly',
          period: 30,
          strength: monthlyPattern.strength,
          description: 'Monthly recurring pattern detected'
        })
      }
    }
    
    return patterns
  }

  /**
   * Detect cyclic patterns with specific period
   * @param {Array} data - Data array
   * @param {number} period - Expected period length
   * @returns {Object} Pattern detection results
   */
  detectCyclicPattern(data, period) {
    if (data.length < period * 2) {
      return { strength: 0, correlation: 0 }
    }
    
    // Calculate autocorrelation at the given lag (period)
    const correlation = this.calculateAutocorrelation(data, period)
    
    return {
      strength: Math.abs(correlation),
      correlation
    }
  }

  /**
   * Calculate autocorrelation at specific lag
   * @param {Array} data - Data array
   * @param {number} lag - Lag value
   * @returns {number} Autocorrelation coefficient
   */
  calculateAutocorrelation(data, lag) {
    if (data.length < lag + 1) return 0
    
    const n = data.length - lag
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length
    
    let numerator = 0
    let denominator = 0
    
    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean)
    }
    
    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2)
    }
    
    return denominator > 0 ? numerator / denominator : 0
  }

  /**
   * Detect anomalies in the time series
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Anomaly detection results
   */
  detectAnomalies(timeSeriesData) {
    const counts = timeSeriesData.map(d => d.count)
    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length
    const stdDev = Math.sqrt(counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / counts.length)
    
    const threshold = this.options.anomalyThreshold * stdDev
    const anomalies = []
    
    timeSeriesData.forEach((dayData, index) => {
      const deviation = Math.abs(dayData.count - mean)
      if (deviation > threshold) {
        anomalies.push({
          date: dayData.dateKey,
          value: dayData.count,
          expectedRange: {
            min: Math.round((mean - threshold) * 100) / 100,
            max: Math.round((mean + threshold) * 100) / 100
          },
          deviation: Math.round(deviation * 100) / 100,
          type: dayData.count > mean + threshold ? 'spike' : 'drop',
          severity: deviation > threshold * 2 ? 'high' : 'moderate'
        })
      }
    })
    
    return {
      detected: anomalies.length > 0,
      count: anomalies.length,
      anomalies: anomalies.slice(0, 10), // Limit to top 10 anomalies
      threshold: Math.round(threshold * 100) / 100,
      meanValue: Math.round(mean * 100) / 100,
      standardDeviation: Math.round(stdDev * 100) / 100
    }
  }

  /**
   * Analyze sentiment trends over time
   * @param {Array} feedback - Original feedback data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Sentiment trend analysis
   */
  analyzeSentimentTrends(feedback, timeSeriesData) {
    const sentimentTrend = timeSeriesData.map(dayData => ({
      date: dayData.dateKey,
      avgSentiment: Math.round(dayData.avgSentiment * 1000) / 1000,
      sentimentCount: dayData.sentimentScores.length
    }))
    
    // Calculate overall sentiment trend
    const sentimentValues = sentimentTrend.map(d => d.avgSentiment).filter(val => val > 0)
    const overallTrend = sentimentValues.length > 1 ? this.calculateOverallTrend(
      sentimentTrend.map((d, i) => ({ count: d.avgSentiment, date: new Date() }))
    ) : { direction: 'insufficient_data' }
    
    return {
      dailySentiment: sentimentTrend,
      overallTrend: overallTrend,
      sentimentVolatility: this.calculateSentimentVolatility(sentimentValues),
      bestDay: this.findBestSentimentDay(sentimentTrend),
      worstDay: this.findWorstSentimentDay(sentimentTrend)
    }
  }

  /**
   * Calculate sentiment volatility
   * @param {Array} sentimentValues - Array of sentiment values
   * @returns {Object} Sentiment volatility metrics
   */
  calculateSentimentVolatility(sentimentValues) {
    if (sentimentValues.length < 2) {
      return { coefficient: 0, interpretation: 'insufficient_data' }
    }
    
    const mean = sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length
    const variance = sentimentValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / sentimentValues.length
    const stdDev = Math.sqrt(variance)
    const coefficient = mean > 0 ? stdDev / mean : 0
    
    return {
      coefficient: Math.round(coefficient * 1000) / 1000,
      standardDeviation: Math.round(stdDev * 1000) / 1000,
      interpretation: this.interpretVolatility(coefficient)
    }
  }

  /**
   * Find best sentiment day
   * @param {Array} sentimentTrend - Sentiment trend data
   * @returns {Object} Best sentiment day
   */
  findBestSentimentDay(sentimentTrend) {
    const validDays = sentimentTrend.filter(d => d.avgSentiment > 0)
    if (validDays.length === 0) return null
    
    return validDays.reduce((best, current) => 
      current.avgSentiment > best.avgSentiment ? current : best
    )
  }

  /**
   * Find worst sentiment day
   * @param {Array} sentimentTrend - Sentiment trend data
   * @returns {Object} Worst sentiment day
   */
  findWorstSentimentDay(sentimentTrend) {
    const validDays = sentimentTrend.filter(d => d.avgSentiment > 0)
    if (validDays.length === 0) return null
    
    return validDays.reduce((worst, current) => 
      current.avgSentiment < worst.avgSentiment ? current : worst
    )
  }

  /**
   * Analyze category trends over time
   * @param {Array} feedback - Original feedback data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Category trend analysis
   */
  analyzeCategoryTrends(feedback, timeSeriesData) {
    const categoryTimeSeries = {}
    
    // Build time series for each category
    timeSeriesData.forEach(dayData => {
      Object.keys(dayData.categories).forEach(category => {
        if (!categoryTimeSeries[category]) {
          categoryTimeSeries[category] = []
        }
        
        categoryTimeSeries[category].push({
          date: dayData.dateKey,
          count: dayData.categories[category]
        })
      })
    })
    
    // Analyze trends for each category
    const categoryTrends = {}
    Object.keys(categoryTimeSeries).forEach(category => {
      const categoryData = categoryTimeSeries[category]
      if (categoryData.length >= 2) {
        const trend = this.calculateOverallTrend(categoryData)
        categoryTrends[category] = {
          trend: trend.direction,
          strength: trend.strength,
          confidence: trend.confidence,
          dataPoints: categoryData.length,
          timeSeries: categoryData
        }
      }
    })
    
    return categoryTrends
  }

  /**
   * Analyze source trends over time
   * @param {Array} feedback - Original feedback data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Source trend analysis
   */
  analyzeSourceTrends(feedback, timeSeriesData) {
    const sourceTimeSeries = {}
    
    // Build time series for each source
    timeSeriesData.forEach(dayData => {
      Object.keys(dayData.sources).forEach(source => {
        if (!sourceTimeSeries[source]) {
          sourceTimeSeries[source] = []
        }
        
        sourceTimeSeries[source].push({
          date: dayData.dateKey,
          count: dayData.sources[source]
        })
      })
    })
    
    // Analyze trends for each source
    const sourceTrends = {}
    Object.keys(sourceTimeSeries).forEach(source => {
      const sourceData = sourceTimeSeries[source]
      if (sourceData.length >= 2) {
        const trend = this.calculateOverallTrend(sourceData)
        sourceTrends[source] = {
          trend: trend.direction,
          strength: trend.strength,
          confidence: trend.confidence,
          dataPoints: sourceData.length,
          timeSeries: sourceData
        }
      }
    })
    
    return sourceTrends
  }

  /**
   * Generate forecasts based on trend analysis
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Forecast results
   */
  generateForecasts(timeSeriesData) {
    if (timeSeriesData.length < 7) {
      return { available: false, reason: 'insufficient_historical_data' }
    }
    
    // Simple forecasting using linear regression and exponential smoothing
    const counts = timeSeriesData.map(d => d.count)
    const sentiments = timeSeriesData.map(d => d.avgSentiment)
    
    return {
      available: true,
      volume: this.forecastVolume(counts),
      sentiment: this.forecastSentiment(sentiments),
      methodology: 'linear_regression_with_exponential_smoothing',
      confidence: 'medium'
    }
  }

  /**
   * Forecast volume using linear regression
   * @param {Array} counts - Historical counts
   * @returns {Object} Volume forecast
   */
  forecastVolume(counts) {
    if (!counts || !Array.isArray(counts) || counts.length === 0) {
      return [
        { period: '7_days', predicted: 0, confidence: 0 },
        { period: '30_days', predicted: 0, confidence: 0 },
        { period: '90_days', predicted: 0, confidence: 0 }
      ]
    }

    try {
      const x = counts.map((_, i) => i)
      const regression = this.calculateLinearRegression(x, counts)
      
      // Ensure regression results are valid
      if (!regression || typeof regression.slope !== 'number' || typeof regression.intercept !== 'number') {
        return [
          { period: '7_days', predicted: 0, confidence: 0 },
          { period: '30_days', predicted: 0, confidence: 0 },
          { period: '90_days', predicted: 0, confidence: 0 }
        ]
      }
      
      const forecasts = []
      const currentIndex = counts.length
      
      // Forecast next 7, 30, and 90 days
      const periodsToForecast = [7, 30, 90]
      periodsToForecast.forEach(days => {
        const futureIndex = currentIndex + days - 1
        const predicted = regression.slope * futureIndex + regression.intercept
        forecasts.push({
          period: `${days}_days`,
          predicted: Math.max(0, Math.round(predicted * 100) / 100),
          confidence: Math.round((regression.rSquared || 0) * 100)
        })
      })
      
      return forecasts
    } catch (error) {
      console.error('Error in forecastVolume:', error)
      return [
        { period: '7_days', predicted: 0, confidence: 0 },
        { period: '30_days', predicted: 0, confidence: 0 },
        { period: '90_days', predicted: 0, confidence: 0 }
      ]
    }
  }

  /**
   * Forecast sentiment using exponential smoothing
   * @param {Array} sentiments - Historical sentiment values
   * @returns {Object} Sentiment forecast
   */
  forecastSentiment(sentiments) {
    if (!Array.isArray(sentiments) || sentiments.length === 0) {
      return [
        { period: '7_days', predicted: 0, confidence: 0 },
        { period: '30_days', predicted: 0, confidence: 0 },
        { period: '90_days', predicted: 0, confidence: 0 }
      ]
    }

    try {
      const validSentiments = sentiments.filter(s =>
        typeof s === 'number' && !isNaN(s) && isFinite(s) && s > 0
      )
      
      if (validSentiments.length === 0) {
        return [
          { period: '7_days', predicted: 0, confidence: 0 },
          { period: '30_days', predicted: 0, confidence: 0 },
          { period: '90_days', predicted: 0, confidence: 0 }
        ]
      }
      
      // Simple exponential smoothing
      const alpha = Math.max(0.1, Math.min(0.9, this.options.smoothingFactor || 0.3))
      let smoothed = validSentiments[0]
      
      for (let i = 1; i < validSentiments.length; i++) {
        smoothed = alpha * validSentiments[i] + (1 - alpha) * smoothed
      }
      
      // Ensure smoothed value is valid
      if (!isFinite(smoothed) || isNaN(smoothed)) {
        smoothed = validSentiments[validSentiments.length - 1] || 0
      }
      
      // Calculate confidence based on data quality
      const confidence = Math.min(60 + (validSentiments.length * 2), 80)
      
      // Forecast assumes sentiment will continue at current smoothed level
      return [7, 30, 90].map(days => ({
        period: `${days}_days`,
        predicted: Math.round(Math.max(0, smoothed) * 1000) / 1000,
        confidence: Math.round(confidence)
      }))
    } catch (error) {
      console.error('Error in forecastSentiment:', error)
      return [
        { period: '7_days', predicted: 0, confidence: 0 },
        { period: '30_days', predicted: 0, confidence: 0 },
        { period: '90_days', predicted: 0, confidence: 0 }
      ]
    }
  }

  /**
   * Generate trend insights and key findings
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Trend insights
   */
  generateTrendInsights(timeSeriesData) {
    const insights = []
    const keyFindings = []
    
    if (timeSeriesData.length === 0) {
      return { insights: ['No data available for trend analysis'], keyFindings: [] }
    }
    
    // Volume insights
    const totalFeedback = timeSeriesData.reduce((sum, day) => sum + day.count, 0)
    const avgDaily = totalFeedback / timeSeriesData.length
    
    insights.push(`Average daily feedback volume: ${Math.round(avgDaily * 100) / 100}`)
    
    // Peak activity insights
    const maxDay = timeSeriesData.reduce((max, day) => day.count > max.count ? day : max)
    insights.push(`Highest activity day: ${maxDay.dateKey} with ${maxDay.count} feedback entries`)
    
    // Recent trend insights
    if (timeSeriesData.length >= 7) {
      const recentWeek = timeSeriesData.slice(-7)
      const previousWeek = timeSeriesData.slice(-14, -7)
      
      if (previousWeek.length === 7) {
        const recentAvg = recentWeek.reduce((sum, day) => sum + day.count, 0) / 7
        const previousAvg = previousWeek.reduce((sum, day) => sum + day.count, 0) / 7
        const change = ((recentAvg - previousAvg) / previousAvg) * 100
        
        if (Math.abs(change) > 10) {
          const direction = change > 0 ? 'increased' : 'decreased'
          insights.push(`Feedback volume has ${direction} by ${Math.abs(change).toFixed(1)}% in the last week`)
          keyFindings.push({
            type: 'volume_change',
            change: Math.round(change * 10) / 10,
            direction,
            significance: Math.abs(change) > 25 ? 'high' : 'moderate'
          })
        }
      }
    }
    
    return { insights, keyFindings }
  }

  // Helper methods
  
  /**
   * Parse date string or object to Date
   * @param {string|Date} dateInput - Date input
   * @returns {Date|null} Parsed date or null if invalid
   */
  parseDate(dateInput) {
    if (!dateInput) return null
    
    let date
    if (typeof dateInput === 'string') {
      date = dateInput.includes('T') ? parseISO(dateInput) : parseISO(dateInput + 'T00:00:00.000Z')
    } else {
      date = new Date(dateInput)
    }
    
    return isValid(date) ? date : null
  }

  /**
   * Get top value from object
   * @param {Object} obj - Object with numeric values
   * @returns {string|null} Key with highest value
   */
  getTopValue(obj) {
    const entries = Object.entries(obj)
    if (entries.length === 0) return null
    
    return entries.reduce((max, entry) => entry[1] > max[1] ? entry : max)[0]
  }

  /**
   * Group data by weeks
   * @param {Array} timeSeriesData - Time series data
   * @returns {Array} Weekly grouped data
   */
  groupDataByWeeks(timeSeriesData) {
    const weeks = {}
    
    timeSeriesData.forEach(dayData => {
      const date = dayData.date
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      const weekKey = format(weekStart, 'yyyy-MM-dd')
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          week: weekKey,
          weekStart: weekStart,
          totalCount: 0,
          sentimentScores: [],
          days: []
        }
      }
      
      weeks[weekKey].totalCount += dayData.count
      weeks[weekKey].sentimentScores.push(...dayData.sentimentScores)
      weeks[weekKey].days.push(dayData)
    })
    
    return Object.values(weeks).map(week => ({
      ...week,
      avgSentiment: week.sentimentScores.length > 0
        ? week.sentimentScores.reduce((sum, score) => sum + score, 0) / week.sentimentScores.length
        : 0,
      dayCount: week.days.length
    })).sort((a, b) => a.weekStart - b.weekStart)
  }

  /**
   * Group data by months
   * @param {Array} timeSeriesData - Time series data
   * @returns {Array} Monthly grouped data
   */
  groupDataByMonths(timeSeriesData) {
    const months = {}
    
    timeSeriesData.forEach(dayData => {
      const monthKey = format(dayData.date, 'yyyy-MM')
      
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          monthStart: startOfMonth(dayData.date),
          totalCount: 0,
          sentimentScores: [],
          days: []
        }
      }
      
      months[monthKey].totalCount += dayData.count
      months[monthKey].sentimentScores.push(...dayData.sentimentScores)
      months[monthKey].days.push(dayData)
    })
    
    return Object.values(months).map(month => ({
      ...month,
      avgSentiment: month.sentimentScores.length > 0
        ? month.sentimentScores.reduce((sum, score) => sum + score, 0) / month.sentimentScores.length
        : 0,
      dayCount: month.days.length
    })).sort((a, b) => a.monthStart - b.monthStart)
  }

  /**
   * Calculate moving average
   * @param {Array} data - Data array
   * @param {number} windowSize - Window size for moving average
   * @returns {Array} Moving average values
   */
  calculateMovingAverage(data, windowSize) {
    const result = []
    
    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - Math.floor(windowSize / 2))
      const end = Math.min(data.length, i + Math.ceil(windowSize / 2))
      const window = data.slice(start, end)
      const avg = window.reduce((sum, val) => sum + val, 0) / window.length
      result.push(avg)
    }
    
    return result
  }

  /**
   * Calculate variance
   * @param {Array} data - Data array
   * @returns {number} Variance
   */
  calculateVariance(data) {
    if (data.length === 0) return 0
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length
    return data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
  }

  /**
   * Get analysis time range
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Time range information
   */
  getAnalysisTimeRange(timeSeriesData) {
    if (timeSeriesData.length === 0) {
      return { start: null, end: null, days: 0 }
    }
    
    const startDate = timeSeriesData[0].date
    const endDate = timeSeriesData[timeSeriesData.length - 1].date
    const days = differenceInDays(endDate, startDate) + 1
    
    return {
      start: format(startDate, 'yyyy-MM-dd'),
      end: format(endDate, 'yyyy-MM-dd'),
      days
    }
  }

  /**
   * Generate cache key for trend analysis
   * @param {Array} feedback - Feedback data
   * @param {Object} timeRange - Time range
   * @returns {string} Cache key
   */
  generateTrendCacheKey(feedback, timeRange) {
    const dataHash = this.simpleHash(JSON.stringify(feedback.slice(0, 50))) // Sample for performance
    const timeRangeHash = timeRange ? this.simpleHash(JSON.stringify(timeRange)) : 'all'
    return `trend_${dataHash}_${timeRangeHash}`
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

  /**
   * Get empty trend analysis result
   * @returns {Object} Empty analysis
   */
  getEmptyTrendAnalysis() {
    return {
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataPoints: 0,
        analysisType: 'empty'
      },
      overallTrend: { direction: 'no_data', strength: 0, confidence: 0 },
      insights: { insights: ['No feedback data available for trend analysis'], keyFindings: [] }
    }
  }

  /**
   * Get insufficient data analysis result
   * @param {number} dataPoints - Number of data points available
   * @returns {Object} Insufficient data analysis
   */
  getInsufficientDataAnalysis(dataPoints) {
    return {
      metadata: {
        analyzedAt: new Date().toISOString(),
        dataPoints,
        analysisType: 'insufficient_data',
        minimumRequired: this.options.minDataPoints
      },
      overallTrend: { direction: 'insufficient_data', strength: 0, confidence: 0 },
      insights: { 
        insights: [`Insufficient data for trend analysis. Need at least ${this.options.minDataPoints} data points, but only ${dataPoints} available.`],
        keyFindings: []
      }
    }
  }

  /**
   * Get error analysis result
   * @param {string} errorMessage - Error message
   * @returns {Object} Error analysis
   */
  getErrorAnalysis(errorMessage) {
    return {
      metadata: {
        analyzedAt: new Date().toISOString(),
        analysisType: 'error',
        error: errorMessage
      },
      overallTrend: { direction: 'error', strength: 0, confidence: 0 },
      insights: { insights: [`Trend analysis failed: ${errorMessage}`], keyFindings: [] }
    }
  }

  /**
   * Detect cyclic patterns in data
   * @param {Array} timeSeriesData - Time series data
   * @returns {Object} Cyclic pattern analysis
   */
  detectCyclicPatterns(timeSeriesData) {
    if (timeSeriesData.length < 14) {
      return { detected: false, reason: 'insufficient_data_for_cycle_detection' }
    }

    const counts = timeSeriesData.map(d => d.count)
    const patterns = []

    // Check for common cycles
    const cyclesToCheck = [7, 14, 30] // Weekly, bi-weekly, monthly
    
    cyclesToCheck.forEach(cycle => {
      if (counts.length >= cycle * 2) {
        const pattern = this.detectCyclicPattern(counts, cycle)
        if (pattern.strength > 0.3) {
          patterns.push({
            cycle,
            strength: Math.round(pattern.strength * 1000) / 1000,
            correlation: Math.round(pattern.correlation * 1000) / 1000,
            description: this.describeCycle(cycle)
          })
        }
      }
    })

    return {
      detected: patterns.length > 0,
      patterns,
      strongestPattern: patterns.length > 0 ? patterns.reduce((max, p) => p.strength > max.strength ? p : max) : null
    }
  }

  /**
   * Describe cycle based on period
   * @param {number} cycle - Cycle period
   * @returns {string} Cycle description
   */
  describeCycle(cycle) {
    switch (cycle) {
      case 7: return 'Weekly pattern (7-day cycle)'
      case 14: return 'Bi-weekly pattern (14-day cycle)'
      case 30: return 'Monthly pattern (30-day cycle)'
      default: return `${cycle}-day cycle`
    }
  }

  /**
   * Clear trend analysis cache
   */
  clearTrendCache() {
    this.trendCache.clear()
  }
}

export default TrendAnalyzer