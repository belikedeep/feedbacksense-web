#!/usr/bin/env node

/**
 * Diagnostic script to test CSV Import functionality
 * This script will help identify issues with:
 * 1. AI Service initialization and connectivity
 * 2. Database connectivity and schema compatibility
 * 3. CSV parsing and data transformation
 * 4. Batch processing functionality
 */

import { promises as fs } from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { prisma } from '../lib/prisma.js';
import { initializeGeminiAI, categorizeFeedback, batchCategorizeFeedback, getUsageStats } from '../lib/geminiAI.js';
import { analyzeSentiment, batchAnalyzeAndCategorizeFeedback } from '../lib/sentimentAnalysis.js';
import { getBatchConfig } from '../lib/batchConfig.js';

console.log('🔍 CSV Import Diagnostic Script Starting...\n');

async function testDatabaseConnectivity() {
  console.log('📊 Testing Database Connectivity...');
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const profileCount = await prisma.profile.count();
    console.log(`✅ Database query successful - ${profileCount} profiles found`);
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testAIServiceInitialization() {
  console.log('\n🤖 Testing AI Service Initialization...');
  try {
    // Check if API key is configured
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.error('❌ Gemini API key not configured or invalid');
      return false;
    }
    console.log('✅ Gemini API key configured');
    
    // Test basic categorization
    const testResult = await categorizeFeedback('This is a test feedback for AI categorization');
    console.log('✅ AI categorization successful:', {
      category: testResult.category,
      confidence: testResult.confidence,
      method: testResult.method
    });
    
    // Check rate limiting status
    const usageStats = getUsageStats();
    console.log('✅ AI service status:', usageStats);
    
    return true;
  } catch (error) {
    console.error('❌ AI service initialization failed:', error.message);
    return false;
  }
}

async function testCSVParsing() {
  console.log('\n📄 Testing CSV Parsing...');
  try {
    const csvPath = path.join(process.cwd(), 'sample_feedback.csv');
    const csvContent = await fs.readFile(csvPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('❌ CSV parsing errors:', results.errors);
            resolve(false);
            return;
          }
          
          console.log('✅ CSV parsing successful');
          console.log(`✅ Found ${results.data.length} rows`);
          console.log('✅ Columns:', results.meta.fields);
          
          // Test data validation
          const validRows = results.data.filter(row => 
            row.content && row.content.trim()
          );
          console.log(`✅ Valid content rows: ${validRows.length}`);
          
          resolve(true);
        },
        error: (error) => {
          console.error('❌ CSV parsing failed:', error.message);
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('❌ CSV file reading failed:', error.message);
    return false;
  }
}

