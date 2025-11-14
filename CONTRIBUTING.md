# Contributing to LocalMind

Thank you for your interest in contributing to LocalMind! 🎉

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/localmind.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit your changes: `git commit -m "Add your feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Open a Pull Request

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
- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `style: UI improvements`
- `refactor: Code refactoring`
- `test: Add tests`

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
