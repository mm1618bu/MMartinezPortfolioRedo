/**
 * Utility functions for rate limiting and performance optimization
 */

/**
 * Debounce function - delays execution until after a period of inactivity
 * Perfect for: search inputs, text fields, auto-save
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per time period
 * Perfect for: scroll handlers, resize handlers, repeated button clicks
 * 
 * @param {Function} func - The function to throttle
 * @param {number} limit - Minimum time between executions in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 1000) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func(...args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Advanced debounce with leading edge execution option
 * Executes immediately on first call, then waits
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - Delay in milliseconds
 * @param {boolean} immediate - Execute on leading edge
 * @returns {Function} - Debounced function
 */
export function debounceLeading(func, wait = 300, immediate = false) {
  let timeout;
  
  return function executedFunction(...args) {
    const callNow = immediate && !timeout;
    
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      timeout = null;
      if (!immediate) func(...args);
    }, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Rate limiter - limits function calls to a maximum per time window
 * 
 * @param {Function} func - The function to rate limit
 * @param {number} maxCalls - Maximum number of calls allowed
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Function} - Rate limited function
 */
export function rateLimit(func, maxCalls = 5, timeWindow = 60000) {
  const calls = [];
  
  return function executedFunction(...args) {
    const now = Date.now();
    
    // Remove calls outside the time window
    while (calls.length && calls[0] < now - timeWindow) {
      calls.shift();
    }
    
    // Check if we're under the limit
    if (calls.length < maxCalls) {
      calls.push(now);
      return func(...args);
    } else {
      const oldestCall = calls[0];
      const timeUntilNextCall = (oldestCall + timeWindow) - now;
      console.warn(`Rate limit exceeded. Try again in ${Math.ceil(timeUntilNextCall / 1000)} seconds.`);
      throw new Error(`Rate limit exceeded. Maximum ${maxCalls} calls per ${timeWindow / 1000} seconds.`);
    }
  };
}

/**
 * Create a memoized version of a function
 * Caches results for identical inputs
 * 
 * @param {Function} func - The function to memoize
 * @returns {Function} - Memoized function
 */
export function memoize(func) {
  const cache = new Map();
  
  return function memoizedFunction(...args) {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Batch multiple function calls into a single execution
 * Useful for grouping multiple updates
 * 
 * @param {Function} func - The function to batch
 * @param {number} delay - Delay before execution in milliseconds
 * @returns {Function} - Batched function
 */
export function batchCalls(func, delay = 100) {
  let timeout;
  let calls = [];
  
  return function batchedFunction(...args) {
    calls.push(args);
    
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      const allCalls = [...calls];
      calls = [];
      func(allCalls);
    }, delay);
  };
}

/**
 * Prevents duplicate function calls while a promise is pending
 * Perfect for preventing double-submits
 * 
 * @param {Function} asyncFunc - The async function to guard
 * @returns {Function} - Guarded function
 */
export function preventDuplicateCalls(asyncFunc) {
  let pending = false;
  
  return async function guardedFunction(...args) {
    if (pending) {
      console.warn('Call already in progress, ignoring duplicate');
      return;
    }
    
    pending = true;
    
    try {
      const result = await asyncFunc(...args);
      return result;
    } finally {
      pending = false;
    }
  };
}

/**
 * Exponential backoff retry logic
 * Retries with increasing delays
 * 
 * @param {Function} func - The function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} initialDelay - Initial delay in milliseconds
 * @returns {Function} - Function with retry logic
 */
export function withRetry(func, maxRetries = 3, initialDelay = 1000) {
  return async function retriedFunction(...args) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await func(...args);
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries) {
          const delay = initialDelay * Math.pow(2, i);
          console.warn(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  };
}
