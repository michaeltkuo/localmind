# GitHub Actions Implementation Plan

**Branch:** `feature/github-actions-setup`  
**Created:** November 30, 2025  
**Project:** LocalMind - Private AI Desktop Assistant

---

## 🎯 Overview

This document outlines the phased implementation of GitHub Actions CI/CD workflows for LocalMind, including considerations for cross-platform builds (macOS + Windows) and handling distribution without Apple Developer certificates.

---

## 🚨 Special Considerations

### No Apple Developer Certificate
**Current Status:** No Apple Developer Account ($99/year)

**Impact:**
- ❌ Cannot code sign macOS apps
- ❌ Cannot notarize for Gatekeeper
- ⚠️ Users will see "App from unidentified developer" warning
- ✅ Apps still work - users can bypass with Right-Click > Open (first time only)

**Workaround Strategy:**
1. Skip code signing in electron-builder config
2. Configure GitHub Actions to build unsigned DMGs
3. Add clear instructions in README about security warnings
4. Document how to add certificates later when available

**Future Migration Path:**
When you get Apple Developer cert:
1. Export certificate as `.p12` file
2. Base64 encode: `base64 -i certificate.p12 | pbcopy`
3. Add to GitHub Secrets:
   - `APPLE_CERTIFICATE` (base64 cert)
   - `APPLE_CERT_PASSWORD` (cert password)
   - `APPLE_ID` (your Apple ID email)
   - `APPLE_ID_PASSWORD` (app-specific password)
   - `APPLE_TEAM_ID` (team ID from developer portal)
4. Update build workflow to include signing steps
5. Enable notarization in electron-builder config

---

### Windows Support
**Current Status:** macOS only

**Plan:** Add Windows as build target

**Changes Required:**

1. **package.json** - Add Windows build config:
   ```json
   "build": {
     "win": {
       "target": ["nsis", "portable"],
       "icon": "build/icon.ico"
     }
   }
   ```

2. **Icon Format** - Create `.ico` file from existing `.png`:
   - Use online converter or ImageMagick
   - 256x256px recommended

3. **GitHub Actions** - Use matrix strategy to build both platforms:
   ```yaml
   strategy:
     matrix:
       os: [macos-latest, windows-latest]
   ```

4. **Build Script** - Update to support platform detection or separate commands

**Windows Build Outputs:**
- `LocalMind-Setup-1.1.0.exe` - NSIS installer (recommended for users)
- `LocalMind-1.1.0-portable.exe` - No installation required

**Testing Strategy:**
- macOS builds tested on your machine
- Windows builds tested via:
  - GitHub Actions (basic validation)
  - Virtual machine (VMware Fusion / Parallels)
  - Community testing via GitHub releases

---

## 📋 Implementation Phases

### **Phase 1: Foundation (Week 1)** ⭐ START HERE

**Goal:** Establish quality gates and security baseline

#### Workflows to Implement:

