#!/bin/bash

# Setup Branches Script
# This script sets up the branching structure for deployment and development

set -e

echo "=========================================="
echo "Setting up AKA Industries Branch Structure"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right repository
if [ ! -d ".git" ]; then
    echo "Error: This script must be run from the root of the git repository"
    exit 1
fi

echo "Current repository: $(git remote get-url origin)"
echo ""

# Fetch latest from remote
echo -e "${YELLOW}Fetching latest changes from remote...${NC}"
git fetch origin
echo ""

# Check if develop branch exists on remote
if git ls-remote --heads origin develop | grep -q develop; then
    echo -e "${GREEN}✓ develop branch already exists on remote${NC}"
    
    # Check if we have it locally
    if git show-ref --verify --quiet refs/heads/develop; then
        echo -e "${GREEN}✓ develop branch exists locally${NC}"
        git checkout develop
        git pull origin develop
    else
        echo "Creating local develop branch from remote..."
        git checkout -b develop origin/develop
    fi
else
    echo -e "${YELLOW}develop branch does not exist on remote yet${NC}"
    
    # Check if main exists
    if ! git show-ref --verify --quiet refs/heads/main; then
        if git ls-remote --heads origin main | grep -q main; then
            echo "Fetching main branch from remote..."
            git fetch origin main:main
        else
            echo "Error: main branch not found"
            exit 1
        fi
    fi
    
    # Create develop from main
    echo "Creating develop branch from main..."
    git checkout -B develop main
    
    echo -e "${YELLOW}⚠ Note: You need to push the develop branch to remote:${NC}"
    echo "  Run: git push -u origin develop"
    echo ""
fi

# Summary
echo ""
echo "=========================================="
echo "Branch Setup Complete!"
echo "=========================================="
echo ""
echo "Branches configured:"
git branch -a | grep -E '(main|develop)' || echo "  No branches found"
echo ""
echo "Next steps:"
echo "1. If develop was just created, push it: git push -u origin develop"
echo "2. Review the branching strategy: docs/BRANCHING_STRATEGY.md"
echo "3. For development work: git checkout develop"
echo "4. Create feature branches: git checkout -b feature/your-feature"
echo ""
echo "For more information, see:"
echo "  - docs/BRANCHING_STRATEGY.md"
echo "  - CONTRIBUTING.md"
echo "  - docs/runbooks/DEPLOYMENT.md"
echo ""

exit 0
