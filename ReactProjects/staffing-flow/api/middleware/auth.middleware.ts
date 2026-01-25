import { Request, Response, NextFunction } from 'express';
import { supabase } from '../lib/supabase';
import { UnauthorizedError } from '../errors';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id: string;
    team_id?: string;
    created_at: string;
    updated_at: string;
  };
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedRequest['user'];
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Development bypass: skip auth check entirely in development
    if (process.env.NODE_ENV === 'development') {
      // Create a mock user for local development
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@localhost',
        name: 'Dev User',
        role: 'admin',
        organization_id: '00000000-0000-0000-0000-000000000001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return next();
    }

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.substring(7);

    // Verify token with Supabase
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new UnauthorizedError('Invalid or expired authentication token');
    }

    // Fetch user details from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      throw new UnauthorizedError('User account not found');
    }

    // Attach user to request
    req.user = userData;
    next();
  } catch (error) {
    next(error);
  }
};
