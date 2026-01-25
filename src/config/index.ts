/**
 * Application Configuration
 * Centralized configuration management using environment variables
 */

export const config = {
  // API Configuration
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
    timeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || 'PSM Main Site',
    env: import.meta.env.VITE_APP_ENV || 'development',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
} as const;

export default config;
