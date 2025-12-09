# AKA Industries Enterprise Platform

Enterprise-grade digital platform for advanced technology company, featuring marketing site, SaaS console, developer hub, and partner portal.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📁 Project Structure

```
├── apps/                       # Application packages
│   ├── marketing/             # Public marketing website
│   ├── console/               # Product console (SaaS dashboard)
│   ├── developer-hub/         # Developer documentation & tools
│   └── partner-portal/        # Partner & marketplace portal
├── packages/                   # Shared libraries
│   ├── ui/                    # Component library
│   ├── auth/                  # Authentication & authorization
│   ├── analytics/             # Analytics & personalization
│   ├── sdk-core/              # Client SDKs
│   └── widgets/               # Embeddable widgets
├── infra/                     # Infrastructure as code
│   ├── terraform/             # Terraform configurations
│   ├── k8s/                   # Kubernetes manifests
│   └── docker/                # Docker configurations
└── docs/                      # Documentation
    ├── architecture/          # Architecture docs
    └── runbooks/              # Operational runbooks
```

## 🏗️ Architecture

This platform is built as a modular, extensible system:

- **Monorepo:** npm workspaces + Turbo for efficient builds
- **Frontend:** React, Next.js, TypeScript
- **Backend:** Node.js, PostgreSQL, Redis, Elasticsearch
- **Infrastructure:** Kubernetes, Docker, Terraform
- **CI/CD:** GitHub Actions with canary deployments

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 🔑 Key Features

### Marketing Site
- CMS-driven content (Contentful/Strapi)
- A/B testing and experiments
- Internationalization (i18n)
- Personalized experiences
- SEO optimized

### Product Console
- Multi-tenant SaaS dashboard
- Usage metrics and billing
- Team and license management
- Feature flags
- In-app guides

### Developer Hub
- Interactive API documentation
- REST and GraphQL explorers
- Client SDKs (TypeScript, Python, Go)
- Code samples and playground
- Sandbox environment

### Partner Portal
- Partner onboarding workflow
- App marketplace
- Revenue share tracking
- Embeddable widgets
- Webhook integrations

## 🔐 Security

- SSO/SAML integration
- Multi-factor authentication (MFA)
- RBAC with granular permissions
- SCIM provisioning
- Audit logging
- Encryption at rest and in transit
- Rate limiting and DDoS protection

See [Security documentation](./docs/SECURITY.md) for details.

## 🧪 Testing

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📦 Deployment

### Local Development

```bash
# Start all services with Docker Compose
npm run docker:up

# Or start individual services
npm run dev
```

### Staging Deployment

```bash
# Deploy to staging
npm run deploy:canary

# Run smoke tests
npm run test:smoke -- --env=staging
```

### Production Deployment

The platform uses automated CI/CD with canary deployments:

1. Push to `main` branch triggers CI/CD pipeline
2. Automated tests run (lint, unit, integration)
3. Docker images built and pushed to registry
4. Canary deployment to 10% of production traffic
5. Automated monitoring for 15 minutes
6. Progressive rollout to 100% if healthy
7. Automatic rollback on failure

See [Deployment Runbook](./docs/runbooks/DEPLOYMENT.md) for detailed procedures.

### Infrastructure

```bash
# Initialize Terraform
cd infra/terraform
terraform init

# Plan infrastructure changes
terraform plan

# Apply changes
terraform apply

# Deploy to Kubernetes
kubectl apply -f infra/k8s/
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit with conventional commits (`git commit -m "feat: add amazing feature"`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Code Quality Standards

- Maintain >80% test coverage
- Follow TypeScript strict mode
- Use Prettier for formatting
- Pass all ESLint checks
- Document public APIs

## 📚 Documentation

- **[Architecture](./ARCHITECTURE.md)** - System design and patterns
- **[Contributing](./CONTRIBUTING.md)** - Development guidelines
- **[Roadmap](./ROADMAP.md)** - Feature roadmap and timeline
- **[Deployment](./docs/runbooks/DEPLOYMENT.md)** - Deployment procedures
- **[API Documentation](https://developers.akaind.ca)** - API reference

## 📊 Monitoring & Observability

- **Metrics:** Prometheus + Grafana
- **Logs:** ELK Stack (Elasticsearch, Logstash, Kibana)
- **Traces:** Jaeger distributed tracing
- **Alerts:** PagerDuty for critical issues
- **Uptime:** StatusPage for status updates

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18, Next.js 14
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS, Framer Motion
- **State:** Zustand, TanStack Query
- **Testing:** Vitest, Playwright

### Backend
- **Runtime:** Node.js 18+
- **Database:** PostgreSQL 16, Redis 7
- **Search:** Elasticsearch 8
- **Queue:** BullMQ
- **Auth:** JWT, OAuth2, SAML

### Infrastructure
- **Cloud:** AWS (EKS, RDS, ElastiCache, S3)
- **Container:** Docker, Kubernetes
- **IaC:** Terraform
- **CI/CD:** GitHub Actions
- **CDN:** CloudFront

### Observability
- **Metrics:** Prometheus, Grafana
- **Logging:** Elasticsearch, Fluentd
- **Tracing:** Jaeger, OpenTelemetry
- **APM:** DataDog

## 📈 Performance Targets

- **Page Load:** < 2s (LCP)
- **API Response:** < 200ms (P95)
- **Uptime:** 99.9% SLA
- **Error Rate:** < 0.1%

## 🌐 Accessing Different Systems

The AKA Industries platform consists of multiple systems accessible through different web addresses. You can access each system by modifying the subdomain in the URL.

### How to Access Different Systems

Simply change the subdomain part of the URL to access different features and platforms:

| System | URL | Access Method | Description |
|--------|-----|---------------|-------------|
| **Main Website** | `www.akaind.ca` | Default subdomain | Public marketing site with company information, products, and contact details |
| **Product Console** | `console.akaind.ca` | Change `www` → `console` | SaaS dashboard for managing your account, usage metrics, billing, and licenses |
| **Developer Hub** | `developers.akaind.ca` | Change `www` → `developers` | API documentation, SDKs, code samples, and interactive API explorer |
| **Partner Portal** | `partners.akaind.ca` | Change `www` → `partners` | Partner onboarding, marketplace, revenue tracking, and integrations |
| **System Status** | `status.akaind.ca` | Change `www` → `status` | Real-time system status, uptime monitoring, and incident reports |
| **Documentation** | `docs.akaind.ca` | Change `www` → `docs` | Comprehensive documentation and user guides |
| **Community** | `community.akaind.ca` | Change `www` → `community` | Community forums, discussions, and support |

### Quick Access Examples

Starting from the main website (`www.akaind.ca`):

1. **To access the Product Console:**
   - Current: `www.akaind.ca`
   - Modified: `console.akaind.ca`
   - Simply replace `www` with `console` in your browser's address bar

2. **To view API documentation:**
   - Current: `www.akaind.ca`
   - Modified: `developers.akaind.ca`
   - Simply replace `www` with `developers` in your browser's address bar

3. **To check system status:**
   - Current: `www.akaind.ca`
   - Modified: `status.akaind.ca`
   - Simply replace `www` with `status` in your browser's address bar

### Understanding Subdomains

A **subdomain** is the part of the URL that comes before the main domain name. In our case:

```
https://[subdomain].akaind.ca
          ↑
    This part changes to access different systems
