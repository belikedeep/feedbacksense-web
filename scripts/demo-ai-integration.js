#!/usr/bin/env node

/**
 * Demo script to showcase AI integration working end-to-end
 * This simulates what happens when a user submits feedback through the frontend
 */

// Test feedback samples that showcase different AI categories
const testFeedbacks = [
  {
    content: "The app keeps crashing when I try to upload photos. This is really frustrating!",
    expected: "bug_report"
  },
  {
    content: "I love the new dark mode feature! It's exactly what I needed.",
    expected: "compliment"
  },
  {
    content: "My order arrived 3 days late and the package was damaged.",
    expected: "shipping_complaint"
  },
  {
    content: "Please add a feature to export data to CSV format.",
    expected: "feature_request"
  },
  {
    content: "Can I get a refund for my recent purchase? I'm not satisfied.",
    expected: "refund_request"
  }
];

async function demonstrateAIIntegration() {
  console.log('\n🤖 AI Integration Demo - FeedbackSense\n');
  console.log('=' .repeat(60));
  
  for (let i = 0; i < testFeedbacks.length; i++) {
    const feedback = testFeedbacks[i];
    
    console.log(`\n📝 Test ${i + 1}: ${feedback.content}`);
    console.log('-'.repeat(50));
    
    try {
      const response = await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Note: In real usage, you'd need a valid auth token
          'Authorization': 'Bearer fake-token-for-demo'
        },
        body: JSON.stringify({
          content: feedback.content,
          source: 'demo'
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        
        console.log(`✅ AI Categorized as: ${result.category}`);
        console.log(`🎯 Expected: ${feedback.expected}`);
        console.log(`📊 Confidence: ${Math.round((result.aiCategoryConfidence || 0) * 100)}%`);
        console.log(`😊 Sentiment: ${result.sentimentLabel} (${Math.round((result.sentimentScore || 0) * 100)}%)`);
        
        if (result.topics && result.topics.length > 0) {
          console.log(`🏷️  Topics: ${result.topics.join(', ')}`);
        }
        
        const isCorrect = result.category === feedback.expected;
        console.log(`${isCorrect ? '✅' : '❌'} Prediction: ${isCorrect ? 'CORRECT' : 'DIFFERENT'}`);
        
      } else {
        console.log(`❌ API Error: ${response.status} ${response.statusText}`);
        const error = await response.text();
        console.log(`Error details: ${error}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('🎉 Demo Complete!');
  console.log('\n💡 What just happened:');
  console.log('  1. 🤖 Gemini AI analyzed each feedback text');
  console.log('  2. 📊 Assigned categories with confidence scores');
  console.log('  3. 😊 Detected sentiment (positive/negative/neutral)');
  console.log('  4. 🏷️  Identified relevant topics');
  console.log('  5. 💾 Stored everything in the database');
  console.log('\n🌐 Frontend Features:');
  console.log('  • Visit http://localhost:3000 to see the web interface');
  console.log('  • Submit feedback to see AI results in real-time');
  console.log('  • View confidence indicators and manual override options');
  console.log('  • Check classification history for each feedback');
}

// Run the demo
demonstrateAIIntegration().catch(console.error);