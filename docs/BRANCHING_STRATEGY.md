# Branching Strategy

## Overview

This document outlines the branching strategy for the AKA Industries platform. We use a Git Flow-inspired approach optimized for continuous deployment and enterprise requirements.

## Branch Types

### Permanent Branches

#### 1. `main` (Production)
- **Purpose:** Production-ready code that is deployed to production
- **Protected:** Yes (requires PR reviews, passing CI/CD)
- **Deployment:** Automatically deploys to production via GitHub Actions
- **Merge From:** `develop` (via PR), hotfix branches (via PR)
- **Naming:** `main`

**Rules:**
- Never commit directly to `main`
- All changes must go through pull requests
- Requires at least 2 approvals
- All CI/CD checks must pass
- Canary deployment strategy is used

#### 2. `develop` (Development)
- **Purpose:** Integration branch for ongoing development work
- **Protected:** Yes (requires PR reviews, passing CI/CD)
- **Deployment:** Automatically deploys to staging/development environment
- **Merge From:** Feature branches, upgrade branches
- **Naming:** `develop`

**Rules:**
- Never commit directly to `develop`
- All changes must go through pull requests
- Requires at least 1 approval
- All tests must pass

### Temporary Branches

#### 3. Feature Branches
- **Purpose:** Development of new features
- **Branch From:** `develop`
- **Merge To:** `develop`
- **Naming Convention:** `feature/<short-description>`
- **Lifecycle:** Deleted after merge

**Examples:**
- `feature/add-sso-integration`
- `feature/user-dashboard-redesign`
- `feature/multi-tenant-support`

**Workflow:**
```bash
# Create feature branch
git checkout develop
git pull origin develop
git checkout -b feature/new-feature

# Work on feature
git add .
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/new-feature
# Create PR to develop
```

#### 4. Upgrade Branches
- **Purpose:** Platform upgrades, dependency updates, major refactoring
- **Branch From:** `develop`
- **Merge To:** `develop`
- **Naming Convention:** `upgrade/<description>`
- **Lifecycle:** Deleted after merge

**Examples:**
- `upgrade/react-18`
- `upgrade/node-20`
- `upgrade/typescript-5`
- `upgrade/kubernetes-1-28`

**Workflow:**
```bash
# Create upgrade branch
git checkout develop
git pull origin develop
git checkout -b upgrade/react-18

# Work on upgrade
npm install react@18
npm test
git add .
git commit -m "chore: upgrade to React 18"

# Push and create PR
git push origin upgrade/react-18
# Create PR to develop
```

#### 5. Bugfix Branches
- **Purpose:** Bug fixes for upcoming releases
- **Branch From:** `develop`
- **Merge To:** `develop`
- **Naming Convention:** `bugfix/<issue-number>-<short-description>` or `fix/<short-description>`
- **Lifecycle:** Deleted after merge

**Examples:**
- `bugfix/123-login-error`
- `fix/memory-leak-in-worker`
- `fix/api-rate-limiting`

#### 6. Hotfix Branches
- **Purpose:** Critical bug fixes for production
- **Branch From:** `main`
- **Merge To:** `main` AND `develop` (to keep branches in sync)
- **Naming Convention:** `hotfix/<version>-<short-description>`
- **Lifecycle:** Deleted after merge

**Examples:**
- `hotfix/1.2.1-critical-security-fix`
- `hotfix/1.2.2-payment-processing-bug`

**Workflow:**
```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/1.2.1-security-fix

# Fix the issue
git add .
git commit -m "fix: critical security vulnerability"

# Push and create PR to main
git push origin hotfix/1.2.1-security-fix
# Create PR to main

# After merging to main, also merge to develop
git checkout develop
git merge hotfix/1.2.1-security-fix
git push origin develop
```

#### 7. Release Branches (Optional)
- **Purpose:** Prepare releases, final testing, version bumping
- **Branch From:** `develop`
- **Merge To:** `main` AND `develop`
- **Naming Convention:** `release/<version>`
- **Lifecycle:** Deleted after merge

**Examples:**
- `release/1.3.0`
- `release/2.0.0-beta`

## Deployment Pipeline

```
┌──────────────┐
│   Feature    │──┐
│   Branches   │  │
└──────────────┘  │
                  ▼
┌──────────────┐  ┌──────────────┐       ┌──────────────┐
│   Upgrade    │─▶│   develop    │──────▶│     main     │
│   Branches   │  │  (Staging)   │  PR   │ (Production) │
└──────────────┘  └──────────────┘       └──────────────┘
                         ▲                       │
┌──────────────┐         │                       │
│   Bugfix     │─────────┘                       │
│   Branches   │                                 │
└──────────────┘                                 │
                                                 │
┌──────────────┐                                 │
│   Hotfix     │─────────────────────────────────┘
│   Branches   │
└──────────────┘
```

## Workflow Examples

### Standard Feature Development

