#!/usr/bin/env node

/**
 * Test script for AI Categorization System Enhancements
 * 
 * This script tests all the enhanced features:
 * - Custom category management
 * - Enhanced AI categorization
 * - Bulk re-categorization
 * - Performance metrics
 * - User feedback integration
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
config({ path: join(projectRoot, '.env.local') });

// Import enhanced modules
import { 
  categorizeFeedback, 
  batchCategorizeFeedback,
  recordUserFeedback,
  getAIPerformanceMetrics
} from '../lib/geminiAI.js';
import { 
  analyzeAndCategorizeFeedback,
  batchAnalyzeAndCategorizeFeedback 
} from '../lib/sentimentAnalysis.js';

// Test data for various scenarios
const testFeedback = [
  {
    id: 'test_1',
    content: 'The app keeps crashing when I try to upload photos. This is very frustrating and needs to be fixed immediately.',
    expectedCategory: 'bug_report'
  },
  {
    id: 'test_2',
    content: 'I would love to see a dark mode feature added to the app. It would make using it at night much easier.',
    expectedCategory: 'feature_request'
  },
  {
    id: 'test_3',
    content: 'My package arrived 3 days late and the box was damaged. The product inside was fortunately okay.',
    expectedCategory: 'shipping_complaint'
  },
  {
    id: 'test_4',
    content: 'Excellent customer service! Sarah was very helpful and resolved my issue quickly. Thank you!',
    expectedCategory: 'compliment'
  },
  {
    id: 'test_5',
    content: 'The material quality seems cheap and flimsy. For the price I paid, I expected much better construction.',
    expectedCategory: 'product_quality'
  },
  {
    id: 'test_6',
    content: 'I need help canceling my subscription and getting a refund for this month.',
    expectedCategory: 'refund_request'
  },
  {
    id: 'test_7',
    content: 'How do I change my email address in my account settings?',
    expectedCategory: 'general_inquiry'
  },
  {
    id: 'test_8',
    content: 'The support team was very rude and unhelpful. I waited 2 hours on chat and got no resolution.',
    expectedCategory: 'customer_service'
  }
];

// Custom category for testing
const testCustomCategory = {
  id: 'website_feedback',
  name: 'Website Feedback',
  description: 'Feedback specifically about website functionality, design, and user experience',
  keywords: 'website,ui,interface,design,navigation,layout,responsive,mobile,desktop',
  color: '#6366F1',
  isActive: true
};

class AIEnhancementsTestSuite {
  constructor() {
    this.results = {
      individualTests: [],
      batchTests: [],
      customCategoryTests: [],
      performanceTests: [],
      errors: []
    };
    this.startTime = Date.now();
  }

  log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  error(message, error) {
    const errorMessage = `❌ ${message}: ${error.message}`;
    console.error(errorMessage);
    this.results.errors.push(errorMessage);
  }

  success(message) {
    console.log(`✅ ${message}`);
  }

  async runAllTests() {
    this.log('🚀 Starting AI Categorization Enhancements Test Suite');
    console.log('=' * 60);

    try {
      await this.testIndividualCategorization();
      await this.testBatchCategorization();
      await this.testCustomCategories();
      await this.testEnhancedSentimentAnalysis();
      await this.testUserFeedbackIntegration();
      await this.testPerformanceMetrics();
      await this.testConfidenceScoring();
      await this.testErrorHandling();
      
      this.generateReport();
    } catch (error) {
      this.error('Test suite execution failed', error);
    }
  }

  async testIndividualCategorization() {
    this.log('📝 Testing Individual AI Categorization...');
    
    for (const testItem of testFeedback) {
      try {
        const result = await categorizeFeedback(testItem.content);
        
        const testResult = {
          id: testItem.id,
          input: testItem.content.substring(0, 50) + '...',
          expected: testItem.expectedCategory,
          actual: result.category,
          confidence: result.confidence,
          reasoning: result.reasoning,
          method: result.method,
          keyIndicators: result.keyIndicators || [],
          isCorrect: result.category === testItem.expectedCategory,
          timestamp: new Date().toISOString()
        };
        
        this.results.individualTests.push(testResult);
        
        if (testResult.isCorrect) {
          this.success(`Individual test ${testItem.id}: ${result.category} (${Math.round(result.confidence * 100)}% confidence)`);
        } else {
          this.log(`⚠️  Individual test ${testItem.id}: Expected ${testItem.expectedCategory}, got ${result.category} (${Math.round(result.confidence * 100)}% confidence)`);
        }
        
        // Small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        this.error(`Individual categorization test ${testItem.id}`, error);
      }
    }
  }

  async testBatchCategorization() {
    this.log('📦 Testing Batch AI Categorization...');
    
    try {
      const batchTexts = testFeedback.map(item => item.content);
      const startTime = Date.now();
      
      const results = await batchCategorizeFeedback(batchTexts, 5); // Small batch size for testing
      const processingTime = Date.now() - startTime;
      
      const batchResult = {
        totalItems: batchTexts.length,
        processingTime,
        averageTimePerItem: processingTime / batchTexts.length,
        results: results.map((result, index) => ({
          id: testFeedback[index].id,
          expected: testFeedback[index].expectedCategory,
          actual: result.category,
          confidence: result.confidence,
          isCorrect: result.category === testFeedback[index].expectedCategory
        }))
      };
      
      this.results.batchTests.push(batchResult);
      
      const correctCount = batchResult.results.filter(r => r.isCorrect).length;
      const accuracy = correctCount / batchResult.results.length;
      
      this.success(`Batch categorization: ${correctCount}/${batchResult.results.length} correct (${Math.round(accuracy * 100)}% accuracy) in ${processingTime}ms`);
      
    } catch (error) {
      this.error('Batch categorization test', error);
    }
  }

  async testCustomCategories() {
    this.log('🎯 Testing Custom Category Integration...');
    
    try {
      // Simulate adding a custom category
      if (typeof window !== 'undefined') {
        const existingCategories = JSON.parse(localStorage.getItem('feedbacksense_custom_categories') || '[]');
        const updatedCategories = [...existingCategories, testCustomCategory];
        localStorage.setItem('feedbacksense_custom_categories', JSON.stringify(updatedCategories));
      }
      
      // Test with website-specific feedback
      const websiteFeedback = [
        'The website navigation is confusing and hard to use on mobile devices',
        'I love the new responsive design! The interface looks great on my tablet.',
        'The website loads very slowly and some buttons don\'t work properly'
      ];
      
      for (const feedback of websiteFeedback) {
        try {
          const result = await categorizeFeedback(feedback);
          
          this.results.customCategoryTests.push({
            input: feedback,
            category: result.category,
            confidence: result.confidence,
            method: result.method,
            isCustomCategory: result.category === 'website_feedback'
          });
          
          this.log(`Custom category test: ${result.category} (${Math.round(result.confidence * 100)}% confidence)`);
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.error('Custom category test', error);
        }
      }
      
    } catch (error) {
      this.error('Custom category integration test', error);
    }
  }

  async testEnhancedSentimentAnalysis() {
    this.log('💭 Testing Enhanced Sentiment Analysis...');
    
    try {
      const testText = testFeedback[0].content;
      const result = await analyzeAndCategorizeFeedback(testText);
      
      this.log(`Enhanced analysis result:`);
      this.log(`  - Sentiment: ${result.sentimentLabel} (${Math.round(result.sentimentScore * 100)}%)`);
      this.log(`  - AI Category: ${result.aiCategory} (${Math.round(result.aiCategoryConfidence * 100)}%)`);
      this.log(`  - Topics: ${result.topics.join(', ')}`);
      this.log(`  - Reasoning: ${result.aiReasoning}`);
      
      this.success('Enhanced sentiment analysis integration');
      
    } catch (error) {
      this.error('Enhanced sentiment analysis test', error);
    }
  }

  async testUserFeedbackIntegration() {
    this.log('👤 Testing User Feedback Integration...');
    
    try {
      // Simulate user corrections
      const testCorrections = [
        {
          text: 'This is a test feedback',
          aiPrediction: 'general_inquiry',
          userCorrection: 'feature_request',
          confidence: 0.7
        },
        {
          text: 'Another test feedback',
          aiPrediction: 'bug_report',
          userCorrection: 'bug_report',
          confidence: 0.9
        }
      ];
      
      for (const correction of testCorrections) {
        recordUserFeedback(
          correction.text,
          correction.aiPrediction,
          correction.userCorrection,
          correction.confidence
        );
      }
      
      // Get performance metrics
      const metrics = getAIPerformanceMetrics();
      
      this.log(`User feedback metrics:`);
      this.log(`  - Total feedback: ${metrics.totalFeedback}`);
      this.log(`  - Accuracy: ${Math.round(metrics.accuracy * 100)}%`);
      this.log(`  - Average confidence: ${Math.round(metrics.averageConfidence * 100)}%`);
      this.log(`  - Correct predictions: ${metrics.correctPredictions}`);
      
      if (metrics.improvementSuggestions.length > 0) {
        this.log(`  - Suggestions: ${metrics.improvementSuggestions.join(', ')}`);
      }
      
      this.success('User feedback integration');
      
    } catch (error) {
      this.error('User feedback integration test', error);
    }
  }

  async testPerformanceMetrics() {
    this.log('📊 Testing Performance Metrics...');
    
    try {
      const metrics = getAIPerformanceMetrics();
      
      this.results.performanceTests.push({
        totalFeedback: metrics.totalFeedback,
        accuracy: metrics.accuracy,
        averageConfidence: metrics.averageConfidence,
        correctPredictions: metrics.correctPredictions,
        improvementSuggestions: metrics.improvementSuggestions
      });
      
      this.success(`Performance metrics calculated: ${metrics.totalFeedback} total feedback items`);
      
    } catch (error) {
      this.error('Performance metrics test', error);
    }
  }

  async testConfidenceScoring() {
    this.log('🎯 Testing Enhanced Confidence Scoring...');
    
    try {
      const confidenceTests = [
        'The app crashes every time I open it - this is a critical bug!', // Should be high confidence
        'I have a question about something', // Should be lower confidence
        'The website navigation could use some improvements' // Medium confidence
      ];
      
      for (const text of confidenceTests) {
        try {
          const result = await categorizeFeedback(text);
          
          this.log(`Confidence test: "${text.substring(0, 40)}..." → ${result.confidence.toFixed(2)} confidence`);
          
          if (result.keyIndicators && result.keyIndicators.length > 0) {
            this.log(`  - Key indicators: ${result.keyIndicators.join(', ')}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.error('Confidence scoring test', error);
        }
      }
      
      this.success('Enhanced confidence scoring');
      
    } catch (error) {
      this.error('Confidence scoring test', error);
    }
  }

  async testErrorHandling() {
    this.log('🛡️  Testing Error Handling...');
    
    try {
      // Test with invalid input
      const invalidInputs = ['', null, undefined, ' '.repeat(10)];
      
      for (const input of invalidInputs) {
        try {
          await categorizeFeedback(input);
          this.log(`⚠️  Expected error for invalid input: ${JSON.stringify(input)}`);
        } catch (error) {
          this.success(`Properly handled invalid input: ${JSON.stringify(input)}`);
        }
      }
      
      // Test batch with mixed valid/invalid inputs
      try {
        const mixedInputs = ['Valid feedback text', '', 'Another valid feedback'];
        await batchCategorizeFeedback(mixedInputs);
        this.success('Handled mixed valid/invalid batch inputs');
      } catch (error) {
        this.log(`Batch error handling: ${error.message}`);
      }
      
    } catch (error) {
      this.error('Error handling test', error);
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalTime = endTime - this.startTime;
    
    console.log('\n' + '=' * 60);
    console.log('📋 AI CATEGORIZATION ENHANCEMENTS TEST REPORT');
    console.log('=' * 60);
    
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`);
    console.log(`📝 Total errors: ${this.results.errors.length}`);
    
    // Individual test results
    if (this.results.individualTests.length > 0) {
      const correctIndividual = this.results.individualTests.filter(t => t.isCorrect).length;
      const individualAccuracy = correctIndividual / this.results.individualTests.length;
      const avgConfidence = this.results.individualTests.reduce((sum, t) => sum + t.confidence, 0) / this.results.individualTests.length;
      
      console.log(`\n📝 Individual Tests:`);
      console.log(`   - Total: ${this.results.individualTests.length}`);
      console.log(`   - Correct: ${correctIndividual}`);
      console.log(`   - Accuracy: ${Math.round(individualAccuracy * 100)}%`);
      console.log(`   - Average Confidence: ${Math.round(avgConfidence * 100)}%`);
    }
    
    // Batch test results
    if (this.results.batchTests.length > 0) {
      const batchTest = this.results.batchTests[0];
      const batchAccuracy = batchTest.results.filter(r => r.isCorrect).length / batchTest.results.length;
      
      console.log(`\n📦 Batch Tests:`);
      console.log(`   - Items processed: ${batchTest.totalItems}`);
      console.log(`   - Processing time: ${batchTest.processingTime}ms`);
      console.log(`   - Avg time per item: ${Math.round(batchTest.averageTimePerItem)}ms`);
      console.log(`   - Accuracy: ${Math.round(batchAccuracy * 100)}%`);
    }
    
    // Custom category tests
    if (this.results.customCategoryTests.length > 0) {
      const customCategoryDetected = this.results.customCategoryTests.filter(t => t.isCustomCategory).length;
      
      console.log(`\n🎯 Custom Category Tests:`);
      console.log(`   - Total tests: ${this.results.customCategoryTests.length}`);
      console.log(`   - Custom category detected: ${customCategoryDetected}`);
    }
    
    // Performance metrics
    if (this.results.performanceTests.length > 0) {
      const perfTest = this.results.performanceTests[0];
      
      console.log(`\n📊 Performance Metrics:`);
      console.log(`   - Total feedback tracked: ${perfTest.totalFeedback}`);
      console.log(`   - Overall accuracy: ${Math.round(perfTest.accuracy * 100)}%`);
      console.log(`   - Average confidence: ${Math.round(perfTest.averageConfidence * 100)}%`);
      console.log(`   - Improvement suggestions: ${perfTest.improvementSuggestions.length}`);
    }
    
    // Errors
    if (this.results.errors.length > 0) {
      console.log(`\n❌ Errors Encountered:`);
      this.results.errors.forEach(error => console.log(`   ${error}`));
    }
    
    console.log('\n' + '=' * 60);
    
    if (this.results.errors.length === 0) {
      console.log('🎉 All tests completed successfully!');
    } else {
      console.log(`⚠️  Tests completed with ${this.results.errors.length} errors.`);
    }
    
    console.log('=' * 60);
  }
}

// Run the test suite
async function main() {
  const testSuite = new AIEnhancementsTestSuite();
  await testSuite.runAllTests();
}

// Handle command line execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Test suite failed:', error);
    process.exit(1);
  });
}

export default AIEnhancementsTestSuite;