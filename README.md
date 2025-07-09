# FeedbackSense - Customer Feedback Analytics Platform

Transform customer feedback into actionable insights with AI-powered sentiment analysis.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier available)

### 1. Clone and Install
```bash
git clone <your-repo>
cd feedbacksense
npm install
```

### 2. Set Up Supabase

1. **Create a new Supabase project** at [supabase.com](https://supabase.com)
2. **Copy your project credentials** from Settings > API
3. **Run the database setup**:
   - Go to SQL Editor in your Supabase dashboard
   - Copy and paste the contents of `supabase/setup.sql`
   - Run the script to create tables and policies

### 3. Configure Environment

1. **Copy the environment template**:
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update `.env.local` with your Supabase credentials**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 4. Run the Application
```bash
npm run dev
```

Visit `http://localhost:3000` to start using FeedbackSense!

## 📋 Features

### ✅ MVP Features (Ready)
- **User Authentication** - Secure email/password login and registration
- **Manual Feedback Entry** - Add customer feedback with categorization
- **CSV Import** - Bulk import feedback from existing data
- **Sentiment Analysis** - AI-powered sentiment detection
- **Analytics Dashboard** - Visual insights with charts and metrics
- **Feedback Management** - View, filter, and organize all feedback

### 🔄 How It Works

1. **Sign Up/Login** - Create your account or sign in
2. **Add Feedback** - Either manually enter feedback or import via CSV
3. **Automatic Analysis** - System analyzes sentiment and extracts topics
4. **View Insights** - Dashboard shows trends, sentiment distribution, and metrics
5. **Take Action** - Use insights to improve your business

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with React 19
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS
- **Charts**: Chart.js with React Chart.js 2
- **AI/NLP**: Custom sentiment analysis engine
- **Deployment**: Ready for Vercel

## 📊 CSV Import Format

Your CSV file should have these columns (only `content` is required):

```csv
content,source,category,date
"Great product, very satisfied!",email,product,2024-01-15
"Delivery was slower than expected",chat,delivery,2024-01-16
"Customer service was helpful",phone,service,2024-01-17
```

**Column descriptions**:
- `content` (required): The feedback text
- `source` (optional): Where feedback came from (email, chat, social, etc.)
- `category` (optional): Feedback category (product, service, pricing, etc.)
- `date` (optional): When feedback was received (YYYY-MM-DD format)

## 🔒 Security Features

- **Row Level Security (RLS)** - Users can only access their own data
- **Email Authentication** - Secure user registration and login
- **Data Isolation** - Complete separation between user accounts
- **Input Validation** - All user inputs are validated and sanitized

## 🎯 Sentiment Analysis

The platform includes a built-in sentiment analysis engine that:

- Analyzes feedback text for positive, negative, or neutral sentiment
- Provides sentiment scores (0-100%)
- Extracts relevant topics and keywords
- Works in real-time for immediate insights

## 📈 Analytics & Insights

The dashboard provides:

- **Sentiment Distribution** - Pie chart showing positive/negative/neutral breakdown
- **Category Analysis** - Bar chart of feedback by category
- **Trend Analysis** - Line chart showing feedback volume over time
- **Source Tracking** - Where your feedback is coming from
- **Key Metrics** - Total feedback, average sentiment, and more

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Push your code to GitHub**
2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables from your `.env.local`
3. **Deploy** - Vercel will automatically build and deploy your app

### Environment Variables for Production
Make sure to add these in your Vercel dashboard:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
```

## 🔧 Development

### Project Structure
```
feedbacksense/
├── app/                 # Next.js app directory
├── components/          # React components
├── lib/                # Utilities and configurations
├── supabase/           # Database setup and migrations
└── public/             # Static assets
```

### Key Components
- `AuthForm.js` - User authentication
- `Dashboard.js` - Main dashboard layout
- `FeedbackForm.js` - Add new feedback
- `CSVImport.js` - Bulk import functionality
- `Analytics.js` - Charts and metrics
- `FeedbackList.js` - View and manage feedback

## 🐛 Troubleshooting

### Common Issues

**Authentication not working?**
- Check your Supabase URL and keys in `.env.local`
- Ensure you've run the database setup script

**CSV import failing?**
- Make sure your CSV has headers
- Check that the content column is mapped correctly
- Verify the file is in proper CSV format

**Charts not displaying?**
- Ensure you have feedback data in your database
- Check browser console for any JavaScript errors

### Getting Help

1. Check the browser console for error messages
2. Verify your Supabase setup and credentials
3. Ensure all dependencies are installed correctly

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ for small businesses to better understand their customers.