**1. CI Workflow** (`ci.yml`)
- **Trigger:** Push to any branch, Pull Requests
- **Jobs:**
  - Install dependencies (`npm ci`)
  - Type checking (`npm run type-check`)
  - Run tests (`npm test`)
  - Build validation (don't publish)
  - Run on: Ubuntu (fastest), test with Node 20
- **Success Criteria:** All checks pass before merging
- **Estimated Time:** 30 minutes

**2. Security Scanning** (`security.yml`)
- **Trigger:** Push to main, PRs, Schedule (weekly)
- **Jobs:**
  - `npm audit` for known vulnerabilities
  - Fail on critical/high severity issues
  - Create GitHub Security Advisories
- **Success Criteria:** No critical vulnerabilities
- **Estimated Time:** 15 minutes

**Deliverables:**
- ✅ `.github/workflows/ci.yml`
- ✅ `.github/workflows/security.yml`
- ✅ README updated with build status badges
- ✅ All checks passing on this branch

---

### **Phase 2: Automated Versioning (Week 2)**

**Goal:** Eliminate manual version management

#### Workflows to Implement:

**3. Semantic Release** (`release.yml`)
- **Trigger:** Manual workflow dispatch OR merge to main
- **Uses:** `semantic-release` or `standard-version`
- **Jobs:**
  - Analyze commits since last tag
  - Determine version bump (major/minor/patch)
  - Update `package.json` version
  - Generate/update `CHANGELOG.md`
  - Create git tag (e.g., `v1.2.0`)
  - Create GitHub release (draft)
  - Commit version bump back to main
- **Commit Convention Required:**
  - `feat:` → minor bump (1.1.0 → 1.2.0)
  - `fix:` → patch bump (1.1.0 → 1.1.1)
  - `feat!:` or `BREAKING CHANGE:` → major (1.1.0 → 2.0.0)
  - `chore:`, `docs:`, `style:` → no version bump
- **Success Criteria:** Tags created automatically
- **Estimated Time:** 1 hour

**Deliverables:**
- ✅ `.github/workflows/release.yml`
- ✅ Update CONTRIBUTING.md with commit conventions
- ✅ Configure semantic-release (if used)

---

### **Phase 3: Cross-Platform Builds (Week 2-3)**

**Goal:** Automated builds for macOS and Windows

#### Pre-Implementation Steps:

**A. Update package.json:**
```json
{
  "build": {
    "appId": "com.localmind.app",
    "productName": "LocalMind",
    "directories": {
      "output": "release",
      "buildResources": "build"
    },
    "files": [
      "dist/**/*",
      "dist-electron/**/*",
      "package.json"
    ],
    "mac": {
      "category": "public.app-category.productivity",
      "icon": "build/icon.png",
      "target": ["dmg"],
      "identity": null,  // Skip code signing
      "hardenedRuntime": false,  // Disable for unsigned builds
      "gatekeeperAssess": false  // Skip Gatekeeper check
    },
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "dmg": {
      "contents": [
        {
          "x": 130,
          "y": 220
        },
        {
          "x": 410,
          "y": 220,
          "type": "link",
          "path": "/Applications"
        }
      ]
    }
  }
}
```

**B. Create Windows Icon:**
```bash
# Using ImageMagick (if installed)
convert build/icon.png -resize 256x256 build/icon.ico

# Or use online tool: https://convertio.co/png-ico/
```

**C. Add Build Scripts:**
```json
{
  "scripts": {
    "build:mac": "tsc && vite build && electron-builder --mac",
    "build:win": "tsc && vite build && electron-builder --win",
    "build:all": "tsc && vite build && electron-builder --mac --win"
  }
}
```

#### Workflows to Implement:

**4. Build & Publish** (`build.yml`)
- **Trigger:** New tags matching `v*.*.*`
- **Strategy:** Matrix build for macOS and Windows
- **Jobs:**
  ```yaml
  matrix:
    os: [macos-latest, windows-latest]
    include:
      - os: macos-latest
        build-command: npm run build:mac
      - os: windows-latest
        build-command: npm run build:win
  ```
- **Steps:**
  - Checkout code
  - Setup Node.js 20
  - Install dependencies
  - Build application
  - Upload artifacts to GitHub Release
  - Update auto-updater config (`latest-mac.yml`, `latest.yml`)
- **Success Criteria:** DMG + EXE uploaded to release
- **Estimated Time:** 1.5 hours

**Deliverables:**
- ✅ `.github/workflows/build.yml`
- ✅ `build/icon.ico` created
- ✅ `package.json` updated with Windows config
- ✅ Test release created

---

### **Phase 4: Polish & Maintenance (Week 3+)**

**Goal:** Long-term automation and quality

#### Workflows to Implement:

**5. Dependency Updates** (`dependency-updates.yml`)
- **Trigger:** Schedule (weekly on Monday)
- **Tool:** Dependabot config OR custom workflow
- **Jobs:**
  - Check for outdated packages
  - Create PR with updates
  - Auto-run CI on update PR
- **Estimated Time:** 30 minutes

**6. Code Coverage** (`coverage.yml`)
- **Trigger:** PRs, push to main
- **Tool:** Codecov or Coveralls
- **Jobs:**
  - Run Jest with coverage
  - Upload to coverage service
  - Comment coverage % on PRs
- **Estimated Time:** 45 minutes

**7. Stale Issue Management** (`stale.yml`)
- **Trigger:** Daily schedule
- **Tool:** `actions/stale`
- **Config:** Label after 60 days, close after 90
- **Estimated Time:** 15 minutes

**Deliverables:**
- ✅ `.github/dependabot.yml` OR `.github/workflows/dependency-updates.yml`
- ✅ `.github/workflows/coverage.yml`
- ✅ `.github/workflows/stale.yml`

---

## 🚀 Quick Start Guide

### For Contributors

**1. Commit Message Format:**
```bash
# Features (minor version bump)
git commit -m "feat: add web search integration"

# Bug fixes (patch version bump)
git commit -m "fix: resolve chat input scrolling issue"

# Breaking changes (major version bump)
git commit -m "feat!: redesign settings panel"
# or
git commit -m "feat: new API

BREAKING CHANGE: old API endpoints removed"

# No version bump
git commit -m "chore: update README"
git commit -m "docs: add contribution guidelines"
```

**2. Creating a Release:**
```bash
# Option A: Manual trigger (when ready)
# Go to: Actions > Release Workflow > Run workflow

# Option B: Automatic (on merge to main)
# Just merge your PR - release happens automatically
```

**3. Local Testing:**
```bash
# Run CI checks locally
npm run type-check
npm test
npm run build:dir  # Test build without publishing

# Test Windows build (on macOS)
npm run build:win  # Requires Wine for testing
```

---

## 📊 Success Metrics

### After Phase 1:
- [ ] All PRs automatically tested
- [ ] No critical security vulnerabilities
- [ ] Build status visible in README

### After Phase 2:
- [ ] Version bumps happen automatically
- [ ] CHANGELOG generated from commits
- [ ] Tags created on release

### After Phase 3:
- [ ] macOS DMG built and uploaded
- [ ] Windows EXE built and uploaded
- [ ] Users can download from GitHub Releases

### After Phase 4:
- [ ] Dependencies updated weekly
- [ ] Code coverage tracked
- [ ] Stale issues managed

---

## 🔗 Resources

### Documentation:
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [electron-builder](https://www.electron.build/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Release](https://semantic-release.gitbook.io/)

### Useful Actions:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-artifact@v4`
- `semantic-release/semantic-release`
- `actions/stale`

### Testing Tools:
- [act](https://github.com/nektos/act) - Run GitHub Actions locally
- Wine (macOS) - Test Windows builds on Mac

---

## 🐛 Troubleshooting

### Common Issues:

**1. "npm ci" fails in Actions**
- Solution: Ensure `package-lock.json` is committed
- Check Node version matches (20.x)

**2. Windows build fails on macOS**
- Expected: electron-builder handles cross-platform
- Ensure Wine not installed (causes conflicts)

**3. DMG shows security warning**
- Expected: No code signing certificate
- Users: Right-click > Open (first time only)

**4. Auto-updater not working**
- Check `latest-mac.yml` is uploaded with DMG
- Verify `appId` matches in package.json

**5. Release not created**
- Check commit messages follow convention
- Verify GITHUB_TOKEN has write permissions

---

## 📝 Notes

- This plan assumes no breaking changes to existing functionality
- All workflows include detailed comments for learning
- Secrets will be documented but not committed
- Windows testing may require community feedback initially
- Code signing can be added later without changing workflow structure

---

**Next Steps:** Begin Phase 1 implementation → CI & Security workflows
