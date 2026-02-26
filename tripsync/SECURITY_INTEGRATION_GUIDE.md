# TripSync Security Integration Guide

## Quick Start Guide for Developers

This guide shows how to use the new security utilities in your code.

---

## 1. Input Sanitization

### Basic Text Sanitization

```javascript
import { sanitizeText } from './securityUtils';

// Remove HTML and potential XSS attacks
const userInput = "<script>alert('XSS')</script>";
const clean = sanitizeText(userInput); // "alert('XSS')"
```

### Email Validation

```javascript
import { sanitizeEmail } from './securityUtils';

// Validate and sanitize email
const email = sanitizeEmail(userInput);
if (!email) {
    console.error('Invalid email format');
}
```

### URL Sanitization

```javascript
import { sanitizeURL } from './securityUtils';

// Block dangerous protocols like javascript:
const url = sanitizeURL(userInput);
if (!url) {
    console.error('Invalid or dangerous URL');
}
```

### Numeric Validation

```javascript
import { sanitizeNumber } from './securityUtils';

// Ensure number is valid, provide default
const amount = sanitizeNumber(userInput, 0); // Returns 0 if invalid
```

### Object Sanitization

```javascript
import { sanitizeObject } from './securityUtils';

// Recursively sanitize all string values in object
const userObj = { name: "<script>test</script>", age: 25 };
const clean = sanitizeObject(userObj);
// { name: "test", age: 25 }
```

### Domain-Specific Validation

```javascript
import { validateAndSanitizeTripData } from './securityUtils';

// Validate and sanitize trip data all at once
const tripData = await validateAndSanitizeTripData(userInput);
```

---

## 2. Authentication & Authorization

### Verify JWT Session

```javascript
import { verifyJWTSession } from './authorizationUtils';

// Check if user is authenticated
const { user, error } = await verifyJWTSession();
if (error || !user) {
    // User not authenticated
    navigate('/login');
}
```

### Check Trip Membership

```javascript
import { isUserTripMember, getUserTripRole } from './authorizationUtils';

// Verify user is member of trip
const { isMember, role } = await isUserTripMember(tripId, userId);
if (!isMember) {
    // User not a member
    return { error: 'Access denied' };
}

console.log('User role:', role); // 'creator' or 'participant'
```

### Verify Creator Status

```javascript
import { isUserTripCreator } from './authorizationUtils';

// Check if user created this trip
const { isCreator } = await isUserTripCreator(tripId, userId);
if (!isCreator) {
    return { error: 'Only trip creator can do this' };
}
```

### Combined Auth + Membership Check

```javascript
import { verifyAuthAndTripAccess } from './authorizationUtils';

// Single function to verify both authentication and membership
const { authorized, user, role, error } = await verifyAuthAndTripAccess(tripId);
if (!authorized) {
    return { error: error || 'Access denied' };
}

// At this point, we know user is authenticated and is a trip member
console.log('User role:', role);
```

### Check Modification Permissions

```javascript
import { canUserModifyTrip } from './authorizationUtils';

// Check if user can modify trip (creator only)
const { canModify } = await canUserModifyTrip(tripId, userId);
if (!canModify) {
    return { error: 'Only trip creator can modify the trip' };
}
```

### Middleware-Like Protection

```javascript
import { requireAuthentication } from './authorizationUtils';

// Protect service function call
export const someProtectedFunction = async (tripId, userId) => {
    const { authorized, error } = await requireAuthentication(tripId, userId);
    if (!authorized) {
        return { error };
    }
    // Function implementation...
};
```

---

## 3. Complete Service Function Example

Here's a complete example combining sanitization and authorization:

```javascript
import { sanitizeText, validateAndSanitizeTripData } from './securityUtils';
import { verifyAuthAndTripAccess } from './authorizationUtils';
import { supabase } from './supabaseClient';

/**
 * Create a new trip (secure example)
 */
export const createTrip = async (tripData, userId) => {
    try {
        // Step 1: Verify JWT authentication
        const { authorized, error: authError } = await verifyJWTSession();
        if (!authorized) {
            return { data: null, error: authError };
        }

        // Step 2: Sanitize all input to prevent XSS
        const sanitizedData = validateAndSanitizeTripData(tripData);

        // Step 3: Insert sanitized data
        const { data: trip, error: tripError } = await supabase
            .from('trips')
            .insert([{
                created_by: userId,
                name: sanitizedData.startPoint + ' to ' + sanitizedData.endPoint,
                start_point: sanitizedData.startPoint,
                end_point: sanitizedData.endPoint,
                departure_date: sanitizedData.departureDate,
                return_date: sanitizedData.returnDate,
                expected_travelers: sanitizedData.travelers,
                mode_of_travel: sanitizedData.modeOfTravel,
                accommodation_type: sanitizedData.accommodation,
                travel_details: sanitizedData.travelDetails
            }])
            .select()
            .single();

        if (tripError) throw tripError;

        // Step 4: Add creator as participant
        const { error: participantError } = await supabase
            .from('trip_participants')
            .insert([{
                trip_id: trip.id,
                user_id: userId,
                role: 'creator',
                status: 'accepted'
            }]);

        if (participantError) throw participantError;

        return { data: trip, error: null };
    } catch (error) {
        console.error('Error creating trip:', error);
        return { data: null, error };
    }
};

/**
 * Add accommodation to trip (secure example)
 */
export const addAccommodation = async (tripId, userId, payload) => {
    try {
        // Step 1: Verify JWT + Trip Membership
        const { authorized, error: accessError } = await verifyAuthAndTripAccess(tripId);
        if (!authorized) {
            return { data: null, error: accessError };
        }

        // Step 2: Sanitize accommodation data
        const sanitizedData = validateAndSanitizeAccommodationData(payload);

        // Step 3: Insert sanitized data
        const { data: accommodation, error } = await supabase
            .from('accommodations')
            .insert([{
                trip_id: tripId,
                added_by: userId,
                name: sanitizedData.name,
                url: sanitizedData.url,
                price_cents: sanitizedData.price_cents,
                beds: sanitizedData.beds,
                is_booked: false
            }])
            .select()
            .single();

        if (error) throw error;

        return { data: accommodation, error: null };
    } catch (error) {
        console.error('Error adding accommodation:', error);
        return { data: null, error };
    }
};
```

