# Staff Backend API - Usage Examples

This document provides example API calls for the Staff Backend service.

## Prerequisites

```bash
# Set base URL
export API_URL="http://localhost:3000/api/v1"

# Set authentication token (after login)
export TOKEN="your-jwt-token-here"
```

## 1. Health Check

```bash
curl -X GET http://localhost:3000/health
```

## 2. Login

```bash
curl -X POST $API_URL/staff/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@akaind.ca",
    "password": "Admin@123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "staff": {
      "id": "uuid",
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

## 3. Get Current Profile

```bash
curl -X GET $API_URL/staff/profile \
  -H "Authorization: Bearer $TOKEN"
```

## 4. List Staff Members

```bash
# List all active staff
curl -X GET "$API_URL/staff?status=active&page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Search staff
curl -X GET "$API_URL/staff?search=john&department=Engineering" \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Create Staff Member

```bash
curl -X POST $API_URL/staff \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@akaind.ca",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "department": "Engineering",
    "position": "Software Engineer",
    "employeeId": "EMP-1001"
  }'
```

## 6. Get Staff Member by ID

```bash
curl -X GET $API_URL/staff/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"
```

## 7. Update Staff Member

```bash
curl -X PUT $API_URL/staff/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Smith",
    "position": "Senior Software Engineer",
    "status": "active"
  }'
```

## 8. Change Password

```bash
curl -X PUT $API_URL/staff/profile/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123!",
    "newPassword": "NewPass123!"
  }'
```

## 9. Assign Role to Staff

```bash
curl -X POST $API_URL/staff/123e4567-e89b-12d3-a456-426614174000/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roleId": "456e7890-e89b-12d3-a456-426614174001"
  }'
```

## 10. Remove Role from Staff

```bash
curl -X DELETE $API_URL/staff/123e4567-e89b-12d3-a456-426614174000/roles/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer $TOKEN"
```

## 11. Delete Staff Member

```bash
curl -X DELETE $API_URL/staff/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer $TOKEN"
```

## Using with JavaScript/Node.js

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Login
async function login(email, password) {
  const response = await axios.post(`${API_URL}/staff/login`, {
    email,
    password
  });
  return response.data.data.token;
}

// Get staff list
async function getStaffList(token, options = {}) {
  const response = await axios.get(`${API_URL}/staff`, {
    headers: { Authorization: `Bearer ${token}` },
    params: options
  });
  return response.data;
}

// Create staff member
async function createStaff(token, staffData) {
  const response = await axios.post(`${API_URL}/staff`, staffData, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}

// Example usage
(async () => {
  try {
    // Login
    const token = await login('admin@akaind.ca', 'Admin@123');
    console.log('Logged in successfully');

    // Get staff list
    const staffList = await getStaffList(token, {
      status: 'active',
      page: 1,
      limit: 20
    });
    console.log('Staff members:', staffList);

    // Create new staff
    const newStaff = await createStaff(token, {
      email: 'jane.smith@akaind.ca',
      password: 'SecurePass123!',
      firstName: 'Jane',
      lastName: 'Smith',
      department: 'Engineering',
      position: 'Senior Engineer'
    });
    console.log('Created staff:', newStaff);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
})();
```

## Using with Python

```python
import requests

API_URL = 'http://localhost:3000/api/v1'

def login(email, password):
    response = requests.post(f'{API_URL}/staff/login', json={
        'email': email,
        'password': password
    })
    response.raise_for_status()
    return response.json()['data']['token']

def get_staff_list(token, **params):
    response = requests.get(f'{API_URL}/staff',
        headers={'Authorization': f'Bearer {token}'},
        params=params
    )
    response.raise_for_status()
    return response.json()

def create_staff(token, staff_data):
    response = requests.post(f'{API_URL}/staff',
        headers={'Authorization': f'Bearer {token}'},
        json=staff_data
    )
    response.raise_for_status()
    return response.json()

# Example usage
if __name__ == '__main__':
    # Login
    token = login('admin@akaind.ca', 'Admin@123')
    print('Logged in successfully')

    # Get staff list
    staff_list = get_staff_list(token, status='active', page=1, limit=20)
    print(f"Found {staff_list['pagination']['total']} staff members")

    # Create new staff
    new_staff = create_staff(token, {
        'email': 'jane.smith@akaind.ca',
        'password': 'SecurePass123!',
        'firstName': 'Jane',
        'lastName': 'Smith',
        'department': 'Engineering',
        'position': 'Senior Engineer'
    })
    print(f"Created staff: {new_staff['data']['email']}")
```

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message",
  "details": ["Additional error details"]
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

The API implements rate limiting:
- **Limit**: 100 requests per minute per IP
- **Response Header**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later"
}
```

## Security Best Practices

1. **Never log or expose JWT tokens** in client-side code
2. **Store tokens securely** (e.g., httpOnly cookies, secure storage)
3. **Use HTTPS** in production
4. **Rotate tokens regularly** by re-authenticating
5. **Implement proper error handling** to avoid leaking sensitive information
6. **Validate all input** before sending to the API
7. **Follow password requirements** for strong passwords
