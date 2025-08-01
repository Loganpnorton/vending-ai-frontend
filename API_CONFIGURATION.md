# API Configuration Guide

## Environment Variables Setup

Create a `.env` file in your project root with the following variables:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# API Configuration
# Development: Use your local backend server
VITE_API_BASE_URL=http://localhost:3000

# Production: Use your deployed backend
# VITE_API_BASE_URL=https://your-backend-domain.com

# Alternative: Use the default Vercel deployment
# VITE_API_BASE_URL=https://vending-ai-nexus.vercel.app
```

## Backend API Endpoints

The frontend expects the following API endpoints:

### POST /api/machine-checkin

**Request Headers:**
```
Content-Type: application/json
Authorization: Bearer <supabase_access_token>  # Optional but recommended
```

**Request Body:**
```json
{
  "machine_id": "string",
  "status": {
    "name": "string",
    "location": "string", 
    "battery": 100,
    "stock_level": 0,
    "temperature": 37,
    "errors": [],
    "uptime_minutes": 0,
    "last_maintenance": "2024-01-01"
  },
  "auto_register": true,
  "machine_token": "string"  // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "machine": {
    "machine_id": "string",
    "machine_token": "string"  // Provided on first check-in
  }
}
```

## Authentication Flow

1. **User Authentication**: The frontend uses Supabase for user authentication
2. **Token Retrieval**: Before making API calls, the frontend retrieves the current user's access token
3. **Authorization Header**: The access token is included in the `Authorization: Bearer <token>` header
4. **Fallback**: If no auth token is available, requests proceed without authentication (for machine-only operations)

## Error Handling

The frontend now includes comprehensive error handling:

- **HTTP Status Codes**: Detailed logging of response status and body
- **Retry Logic**: Automatic retry for 429 (rate limit) and 5xx errors with exponential backoff
- **CORS Detection**: Automatic detection and handling of CORS errors
- **Development Mode**: Fallback to simulation mode when backend is not accessible

## Testing Your Backend

### 1. Test with Hardcoded URL

Temporarily modify the API base URL in the ProductScreen component:

```typescript
// In ProductScreen.tsx, line 18
baseUrl: 'http://localhost:3000', // Your local backend
```

### 2. Test with Vercel Deployment

```typescript
// In ProductScreen.tsx, line 18  
baseUrl: 'https://vending-ai-nexus.vercel.app', // Your Vercel deployment
```

### 3. Check Browser Console

Look for these log messages:
- ✅ `Auth token retrieved successfully`
- ✅ `Including auth token in request`
- ✅ `Check-in successful`
- ❌ `HTTP Error: 401 Unauthorized`
- ❌ `CORS Error - Backend not accessible from browser`

## CORS Configuration

If you're getting CORS errors, ensure your backend includes these headers:

```
Access-Control-Allow-Origin: *  // Or your specific domain
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

## Troubleshooting

### Issue: "CORS Error - Backend not accessible from browser"
**Solution**: Set up CORS on your backend or use a proxy

### Issue: "No auth token available"
**Solution**: Ensure user is logged in via Supabase authentication

### Issue: "HTTP 401 Unauthorized"
**Solution**: Check that your backend validates the Supabase JWT token correctly

### Issue: "HTTP 404 Not Found"
**Solution**: Verify the API endpoint `/api/machine-checkin` exists on your backend

## Development vs Production

- **Development**: Uses simulation mode when CORS errors are detected
- **Production**: Requires proper CORS configuration and authentication
- **Testing**: Can manually set API URL via the UI for testing different backends 