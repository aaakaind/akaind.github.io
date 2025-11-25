import { query, transaction } from '../config/database';
import { hashPassword } from '../utils/auth';
import logger from '../config/logger';

export interface Staff {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  department?: string;
  position?: string;
  employeeId?: string;
  status: string;
  isSuperAdmin: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffWithRoles extends Staff {
  roles: Array<{ id: string; name: string; permissions: string[] }>;
}

export class StaffModel {
  /**
   * Create a new staff member
   */
  static async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    department?: string;
    position?: string;
    employeeId?: string;
    createdBy?: string;
  }): Promise<Staff> {
    const passwordHash = await hashPassword(data.password);

    const result = await query<Staff>(
      `INSERT INTO staff (
        email, password_hash, first_name, last_name, phone, 
        department, position, employee_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, email, first_name as "firstName", last_name as "lastName",
                phone, department, position, employee_id as "employeeId",
                status, is_super_admin as "isSuperAdmin",
                created_at as "createdAt", updated_at as "updatedAt"`,
      [
        data.email,
        passwordHash,
        data.firstName,
        data.lastName,
        data.phone,
        data.department,
        data.position,
        data.employeeId,
        data.createdBy,
      ]
    );

    logger.info('Staff member created', { staffId: result[0].id, email: data.email });
    return result[0];
  }

  /**
   * Find staff member by ID
   */
  static async findById(id: string): Promise<Staff | null> {
    const result = await query<Staff>(
      `SELECT id, email, first_name as "firstName", last_name as "lastName",
              phone, department, position, employee_id as "employeeId",
              status, is_super_admin as "isSuperAdmin", last_login_at as "lastLoginAt",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM staff WHERE id = $1`,
      [id]
    );

    return result[0] || null;
  }

  /**
   * Find staff member by email
   */
  static async findByEmail(email: string): Promise<Staff | null> {
    const result = await query<Staff>(
      `SELECT id, email, first_name as "firstName", last_name as "lastName",
              phone, department, position, employee_id as "employeeId",
              status, is_super_admin as "isSuperAdmin", last_login_at as "lastLoginAt",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM staff WHERE email = $1`,
      [email]
    );

    return result[0] || null;
  }

  /**
   * Get staff member with password hash (for authentication)
   */
  static async findByEmailWithPassword(
    email: string
  ): Promise<(Staff & { passwordHash: string; failedLoginAttempts: number; lockedUntil?: Date }) | null> {
    const result = await query<any>(
      `SELECT id, email, password_hash as "passwordHash", first_name as "firstName", 
              last_name as "lastName", phone, department, position, employee_id as "employeeId",
              status, is_super_admin as "isSuperAdmin", last_login_at as "lastLoginAt",
              failed_login_attempts as "failedLoginAttempts", locked_until as "lockedUntil",
              created_at as "createdAt", updated_at as "updatedAt"
       FROM staff WHERE email = $1`,
      [email]
    );

    return result[0] || null;
  }

  /**
   * Get staff member with their roles
   */
  static async findByIdWithRoles(id: string): Promise<StaffWithRoles | null> {
    const staff = await this.findById(id);
    if (!staff) return null;

    const roles = await query<{ id: string; name: string; permissions: string[] }>(
      `SELECT r.id, r.name, r.permissions
       FROM staff_roles r
       JOIN staff_role_assignments sra ON sra.role_id = r.id
       WHERE sra.staff_id = $1`,
      [id]
    );

    return { ...staff, roles };
  }

  /**
   * Update staff member
   */
  static async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      department?: string;
      position?: string;
      status?: string;
      updatedBy?: string;
    }
  ): Promise<Staff | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.firstName !== undefined) {
      fields.push(`first_name = $${paramCount++}`);
      values.push(data.firstName);
    }
    if (data.lastName !== undefined) {
      fields.push(`last_name = $${paramCount++}`);
      values.push(data.lastName);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    if (data.department !== undefined) {
      fields.push(`department = $${paramCount++}`);
      values.push(data.department);
    }
    if (data.position !== undefined) {
      fields.push(`position = $${paramCount++}`);
      values.push(data.position);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(data.status);
    }
    if (data.updatedBy !== undefined) {
      fields.push(`updated_by = $${paramCount++}`);
      values.push(data.updatedBy);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const result = await query<Staff>(
      `UPDATE staff SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, first_name as "firstName", last_name as "lastName",
                 phone, department, position, employee_id as "employeeId",
                 status, is_super_admin as "isSuperAdmin",
                 created_at as "createdAt", updated_at as "updatedAt"`,
      values
    );

    logger.info('Staff member updated', { staffId: id });
    return result[0] || null;
  }

  /**
   * Update password
   */
  static async updatePassword(id: string, newPassword: string): Promise<void> {
    const passwordHash = await hashPassword(newPassword);

    await query(
      `UPDATE staff 
       SET password_hash = $1, password_changed_at = NOW()
       WHERE id = $2`,
      [passwordHash, id]
    );

    logger.info('Staff password updated', { staffId: id });
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id: string): Promise<void> {
    await query(
      `UPDATE staff 
       SET last_login_at = NOW(), failed_login_attempts = 0, locked_until = NULL
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedLogins(id: string): Promise<void> {
    await query(
      `UPDATE staff 
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE 
             WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '30 minutes'
             ELSE locked_until
           END
       WHERE id = $1`,
      [id]
    );
  }

  /**
   * List staff members with pagination and filters
   */
  static async list(options: {
    page?: number;
    limit?: number;
    status?: string;
    department?: string;
    search?: string;
  }): Promise<{ data: Staff[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (options.status && options.status !== 'all') {
      conditions.push(`status = $${paramCount++}`);
      values.push(options.status);
    }

    if (options.department) {
      conditions.push(`department = $${paramCount++}`);
      values.push(options.department);
    }

    if (options.search) {
      conditions.push(
        `(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
      );
      values.push(`%${options.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const [data, countResult] = await Promise.all([
      query<Staff>(
        `SELECT id, email, first_name as "firstName", last_name as "lastName",
                phone, department, position, employee_id as "employeeId",
                status, is_super_admin as "isSuperAdmin", last_login_at as "lastLoginAt",
                created_at as "createdAt", updated_at as "updatedAt"
         FROM staff
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...values, limit, offset]
      ),
      query<{ count: number }>(
        `SELECT COUNT(*) as count FROM staff ${whereClause}`,
        values
      ),
    ]);

    return {
      data,
      total: parseInt(countResult[0].count.toString()),
      page,
      limit,
    };
  }

  /**
   * Delete staff member
   */
  static async delete(id: string): Promise<void> {
    await query(`DELETE FROM staff WHERE id = $1`, [id]);
    logger.info('Staff member deleted', { staffId: id });
  }

  /**
   * Assign role to staff member
   */
  static async assignRole(staffId: string, roleId: string, assignedBy?: string): Promise<void> {
    await query(
      `INSERT INTO staff_role_assignments (staff_id, role_id, assigned_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (staff_id, role_id) DO NOTHING`,
      [staffId, roleId, assignedBy]
    );

    logger.info('Role assigned to staff', { staffId, roleId });
  }

  /**
   * Remove role from staff member
   */
  static async removeRole(staffId: string, roleId: string): Promise<void> {
    await query(
      `DELETE FROM staff_role_assignments 
       WHERE staff_id = $1 AND role_id = $2`,
      [staffId, roleId]
    );

    logger.info('Role removed from staff', { staffId, roleId });
  }

  /**
   * Get all permissions for a staff member
   */
  static async getPermissions(staffId: string): Promise<string[]> {
    const result = await query<{ permission: string }>(
      `SELECT DISTINCT unnest(r.permissions::text[]) as permission
       FROM staff_roles r
       JOIN staff_role_assignments sra ON sra.role_id = r.id
       WHERE sra.staff_id = $1`,
      [staffId]
    );

    return result.map((row) => row.permission);
  }
}
