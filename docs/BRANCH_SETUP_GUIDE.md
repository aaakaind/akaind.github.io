# Branch Setup Guide

This guide helps you set up the branch structure for the AKA Industries platform after the initial branching strategy has been merged.

## Quick Setup

Run the automated setup script:

```bash
# From the repository root
./scripts/setup-branches.sh
```

This script will:
1. Check if the `develop` branch exists on remote
2. Create it locally from `main` if it doesn't exist
3. Provide instructions for pushing it to remote

## Manual Setup

If you prefer to set up branches manually:

### 1. Create the develop branch

```bash
# Ensure you have the latest main branch
git checkout main
git pull origin main

# Create develop branch from main
git checkout -b develop main

# Push develop to remote (requires write access)
git push -u origin develop
```

### 2. Configure branch protection rules (Admin only)

In GitHub repository settings:

#### For `main` branch:
- ✅ Require pull request reviews (2 approvals)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require linear history
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

#### For `develop` branch:
- ✅ Require pull request reviews (1 approval)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

### 3. Update CI/CD workflows (if needed)

The workflows are already configured to trigger on both `main` and `develop` branches. Verify in `.github/workflows/ci.yml`:

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
```

## For Contributors

### Setting up your local environment

```bash
# Clone the repository
git clone https://github.com/aaakaind/akaind.github.io.git
cd akaind.github.io

# Fetch all branches
git fetch --all

# Checkout develop branch
git checkout develop
git pull origin develop

# You're ready to start developing!
```

### Creating a feature branch

```bash
# Make sure you're on develop
git checkout develop
git pull origin develop

# Create your feature branch
git checkout -b feature/your-feature-name

# Make your changes, commit, and push
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Create a Pull Request to develop via GitHub UI
```

## Branch Structure Overview

After setup, your repository will have:

```
main (production)
  └── develop (development/staging)
        ├── feature/* (feature branches)
        ├── bugfix/* (bug fix branches)
        ├── upgrade/* (upgrade branches)
        └── ... (other temporary branches)

hotfix/* (critical fixes, branch from main)
```

## Verification

After setup, verify the branches exist:

```bash
# List all local branches
git branch

# List all remote branches
git branch -r

# You should see:
# * develop
#   main
#   remotes/origin/develop
#   remotes/origin/main
```

## Troubleshooting

### "develop branch already exists"

If the develop branch already exists, just check it out:

```bash
git checkout develop
git pull origin develop
```

### "Permission denied when pushing"

You need write access to the repository to push the develop branch. Contact the repository owner or ask them to run:

```bash
git checkout main
git pull origin main
git checkout -b develop main
git push -u origin develop
```

### "Workflows not triggering on develop"

Check that `.github/workflows/ci.yml` includes `develop` in the trigger branches:

```yaml
on:
  push:
    branches: [main, develop]
```

## Next Steps

1. Read the [Branching Strategy](./BRANCHING_STRATEGY.md) for complete workflow details
2. Review [Contributing Guidelines](../CONTRIBUTING.md) for development workflow
3. Check [Deployment Runbook](./runbooks/DEPLOYMENT.md) for deployment procedures

## Support

For questions or issues:
- 💬 Slack: #platform-dev
- 📧 Email: dev@akaind.ca
- 📚 Docs: See documentation links above