1. Create feature branch from `develop`
2. Develop and test locally
3. Push to remote and create PR to `develop`
4. Code review and approval
5. Merge to `develop` → Auto-deploy to staging
6. Test on staging
7. When ready for release, create PR from `develop` to `main`
8. Deploy to production via canary deployment

### Upgrade Development

1. Create upgrade branch from `develop`
2. Upgrade dependencies/framework
3. Update code and tests
4. Ensure all tests pass
5. Create PR to `develop`
6. Extensive testing on staging
7. Merge to `develop` → Auto-deploy to staging
8. Monitor staging for issues
9. When stable, include in next release to `main`

### Emergency Hotfix

1. Create hotfix branch from `main`
2. Fix critical issue
3. Test thoroughly
4. Create PR to `main`
5. Fast-track review and approval
6. Merge to `main` → Immediate production deployment
7. Also merge/cherry-pick to `develop` to keep in sync

## Branch Protection Rules

### `main` Branch
- Require pull request reviews before merging (2 approvals)
- Require status checks to pass before merging:
  - CI/CD pipeline (lint, test, build)
  - Security scan
  - Code coverage threshold
- Require branches to be up to date before merging
- Require linear history
- Do not allow force pushes
- Do not allow deletions

### `develop` Branch
- Require pull request reviews before merging (1 approval)
- Require status checks to pass before merging:
  - CI/CD pipeline (lint, test, build)
  - Security scan
- Require branches to be up to date before merging
- Do not allow force pushes
- Do not allow deletions

## Environment Mapping

| Branch | Environment | URL | Auto-Deploy |
|--------|-------------|-----|-------------|
| `main` | Production | https://www.akaind.ca | Yes (Canary) |
| `develop` | Staging/Dev | https://staging.akaind.ca | Yes |
| Feature branches | Preview | https://preview-{branch}.akaind.ca | Optional |

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates
- `ci`: CI/CD changes
- `build`: Build system changes

**Examples:**
```
feat(auth): add SSO integration with Okta
fix(api): resolve memory leak in worker process
chore(deps): upgrade React to v18
docs(readme): update deployment instructions
```

## Version Numbering

We use [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

Example: 1.2.3
```

- **MAJOR:** Incompatible API changes
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

## Release Process

1. **Preparation:**
   - Ensure all features for release are merged to `develop`
   - Run full test suite on `develop`
   - Update version numbers
   - Update CHANGELOG.md

2. **Create Release PR:**
   ```bash
   # From develop, create PR to main
   git checkout develop
   git pull origin develop
   # Create PR via GitHub UI: develop → main
   ```

3. **Review and Approve:**
   - Code review
   - QA testing on staging
   - Security review
   - Performance testing

4. **Merge and Deploy:**
   - Merge PR to `main`
   - Automatic canary deployment to production
   - Monitor metrics for 15 minutes
   - Progressive rollout to 100%

5. **Post-Release:**
   - Tag release in Git
   - Create GitHub release notes
   - Announce in team channels
   - Monitor production metrics

## Git Commands Reference

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/aaakaind/akaind.github.io.git
cd akaind.github.io

# Fetch all branches
git fetch --all

# Checkout develop
git checkout develop
```

### Create Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature
```

### Update Branch with Latest Changes
```bash
# Update develop
git checkout develop
git pull origin develop

# Rebase feature branch
git checkout feature/my-feature
git rebase develop
```

### Sync Fork (for contributors)
```bash
git remote add upstream https://github.com/aaakaind/akaind.github.io.git
git fetch upstream
git checkout develop
git merge upstream/develop
```

## Best Practices

1. **Keep Branches Short-Lived:**
   - Feature branches should be merged within 1-2 weeks
   - Avoid long-running feature branches

2. **Sync Regularly:**
   - Pull from `develop` daily
   - Rebase feature branches regularly

3. **Atomic Commits:**
   - Each commit should be a logical unit
   - Write descriptive commit messages

4. **Test Before Pushing:**
   - Run tests locally
   - Ensure linting passes

5. **Small Pull Requests:**
   - Keep PRs focused and reviewable
   - Aim for < 400 lines of changes

6. **Code Review:**
   - Review code thoroughly
   - Provide constructive feedback
   - Approve only when confident

## Troubleshooting

### Merge Conflicts
```bash
# Update your branch
git checkout develop
git pull origin develop
git checkout feature/my-feature
git rebase develop

# Resolve conflicts in your editor
# After resolving:
git add .
git rebase --continue
```

### Accidentally Committed to Wrong Branch
```bash
# If not pushed yet
git reset HEAD~1 --soft
git stash
git checkout correct-branch
git stash pop
git add .
git commit -m "Your message"
```

### Need to Undo Last Commit
```bash
# Keep changes
git reset HEAD~1 --soft

# Discard changes (careful!)
git reset HEAD~1 --hard
```

## Support

For questions about the branching strategy:
- 💬 Slack: #platform-dev
- 📧 Email: dev@akaind.ca
- 📚 Docs: See [CONTRIBUTING.md](../../CONTRIBUTING.md)

## References

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
