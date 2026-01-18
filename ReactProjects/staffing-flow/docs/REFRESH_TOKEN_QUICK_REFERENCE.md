# Refresh Token Flow - Quick Reference

## Summary

✅ **Implemented:** Complete JWT + Refresh Token authentication system with token rotation, revocation, and security tracking.

## New API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/login` | No | Login and receive tokens |
| POST | `/api/auth/refresh` | No | Exchange refresh token for new tokens |
| POST | `/api/auth/logout` | No | Revoke refresh token |
| POST | `/api/auth/revoke-all` | Yes | Revoke all user tokens |

## Response Format

All auth endpoints return:
```json
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "accessToken": "jwt...",
    "refreshToken": "random_string...",
    "expiresIn": 900
  }
}
```

## Environment Variables

```bash
JWT_SECRET=change_this_in_production
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
```

## Client Usage Pattern

```javascript
// 1. Login
const tokens = await fetch('/api/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// 2. Use access token
fetch('/api/protected', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. On 401 error, refresh
const newTokens = await fetch('/api/auth/refresh', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});

// 4. Logout
await fetch('/api/auth/logout', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});
```

## Security Features

- ✅ Token rotation (refresh tokens are single-use)
- ✅ Token revocation (individual and bulk)
- ✅ IP address and user agent tracking
- ✅ Automatic expiration
- ✅ Secure random token generation (128 chars)
- ✅ Short-lived access tokens (15 min)
- ✅ Audit trail (revoked tokens kept in DB)

## Database Migration

Run this SQL in your Supabase SQL editor:

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

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token) WHERE is_revoked = false;
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at) WHERE is_revoked = false;
```

## Files Changed

### New Files
- `api/utils/token.utils.ts` - Token generation and validation utilities
- `docs/REFRESH_TOKEN_FLOW.md` - Comprehensive documentation
- `docs/REFRESH_TOKEN_QUICK_REFERENCE.md` - This file

### Modified Files
- `api/services/auth.service.ts` - Added refresh token methods
- `api/controllers/auth.controller.ts` - Added refresh endpoint
- `api/routes/auth.routes.ts` - Added refresh route
- `api/schemas/auth.schema.ts` - Added validation schemas
- `.env.example` - Added JWT configuration
- `SUPABASE_SETUP.md` - Added refresh_tokens table

## Testing

```bash
# Run type check
npm run type-check:api

# Start dev server
npm run dev:api

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test refresh
curl -X POST http://localhost:3001/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"your_refresh_token_here"}'
```

## Common Issues

**Issue:** "Invalid or expired refresh token"
**Solution:** User must login again

**Issue:** Access token validation fails
**Solution:** Refresh the token using `/api/auth/refresh`

**Issue:** Token rotation not working
**Solution:** Check that refresh_tokens table exists and indexes are created

## Next Steps

1. ✅ Run database migration (create refresh_tokens table)
2. ✅ Update `.env` with secure JWT_SECRET
3. ⏳ Update client code to use new flow
4. ⏳ Add rate limiting to auth endpoints
5. ⏳ Set up token cleanup cron job
6. ⏳ Implement httpOnly cookies for refresh tokens
7. ⏳ Add monitoring for suspicious activity

## Support

See [REFRESH_TOKEN_FLOW.md](./REFRESH_TOKEN_FLOW.md) for detailed documentation.
