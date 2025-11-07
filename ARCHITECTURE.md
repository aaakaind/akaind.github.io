# Enterprise Platform Architecture

## Overview

This repository contains an enterprise-grade digital platform for AKA Industries, designed as a modular, extensible system supporting multiple products and services.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CDN / Edge Layer                         │
│            (Cloudflare, CloudFront, Fastly)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   API Gateway / Load Balancer                │
│              (Kong, NGINX, AWS ALB, Traefik)                 │
└────┬─────────────┬─────────────┬─────────────┬──────────────┘
     │             │             │             │
┌────▼────┐  ┌────▼────┐  ┌─────▼────┐  ┌────▼────┐
│Marketing│  │ Product │  │Developer │  │ Partner │
│   Site  │  │ Console │  │   Hub    │  │ Portal  │
└────┬────┘  └────┬────┘  └─────┬────┘  └────┬────┘
     │            │              │             │
     └────────────┴──────────────┴─────────────┘
                  │
     ┌────────────┴────────────────────────────┐
     │                                          │
┌────▼────────────┐         ┌─────────────────▼──────┐
│  Core Services  │         │   Platform Services     │
│                 │         │                         │
│ • Auth/IAM      │         │ • Analytics             │
│ • Billing       │         │ • Search                │
│ • Usage Metrics │         │ • Personalization       │
│ • Tenancy       │         │ • A/B Testing           │
│ • Feature Flags │         │ • MCP Sessions          │
│ • RBAC          │         │ • Webhooks              │
└─────────────────┘         └─────────────────────────┘
          │                           │
          └───────────┬───────────────┘
                      │
┌─────────────────────▼─────────────────────┐
│           Data Layer                       │
│                                            │
│ • PostgreSQL (Multi-tenant)                │
│ • Redis (Cache, Sessions)                  │
│ • S3 (Object Storage)                      │
│ • Elasticsearch (Search, Analytics)        │
│ • TimescaleDB (Time-series metrics)        │
│ • Vector DB (AI/ML embeddings)             │
└────────────────────────────────────────────┘
```

## Application Structure

### Apps (Frontend Applications)

- **`apps/marketing/`** - Public marketing website
  - Next.js with SSR/SSG
  - CMS integration (Contentful/Strapi)
  - A/B testing framework
  - i18n support (next-i18next)
  - Personalization engine

- **`apps/console/`** - Product dashboard (SaaS console)
  - React + TypeScript
  - Multi-tenant architecture
  - Real-time usage metrics
  - Billing and license management
  - Feature flag integration

- **`apps/developer-hub/`** - Developer documentation and tools
  - Docusaurus or Next.js
  - API documentation (OpenAPI/GraphQL)
  - Interactive API explorer
  - Code playground
  - SDK downloads

- **`apps/partner-portal/`** - Partner and marketplace management
  - Next.js + TypeScript
  - Partner onboarding flows
  - Revenue share tracking
  - App marketplace
  - Embeddable widgets

### Packages (Shared Libraries)

- **`packages/ui/`** - Design system and component library
  - React components
  - Tailwind CSS / styled-components
  - Storybook documentation
  - Accessibility compliant (WCAG 2.1 AA)

- **`packages/auth/`** - Authentication and authorization
  - SSO providers (OAuth2, SAML)
  - MFA support
  - JWT token management
  - RBAC utilities
  - Session handling

- **`packages/analytics/`** - Analytics and tracking
  - Event tracking
  - User behavior analytics
  - Conversion funnels
  - Custom dashboards

- **`packages/sdk-core/`** - Core SDK functionality
  - TypeScript client
  - Python SDK
  - Go SDK
  - REST and GraphQL clients

- **`packages/widgets/`** - Embeddable widgets
  - Widget loader
  - Sandboxed iframe components
  - PostMessage API
  - Customizable themes

## Multi-Tenancy Architecture

### Data Isolation Strategies

1. **Schema-per-tenant** (High isolation)
   - Each tenant has dedicated database schema
   - Strong isolation, easier compliance
   - Higher resource usage

2. **Row-level security** (Balanced)
   - Shared tables with tenant_id column
   - PostgreSQL RLS policies
   - Good performance, moderate isolation

3. **Hybrid approach** (Recommended)
   - Critical data: Schema-per-tenant
   - Shared data: Row-level security
   - Best of both worlds

```sql
-- Example multi-tenant schema
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  data_residency VARCHAR(50),
  encryption_key_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  scopes JSONB,
  UNIQUE(tenant_id, email)
);

