#!/usr/bin/env node

/**
 * Test script for AI integration
 * Tests the enhanced sentiment analysis with Gemini AI categorization
 */

import { analyzeAndCategorizeFeedback, reanalyzeFeedback } from '../lib/sentimentAnalysis.js';
import { categorizeFeedback, batchCategorizeFeedback } from '../lib/geminiAI.js';

// Test feedback samples
const testFeedbacks = [
  "The app keeps crashing when I try to upload photos. This is really frustrating!",
  "I love the new dark mode feature! It's exactly what I needed.",
  "My order arrived 3 days late and the package was damaged.",
  "The customer service team was incredibly helpful and resolved my issue quickly.",
  "I'd like to request a feature to export data to CSV format.",
  "The product quality is poor - the material feels cheap and flimsy.",
  "Can I get a refund for my recent purchase? I'm not satisfied.",
  "Thank you for the amazing service! Everything was perfect."
];

async function testSingleAnalysis() {
  console.log('\n🧪 Testing Single Feedback Analysis\n');
  
  const testText = testFeedbacks[0];
  console.log(`Analyzing: "${testText}"`);
  
  try {
    const result = await analyzeAndCategorizeFeedback(testText);
    
    console.log('\n📊 Analysis Results:');
    console.log(`Category: ${result.aiCategory}`);
    console.log(`Confidence: ${Math.round(result.aiCategoryConfidence * 100)}%`);
    console.log(`Sentiment: ${result.sentimentLabel} (${Math.round(result.sentimentScore * 100)}%)`);
    console.log(`Topics: ${result.topics.join(', ')}`);
    console.log(`Reasoning: ${result.aiReasoning}`);
    
    console.log('\n📝 Database Fields:');
    console.log(`aiCategoryConfidence: ${result.aiCategoryConfidence}`);
    console.log(`aiClassificationMeta: ${JSON.stringify(result.classificationMeta, null, 2)}`);
    console.log(`classificationHistory: ${JSON.stringify(result.historyEntry, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Single analysis failed:', error.message);
  }
}

async function testBatchAnalysis() {
  console.log('\n🧪 Testing Batch Analysis\n');
  
  try {
    const results = await batchCategorizeFeedback(testFeedbacks);
    
    console.log('📊 Batch Results:');
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${testFeedbacks[index]}`);
      console.log(`   → ${result.category} (${Math.round(result.confidence * 100)}%)`);
      console.log(`   → ${result.reasoning}\n`);
    });
    
  } catch (error) {
    console.error('❌ Batch analysis failed:', error.message);
  }
}

async function testReanalysis() {
  console.log('\n🧪 Testing Re-analysis with History\n');
  
  const testText = testFeedbacks[1];
  console.log(`Re-analyzing: "${testText}"`);
  
  try {
    // Simulate existing history
    const existingHistory = [
      {
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        category: 'general_inquiry',
        confidence: 0.7,
        method: 'ai_classification',
        reasoning: 'Initial AI classification'
      }
    ];
    
    const result = await reanalyzeFeedback(testText, existingHistory);
    
    console.log('\n📊 Re-analysis Results:');
    console.log(`New Category: ${result.aiCategory}`);
    console.log(`New Confidence: ${Math.round(result.aiCategoryConfidence * 100)}%`);
    console.log(`Classification History (${result.classificationHistory.length} entries):`);
    
    result.classificationHistory.forEach((entry, index) => {
      console.log(`  ${index + 1}. ${entry.category} - ${entry.method} (${Math.round(entry.confidence * 100)}%)`);
      console.log(`     ${entry.reasoning}`);
      console.log(`     ${new Date(entry.timestamp).toLocaleString()}\n`);
    });
    
  } catch (error) {
    console.error('❌ Re-analysis failed:', error.message);
  }
}

async function testFallbackScenario() {
  console.log('\n🧪 Testing Fallback Scenario\n');
  
  // Temporarily disable Gemini API to test fallback
  const originalApiKey = process.env.GOOGLE_GEMINI_API_KEY;
  process.env.GOOGLE_GEMINI_API_KEY = '';
  
  try {
    const result = await analyzeAndCategorizeFeedback(testFeedbacks[2]);
    
    console.log('📊 Fallback Results:');
    console.log(`Category: ${result.aiCategory}`);
    console.log(`Confidence: ${Math.round(result.aiCategoryConfidence * 100)}%`);
    console.log(`Reasoning: ${result.aiReasoning}`);
    console.log(`Fallback metadata: ${JSON.stringify(result.classificationMeta.aiClassification, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Fallback test failed:', error.message);
  } finally {
    // Restore API key
    process.env.GOOGLE_GEMINI_API_KEY = originalApiKey;
  }
}

async function runAllTests() {
  console.log('🚀 Starting AI Integration Tests');
  console.log('='.repeat(50));
  
  await testSingleAnalysis();
  await testBatchAnalysis();
  await testReanalysis();
  await testFallbackScenario();
  
  console.log('\n✅ All tests completed!');
  console.log('='.repeat(50));
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}

export { runAllTests };