async function testBatchProcessing() {
  console.log('\n⚡ Testing Batch Processing...');
  try {
    // Test with small sample
    const testTexts = [
      'Great product, very satisfied!',
      'Delivery was delayed, very disappointing.',
      'Customer service was helpful and quick.'
    ];
    
    console.log('Testing batch sentiment analysis...');
    const sentimentResults = await Promise.all(
      testTexts.map(text => analyzeSentiment(text))
    );
    console.log('✅ Batch sentiment analysis successful');
    
    console.log('Testing batch AI categorization...');
    const batchConfig = getBatchConfig('csv_import');
    console.log('✅ Batch configuration loaded:', batchConfig);
    
    const aiResults = await batchCategorizeFeedback(testTexts, 3);
    console.log('✅ Batch AI categorization successful');
    
    console.log('Testing combined batch analysis...');
    const combinedResults = await batchAnalyzeAndCategorizeFeedback(
      testTexts, 
      3, 
      (progress) => console.log(`Progress: ${progress.percentage}%`)
    );
    console.log('✅ Combined batch analysis successful');
    
    return true;
  } catch (error) {
    console.error('❌ Batch processing failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function testDataTransformation() {
  console.log('\n🔄 Testing Data Transformation...');
  try {
    // Load sample CSV data
    const csvPath = path.join(process.cwd(), 'sample_feedback.csv');
    const csvContent = await fs.readFile(csvPath, 'utf8');
    
    return new Promise(async (resolve) => {
      Papa.parse(csvContent, {
        header: true,
        complete: async (results) => {
          try {
            // Take first 3 rows for testing
            const testRows = results.data.slice(0, 3).filter(row => 
              row.content && row.content.trim()
            );
            
            console.log(`Testing data transformation with ${testRows.length} rows...`);
            
            // Test analysis
            const analysisResults = await batchAnalyzeAndCategorizeFeedback(
              testRows.map(row => row.content),
              3
            );
            
            // Test data transformation like in the actual import
            const feedbacks = testRows.map((row, index) => {
              const analysisResult = analysisResults[index];
              
              return {
                content: row.content.trim(),
                source: row.source || 'csv_import',
                category: row.category || analysisResult.aiCategory,
                sentimentScore: analysisResult.sentimentScore,
                sentimentLabel: analysisResult.sentimentLabel,
                feedbackDate: row.date || new Date().toISOString(),
                topics: analysisResult.topics || [],
                aiCategoryConfidence: analysisResult.aiCategoryConfidence,
                aiClassificationMeta: analysisResult.classificationMeta,
                classificationHistory: [analysisResult.historyEntry],
                manualOverride: row.category ? true : false
              };
            });
            
            console.log('✅ Data transformation successful');
            console.log('Sample transformed data:', JSON.stringify(feedbacks[0], null, 2));
            
            resolve(true);
          } catch (error) {
            console.error('❌ Data transformation failed:', error.message);
            resolve(false);
          }
        }
      });
    });
  } catch (error) {
    console.error('❌ Data transformation test failed:', error.message);
    return false;
  }
}

async function testDatabaseInsertion() {
  console.log('\n💾 Testing Database Insertion...');
  try {
    // Create a test user profile first
    const testUserId = 'test-user-' + Date.now();
    
    // Clean up any existing test data
    await prisma.feedback.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.profile.deleteMany({
      where: { id: testUserId }
    });
    
    // Create test profile
    await prisma.profile.create({
      data: {
        id: testUserId,
        email: 'test@example.com',
        name: 'Test User'
      }
    });
    console.log('✅ Test profile created');
    
    // Test feedback insertion
    const testFeedback = {
      userId: testUserId,
      content: 'Test feedback for database insertion',
      source: 'csv_import',
      category: 'general_inquiry',
      sentimentScore: 0.5,
      sentimentLabel: 'neutral',
      topics: ['test'],
      feedbackDate: new Date(),
      aiCategoryConfidence: 0.8,
      aiClassificationMeta: {
        method: 'test',
        confidence: 0.8
      },
      classificationHistory: [{
        timestamp: new Date().toISOString(),
        category: 'general_inquiry',
        confidence: 0.8,
        method: 'test'
      }],
      manualOverride: false
    };
    
    const createdFeedback = await prisma.feedback.create({
      data: testFeedback
    });
    console.log('✅ Single feedback insertion successful');
    
    // Test bulk insertion
    const bulkFeedbacks = Array(3).fill(null).map((_, i) => ({
      ...testFeedback,
      content: `Bulk test feedback ${i + 1}`
    }));
    
    const bulkResult = await prisma.feedback.createMany({
      data: bulkFeedbacks,
      skipDuplicates: true
    });
    console.log(`✅ Bulk insertion successful - ${bulkResult.count} records created`);
    
    // Clean up test data
    await prisma.feedback.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.profile.deleteMany({
      where: { id: testUserId }
    });
    console.log('✅ Test data cleaned up');
    
    return true;
  } catch (error) {
    console.error('❌ Database insertion failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function runDiagnostics() {
  const results = {
    database: false,
    aiService: false,
    csvParsing: false,
    batchProcessing: false,
    dataTransformation: false,
    databaseInsertion: false
  };
  
  try {
    results.database = await testDatabaseConnectivity();
    results.aiService = await testAIServiceInitialization();
    results.csvParsing = await testCSVParsing();
    results.batchProcessing = await testBatchProcessing();
    results.dataTransformation = await testDataTransformation();
    results.databaseInsertion = await testDatabaseInsertion();
    
    console.log('\n📋 DIAGNOSTIC RESULTS SUMMARY:');
    console.log('================================');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const failedTests = Object.entries(results).filter(([_, passed]) => !passed);
    
    if (failedTests.length === 0) {
      console.log('\n🎉 All tests passed! CSV Import functionality should be working correctly.');
    } else {
      console.log('\n⚠️  ISSUES FOUND:');
      failedTests.forEach(([test]) => {
        console.log(`- ${test} functionality needs attention`);
      });
    }
    
  } catch (error) {
    console.error('\n💥 Diagnostic script failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);