-- Enable RLS
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY tenant_isolation ON tenant_users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

## Authentication & Authorization

### SSO Integration

```typescript
// packages/auth/src/sso.ts
import { OAuth2Client } from 'google-auth-library';
import { SAMLClient } from 'saml2-js';

export class SSOProvider {
  async authenticateOAuth2(provider: string, code: string) {
    // OAuth2 flow (Google, Microsoft, GitHub)
    const client = new OAuth2Client({
      clientId: process.env[`${provider}_CLIENT_ID`],
      clientSecret: process.env[`${provider}_CLIENT_SECRET`],
      redirectUri: process.env.OAUTH_CALLBACK_URL
    });
    
    const { tokens } = await client.getToken(code);
    return this.createSession(tokens);
  }
  
  async authenticateSAML(assertion: string) {
    // SAML 2.0 flow (Okta, Azure AD)
    const saml = new SAMLClient({
      entryPoint: process.env.SAML_ENTRY_POINT,
      cert: process.env.SAML_CERT
    });
    
    const profile = await saml.validatePostResponse(assertion);
    return this.createSession(profile);
  }
}
```

### RBAC Implementation

```typescript
// packages/auth/src/rbac.ts
export interface Role {
  name: string;
  scopes: string[];
}

export interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
  conditions?: Record<string, any>;
}

export class RBACEngine {
  private roles: Map<string, Role> = new Map([
    ['admin', { name: 'admin', scopes: ['*'] }],
    ['developer', { name: 'developer', scopes: ['api:*', 'docs:read'] }],
    ['viewer', { name: 'viewer', scopes: ['*:read'] }]
  ]);
  
  hasPermission(userRoles: string[], permission: Permission): boolean {
    const userScopes = userRoles.flatMap(role => 
      this.roles.get(role)?.scopes || []
    );
    
    return userScopes.some(scope => 
      this.matchScope(scope, `${permission.resource}:${permission.action}`)
    );
  }
  
  private matchScope(scope: string, required: string): boolean {
    if (scope === '*') return true;
    if (scope === required) return true;
    
    const scopeParts = scope.split(':');
    const requiredParts = required.split(':');
    
    return scopeParts[0] === requiredParts[0] && 
           (scopeParts[1] === '*' || scopeParts[1] === requiredParts[1]);
  }
}
```

## Personalization Engine

```typescript
// packages/analytics/src/personalization.ts
export interface UserContext {
  tenantId: string;
  userId?: string;
  role?: string;
  region: string;
  language: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  intentSignals: string[];
}

export class PersonalizationEngine {
  async getPersonalizedContent(
    contentId: string, 
    context: UserContext
  ): Promise<any> {
    // Fetch base content
    const content = await this.fetchContent(contentId);
    
    // Apply regional customizations
    if (content.variants?.[context.region]) {
      Object.assign(content, content.variants[context.region]);
    }
    
    // Apply role-based customizations
    if (context.role && content.roleVariants?.[context.role]) {
      Object.assign(content, content.roleVariants[context.role]);
    }
    
    // Apply intent-based recommendations
    const recommendations = await this.getRecommendations(
      context.intentSignals
    );
    
    return {
      ...content,
      recommendations,
      metadata: {
        personalized: true,
        context: context
      }
    };
  }
  
  private async getRecommendations(signals: string[]): Promise<any[]> {
    // AI-powered recommendation logic
    // Could integrate with vector DB for semantic search
    return [];
  }
}
```

## MCP Session Management

