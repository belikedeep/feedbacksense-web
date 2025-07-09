# Troubleshooting Guide

## Common Issues and Solutions

### 1. JSON Parsing Errors

**Error**: `SyntaxError: Unexpected end of JSON input`

**Symptoms**:
- POST requests to `/api/auth/profile` fail with 500 status
- Error occurs at `await request.json()` line

**Solutions**:
✅ **Fixed**: Added robust JSON parsing with proper error handling
- Checks content-type header
- Validates JSON before parsing
- Returns appropriate 400 error for invalid JSON

**Test the fix**:
```bash
# Test with valid JSON
curl -X POST http://localhost:3000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "John Doe"}'

# Test with empty body (should not crash)
curl -X POST http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 2. Database Connection Issues

**Error**: `Can't reach database server at db.vgxnztzmwnuejpdxycuc.supabase.co:5432`

**Symptoms**:
- All database operations fail
- Prisma connection errors
- 503 Service Unavailable responses

**Solutions**:

#### Check Database Connection
```bash
# Test database connection
node scripts/test-db.js

# Check health endpoint
curl http://localhost:3000/api/health
curl http://localhost:3000/api/health?detailed=true
```

#### Verify Environment Variables
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# Check Supabase configuration
echo $NEXT_PUBLIC_SUPABASE_URL
```

#### Update Prisma Configuration
✅ **Fixed**: Enhanced Prisma client with:
- Connection timeout settings
- Better error handling
- Connection retry logic
- Graceful disconnect

#### Database Connection Troubleshooting

1. **Check Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Verify your project is active
   - Check database settings

2. **Verify Connection String**:
   ```bash
   # Test connection with psql
   psql "postgresql://username:password@db.vgxnztzmwnuejpdxycuc.supabase.co:5432/postgres"
   ```

3. **Check Network**:
   ```bash
   # Test network connectivity
   ping db.vgxnztzmwnuejpdxycuc.supabase.co
   telnet db.vgxnztzmwnuejpdxycuc.supabase.co 5432
   ```

4. **Update Environment Variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

### 3. API Route Debugging

#### Enable Detailed Logging
```javascript
// In your API routes, set NODE_ENV=development for detailed errors
console.log('Request details:', {
  method: request.method,
  headers: Object.fromEntries(request.headers.entries()),
  url: request.url
})
```

#### Test API Endpoints
```bash
# Test health check
curl http://localhost:3000/api/health

# Test authentication
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test feedback endpoint
curl http://localhost:3000/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Environment Setup

#### Required Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Development
NODE_ENV="development"
```

#### Database Migration
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Check database status
npx prisma studio
```

### 5. Performance Improvements

✅ **Implemented**:
- Exponential backoff retry logic
- Connection pooling configuration
- Request timeout settings
- Proper error categorization

### 6. Monitoring and Alerts

#### Health Check Endpoints
- `GET /api/health` - Basic health check
- `GET /api/health?detailed=true` - Detailed operations test

#### Error Tracking
- All errors are logged with context
- Database errors include retry attempts
- Connection errors provide specific guidance

### 7. Quick Fixes

#### Restart Services
```bash
# Restart development server
npm run dev

# Clear Next.js cache
rm -rf .next

# Restart with fresh install
rm -rf node_modules package-lock.json
npm install
npm run dev
```

#### Database Reset (if needed)
```bash
# Reset database schema
npx prisma db push --force-reset

# Reseed if you have seed data
npx prisma db seed
```

## Getting Help

If issues persist:

1. Check the health endpoint: `http://localhost:3000/api/health?detailed=true`
2. Run the database test script: `node scripts/test-db.js`
3. Check browser developer tools for client-side errors
4. Review server logs in the terminal
5. Verify all environment variables are set correctly

## Contact

For additional support, please check the main README.md file or create an issue in the project repository.