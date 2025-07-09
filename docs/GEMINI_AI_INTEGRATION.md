# Gemini AI Integration Documentation

## Overview

This document describes the foundational Gemini AI integration implemented for FeedbackSense's AI-powered categorization feature (Phase 2.1: Core AI Integration).

## Components Implemented

### 1. Dependencies
- **@google/generative-ai**: Official Google Generative AI library for Node.js
- Added to `package.json` and installed successfully

### 2. Environment Configuration
Added to `.env.local`:
```env
# Gemini AI Configuration
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
```

### 3. Core AI Service (`lib/geminiAI.js`)

#### Main Functions:
- **`categorizeFeedback(feedbackText)`**: Main categorization function
- **`batchCategorizeFeedback(feedbackTexts)`**: Batch processing for efficiency
- **`getUsageStats()`**: Monitor API usage and rate limits

#### Features:
- **Rate Limiting**: 60 requests per minute with automatic tracking
- **Fallback System**: Keyword-based categorization when AI is unavailable
- **Error Handling**: Comprehensive error handling with graceful degradation
- **Input Validation**: Validates feedback text before processing
- **Cost Optimization**: Built-in rate limiting and batch processing support

#### Categories Supported:
- `feature_request`: Requests for new features or improvements
- `bug_report`: Reports of technical issues, errors, or malfunctions
- `shipping_complaint`: Issues related to delivery, packaging, or shipping
- `product_quality`: Concerns about product quality, materials, or build
- `customer_service`: Feedback about customer support or service experience
- `general_inquiry`: General questions or neutral feedback
- `refund_request`: Requests for refunds, returns, or billing issues
- `compliment`: Positive feedback, praise, or compliments

#### Return Format:
```javascript
{
  category: string,        // One of the supported categories
  confidence: number,      // 0-1 scale confidence score
  reasoning: string        // Brief explanation of the categorization
}
```

### 4. Database Schema Updates (`prisma/schema.prisma`)

Extended the `Feedback` model with AI-related fields:

```prisma
model Feedback {
  // ... existing fields ...
  
  // AI Classification fields
  aiCategoryConfidence   Decimal? @map("ai_category_confidence") @db.Decimal(3, 2)
  aiClassificationMeta   Json?    @map("ai_classification_meta")
  manualOverride         Boolean  @default(false) @map("manual_override")
  classificationHistory  Json     @default("[]") @map("classification_history")
  
  // ... rest of model ...
}
```

#### Field Descriptions:
- **`aiCategoryConfidence`**: AI confidence score (0.00-1.00)
- **`aiClassificationMeta`**: Metadata about the AI classification process
- **`manualOverride`**: Flag indicating if category was manually overridden
- **`classificationHistory`**: Array tracking all classification attempts

### 5. Enhanced Sentiment Analysis (`lib/sentimentAnalysis.js`)

#### New Functions:
- **`analyzeAndCategorizeFeedback(text)`**: Combined sentiment + AI analysis
- **`reanalyzeFeedback(text, existingHistory)`**: Re-analyze with history tracking

#### Enhanced Return Format:
```javascript
{
  // Sentiment analysis results
  sentimentScore: number,
  sentimentLabel: string,
  sentimentConfidence: number,
  topics: string[],
  
  // AI categorization results
  aiCategory: string,
  aiCategoryConfidence: number,
  aiReasoning: string,
  
  // Metadata for database storage
  classificationMeta: object,
  historyEntry: object,
  analysisTimestamp: string,
  analysisVersion: string
}
```

## Setup Instructions

### 1. Environment Setup
1. Obtain a Google Gemini API key from Google AI Studio
2. Update `.env.local` with your API key:
   ```env
   GOOGLE_GEMINI_API_KEY=your_actual_api_key_here
   ```

### 2. Database Migration
The database schema has been updated automatically. If you need to regenerate:
```bash
npx prisma generate
npx prisma db push
```

### 3. Testing
Use the provided test script to verify the integration:
```bash
node scripts/test-gemini-ai.js
```

## Usage Examples

### Basic Categorization
```javascript
import { categorizeFeedback } from './lib/geminiAI.js';

const result = await categorizeFeedback("The app keeps crashing!");
console.log(result);
// Output: { category: 'bug_report', confidence: 0.95, reasoning: '...' }
```

### Enhanced Analysis
```javascript
import { analyzeAndCategorizeFeedback } from './lib/sentimentAnalysis.js';

const result = await analyzeAndCategorizeFeedback("Love the new features!");
console.log(result);
// Output includes both sentiment and AI categorization
```

### Batch Processing
```javascript
import { batchCategorizeFeedback } from './lib/geminiAI.js';

const feedbacks = ["Great product!", "Needs improvement", "Bug in checkout"];
const results = await batchCategorizeFeedback(feedbacks);
```

## Error Handling & Fallbacks

The system implements multiple layers of fallback:

1. **API Key Missing**: Falls back to keyword-based categorization
2. **Rate Limit Exceeded**: Falls back to keyword-based categorization
3. **Network Errors**: Falls back to keyword-based categorization
4. **Invalid Responses**: Falls back to keyword-based categorization

All fallbacks maintain the same response format for consistency.

## Rate Limiting & Cost Management

- **Rate Limit**: 60 requests per minute (configurable)
- **Request Tracking**: Automatic tracking of API usage
- **Batch Processing**: Support for efficient batch operations
- **Usage Monitoring**: `getUsageStats()` provides real-time usage data

## Production Considerations

### Security
- API keys stored in environment variables
- Input validation on all text inputs
- Error messages don't expose sensitive information

### Performance
- Rate limiting prevents API quota exhaustion
- Fallback system ensures service availability
- Batch processing reduces API costs

### Monitoring
- Comprehensive error logging
- Usage statistics tracking
- Classification history for audit trails

## Integration Points

This foundational implementation is designed to integrate with:

1. **API Endpoints**: `app/api/feedback/route.js` (future integration)
2. **Feedback Form**: `components/FeedbackForm.js` (future integration)
3. **Dashboard Analytics**: Enhanced categorization data
4. **Bulk Processing**: CSV import with AI categorization

## Next Steps (Not Implemented Yet)

The following will be handled in subsequent subtasks:

1. Integration with feedback creation API
2. UI updates to display AI categorization
3. Manual override functionality
4. Bulk re-categorization tools
5. Advanced analytics with AI insights

## Technical Specifications

- **Node.js**: ES6 modules with async/await
- **Database**: PostgreSQL with Prisma ORM
- **AI Model**: Gemini 1.5 Flash (configurable)
- **Rate Limiting**: In-memory sliding window
- **Error Handling**: Graceful degradation with fallbacks
- **Data Storage**: JSON metadata with full audit trail

## Support & Troubleshooting

Common issues and solutions:

1. **"Gemini AI not available"**: Check API key configuration
2. **Rate limit exceeded**: Wait or use batch processing
3. **Invalid category returned**: Check model configuration
4. **Database errors**: Verify Prisma schema is up to date

For additional support, check the application logs for detailed error messages.