```typescript
// packages/sdk-core/src/mcp-session.ts
export interface MCPSession {
  sessionId: string;
  tenantId: string;
  participants: string[];
  state: Record<string, any>;
}

export class MCPSessionManager {
  async createSession(tenantId: string): Promise<MCPSession> {
    const sessionId = crypto.randomUUID();
    
    const session: MCPSession = {
      sessionId,
      tenantId,
      participants: [],
      state: {}
    };
    
    await this.redis.set(
      `mcp:session:${sessionId}`,
      JSON.stringify(session),
      'EX',
      3600 // 1 hour TTL
    );
    
    return session;
  }
  
  async joinSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    
    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
      await this.updateSession(session);
    }
    
    // Notify other participants via WebSocket
    await this.notifyParticipants(sessionId, {
      type: 'participant_joined',
      userId
    });
  }
  
  async updateState(
    sessionId: string, 
    key: string, 
    value: any
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    session.state[key] = value;
    await this.updateSession(session);
    
    // Broadcast state change
    await this.notifyParticipants(sessionId, {
      type: 'state_updated',
      key,
      value
    });
  }
}
```

## Observability

### Distributed Tracing

```typescript
// packages/sdk-core/src/tracing.ts
import { trace, context, SpanStatusCode } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export function initTracing() {
  const provider = new NodeTracerProvider();
  
  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new JaegerExporter({
        endpoint: process.env.JAEGER_ENDPOINT
      })
    )
  );
  
  provider.register();
}

export function traceAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const tracer = trace.getTracer('akaind-platform');
  
  return tracer.startActiveSpan(name, async (span) => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

## Security

### Input Sanitization

```typescript
// packages/ui/src/security/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'title']
  });
}

export function validateInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): T {
  return schema.parse(input);
}

// Example schema
export const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100),
  message: z.string().max(5000)
});
```

### Rate Limiting

```typescript
// packages/auth/src/rate-limit.ts
import { RateLimiterRedis } from 'rate-limiter-flexible';

export class RateLimiter {
  private limiter: RateLimiterRedis;
  
  constructor(redis: Redis) {
    this.limiter = new RateLimiterRedis({
      storeClient: redis,
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
      blockDuration: 60 * 10 // Block for 10 minutes
    });
  }
  
  async checkLimit(key: string): Promise<void> {
    try {
      await this.limiter.consume(key);
    } catch (error) {
      throw new Error('Rate limit exceeded');
    }
  }
}
```

## Deployment Architecture

### Kubernetes Deployment

See `infra/k8s/` for complete manifests.

### Canary Deployments

```yaml
apiVersion: flagger.app/v1beta1
kind: Canary
metadata:
  name: marketing-app
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: marketing
  progressDeadlineSeconds: 60
  service:
    port: 3000
  analysis:
    interval: 1m
    threshold: 5
    maxWeight: 50
    stepWeight: 10
    metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
    - name: request-duration
      thresholdRange:
        max: 500
```

## Data Governance

### Encryption

- **At Rest**: AES-256 encryption for database and object storage
- **In Transit**: TLS 1.3 for all communications
- **Key Management**: AWS KMS, HashiCorp Vault

### Data Residency

```typescript
// Tenant-specific data residency configuration
export interface DataResidencyConfig {
  region: 'us-east' | 'eu-west' | 'ap-south';
  databaseEndpoint: string;
  storageEndpoint: string;
  restrictions: string[];
}

export function getDataResidencyConfig(
  tenantId: string
): DataResidencyConfig {
  // Fetch tenant's data residency requirements
  // Route data operations to region-specific endpoints
}
```

## Testing Strategy

- **Unit Tests**: Jest, Vitest (>80% coverage)
- **Integration Tests**: Supertest, Testing Library
- **E2E Tests**: Playwright, Cypress
- **Visual Regression**: Percy, Chromatic
- **Load Tests**: k6, Artillery
- **Chaos Engineering**: Chaos Mesh, Gremlin

## Performance Targets

- **Page Load**: < 2s (LCP)
- **API Response**: < 200ms (p95)
- **Uptime**: 99.9% SLA
- **Error Rate**: < 0.1%

## Cost Optimization

- Auto-scaling based on demand
- Spot instances for non-critical workloads
- CDN caching (90%+ hit rate)
- Database connection pooling
- Lazy loading and code splitting
