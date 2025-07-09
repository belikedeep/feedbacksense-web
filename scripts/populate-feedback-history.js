#!/usr/bin/env node

/**
 * Script to populate userFeedbackHistory with test data for AI performance metrics
 */

import { recordUserFeedback, getAIPerformanceMetrics } from '../lib/geminiAI.js';

// Test data for user feedback history
const testFeedbackHistory = [
  {
    text: 'The app crashes every time I open it - this is a critical bug!',
    aiPrediction: 'bug_report',
    userCorrection: 'bug_report',
    aiConfidence: 0.95,
  },
  {
    text: 'I would love to see a dark mode feature added to the app.',
    aiPrediction: 'feature_request',
    userCorrection: 'feature_request',
    aiConfidence: 0.87,
  },
  {
    text: 'My package arrived 3 days late and the box was damaged.',
    aiPrediction: 'shipping_complaint',
    userCorrection: 'shipping_complaint',
    aiConfidence: 0.78,
  },
  {
    text: 'Excellent customer service! Sarah was very helpful.',
    aiPrediction: 'compliment',
    userCorrection: 'compliment',
    aiConfidence: 0.92,
  },
  {
    text: 'The material quality seems cheap and flimsy.',
    aiPrediction: 'product_quality',
    userCorrection: 'product_quality',
    aiConfidence: 0.81,
  },
];

async function populateFeedbackHistory() {
  console.log('Populating userFeedbackHistory with test data...');
  for (const feedback of testFeedbackHistory) {
    recordUserFeedback(
      feedback.text,
      feedback.aiPrediction,
      feedback.userCorrection,
      feedback.aiConfidence
    );
  }

  const metrics = getAIPerformanceMetrics();
  console.log('AI Performance Metrics:', metrics);
}

populateFeedbackHistory().catch((error) => {
  console.error('Failed to populate feedback history:', error);
});