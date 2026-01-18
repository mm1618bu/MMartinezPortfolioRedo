import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { signupSchema, loginSchema, refreshTokenSchema, logoutSchema } from '../schemas/auth.schema';

const router = Router();

// Public routes
router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', validate(logoutSchema), authController.logout);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/revoke-all', authenticate, authController.revokeAllTokens);

export default router;
