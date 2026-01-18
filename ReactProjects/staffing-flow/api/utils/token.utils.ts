import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ACCESS_TOKEN_EXPIRY: StringValue = (process.env.ACCESS_TOKEN_EXPIRY || '15m') as StringValue; // 15 minutes
const REFRESH_TOKEN_EXPIRY: StringValue = (process.env.REFRESH_TOKEN_EXPIRY || '7d') as StringValue; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  organizationId: string;
  role: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'staffing-flow-api',
    subject: payload.userId,
  };
  return jwt.sign(payload, JWT_SECRET, options);
};

/**
 * Generate a secure random refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Calculate refresh token expiry date
 */
export const getRefreshTokenExpiry = (): Date => {
  const expiryMs = parseExpiry(REFRESH_TOKEN_EXPIRY);
  return new Date(Date.now() + expiryMs);
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (payload: TokenPayload): TokenPair => {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken();
  const expiresIn = parseExpiry(ACCESS_TOKEN_EXPIRY);

  return {
    accessToken,
    refreshToken,
    expiresIn: Math.floor(expiresIn / 1000), // Convert to seconds
  };
};

/**
 * Verify and decode JWT access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'staffing-flow-api',
    }) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (useful for expired tokens)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Parse expiry string to milliseconds
 * Supports: 1s, 1m, 1h, 1d, 1w
 */
const parseExpiry = (expiry: string): number => {
  const units: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  const match = expiry.match(/^(\d+)([smhdw])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const [, value = '0', unit = 's'] = match;
  return parseInt(value, 10) * (units[unit] || 1000);
};

/**
 * Check if a date is in the past
 */
export const isExpired = (expiryDate: Date): boolean => {
  return new Date(expiryDate) < new Date();
};

/**
 * Get token expiry in seconds from now
 */
export const getTokenExpiry = (expiryDate: Date): number => {
  const now = Date.now();
  const expiry = new Date(expiryDate).getTime();
  return Math.max(0, Math.floor((expiry - now) / 1000));
};
