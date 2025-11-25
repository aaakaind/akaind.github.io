import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Middleware to log staff activities
 */
export function logActivity(action: string, resourceType?: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      // Log the activity after response
      setImmediate(async () => {
        try {
          const staffId = req.staff?.id || null;
          const resourceId = req.params.id || null;
          const ipAddress = req.ip || req.socket.remoteAddress;
          const userAgent = req.headers['user-agent'];
          const status = res.statusCode < 400 ? 'success' : 'error';
          const errorMessage = body?.error || null;

          await query(
            `INSERT INTO staff_activity_logs 
             (staff_id, action, resource_type, resource_id, details, ip_address, user_agent, status, error_message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              staffId,
              action,
              resourceType,
              resourceId,
              JSON.stringify({
                method: req.method,
                path: req.path,
                query: req.query,
              }),
              ipAddress,
              userAgent,
              status,
              errorMessage,
            ]
          );

          logger.info('Activity logged', {
            staffId,
            action,
            resourceType,
            resourceId,
            status,
          });
        } catch (error) {
          logger.error('Failed to log activity', { error });
        }
      });

      return originalJson(body);
    };

    next();
  };
}
