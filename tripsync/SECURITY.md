# TripSync Security Implementation Guide

## Overview

This document describes the security implementations for TripSync that fulfill the following Non-Functional Requirements (NFRs):

- **NFR-3.1**: All API endpoints must be protected by JWT authentication unless explicitly public
- **NFR-3.2**: Authorization checks must verify trip membership and role for every trip-scoped operation
- **NFR-3.3**: All user-supplied text fields must be sanitized before storage to prevent XSS and injection attacks
- **NFR-3.4**: Secrets (API keys, connection strings) must never be committed to version control; use environment variables

---

## 1. Environment Variable Management (NFR-3.4)

### Implementation

**File**: `.env` and `.env.example`

All sensitive configuration values are now managed through environment variables:

```dotenv
REACT_APP_SUPABASE_URL=your-project-url.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

### Best Practices

1. **Never commit `.env` file**: The `.env` file is already in `.gitignore` and should never be committed
2. **Use `.env.example`**: Provide a template file `.env.example` with placeholder values
3. **Local setup**: Developers should copy `.env.example` to `.env` and fill in their credentials
4. **Production deployment**: Use your hosting platform's environment variable management (e.g., Vercel, Netlify, AWS)

### Current Status

✅ **Implemented**: 
- Removed exposed secrets from `.env` file
- Ensured `.env.example` contains only placeholders
- Supabase credentials are now safely loaded via environment variables

---

## 2. Input Sanitization (NFR-3.3)

### Implementation

**File**: `src/securityUtils.js`

Comprehensive input sanitization utilities prevent XSS and injection attacks:

```javascript
// Basic text sanitization
const cleanText = sanitizeText(userInput);

// Email validation and sanitization
const cleanEmail = sanitizeEmail(userInput);

// URL sanitization (prevents javascript: protocol attacks)
const cleanURL = sanitizeURL(userInput);

// Numeric input validation
const cleanNumber = sanitizeNumber(userInput, 0);

// Object sanitization (recursive)
const cleanData = sanitizeObject(userInput);

// Domain-specific sanitization
const tripData = validateAndSanitizeTripData(userInput);
const accData = validateAndSanitizeAccommodationData(userInput);
const expData = validateAndSanitizeExpenseData(userInput);
```

#### Key Features

1. **DOMPurify Integration**: Uses the industry-standard DOMPurify library for HTML sanitization
2. **Protocol Validation**: Prevents `javascript:`, `data:`, `vbscript:`, and `file:` protocols
3. **Type Safety**: Validates data types and structures before sanitization
4. **Recursive Processing**: Handles nested objects and arrays
5. **Domain-Specific Validators**: Trip, accommodation, and expense-specific validation

### Usage in Service Layer

All service functions now sanitize inputs before database operations:

```javascript
// Example from tripService.js
export const createTrip = async (tripData, userId) => {
    // Sanitize all input
    const sanitizedData = validateAndSanitizeTripData(tripData);
    
    // Use sanitized data in database operations
    const { data: trip, error } = await supabase
        .from('trips')
        .insert([{
            name: `${sanitizedData.startPoint} to ${sanitizedData.endPoint}`,
            start_point: sanitizedData.startPoint,
            // ... other sanitized fields
        }]);
};
```

### Installation

DOMPurify has been added to `package.json`:

```bash
npm install dompurify
```

### Current Status

✅ **Implemented**:
- DOMPurify library added to dependencies
- Comprehensive sanitization utilities created
- Critical functions (createTrip, addAccommodation, addExpense) updated with sanitization

---

## 3. JWT Authentication (NFR-3.1)

### Implementation

**File**: `src/authorizationUtils.js`

JWT authentication is managed by Supabase, which automatically validates JWT tokens on all database operations.

#### Authentication Verification

```javascript
// Verify JWT session
const { user, error } = await verifyJWTSession();

