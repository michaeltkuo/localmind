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

## [1.1.0] - 2025-11-30

### 🔍 Internet Search Integration

#### Added
- **Web Search Capability**: DuckDuckGo integration for real-time information retrieval
- **Query Classification**: AI-powered intent detection to determine when web search is needed
- **Citation System**: Visual citation pills showing sources for web-based answers
- **Tool Architecture**: Modular tool framework for extensible functionality
  - `BaseTool` abstract class for consistent tool implementation
  - `ToolRegistry` for managing and executing tools
  - `WebSearchTool` with DuckDuckGo integration
- **Debug Service**: Comprehensive logging and monitoring system (315 lines)
  - Search result tracking
  - Performance monitoring
  - Detailed request/response logging
- **Enhanced Settings Panel**: 
  - Model configuration UI
  - Search preferences and controls
  - Web search toggle
- **Test Suite**: 252 lines of comprehensive tests for query classification
- **Constants Management**: Centralized model definitions and system prompts

#### Enhanced
- **Chat Message Component**: Redesigned with citation rendering and source attribution
- **Ollama Service**: Extended with better model management and streaming (+ 237 lines)
- **Chat Store**: Enhanced state management for citations and tool results (+ 368 lines)
- **Vite Configuration**: Improved build configuration for external dependencies

#### Technical Improvements
- Modular service architecture for maintainability
- Type-safe tool execution pipeline
- Error recovery and graceful degradation
- Memory-efficient search result handling

#### Files Changed
- 26 files changed, 2,994 insertions(+), 368 deletions(-)
- New services: `query-classifier.service.ts`, `debug.service.ts`
- New tools: `base.tool.ts`, `registry.ts`, `web-search.tool.ts`
- New component: `CitationPill.tsx`
- Enhanced: `ChatMessage.tsx`, `SettingsPanel.tsx`, `chatStore.ts`

---

## [Unreleased]

### Added
- **🌐 Web Search Integration**: Search the internet for real-time information
  - Privacy-focused search using DuckDuckGo (no tracking, no API key)
  - Auto-detect queries that need current information
  - Display search results with clickable source citations
  - Seamless context injection into conversations
  - Enable/disable toggle in Settings panel
  - Auto-detect search queries option
  - Visual indicators when search is active

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
