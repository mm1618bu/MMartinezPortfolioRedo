import dotenv from 'dotenv';
import { cleanEnv, str, port } from 'envalid';

// Load environment variables
dotenv.config();

export const env = cleanEnv(process.env, {
  NODE_ENV: str({
    choices: ['development', 'test', 'production'],
    default: 'development',
  }),
  PORT: port({ default: 3001 }),
  API_HOST: str({ default: 'localhost' }),
  CORS_ORIGINS: str({ default: 'http://localhost:5173,http://localhost:3000' }),
});

export const config = {
  env: env.NODE_ENV,
  server: {
    host: env.API_HOST,
    port: env.PORT,
  },
  cors: {
    origins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
  },
  isDevelopment: env.isDevelopment,
  isProduction: env.isProduction,
  isTest: env.isTest,
} as const;

export default config;
