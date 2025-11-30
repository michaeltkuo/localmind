#!/bin/bash

# Semantic Versioning Helper Script for LocalMind
# Usage: ./scripts/version-bump.sh [major|minor|patch]

set -e

VERSION_TYPE=${1:-patch}

# Validate input
if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "❌ Error: Invalid version type. Use 'major', 'minor', or 'patch'"
    echo "Usage: ./scripts/version-bump.sh [major|minor|patch]"
    exit 1
fi

# Check if working directory is clean
if [[ -n $(git status -s) ]]; then
    echo "❌ Error: Working directory is not clean. Please commit or stash changes first."
    git status -s
    exit 1
fi

echo "🚀 Bumping $VERSION_TYPE version..."

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Bump version using npm
npm version $VERSION_TYPE -m "chore: bump version to %s"

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ New version: $NEW_VERSION"

# Create git tag
echo "🏷️  Creating git tag v$NEW_VERSION"
git tag -a "v$NEW_VERSION" -m "Release version $NEW_VERSION"

echo ""
echo "✨ Version bump complete!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git log -1"
echo "  2. Push to remote: git push origin $(git branch --show-current) --follow-tags"
echo "  3. Create a release on GitHub with the tag v$NEW_VERSION"
echo ""
