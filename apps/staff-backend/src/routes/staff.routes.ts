import { Router } from 'express';
import { StaffController } from '../controllers/staff.controller';
import { authenticateStaff, requirePermission } from '../middleware/auth.middleware';
import { logActivity } from '../middleware/activity-logger.middleware';

const router = Router();

// Public routes
router.post('/login', logActivity('staff.login'), StaffController.login);

// Protected routes - require authentication
router.use(authenticateStaff);

// Profile routes
router.get('/profile', logActivity('staff.profile.read'), StaffController.getProfile);
router.put(
  '/profile/password',
  logActivity('staff.profile.password'),
  StaffController.changePassword
);

// Staff management routes - require permissions
router.get(
  '/',
  requirePermission('staff:read'),
  logActivity('staff.list'),
  StaffController.list
);

router.post(
  '/',
  requirePermission('staff:create'),
  logActivity('staff.create', 'staff'),
  StaffController.create
);

router.get(
  '/:id',
  requirePermission('staff:read'),
  logActivity('staff.read', 'staff'),
  StaffController.getById
);

router.put(
  '/:id',
  requirePermission('staff:update'),
  logActivity('staff.update', 'staff'),
  StaffController.update
);

router.delete(
  '/:id',
  requirePermission('staff:delete'),
  logActivity('staff.delete', 'staff'),
  StaffController.delete
);

// Role assignment routes
router.post(
  '/:id/roles',
  requirePermission('staff:update'),
  logActivity('staff.role.assign', 'staff'),
  StaffController.assignRole
);

router.delete(
  '/:id/roles/:roleId',
  requirePermission('staff:update'),
  logActivity('staff.role.remove', 'staff'),
  StaffController.removeRole
);

export default router;