```

**Examples:**
- `www.akaind.ca` - Main website
- `console.akaind.ca` - Product console
- `developers.akaind.ca` - Developer resources
- `partners.akaind.ca` - Partner portal

All these addresses lead to different systems within the AKA Industries platform, each designed for specific purposes and user types.

## 🔗 Quick Links

- **Website:** https://www.akaind.ca
- **Console:** https://console.akaind.ca
- **Developers:** https://developers.akaind.ca
- **Partners:** https://partners.akaind.ca
- **Status:** https://status.akaind.ca

## 📄 License

Proprietary - All rights reserved by AKA Industries

## 💬 Support

- **Email:** support@akaind.ca
- **Docs:** https://docs.akaind.ca
- **Community:** https://community.akaind.ca
- **Status:** https://status.akaind.ca

---

## Legacy: Custom Domain Setup with CNAME

The CNAME file in this repository is currently set to: **www.akaind.ca**

### How to Configure Your Custom Domain

#### Step 1: Update the CNAME File

1. Edit the `CNAME` file in the root of this repository
2. Replace `www.example.com` with your actual custom domain (e.g., `www.yourdomain.com` or `yourdomain.com`)
3. The file should contain **only** your domain name, nothing else
4. Commit and push the changes

**Example CNAME file content:**
```
www.akaind.ca
```

#### Step 2: Configure Your Domain Registrar (DNS Settings)

You need to add DNS records at your domain registrar (e.g., GoDaddy, Namecheap, Google Domains, Cloudflare).

**Option A: Using a subdomain (www.yourdomain.com)**

Add a CNAME record:
- **Type:** CNAME
- **Host/Name:** www
- **Value/Points to:** aaakaind.github.io
- **TTL:** 3600 (or default)

**Option B: Using an apex domain (yourdomain.com)**

Add A records for GitHub Pages IP addresses:
- **Type:** A
- **Host/Name:** @ (or leave blank)
- **Value:** 185.199.108.153
- **TTL:** 3600

Add additional A records with these IPs:
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

Optionally, add a CNAME record for www:
- **Type:** CNAME
- **Host/Name:** www
- **Value:** aaakaind.github.io

#### Step 3: Enable Custom Domain in GitHub

1. Go to your repository settings on GitHub
2. Navigate to **Pages** section (Settings → Pages)
3. Under "Custom domain", enter your domain name
4. Click **Save**
5. Wait for DNS check to complete (can take up to 24-48 hours)
6. Once verified, enable **Enforce HTTPS** (recommended)

### Verification

After DNS propagation (which can take 24-48 hours), verify your setup:

1. Visit your custom domain in a browser
2. Check that it loads your GitHub Pages site
3. Verify HTTPS is working (you should see a lock icon)

### Troubleshooting

- **DNS not resolving:** DNS changes can take up to 48 hours to propagate globally
- **CNAME already exists:** Your CNAME file should contain only one domain name
- **SSL certificate errors:** Wait for GitHub to issue an SSL certificate (can take a few minutes after DNS verification)
- **Check DNS propagation:** Use tools like https://www.whatsmydns.net/ to check if your DNS changes have propagated

### Additional Resources

- [GitHub Pages Custom Domain Documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Managing a custom domain for your GitHub Pages site](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- [Verifying your custom domain](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)
