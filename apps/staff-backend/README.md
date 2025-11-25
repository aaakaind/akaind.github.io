# Staff Backend API

Robust backend service for managing staff members, roles, permissions, and activities in the AKA Industries platform.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- 👥 **Staff Management**: Complete CRUD operations for staff members
- 🎭 **Role-Based Access Control**: Flexible permission system with role assignments
- 📊 **Activity Logging**: Comprehensive audit trail of all staff actions
- 🔒 **Security First**: Input validation, rate limiting, account locking
- 🚀 **Production Ready**: Docker support, health checks, graceful shutdown

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **TypeScript**: Full type safety

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 16+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp ../../.env.example .env
# Edit .env with your database credentials

# Initialize database schema
psql -U postgres -d platform -f ../../infra/docker/init-staff-db.sql

# Start development server
npm run dev
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Run tests
npm test
```

### Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker

```bash
# Build Docker image
docker build -t staff-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e JWT_SECRET="your-secret" \
  staff-backend
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication

All endpoints except `/staff/login` require authentication via JWT token:

```
Authorization: Bearer <your-jwt-token>
```

### Endpoints

#### Health Check

```http
GET /health
```

Response:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-11-25T02:00:00.000Z",
  "uptime": 123.45
}
```

#### Login

```http
POST /api/v1/staff/login
Content-Type: application/json

{
  "email": "admin@akaind.ca",
  "password": "Admin@123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "staff": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "admin@akaind.ca",
      "firstName": "System",
      "lastName": "Administrator",
      "department": "Operations",
      "position": "Super Administrator",
      "isSuperAdmin": true
    }
  }
}
```

#### Get Current Profile

```http
GET /api/v1/staff/profile
Authorization: Bearer <token>
```

#### List Staff Members

```http
GET /api/v1/staff?page=1&limit=20&status=active&search=john
Authorization: Bearer <token>
```

Query Parameters:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (active, inactive, suspended, all)
- `department` (string): Filter by department
- `search` (string): Search by name or email

#### Create Staff Member

```http
POST /api/v1/staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "john.doe@akaind.ca",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "department": "Engineering",
  "position": "Software Engineer",
  "employeeId": "EMP-1001"
}
```

Required Permission: `staff:create`

#### Get Staff Member by ID

```http
GET /api/v1/staff/:id
Authorization: Bearer <token>
```

Required Permission: `staff:read`

#### Update Staff Member

```http
PUT /api/v1/staff/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Smith",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "status": "active"
}
```

Required Permission: `staff:update`

#### Delete Staff Member

```http
DELETE /api/v1/staff/:id
Authorization: Bearer <token>
```

Required Permission: `staff:delete`

#### Change Password

```http
PUT /api/v1/staff/profile/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

Password Requirements:
- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### Assign Role to Staff

```http
POST /api/v1/staff/:id/roles
Authorization: Bearer <token>
Content-Type: application/json

{
  "roleId": "123e4567-e89b-12d3-a456-426614174001"
}
```

Required Permission: `staff:update`

#### Remove Role from Staff

```http
DELETE /api/v1/staff/:id/roles/:roleId
Authorization: Bearer <token>
```

Required Permission: `staff:update`

## Permissions System

The staff backend uses a flexible permission system:

### Permission Format

Permissions follow the format: `resource:action`

Examples:
- `staff:read` - Read staff information
- `staff:create` - Create new staff members
- `staff:update` - Update staff information
- `staff:delete` - Delete staff members
- `staff:*` - All staff permissions
- `*` - All permissions (super admin)

### Default Roles

1. **Super Admin** - `["*"]`
   - Full system access

2. **Admin** - `["staff:*", "roles:*", "departments:*", "settings:*"]`
   - Administrative access to manage staff and settings

3. **Manager** - `["staff:read", "staff:update", "reports:read", "departments:read"]`
   - Manage staff within department and view reports

4. **Staff** - `["profile:read", "profile:update"]`
   - Basic access to view own information

5. **Support** - `["tenants:read", "tenants:update", "tickets:*", "users:read"]`
   - Customer support access

## Security Features

### Authentication Security
- JWT tokens with configurable expiration
- Bcrypt password hashing (10 rounds)
- Password strength requirements
- Account locking after 5 failed login attempts
- Automatic unlock after 30 minutes

### API Security
- Helmet.js for security headers
- CORS configuration
- Rate limiting (100 requests per minute)
- Input validation with Zod
- SQL injection prevention (parameterized queries)

### Activity Logging
All staff actions are logged with:
- Action type
- Resource affected
- IP address
- User agent
- Timestamp
- Success/failure status

## Environment Variables

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/platform
DATABASE_POOL_MAX=10
DATABASE_POOL_MIN=2
DATABASE_SSL=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=10

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
CORS_CREDENTIALS=true

# Rate Limiting
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
LOG_FILE=logs/app.log
```

## Database Schema

The staff backend uses the following tables:

- `staff` - Staff member information
- `staff_roles` - Role definitions
- `staff_role_assignments` - Staff-to-role mappings
- `staff_activity_logs` - Audit trail of actions
- `staff_sessions` - Active sessions (optional)
- `staff_departments` - Department hierarchy

See `../../infra/docker/init-staff-db.sql` for complete schema.

## Error Handling

All API responses follow a consistent format:

Success Response:
```json
{
  "success": true,
  "data": { ... }
}
```

Error Response:
```json
{
  "success": false,
  "error": "Error message",
  "details": [ ... ] // Optional validation errors
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Using Docker

```bash
docker build -t staff-backend .
docker run -p 3000:3000 --env-file .env staff-backend
```

### Using Kubernetes

See `../../infra/k8s/staff-backend-deployment.yaml` for Kubernetes deployment manifest.

## Monitoring

The application includes:
- Health check endpoint at `/health`
- Structured logging with Winston
- Activity logging to database
- Request/response logging

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for development guidelines.

## License

Proprietary - All rights reserved by AKA Industries
