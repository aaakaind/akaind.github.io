-- Staff Management Database Schema

-- Staff members table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department VARCHAR(100),
    position VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    is_super_admin BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES staff(id),
    updated_by UUID REFERENCES staff(id)
);

-- Staff roles table
CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff role assignments
CREATE TABLE IF NOT EXISTS staff_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    role_id UUID REFERENCES staff_roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES staff(id),
    UNIQUE(staff_id, role_id)
);

-- Staff activity logs
CREATE TABLE IF NOT EXISTS staff_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    status VARCHAR(50),
    error_message TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Staff sessions table
CREATE TABLE IF NOT EXISTS staff_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff departments table
CREATE TABLE IF NOT EXISTS staff_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES staff_departments(id),
    manager_id UUID REFERENCES staff(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_role_assignments_staff_id ON staff_role_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_role_assignments_role_id ON staff_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_staff_id ON staff_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_timestamp ON staff_activity_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_token_hash ON staff_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_staff_departments_parent_id ON staff_departments(parent_id);

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_roles_updated_at
    BEFORE UPDATE ON staff_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_departments_updated_at
    BEFORE UPDATE ON staff_departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO staff_roles (name, description, permissions, is_system_role) VALUES
    (
        'Super Admin',
        'Full system access with all permissions',
        '["*"]'::jsonb,
        true
    ),
    (
        'Admin',
        'Administrative access to manage staff and settings',
        '["staff:*", "roles:*", "departments:*", "settings:*"]'::jsonb,
        true
    ),
    (
        'Manager',
        'Manage staff within department and view reports',
        '["staff:read", "staff:update", "reports:read", "departments:read"]'::jsonb,
        true
    ),
    (
        'Staff',
        'Basic staff access to view own information',
        '["profile:read", "profile:update"]'::jsonb,
        true
    ),
    (
        'Support',
        'Customer support access',
        '["tenants:read", "tenants:update", "tickets:*", "users:read"]'::jsonb,
        true
    )
ON CONFLICT (name) DO NOTHING;

-- Insert default departments
INSERT INTO staff_departments (name, description) VALUES
    ('Engineering', 'Software development and technical operations'),
    ('Product', 'Product management and design'),
    ('Sales', 'Sales and business development'),
    ('Marketing', 'Marketing and communications'),
    ('Support', 'Customer support and success'),
    ('Operations', 'Operations and administration'),
    ('Finance', 'Finance and accounting'),
    ('HR', 'Human resources')
ON CONFLICT (name) DO NOTHING;

-- Create a default super admin user (password: Admin@123 - should be changed immediately)
-- Password hash generated with bcrypt rounds=10
INSERT INTO staff (
    email,
    password_hash,
    first_name,
    last_name,
    department,
    position,
    employee_id,
    is_super_admin
) VALUES (
    'admin@akaind.ca',
    '$2a$10$XYZ7wQxM0oKl9g8yF6.jb.O5rV8p9x7qR3mN5lK8jH6gF4dS2aB1c',
    'System',
    'Administrator',
    'Operations',
    'Super Administrator',
    'EMP-0001',
    true
) ON CONFLICT (email) DO NOTHING;

-- Assign super admin role to default admin
INSERT INTO staff_role_assignments (staff_id, role_id)
SELECT s.id, r.id
FROM staff s, staff_roles r
WHERE s.email = 'admin@akaind.ca' 
  AND r.name = 'Super Admin'
ON CONFLICT (staff_id, role_id) DO NOTHING;