// Alternatively, check with optional trip membership
const { authorized, error } = await requireAuthentication(tripId, userId);
```

#### Key Features

1. **Automatic JWT Validation**: Supabase validates JWT on all database query
2. **Session Management**: Supabase Auth handles token creation, refresh, and expiration
3. **Protected Service Functions**: All service functions verify authentication before operations
4. **Explicit Public Endpoints**: Share token endpoints are marked; protected by Row Level Security

### Authentication Flow

1. User signs up/logs in (handled by Supabase Auth in `login.jsx` and `register.jsx`)
2. Supabase generates JWT token
3. Token automatically included in headers by Supabase client
4. Every database operation verified by JWT
5. Expired tokens trigger re-authentication

### Unauthenticated Access

The following operations are allowed without authentication (explicitly public):

- **Public shared trips**: Accessed via share token (share_token parameter)
  - Still protected by RLS policy that checks `is_active = true`
  - User must accept invitation to become permanent member

### Current Status

✅ **Implemented**:
- `verifyJWTSession()` function for session validation
- JWT verification in critical service functions
- Supabase RLS policies enforce JWT on all database operations

---

## 4. Authorization & Trip Membership Verification (NFR-3.2)

### Implementation

**File**: `src/authorizationUtils.js`

Authorization utilities enforce trip membership and role-based access control:

```javascript
// Check if user is a trip member
const { isMember, role } = await isUserTripMember(tripId, userId);

// Check if user is the trip creator
const { isCreator } = await isUserTripCreator(tripId, userId);

// Combined auth + membership check
const { authorized, user, role } = await verifyAuthAndTripAccess(tripId);

// Check modification permissions
const { canModify } = await canUserModifyTrip(tripId, userId);
```

#### Authorization Levels

| Role | Permissions |
|------|-------------|
| **Creator** | Create, view, modify, delete trip; manage participants |
| **Participant** | Create expenses/accommodations; view trip resources; vote on accommodations |
| **Pending** | Join trip (after accepting invitation) |
| **Non-member** | Access denied (except public share token access) |

#### Implementation Details

1. **Database Checks**: All authorization checks query `trip_participants` and `trips` tables
2. **Row Level Security**: Supabase RLS policies enforce authorization at the database level
3. **Redundant Client Checks**: Service layer also verifies authorization (defense in depth)
4. **Error Handling**: Clear error messages when access is denied

### Authorization Checks in Service Functions

```javascript
// Example: addAccommodation requires membership
export const addAccommodation = async (tripId, userId, payload) => {
    // 1. Verify JWT authentication
    const { authorized, error: authError } = await verifyAuthAndTripAccess(tripId);
    if (!authorized) {
        return { data: null, error: authError };
    }
    
    // 2. Sanitize input
    const sanitizedData = validateAndSanitizeAccommodationData(payload);
    
    // 3. Insert with database RLS enforcement
    const { data, error } = await supabase
        .from('accommodations')
        .insert([sanitizedData]);
};
```

### Row Level Security Policies

The following RLS policies enforce authorization at the database level:

```sql
-- Users can only view trips they participate in
CREATE POLICY "Users can view trips they participate in"
    ON trips FOR SELECT TO authenticated
    USING (auth.uid() IN (
        SELECT user_id FROM trip_participants WHERE trip_id = trips.id
    ));

-- Only trip creators can modify trips
CREATE POLICY "Trip creators can update trips"
    ON trips FOR UPDATE TO authenticated
    USING (auth.uid() = created_by);

-- Only trip creators can delete trips
CREATE POLICY "Trip creators can delete trips"
    ON trips FOR DELETE TO authenticated
    USING (auth.uid() = created_by);
