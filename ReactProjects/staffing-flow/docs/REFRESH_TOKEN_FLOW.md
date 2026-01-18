# Refresh Token Flow Documentation

## Overview

This application implements a secure refresh token flow for authentication. This allows users to maintain their session without repeatedly logging in, while keeping access tokens short-lived for security.

## Architecture

### Token Types

1. **Access Token (JWT)**
   - Short-lived (default: 15 minutes)
   - Contains user information (userId, email, organizationId, role)
   - Used for API authentication
   - Stored in memory on the client

2. **Refresh Token**
   - Long-lived (default: 7 days)
   - Cryptographically secure random string (128 characters)
   - Used to obtain new access tokens
   - Stored in database for validation and revocation
   - Should be stored securely on client (httpOnly cookie recommended)

### Database Schema

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);
```

## API Endpoints

### 1. Login
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "organization_id": "uuid"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "a1b2c3d4e5f6...",
    "expiresIn": 900
  }
}
```

### 2. Refresh Token
**POST** `/api/auth/refresh`

**Request:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "organization_id": "uuid"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "z9y8x7w6v5u4...",
    "expiresIn": 900
  }
}
```

**Notes:**
- Old refresh token is revoked
- New refresh token is issued (token rotation)
- Old token is linked to new token via `replaced_by` field

### 3. Logout
**POST** `/api/auth/logout`

**Request:**
```json
{
  "refreshToken": "a1b2c3d4e5f6..." // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 4. Revoke All Tokens
**POST** `/api/auth/revoke-all` (Protected)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "message": "All refresh tokens revoked successfully"
}
```

## Security Features

### 1. Token Rotation
When a refresh token is used, it is immediately revoked and replaced with a new one. This prevents token reuse and helps detect token theft.

### 2. Token Revocation
- Tokens can be revoked individually
- All tokens for a user can be revoked at once
- Revoked tokens are marked but kept in database for audit trail

### 3. Token Expiration
- Access tokens expire quickly (15 minutes)
- Refresh tokens expire after 7 days
- Expired tokens are automatically rejected

### 4. IP and User Agent Tracking
Each refresh token stores:
- IP address of the client
- User agent string
- Creation timestamp

This helps detect suspicious activity and enables security monitoring.

### 5. Protection Against Common Attacks

**Replay Attacks:**
- Tokens are single-use (rotation)
- Old tokens are immediately revoked

**Token Theft:**
- Short-lived access tokens limit damage window
- IP/User agent tracking helps detect anomalies
- Revoke all tokens if compromise suspected

**Brute Force:**
- Tokens are 128-character random strings
- Rate limiting should be applied at API gateway level

## Client Implementation Guide

### Recommended Flow

```javascript
// 1. Login
const { accessToken, refreshToken } = await login(email, password);

// Store tokens securely
localStorage.setItem('accessToken', accessToken);
// Store refresh token in httpOnly cookie (server-side) or secure storage
localStorage.setItem('refreshToken', refreshToken);

// 2. Make API requests
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// 3. Handle token expiration
if (response.status === 401) {
  const newTokens = await refreshAccessToken(refreshToken);
  localStorage.setItem('accessToken', newTokens.accessToken);
  localStorage.setItem('refreshToken', newTokens.refreshToken);
  
  // Retry original request with new token
  return fetch('/api/endpoint', {
    headers: {
      'Authorization': `Bearer ${newTokens.accessToken}`
    }
  });
}

// 4. Logout
await logout(refreshToken);
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

### Automatic Token Refresh (Axios Example)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor - add access token
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken
        });

        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Environment Variables

Add to your `.env` file:

```bash
# JWT Secret - MUST be changed in production!
JWT_SECRET=your_super_secure_jwt_secret_key_here_change_in_production

# Token expiration times
ACCESS_TOKEN_EXPIRY=15m   # 15 minutes
REFRESH_TOKEN_EXPIRY=7d   # 7 days
```

**Supported time formats:**
- `s` - seconds (e.g., `30s`)
- `m` - minutes (e.g., `15m`)
- `h` - hours (e.g., `2h`)
- `d` - days (e.g., `7d`)
- `w` - weeks (e.g., `2w`)

## Database Setup

Run the SQL migration from [SUPABASE_SETUP.md](../SUPABASE_SETUP.md):

```sql
-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  replaced_by UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  is_revoked BOOLEAN DEFAULT false,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE is_revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE is_revoked = false;
```

## Maintenance

### Cleanup Expired Tokens

Periodically clean up expired tokens to keep database size manageable:

```javascript
// Run this as a scheduled job (e.g., daily cron job)
import { authService } from './services/auth.service';

const cleanupExpiredTokens = async () => {
  const count = await authService.cleanupExpiredTokens();
  console.log(`Cleaned up ${count} expired tokens`);
};

// Schedule with node-cron or similar
cron.schedule('0 2 * * *', cleanupExpiredTokens); // Run at 2 AM daily
```

## Monitoring and Alerts

Monitor for suspicious activity:

1. **Multiple refresh attempts with same token** - Possible replay attack
2. **Rapid token rotation from different IPs** - Possible token theft
3. **Failed refresh attempts** - Possible brute force
4. **Unusual geographic patterns** - Compare IP locations

## Testing

### Manual Testing

```bash
# 1. Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Refresh token
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"token_from_login"}'

# 3. Logout
curl -X POST http://localhost:3001/api/auth/logout \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"token_from_login"}'
```

## Troubleshooting

### "Invalid or expired refresh token"
- Token was revoked
- Token expired
- Token doesn't exist in database
- Database connection issue

**Solution:** User must login again

### "Refresh token expired"
- Token older than REFRESH_TOKEN_EXPIRY
- User hasn't used the app in 7 days

**Solution:** User must login again

### Access token validation fails
- JWT_SECRET mismatch
- Token malformed
- Token expired

**Solution:** Refresh the access token using refresh endpoint

## Best Practices

1. ✅ **Always use HTTPS in production**
2. ✅ **Store refresh tokens in httpOnly cookies**
3. ✅ **Never log tokens or include them in error messages**
4. ✅ **Rotate tokens on each use**
5. ✅ **Set appropriate expiration times**
6. ✅ **Monitor for suspicious activity**
7. ✅ **Provide "logout from all devices" functionality**
8. ✅ **Clean up expired tokens regularly**
9. ✅ **Use strong JWT_SECRET in production**
10. ✅ **Implement rate limiting on auth endpoints**

## Migration from Supabase Auth

If you were previously using Supabase's built-in auth:

1. Create the `refresh_tokens` table
2. Update login/signup to use new token generation
3. Update client code to store and use refresh tokens
4. Migrate existing users gradually
5. Keep Supabase auth as backup during transition

## References

- [RFC 6749 - OAuth 2.0](https://datatracker.ietf.org/doc/html/rfc6749)
- [RFC 7519 - JSON Web Tokens](https://datatracker.ietf.org/doc/html/rfc7519)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
