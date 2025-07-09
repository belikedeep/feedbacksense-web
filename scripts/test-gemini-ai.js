#!/usr/bin/env node

/**
 * Test script for Gemini AI integration
 * Usage: node scripts/test-gemini-ai.js
 */

import dotenv from 'dotenv';
import { categorizeFeedback, getUsageStats } from '../lib/geminiAI.js';

// Load environment variables
dotenv.config({ path: '.env.local' });
import { analyzeAndCategorizeFeedback } from '../lib/sentimentAnalysis.js';

// Test feedback samples
const testFeedbacks = [
  "The product is amazing! I love the new features you added.",
  "The app keeps crashing when I try to upload files. This is very frustrating.",
  "My order arrived 3 days late and the package was damaged.",
  "Could you please add a dark mode feature? It would be really helpful.",
  "The customer service representative was very rude and unhelpful.",
  "I would like to request a refund for my recent purchase.",
  "The product quality is terrible. The material feels very cheap.",
  "How do I reset my password? I can't seem to find the option."
];

async function runTests() {
  console.log('🧪 Testing Gemini AI Integration\n');
  
  try {
    // Test usage stats
    console.log('📊 Current Usage Stats:');
    console.log(JSON.stringify(getUsageStats(), null, 2));
    console.log('');
    
    // Test individual categorization
    console.log('🔍 Testing Individual Categorization:\n');
    
    for (let i = 0; i < Math.min(3, testFeedbacks.length); i++) {
      const feedback = testFeedbacks[i];
      console.log(`Testing: "${feedback}"`);
      
      try {
        const result = await categorizeFeedback(feedback);
        console.log('✅ Result:', {
          category: result.category,
          confidence: result.confidence,
          reasoning: result.reasoning
        });
      } catch (error) {
        console.log('❌ Error:', error.message);
      }
      
      console.log('');
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test enhanced analysis
    console.log('🔬 Testing Enhanced Analysis (Sentiment + AI):\n');
    
    const enhancedTest = testFeedbacks[0];
    console.log(`Testing: "${enhancedTest}"`);
    
    try {
      const enhancedResult = await analyzeAndCategorizeFeedback(enhancedTest);
      console.log('✅ Enhanced Analysis Result:', {
        sentimentLabel: enhancedResult.sentimentLabel,
        sentimentScore: enhancedResult.sentimentScore,
        aiCategory: enhancedResult.aiCategory,
        aiCategoryConfidence: enhancedResult.aiCategoryConfidence,
        topics: enhancedResult.topics
      });
    } catch (error) {
      console.log('❌ Enhanced Analysis Error:', error.message);
    }
    
    console.log('\n📊 Final Usage Stats:');
    console.log(JSON.stringify(getUsageStats(), null, 2));
    
  } catch (error) {
    console.error('🚨 Test Suite Error:', error);
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { runTests };