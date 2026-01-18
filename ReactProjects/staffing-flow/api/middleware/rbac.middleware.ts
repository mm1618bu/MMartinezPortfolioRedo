import { Request, Response, NextFunction } from 'express';
import { UnauthorizedError, ForbiddenError } from '../errors';

type Role = 'super_admin' | 'admin' | 'manager' | 'staff' | 'viewer';

export const authorize = (allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role as Role;

      // Super admin has access to everything
      if (userRole === 'super_admin') {
        next();
        return;
      }

      // Check if user's role is in the allowed roles list
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireSameOrganization = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const requestedOrgId = req.body.organization_id || req.query.organizationId;

    if (requestedOrgId && requestedOrgId !== req.user.organization_id) {
      throw new ForbiddenError('Access denied to this organization');
    }

    next();
  } catch (error) {
    next(error);
  }
};