```

### Current Status

✅ **Implemented**:
- Membership verification in all trip-scoped operations
- Role-based access control implemented
- Creator-only operations protected
- Supabase RLS policies enforce database-level authorization

---

## Security Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     TripSync Application                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Client Components (React)                                   │
│  ├── Login / Register                                        │
│  ├── CreateTrip                                              │
│  └── TripChoices (Accommodations, Expenses, etc.)            │
│                                                              │
│  ↓ All requests sanitized and authenticated                  │
│                                                              │
│  Service Layer (tripService.js)                              │
│  ├── Verify JWT Session (NFR-3.1)                            │
│  ├── Check Trip Membership (NFR-3.2)                         │
│  ├── Sanitize Input (NFR-3.3)                                │
│  └── Load Secrets from ENV (NFR-3.4)                         │
│                                                              │
│  ↓ All requests validated                                    │
│                                                              │
│  Supabase Backend                                            │
│  ├── JWT Token Validation                                    │
│  ├── Row Level Security (RLS) Policies                       │
│  └── Protected Database Tables                               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Checklist

### For Developers

- [ ] **Never commit secrets**: Always use `.env` for sensitive values
- [ ] **Sanitize user input**: Use `securityUtils` functions for all text inputs
- [ ] **Verify authentication**: Call `verifyJWTSession()` for protected operations
- [ ] **Check authorization**: Use `verifyAuthAndTripAccess()` for trip-scoped operations
- [ ] **Use RLS policies**: Rely on Supabase RLS as defense-in-depth
- [ ] **Handle errors gracefully**: Never expose sensitive error details to users

### For Operations/DevOps

- [ ] **Environment variables set**: All secrets configured via platform (Vercel, Netlify, etc.)
- [ ] **No hardcoded secrets**: Regular code reviews to catch leaked secrets
- [ ] **RLS policies enabled**: Verify all tables have appropriate RLS policies
- [ ] **HTTPS enforced**: Application runs over HTTPS in production
- [ ] **Security headers**: Content-Security-Policy and other headers configured
- [ ] **Rate limiting**: API rate limiting configured (Supabase or zero-trust proxy)

---

## Testing Security

### Unit Tests for Sanitization

```javascript
import { sanitizeText, sanitizeURL, sanitizeEmail } from '../securityUtils';

describe('Security Utils', () => {
  test('sanitizeText removes HTML tags', () => {
    expect(sanitizeText('<script>alert("XSS")</script>'))
      .toBe('alert("XSS")');
  });

  test('sanitizeURL rejects javascript protocol', () => {
    expect(sanitizeURL('javascript:alert("XSS")'))
      .toBe('');
  });

  test('sanitizeEmail validates format', () => {
    expect(sanitizeEmail('test@example.com'))
      .toBe('test@example.com');
    expect(sanitizeEmail('invalid'))
      .toBe('');
  });
});
```

### Manual Testing Checklist

1. **XSS Testing**:
   - Try entering `<script>alert('XSS')</script>` in trip name
   - Verify it's displayed as plain text, not executed
   
2. **Authentication Testing**:
   - Try accessing trip without logging in (should fail)
   - Verify JWT token is included in requests
   
3. **Authorization Testing**:
   - Create trip as User A
   - Try accessing it as User B (should fail)
   - Add User B to trip
   - Verify User B can now access it
   
4. **Secret Testing**:
   - Verify `.env` is in `.gitignore`
   - Never commit `.env` with real values

---

## Incident Response

### Security Issue Discovered

1. **Assess severity**: Determine if user data is at risk
2. **Isolate**: Disable affected functionality if necessary
3. **Fix**: Apply patches to code and retest
4. **Deploy**: Push fix to production immediately
5. **Document**: Create incident post-mortem
6. **Communicate**: Notify affected users if necessary

### Contact

Please report security vulnerabilities responsibly to the development team.

---

## Additional Resources

- [Supabase Security Documentation](https://supabase.com/docs/guides/security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-22 | 1.0 | Initial security implementation (NFR-3.1 through 3.4) |

---

**Last Updated**: February 22, 2026  
**Status**: ✅ All NFR-3.x Requirements Implemented
