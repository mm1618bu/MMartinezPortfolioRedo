import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { signupSchema, loginSchema, refreshTokenSchema, logoutSchema } from '../schemas/auth.schema';
import { authRateLimiter, signupRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Public routes with stricter rate limiting
router.post('/signup', signupRateLimiter, validate(signupSchema), authController.signup);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authRateLimiter, validate(refreshTokenSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/revoke-all', authenticate, authController.revokeAllTokens);

export default router;
