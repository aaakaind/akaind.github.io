# Contributing to AKA Industries Platform

Thank you for your interest in contributing! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Architecture](#architecture)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Security](#security)

## Development Setup

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Kubernetes (minikube or kind for local dev)
- Terraform >= 1.5.0

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/aaakaind/akaind.github.io.git
   cd akaind.github.io
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

5. **Run tests**
   ```bash
   npm test
   ```

### Workspace Structure

This is a monorepo managed with npm workspaces and Turbo:

```
├── apps/                    # Application packages
│   ├── marketing/          # Marketing website
│   ├── console/            # Product console
│   ├── developer-hub/      # Developer documentation
│   └── partner-portal/     # Partner portal
├── packages/               # Shared libraries
│   ├── ui/                 # Component library
│   ├── auth/               # Authentication
│   ├── analytics/          # Analytics
│   ├── sdk-core/           # SDKs
│   └── widgets/            # Embeddable widgets
├── infra/                  # Infrastructure as code
│   ├── terraform/          # Terraform configs
│   ├── k8s/                # Kubernetes manifests
│   └── docker/             # Docker configurations
└── docs/                   # Documentation
```

## Architecture

Please read [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed overview of the platform architecture.

Key principles:
- **Modularity**: Each package should be independently deployable
- **Type Safety**: Use TypeScript everywhere
- **Testing**: Maintain >80% code coverage
- **Security First**: Follow secure coding practices
- **Performance**: Optimize for Core Web Vitals

## Coding Standards

### TypeScript

We use TypeScript for type safety. All new code should be written in TypeScript.

```typescript
// Good
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User> {
  // Implementation
}

// Bad - no types
function getUser(id) {
  // Implementation
}
```

### Code Style

We use Prettier for formatting and ESLint for linting:

```bash
npm run format  # Format all files
npm run lint    # Check for linting errors
```

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- **Types/Interfaces**: PascalCase (`UserProfile`)

### Component Structure

```tsx
// user-profile.tsx
import React from 'react';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // Hooks at the top
  const [user, setUser] = React.useState<User | null>(null);
  
  // Effects
  React.useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);
  
  // Event handlers
  const handleUpdate = async () => {
    // Implementation
  };
  
  // Render
  if (!user) return <Loading />;
  
  return (
    <div className="user-profile">
      {/* JSX */}
    </div>
  );
}
```

## Testing

### Unit Tests

We use Jest/Vitest for unit testing:

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validation';

describe('validateEmail', () => {
  it('should validate correct email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  
  it('should reject invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name=email]', 'user@example.com');
  await page.fill('[name=password]', 'password');
  await page.click('button[type=submit]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Running Tests

```bash
npm test              # Run all unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Generate coverage report
```

### Test Coverage

Maintain at least 80% code coverage:

- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Visual regression tests for UI components

## Pull Request Process

### Before Submitting

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following our standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Run checks locally**
   ```bash
   npm run typecheck  # Check types
   npm run lint       # Check linting
   npm test           # Run tests
   npm run build      # Verify build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   We follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` - New feature
   - `fix:` - Bug fix
   - `docs:` - Documentation changes
   - `style:` - Code style changes
   - `refactor:` - Code refactoring
   - `test:` - Adding tests
   - `chore:` - Maintenance tasks

### Submitting PR

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request**
   - Provide a clear description
   - Reference related issues
   - Add screenshots for UI changes
   - Request reviews from relevant team members

3. **PR Checklist**
   - [ ] Tests pass locally
   - [ ] Code is properly formatted
   - [ ] Documentation updated
   - [ ] No console errors or warnings
   - [ ] Accessibility standards met (WCAG 2.1 AA)
   - [ ] Security review completed
   - [ ] Performance impact assessed

### Code Review

- All PRs require at least one approval
- Address reviewer feedback promptly
- Keep discussions professional and constructive
- CI/CD checks must pass before merging

## Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities. Instead:

1. Email security@akaind.ca
2. Include detailed description
3. Provide steps to reproduce
4. Allow reasonable time for fix

### Security Best Practices

- Never commit secrets or credentials
- Use environment variables for configuration
- Validate and sanitize all user input
- Follow principle of least privilege
- Keep dependencies updated
- Use security headers

```typescript
// Bad - SQL injection risk
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// Good - parameterized query
db.query('SELECT * FROM users WHERE email = ?', [email]);
```

### Dependency Security

Run security audits regularly:

```bash
npm audit           # Check for vulnerabilities
npm run security:scan  # Run additional security checks
```

## Accessibility

All UI components must meet WCAG 2.1 AA standards:

- Proper semantic HTML
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast (4.5:1)
- Alt text for images
- ARIA labels where appropriate

```tsx
// Good - accessible button
<button
  onClick={handleClick}
  aria-label="Close dialog"
  disabled={loading}
>
  <CloseIcon aria-hidden="true" />
</button>
```

## Performance

### Optimization Guidelines

- Lazy load components and routes
- Code splitting for large bundles
- Optimize images (WebP, next/image)
- Minimize JavaScript bundle size
- Use React.memo for expensive components
- Debounce/throttle event handlers

### Performance Budgets

- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Time to Interactive: < 3.8s
- Cumulative Layout Shift: < 0.1
- Total Bundle Size: < 200KB (gzipped)

## Documentation

### Code Comments

Write comments for complex logic:

```typescript
// Calculate exponential backoff with jitter for retry delay
// Formula: min(maxDelay, baseDelay * 2^attempt + randomJitter)
function calculateRetryDelay(attempt: number): number {
  const baseDelay = 1000;
  const maxDelay = 30000;
  const jitter = Math.random() * 1000;
  return Math.min(maxDelay, baseDelay * Math.pow(2, attempt) + jitter);
}
```

### API Documentation

Document all public APIs:

```typescript
/**
 * Fetches user profile by ID with caching.
 * 
 * @param userId - The unique identifier of the user
 * @param options - Optional fetch options
 * @returns Promise resolving to User object
 * @throws {NotFoundError} If user doesn't exist
 * @throws {UnauthorizedError} If not authenticated
 * 
 * @example
 * ```typescript
 * const user = await getUserProfile('user-123');
 * console.log(user.email);
 * ```
 */
export async function getUserProfile(
  userId: string,
  options?: FetchOptions
): Promise<User> {
  // Implementation
}
```

## Getting Help

- 📚 [Documentation](./docs/)
- 🏗️ [Architecture](./ARCHITECTURE.md)
- 💬 Slack: #platform-dev
- 📧 Email: dev@akaind.ca

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
