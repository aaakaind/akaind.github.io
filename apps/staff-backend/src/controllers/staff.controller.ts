import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { StaffModel } from '../models/staff.model';
import {
  createStaffSchema,
  updateStaffSchema,
  changePasswordSchema,
  loginSchema,
  paginationSchema,
  staffFiltersSchema,
} from '../utils/validators';
import { verifyPassword, generateToken, validatePassword } from '../utils/auth';
import logger from '../config/logger';

export class StaffController {
  /**
   * Login staff member
   */
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);

      const staff = await StaffModel.findByEmailWithPassword(validated.email);

      if (!staff) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Check if account is locked
      if (staff.lockedUntil && new Date(staff.lockedUntil) > new Date()) {
        res.status(403).json({
          success: false,
          error: 'Account is temporarily locked due to multiple failed login attempts',
        });
        return;
      }

      // Check if account is active
      if (staff.status !== 'active') {
        res.status(403).json({
          success: false,
          error: 'Account is not active',
        });
        return;
      }

      // Verify password
      const isValidPassword = await verifyPassword(validated.password, staff.passwordHash);

      if (!isValidPassword) {
        await StaffModel.incrementFailedLogins(staff.id);
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
        return;
      }

      // Get permissions
      const permissions = await StaffModel.getPermissions(staff.id);

      // Update last login
      await StaffModel.updateLastLogin(staff.id);

      // Generate token
      const token = generateToken({
        staffId: staff.id,
        email: staff.email,
        isAdmin: staff.isSuperAdmin || permissions.includes('*'),
        permissions,
      });

      logger.info('Staff login successful', { staffId: staff.id, email: staff.email });

      res.json({
        success: true,
        data: {
          token,
          staff: {
            id: staff.id,
            email: staff.email,
            firstName: staff.firstName,
            lastName: staff.lastName,
            department: staff.department,
            position: staff.position,
            isSuperAdmin: staff.isSuperAdmin,
          },
        },
      });
    } catch (error: any) {
      logger.error('Login error', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Login failed',
      });
    }
  }

  /**
   * Get current staff profile
   */
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const staffId = req.staff!.id;

      const staff = await StaffModel.findByIdWithRoles(staffId);

      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      res.json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      logger.error('Get profile error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get profile',
      });
    }
  }

  /**
   * Create new staff member
   */
  static async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = createStaffSchema.parse(req.body);

      // Validate password strength
      const passwordValidation = validatePassword(validated.password);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        });
        return;
      }

      // Check if email already exists
      const existingStaff = await StaffModel.findByEmail(validated.email);
      if (existingStaff) {
        res.status(409).json({
          success: false,
          error: 'Email already in use',
        });
        return;
      }

      const staff = await StaffModel.create({
        ...validated,
        createdBy: req.staff!.id,
      });

      res.status(201).json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      logger.error('Create staff error', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create staff member',
      });
    }
  }

  /**
   * List staff members
   */
  static async list(req: AuthRequest, res: Response): Promise<void> {
    try {
      const pagination = paginationSchema.parse(req.query);
      const filters = staffFiltersSchema.parse(req.query);

      const result = await StaffModel.list({
        page: pagination.page,
        limit: pagination.limit,
        status: filters.status,
        department: filters.department,
        search: filters.search,
      });

      res.json({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / result.limit),
        },
      });
    } catch (error: any) {
      logger.error('List staff error', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to list staff members',
      });
    }
  }

  /**
   * Get staff member by ID
   */
  static async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const staff = await StaffModel.findByIdWithRoles(id);

      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      res.json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      logger.error('Get staff by ID error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to get staff member',
      });
    }
  }

  /**
   * Update staff member
   */
  static async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const validated = updateStaffSchema.parse(req.body);

      const staff = await StaffModel.update(id, {
        ...validated,
        updatedBy: req.staff!.id,
      });

      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      res.json({
        success: true,
        data: staff,
      });
    } catch (error: any) {
      logger.error('Update staff error', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update staff member',
      });
    }
  }

  /**
   * Delete staff member
   */
  static async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (id === req.staff!.id) {
        res.status(400).json({
          success: false,
          error: 'Cannot delete your own account',
        });
        return;
      }

      const staff = await StaffModel.findById(id);
      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      await StaffModel.delete(id);

      res.json({
        success: true,
        message: 'Staff member deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete staff error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to delete staff member',
      });
    }
  }

  /**
   * Change password
   */
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const validated = changePasswordSchema.parse(req.body);
      const staffId = req.staff!.id;

      // Get current staff with password
      const staff = await StaffModel.findByEmailWithPassword(req.staff!.email);

      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      // Verify current password
      const isValidPassword = await verifyPassword(validated.currentPassword, staff.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
        });
        return;
      }

      // Validate new password strength
      const passwordValidation = validatePassword(validated.newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({
          success: false,
          error: 'New password does not meet requirements',
          details: passwordValidation.errors,
        });
        return;
      }

      await StaffModel.updatePassword(staffId, validated.newPassword);

      logger.info('Password changed', { staffId });

      res.json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error: any) {
      logger.error('Change password error', { error });
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to change password',
      });
    }
  }

  /**
   * Assign role to staff member
   */
  static async assignRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { roleId } = req.body;

      if (!roleId) {
        res.status(400).json({
          success: false,
          error: 'Role ID is required',
        });
        return;
      }

      const staff = await StaffModel.findById(id);
      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      await StaffModel.assignRole(id, roleId, req.staff!.id);

      res.json({
        success: true,
        message: 'Role assigned successfully',
      });
    } catch (error: any) {
      logger.error('Assign role error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to assign role',
      });
    }
  }

  /**
   * Remove role from staff member
   */
  static async removeRole(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, roleId } = req.params;

      const staff = await StaffModel.findById(id);
      if (!staff) {
        res.status(404).json({
          success: false,
          error: 'Staff member not found',
        });
        return;
      }

      await StaffModel.removeRole(id, roleId);

      res.json({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error: any) {
      logger.error('Remove role error', { error });
      res.status(500).json({
        success: false,
        error: 'Failed to remove role',
      });
    }
  }
}
