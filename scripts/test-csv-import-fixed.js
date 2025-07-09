#!/usr/bin/env node

/**
 * Test script to verify CSV import functionality after fixes
 */

import { initializeGeminiAI, categorizeFeedback } from '../lib/geminiAI.js';
import { batchAnalyzeAndCategorizeFeedback } from '../lib/sentimentAnalysis.js';
import Papa from 'papaparse';
import fs from 'fs';
import path from 'path';

console.log('🧪 Testing CSV Import Functionality After Fixes...\n');

async function testGeminiInitialization() {
  console.log('1️⃣ Testing Gemini AI Initialization...');
  try {
    const result = initializeGeminiAI();
    console.log(`✅ Gemini AI initialization: ${result ? 'SUCCESS' : 'FALLBACK MODE'}`);
    return result;
  } catch (error) {
    console.log(`❌ Gemini AI initialization failed: ${error.message}`);
    return false;
  }
}

async function testCSVParsing() {
  console.log('\n2️⃣ Testing CSV Parsing...');
  try {
    const csvPath = path.join(process.cwd(), 'sample_feedback.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            const criticalErrors = results.errors.filter(err => err.type === 'Delimiter' || err.type === 'FieldMismatch');
            if (criticalErrors.length > 0) {
              console.log(`❌ CSV parsing failed: ${criticalErrors.map(e => e.message).join(', ')}`);
              reject(new Error('CSV parsing failed'));
              return;
            }
            console.log(`⚠️ CSV parsing warnings: ${results.errors.length} non-critical issues`);
          }
          
          const validRows = results.data.filter(row => 
            row.content && row.content.trim()
          );
          
          console.log(`✅ CSV parsing success: ${validRows.length} valid rows from ${results.data.length} total`);
          resolve(validRows);
        },
        error: (error) => {
          console.log(`❌ CSV parsing error: ${error.message}`);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.log(`❌ CSV file reading failed: ${error.message}`);
    throw error;
  }
}

async function testSingleCategorization() {
  console.log('\n3️⃣ Testing Single Feedback Categorization...');
  try {
    const testFeedback = "Amazing product! Exceeded all my expectations. The quality is outstanding and delivery was super fast.";
    const result = await categorizeFeedback(testFeedback);
    
    console.log(`✅ Single categorization success:`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Confidence: ${result.confidence}`);
    console.log(`   Method: ${result.method}`);
    
    return result;
  } catch (error) {
    console.log(`❌ Single categorization failed: ${error.message}`);
    throw error;
  }
}

async function testBatchAnalysis(validRows) {
  console.log('\n4️⃣ Testing Batch Analysis (first 5 items)...');
  try {
    const testTexts = validRows.slice(0, 5).map(row => row.content);
    
    console.log(`Processing ${testTexts.length} items...`);
    
    const results = await batchAnalyzeAndCategorizeFeedback(
      testTexts,
      3, // Small batch size for testing
      (progress) => {
        console.log(`   Progress: ${progress.processed}/${progress.total} (${progress.percentage}%)`);
      }
    );
    
    console.log(`✅ Batch analysis success: ${results.length} results`);
    
    // Show sample results
    results.slice(0, 2).forEach((result, index) => {
      console.log(`   Result ${index + 1}:`);
      console.log(`     Category: ${result.aiCategory} (${result.aiCategoryConfidence})`);
      console.log(`     Sentiment: ${result.sentimentLabel} (${result.sentimentScore})`);
    });
    
    return results;
  } catch (error) {
    console.log(`❌ Batch analysis failed: ${error.message}`);
    throw error;
  }
}

async function testBulkDataPreparation(validRows, analysisResults) {
  console.log('\n5️⃣ Testing Bulk Data Preparation...');
  try {
    const feedbacks = validRows.slice(0, 5).map((row, index) => {
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
    
    console.log(`✅ Bulk data preparation success: ${feedbacks.length} items prepared`);
    
    // Validate data structure
    const hasRequiredFields = feedbacks.every(feedback => 
      feedback.content && 
      feedback.category && 
      feedback.sentimentScore !== undefined
    );
    
    console.log(`   Data validation: ${hasRequiredFields ? 'PASS' : 'FAIL'}`);
    
    return feedbacks;
  } catch (error) {
    console.log(`❌ Bulk data preparation failed: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  try {
    // Test 1: Gemini AI Initialization
    const isAIInitialized = await testGeminiInitialization();
    
    // Test 2: CSV Parsing
    const validRows = await testCSVParsing();
    
    // Test 3: Single Categorization
    await testSingleCategorization();
    
    // Test 4: Batch Analysis
    const analysisResults = await testBatchAnalysis(validRows);
    
    // Test 5: Bulk Data Preparation
    const preparedData = await testBulkDataPreparation(validRows, analysisResults);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log(`   ✅ Gemini AI: ${isAIInitialized ? 'Initialized' : 'Fallback mode'}`);
    console.log(`   ✅ CSV Parsing: ${validRows.length} valid rows`);
    console.log(`   ✅ Batch Analysis: ${analysisResults.length} items processed`);
    console.log(`   ✅ Data Preparation: ${preparedData.length} items ready`);
    
    console.log('\n🚀 CSV Import functionality is ready for use!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Check the error above and retry after fixing the issue.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);