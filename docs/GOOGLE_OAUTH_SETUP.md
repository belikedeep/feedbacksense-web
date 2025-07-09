# Google OAuth Setup Guide

This guide explains how to configure Google OAuth for your FeedbackSense application with Supabase.

## Prerequisites

- A Supabase project
- A Google Cloud Platform (GCP) account
- Your application running on a domain (localhost for development)

## Step 1: Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click and enable it

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Select "Web application"
   - Add your authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback`
     - For production: `https://yourdomain.com/api/auth/callback`
     - **Important**: Also add your Supabase callback URL: `https://your-project-ref.supabase.co/auth/v1/callback`

5. Note down your:
   - Client ID
   - Client Secret

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to "Authentication" > "Providers"
3. Find "Google" and click to configure
4. Enable Google provider
5. Enter your Google Client ID and Client Secret
6. Set the redirect URL to: `https://your-project-ref.supabase.co/auth/v1/callback`
7. Save the configuration

## Step 3: Update Environment Variables

Add these to your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 4: Configure Site URL in Supabase

1. In Supabase Dashboard, go to "Authentication" > "URL Configuration"
2. Set your Site URL:
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`
3. Add redirect URLs:
   - `http://localhost:3000/dashboard` (development)
   - `https://yourdomain.com/dashboard` (production)

## Step 5: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to `/login` or `/signup`
3. Click "Continue with Google"
4. Complete the OAuth flow
5. You should be redirected to the dashboard

## Troubleshooting

### Common Issues:

1. **"redirect_uri_mismatch" error**:
   - Check that your redirect URIs in Google Console match exactly
   - Ensure you've added both your app's callback and Supabase's callback URL

2. **"Invalid client" error**:
   - Verify your Client ID and Secret are correct in Supabase
   - Make sure the Google+ API is enabled

3. **"Site URL not allowed" error**:
   - Check your Site URL configuration in Supabase
   - Ensure redirect URLs are properly configured

4. **Users not being created in database**:
   - Check that your profile creation API endpoint is working
   - Review the callback route logs for any errors

### Development vs Production

- **Development**: Use `http://localhost:3000` for all URLs
- **Production**: Use your actual domain with HTTPS

### Security Notes

- Always use HTTPS in production
- Keep your Client Secret secure and never expose it client-side
- Regularly rotate your OAuth credentials
- Monitor your Google Cloud Console for any suspicious activity

## Database Considerations

When users sign up with Google OAuth:
1. Supabase automatically creates a user in the `auth.users` table
2. The callback route attempts to create a profile in your application's user table
3. User information from Google (name, email, avatar) is available in the user metadata

Make sure your user profile creation logic handles OAuth users properly by checking the `app_metadata.provider` field.