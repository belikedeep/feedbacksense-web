#!/usr/bin/env node

/**
 * Script to re-analyze existing feedback that was imported without AI analysis
 * This will add AI categorization to feedback that's missing it
 */

async function reanalyzeExistingFeedback() {
  console.log('\n🔄 Re-analyzing Existing Feedback with AI\n');
  console.log('=' .repeat(60));
  
  try {
    console.log('📡 Calling bulk re-analysis API...');
    
    const response = await fetch('http://localhost:3000/api/feedback/reanalyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In real usage, you'd need a valid auth token
        'Authorization': 'Bearer your-auth-token-here'
      },
      body: JSON.stringify({
        // Re-analyze feedback that's missing AI confidence scores
        batchSize: 5 // Process in smaller batches to respect rate limits
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      console.log('\n✅ Re-analysis Complete!');
      console.log(`📊 Total feedback: ${result.total}`);
      console.log(`✅ Successfully processed: ${result.processed}`);
      console.log(`❌ Failed: ${result.failed}`);
      
      if (result.errors && result.errors.length > 0) {
        console.log('\n⚠️  Errors encountered:');
        result.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. Feedback ${error.feedbackId}: ${error.error}`);
        });
      }
      
      console.log('\n🎉 Your existing feedback now has AI categorization!');
      console.log('   Visit your feedback list to see:');
      console.log('   • AI confidence scores');
      console.log('   • Smart categorization');
      console.log('   • Classification history');
      
    } else {
      const error = await response.text();
      console.log(`❌ API Error: ${response.status} ${response.statusText}`);
      console.log(`Error details: ${error}`);
      
      if (response.status === 401) {
        console.log('\n💡 Authentication required:');
        console.log('   This script needs a valid auth token to work.');
        console.log('   Use the web interface to re-analyze feedback instead:');
        console.log('   1. Go to your feedback list');
        console.log('   2. Click the 🤖 button next to any feedback');
        console.log('   3. Or use the bulk re-analysis feature in the UI');
      }
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    console.log('\n💡 Make sure the development server is running:');
    console.log('   npm run dev');
  }
}

// Show usage info
console.log('🤖 FeedbackSense - Re-analyze Existing Feedback');
console.log('\nThis script will add AI categorization to feedback imported from CSV');
console.log('that may be missing AI analysis data.\n');

// Run the re-analysis
reanalyzeExistingFeedback().catch(console.error);