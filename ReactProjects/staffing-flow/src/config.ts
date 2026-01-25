/**
 * Environment configuration for the frontend
 */

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || '/api',
    pythonUrl: import.meta.env.VITE_PYTHON_API_URL || '/python',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Staffing Flow',
    version: import.meta.env.VITE_APP_VERSION || '0.1.0',
  },
  features: {
    debug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
} as const;

export default config;
