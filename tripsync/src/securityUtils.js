/**
 * Security Utilities for TripSync
 * Implements NFR-3.3: Input sanitization to prevent XSS and injection attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize text input to prevent XSS attacks
 * Removes any HTML tags and dangerous attributes
 * @param {string} input - The input text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // DOMPurify removes HTML tags and scripts
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
};

/**
 * Sanitize HTML content (for cases where HTML is needed)
 * Only allows safe tags like p, br, strong, em, etc.
 * @param {string} input - The HTML content to sanitize
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  const ALLOWED_TAGS = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'a'];
  const ALLOWED_ATTR = ['href', 'title'];
  
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    KEEP_CONTENT: true
  });
};

/**
 * Sanitize email addresses
 * Validates and sanitizes email format
 * @param {string} email - The email to sanitize
 * @returns {string} - Sanitized email or empty string if invalid
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return '';
  }
  const sanitized = sanitizeText(email).toLowerCase();
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitize URLs
 * Prevents javascript: proto col and other dangerous URLs
 * @param {string} url - The URL to sanitize
 * @returns {string} - Sanitized URL or empty string if invalid
 */
export const sanitizeURL = (url) => {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    // Remove whitespace
    const trimmed = url.trim();
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmed.toLowerCase();
    
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      return '';
    }
    
    // Use URL constructor to validate
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
      new URL(trimmed);
      return trimmed;
    }
    
    // Allow relative URLs
    if (trimmed.startsWith('/')) {
      return trimmed;
    }
    
    return '';
  } catch (error) {
    return '';
  }
};

/**
 * Sanitize numeric input
 * Ensures the input is a valid number
 * @param {any} input - The input to sanitize
 * @param {number} defaultValue - Default value if invalid
 * @returns {number} - Sanitized number
 */
export const sanitizeNumber = (input, defaultValue = 0) => {
  const num = Number(input);
  return !isNaN(num) && isFinite(num) ? num : defaultValue;
};

/**
 * Sanitize object by sanitizing all string values
 * Recursively processes nested objects
 * @param {object} obj - The object to sanitize
 * @returns {object} - Sanitized object
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'string' ? sanitizeText(item) : sanitizeObject(item)
    );
  }
  
  const sanitized = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  });
  
  return sanitized;
};

/**
 * Validate and sanitize trip data
 * @param {object} tripData - Trip data to validate and sanitize
 * @returns {object} - Cleaned trip data
 */
export const validateAndSanitizeTripData = (tripData) => {
  return {
    startPoint: sanitizeText(tripData.startPoint || ''),
    endPoint: sanitizeText(tripData.endPoint || ''),
    departureDate: sanitizeText(tripData.departureDate || ''),
    returnDate: sanitizeText(tripData.returnDate || ''),
    travelers: sanitizeNumber(tripData.travelers, null),
    modeOfTravel: sanitizeText(tripData.modeOfTravel || ''),
    accommodation: sanitizeText(tripData.accommodation || ''),
    tripStatus: sanitizeText(tripData.tripStatus || 'planning'),
    travelDetails: sanitizeObject(tripData.travelDetails || {})
  };
};

/**
 * Validate and sanitize accommodation data
 * @param {object} accData - Accommodation data to validate and sanitize
 * @returns {object} - Cleaned accommodation data
 */
export const validateAndSanitizeAccommodationData = (accData) => {
  return {
    name: sanitizeText(accData.name || ''),
    url: sanitizeURL(accData.url || ''),
    price_cents: sanitizeNumber(accData.price_cents, null),
    beds: sanitizeNumber(accData.beds, null),
    is_booked: Boolean(accData.is_booked)
  };
};

/**
 * Validate and sanitize expense data
 * @param {object} expData - Expense data to validate and sanitize
 * @returns {object} - Cleaned expense data
 */
export const validateAndSanitizeExpenseData = (expData) => {
  return {
    description: sanitizeText(expData.description || ''),
    amount_cents: sanitizeNumber(expData.amount_cents, 0),
    paidBy: sanitizeText(expData.paidBy || ''),
    category: sanitizeText(expData.category || ''),
    date: sanitizeText(expData.date || ''),
    splits: Array.isArray(expData.splits) ? expData.splits.map(split => ({
      user_id: sanitizeText(split.user_id || ''),
      amount_cents: sanitizeNumber(split.amount_cents, 0),
      settled: Boolean(split.settled)
    })) : []
  };
};

export default {
  sanitizeText,
  sanitizeHTML,
  sanitizeEmail,
  sanitizeURL,
  sanitizeNumber,
  sanitizeObject,
  validateAndSanitizeTripData,
  validateAndSanitizeAccommodationData,
  validateAndSanitizeExpenseData
};
