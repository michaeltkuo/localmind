# Contributing to LocalMind

Thank you for your interest in contributing to LocalMind! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/localmind.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit your changes following our [commit conventions](#commit-message-conventions)
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

## Commit Message Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/) for automated version management and changelog generation. This allows semantic-release to automatically determine version bumps and create releases.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types and Version Impact

| Type | Description | Version Bump | Example |
|------|-------------|--------------|---------|
| `feat` | New feature | **Minor** (1.1.0 → 1.2.0) | `feat: add web search integration` |
| `fix` | Bug fix | **Patch** (1.1.0 → 1.1.1) | `fix: resolve chat input scrolling issue` |
| `perf` | Performance improvement | **Patch** (1.1.0 → 1.1.1) | `perf: optimize message rendering` |
| `refactor` | Code refactoring | **Patch** (1.1.0 → 1.1.1) | `refactor: simplify storage service` |
| `docs` | Documentation only | **None** | `docs: update installation guide` |
| `style` | Code style/formatting | **None** | `style: fix indentation` |
| `test` | Adding tests | **None** | `test: add query classifier tests` |
| `chore` | Maintenance tasks | **None** | `chore: update dependencies` |
| `ci` | CI/CD changes | **None** | `ci: update workflow permissions` |
| `build` | Build system changes | **None** | `build: configure electron-builder` |

### Breaking Changes

Breaking changes trigger a **major** version bump (1.1.0 → 2.0.0):

```bash
# Method 1: Use ! after type
feat!: redesign settings panel API

# Method 2: Add BREAKING CHANGE footer
feat: update storage format

BREAKING CHANGE: Old conversation files need migration
```

### Examples

**✅ Good Commit Messages:**

```bash
feat: add conversation export functionality
fix: prevent duplicate messages in chat
docs: add troubleshooting section for Windows users
refactor(search): improve query parsing logic
feat(ui): add keyboard shortcuts for navigation
```

**❌ Bad Commit Messages:**

```bash
Update code          # Too vague, no type
Fixed stuff          # No type, unclear
WIP                  # Not descriptive
feat Add feature     # Missing colon
FEAT: new feature    # Type should be lowercase
```

### Scopes (Optional)

Scopes provide additional context:

- `ui` - User interface changes
- `search` - Search functionality
- `storage` - Data persistence
- `ollama` - Ollama integration
- `electron` - Electron-specific code
- `deps` - Dependency updates

```bash
feat(ui): add dark mode toggle
fix(ollama): handle connection timeout
chore(deps): update React to 18.3.0
```

### Why This Matters

- **Automated Releases**: Commits determine version numbers automatically
- **Changelog Generation**: Release notes are generated from commit messages
- **Clear History**: Makes it easy to understand what changed and why
- **Semantic Versioning**: Follows semver principles (MAJOR.MINOR.PATCH)

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will launch in Electron
```

## Project Structure

```
local-chatbot/
├── electron/           # Electron main process
├── src/
│   ├── components/    # React components
│   ├── services/      # Business logic
│   ├── stores/        # State management
│   └── types/         # TypeScript types
├── build/             # Build assets (icons)
└── scripts/           # Build scripts
```

## Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **React**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **CSS**: Use Tailwind CSS utility classes
- **Comments**: Write clear comments for complex logic

## Testing Your Changes

Before submitting a PR:

1. **Test in development mode**: `npm run dev`
2. **Test production build**: `npm run build:dir`
3. **Check TypeScript**: `npm run type-check`
4. **Test with multiple models**: Switch between different Ollama models
5. **Test dark mode**: Toggle and verify UI works in both themes

## Common Contribution Areas

### 🐛 Bug Fixes
- Check existing issues first
- Include steps to reproduce
- Test the fix thoroughly

### ✨ New Features
- Open an issue to discuss first
- Keep changes focused and atomic
- Update README if needed
- Consider backward compatibility

### 📚 Documentation
- Fix typos or unclear explanations
- Add examples or screenshots
- Update troubleshooting section

### 🎨 UI/UX Improvements
- Maintain consistency with existing design
- Support both light and dark modes
- Test responsive layouts

## Pull Request Guidelines

### PR Title Format

PR titles should follow the same [commit conventions](#commit-message-conventions):

- `feat: add conversation search`
- `fix: resolve memory leak in chat`
- `docs: update README installation steps`
- `refactor: simplify message handling`
- `perf: optimize rendering performance`
- `test: add integration tests`

### PR Description Should Include
- What changes were made
- Why these changes were needed
- How to test the changes
- Screenshots (for UI changes)
- Related issue numbers

### Example PR Description
```markdown
## Changes
- Added support for conversation search
- Implemented keyboard shortcut (⌘F)

## Motivation
Users requested ability to search through conversations.

## Testing
1. Press ⌘F to open search
2. Type query
3. Results highlight matching conversations

## Screenshots
[Add screenshots here]

Fixes #123
```

## Code Review Process

1. **Automated Checks**: TypeScript compilation must pass
2. **Manual Review**: Maintainer will review code quality
3. **Testing**: Changes will be tested manually
4. **Feedback**: Address any requested changes
5. **Merge**: Once approved, PR will be merged

## Reporting Issues

When reporting issues, please include:

- **OS and version**: macOS 13.0, etc.
- **App version**: Check About screen
- **Ollama version**: Run `ollama --version`
- **Steps to reproduce**: Clear numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Check Electron DevTools (View > Toggle Developer Tools)

## Feature Requests

We love feature ideas! Please:

1. Check if the feature already exists
2. Search existing issues to avoid duplicates
3. Clearly describe the feature and use case
4. Explain why it would benefit users
5. Add mockups or examples if possible

## Questions?

- **Discussions**: Use GitHub Discussions for questions
- **Issues**: Use GitHub Issues for bugs and features
- **Code**: Comment on specific lines in PRs

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making LocalMind better! 🚀
