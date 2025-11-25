import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { StaffModel } from '../models/staff.model';
import logger from '../config/logger';

export interface AuthRequest extends Request {
  staff?: {
    id: string;
    email: string;
    isAdmin: boolean;
    permissions: string[];
  };
}

/**
 * Middleware to authenticate staff using JWT token
 */
export async function authenticateStaff(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyToken(token);

      // Verify staff still exists and is active
      const staff = await StaffModel.findById(payload.staffId);

      if (!staff) {
        res.status(401).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      if (staff.status !== 'active') {
        res.status(403).json({
          success: false,
          error: 'Staff account is not active',
        });
        return;
      }

      // Attach staff info to request
      req.staff = {
        id: payload.staffId,
        email: payload.email,
        isAdmin: payload.isAdmin,
        permissions: payload.permissions,
      };

      next();
    } catch (error) {
      logger.warn('Invalid authentication token', { error });
      res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token',
      });
    }
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

/**
 * Middleware to check if staff has required permission
 */
export function requirePermission(permission: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.staff) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Super admins have all permissions
    if (req.staff.permissions.includes('*')) {
      next();
      return;
    }

    // Check for exact permission match
    if (req.staff.permissions.includes(permission)) {
      next();
      return;
    }

    // Check for wildcard permission (e.g., "staff:*" matches "staff:read")
    const [resource, action] = permission.split(':');
    const wildcardPermission = `${resource}:*`;

    if (req.staff.permissions.includes(wildcardPermission)) {
      next();
      return;
    }

    logger.warn('Permission denied', {
      staffId: req.staff.id,
      requiredPermission: permission,
      staffPermissions: req.staff.permissions,
    });

    res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
    });
  };
}

/**
 * Middleware to check if staff is admin
 */
export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (!req.staff) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    });
    return;
  }

  if (!req.staff.isAdmin && !req.staff.permissions.includes('*')) {
    logger.warn('Admin access denied', { staffId: req.staff.id });
    res.status(403).json({
      success: false,
      error: 'Admin access required',
    });
    return;
  }

  next();
}

/**
 * Optional authentication - doesn't fail if no token
 */
export async function optionalAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    const staff = await StaffModel.findById(payload.staffId);

    if (staff && staff.status === 'active') {
      req.staff = {
        id: payload.staffId,
        email: payload.email,
        isAdmin: payload.isAdmin,
        permissions: payload.permissions,
      };
    }
  } catch (error) {
    // Ignore errors for optional auth
    logger.debug('Optional auth failed', { error });
  }

  next();
}
