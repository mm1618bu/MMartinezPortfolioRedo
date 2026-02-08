/**
 * Application Configuration
 * Default values for the application
 */

export const APP_CONFIG = {
  // Default Organization ID (from sample data)
  // Change this if you're using a different organization
  DEFAULT_ORGANIZATION_ID: '688590f3-2276-4b8c-aafd-6483bfb7f8d5',
  
  // Default Organization Name
  DEFAULT_ORGANIZATION_NAME: 'Demo Corporation',
  
  // API Configuration
  API_URL: import.meta.env.VITE_API_URL || '/api',
  WS_URL: import.meta.env.VITE_WS_URL || '',
  
  // Feature Flags
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  
  // App Metadata
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Staffing Flow',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '0.1.0',
} as const;

export default APP_CONFIG;