---

## 4. Component-Level Security

### In React Components

```javascript
import React from 'react';
import { sanitizeText } from '../securityUtils';
import { verifyJWTSession } from '../authorizationUtils';

export function TripForm({ onSubmit }) {
    const [tripName, setTripName] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Verify authentication
        const { user, error: authError } = await verifyJWTSession();
        if (authError) {
            alert('Please log in first');
            return;
        }

        // Sanitize input before sending to service layer
        const cleanName = sanitizeText(tripName);

        // Call service function
        const { data, error } = await createTrip({
            name: cleanName,
            // ... other fields
        }, user.id);

        if (error) {
            alert('Error creating trip: ' + error.message);
            return;
        }

        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                value={tripName}
                onChange={(e) => setTripName(e.target.value)}
                placeholder="Trip name"
            />
            <button type="submit">Create Trip</button>
        </form>
    );
}
```

---

## 5. Error Handling Best Practices

### For Users

```javascript
try {
    const result = await createTrip(tripData, userId);
    if (result.error) {
        // Show user-friendly error
        if (result.error.message.includes('Authentication')) {
            alert('Please log in to create a trip');
        } else if (result.error.message.includes('permission')) {
            alert('You don\'t have permission to do this');
        } else {
            alert('An error occurred. Please try again.');
        }
        return;
    }
} catch (error) {
    console.error('Unexpected error:', error);
    alert('An unexpected error occurred');
}
```

### Never Expose Sensitive Info

```javascript
// ❌ BAD - Exposes internal error details
alert('Error: ' + error.message);

// ✅ GOOD - Generic user message
alert('An error occurred. Please try again.');

// ✅ GOOD - Log details server-side
console.error('Detailed error:', error);
```

---

## 6. Testing Security Features

### Test Sanitization

```javascript
import { sanitizeText, sanitizeURL } from '../securityUtils';

describe('Security', () => {
    test('XSS prevention', () => {
        const xss = "<script>alert('XSS')</script>";
        const clean = sanitizeText(xss);
        expect(clean).not.toContain('<script>');
    });

    test('URL danger prevention', () => {
        const bad = "javascript:alert('XSS')";
        const clean = sanitizeURL(bad);
        expect(clean).toBe('');
    });
});
```

### Test Authorization

```javascript
import { isUserTripMember } from '../authorizationUtils';

describe('Authorization', () => {
    test('user not in trip', async () => {
        const { isMember } = await isUserTripMember('trip123', 'user456');
        expect(isMember).toBe(false);
    });

    test('user is trip member', async () => {
        // Setup: Add user to trip first
        const { isMember, role } = await isUserTripMember('trip123', 'user123');
        expect(isMember).toBe(true);
        expect(role).toBe('creator');
    });
});
```

---

## 7. Environment Variables

### Setup for Development

```bash
# Copy template
cp .env.example .env

# Edit .env with your credentials
# REACT_APP_SUPABASE_URL=https://your-project.supabase.co
# REACT_APP_SUPABASE_ANON_KEY=your-key-here
```

### Verify .env is Git-Ignored

```bash
# Should show .env in output
cat .gitignore | grep "\.env"

# Verify it's not tracked
git status | grep "\.env"  # Should show nothing
```

---

## 8. Troubleshooting

### Issue: "Authentication required" Error

**Cause**: User is not logged in

**Solution**:
```javascript
const { user } = await verifyJWTSession();
if (!user) {
    // Redirect to login
    navigate('/login');
}
```

### Issue: "Access denied" Error

**Cause**: User is not a trip member

**Solution**:
```javascript
const { isMember } = await isUserTripMember(tripId, userId);
if (!isMember) {
    // Show error message or add user to trip
    alert('You are not a member of this trip');
}
```

### Issue: Sanitized Input Becomes Empty

**Cause**: Input contains only HTML/dangerous content

**Solution**:
```javascript
const clean = sanitizeText(input);
if (!clean) {
    alert('Please enter valid text');
    return;
}
```

### Issue: URL is Rejected

**Cause**: URL uses dangerous protocol

**Solution**:
```javascript
const url = sanitizeURL(userInput);
if (url) {
    // URL is valid and safe
} else {
    alert('Please enter a valid https:// URL');
}
```

---

## 9. Security Checklist for Each PR

- [ ] All user inputs sanitized before database operations
- [ ] All trip-scoped operations verify membership
- [ ] All protected functions verify JWT authentication
- [ ] No hardcoded secrets or API keys
- [ ] No sensitive data in error messages
- [ ] No unencrypted passwords or tokens logged
- [ ] Tests added for new security functions

---

## 10. Additional Resources

- [securityUtils.js](./src/securityUtils.js) - Full sanitization utilities
- [authorizationUtils.js](./src/authorizationUtils.js) - Full authorization utilities
- [SECURITY.md](./SECURITY.md) - Detailed security documentation
- [NFR_IMPLEMENTATION.md](./NFR_IMPLEMENTATION.md) - NFR compliance details

---

**Last Updated**: February 22, 2026  
**Version**: 1.0
