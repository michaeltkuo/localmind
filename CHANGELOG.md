# Changelog

All notable changes to LocalMind will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-11-14

### 🎉 Initial Release

#### Added
- **Multiple Conversations**: Create and manage unlimited chat sessions
- **Conversation Sidebar**: Navigate between chats with preview and timestamps
- **Streaming Responses**: Real-time AI response rendering
- **Multiple Models**: Switch between different Ollama models
- **Persistent Storage**: Automatic conversation saving in localStorage
- **Dark Mode**: Beautiful dark theme with toggle button (⌘D)
- **Markdown Support**: Formatted text with syntax-highlighted code blocks
- **Copy Code Blocks**: One-click copy buttons for code snippets
- **Settings Panel**: Customize temperature, max tokens, top-p, system prompts
- **Export Conversations**: Save as JSON or Markdown files
- **Keyboard Shortcuts**: 
  - ⌘N - New conversation
  - ⌘K - Open settings
  - ⌘D - Toggle dark mode
- **Stop Generation**: Cancel long-running AI responses
- **Model Pre-loading**: Smart warm-up for instant responses
- **Error Boundaries**: Graceful error handling with recovery
- **Loading Overlays**: Clear feedback during model switching
- **Error Notifications**: User-friendly error messages with troubleshooting
- **Professional Icon**: Custom brain-themed app icon

#### Tech Stack
- Electron 28.0.0
- React 18.2.0
- TypeScript 5.3.3
- Vite 5.0.8
- Tailwind CSS 3.3.6
- Zustand 4.4.7
- Ollama integration

#### Supported Platforms
- macOS (Apple Silicon & Intel)

---

## [Unreleased]

### Planned
- Windows support
- Linux support
- Conversation search
- Model download from UI
- Conversation folders/tags
- Voice input support
- Custom themes

---

[1.0.0]: https://github.com/michaeltkuo/localmind/releases/tag/v1.0.0
