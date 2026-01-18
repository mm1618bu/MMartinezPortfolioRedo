import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Helper to extract client info
const getClientInfo = (req: Request) => ({
  ipAddress: req.ip || req.socket.remoteAddress,
  userAgent: req.get('user-agent'),
});

export const authController = {
  signup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, organizationId } = req.body;
      const result = await authService.signup({ email, password, name, organizationId });
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const { ipAddress, userAgent } = getClientInfo(req);
      const result = await authService.login({ email, password }, ipAddress, userAgent);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  refresh: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      const { ipAddress, userAgent } = getClientInfo(req);
      const result = await authService.refreshAccessToken(refreshToken, ipAddress, userAgent);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  getCurrentUser: async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await authService.getCurrentUser();
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  revokeAllTokens: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
        });
        return;
      }
      await authService.revokeAllUserTokens(userId);
      res.json({
        success: true,
        message: 'All refresh tokens revoked successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};
