## [Unreleased]

### 🐛 Bug Fixes

* **web-search**: implement streaming responses for web search tool calls
  - Previously, responses appeared instantly after search completed (non-streaming)
  - Now uses new `executeToolLoopStreaming` method for word-by-word streaming
  - Improved UX with smooth status transitions (searching → streaming)
  - Prevents UI flashing between search completion and response generation

### 🔧 Technical Improvements

* Add `executeToolLoopStreaming` method to `OllamaService` for streaming final responses after tool execution
* Update `chatStore` to use streaming tool loop with proper status management
* Maintain "searching" status until content starts streaming to avoid blank UI states

## [1.2.0](https://github.com/michaeltkuo/localmind/compare/v1.1.0...v1.2.0) (2025-12-01)

### ✨ Features

* add automated semantic versioning (Phase 2) ([2d43ea4](https://github.com/michaeltkuo/localmind/commit/2d43ea411b6c397f90918b477b7e362576014dae))
* add cross-platform build support for Windows ([4d2a86c](https://github.com/michaeltkuo/localmind/commit/4d2a86cbde8556e117bd77acc583715920f3fdd3))
* add GitHub Actions CI/CD workflows (Phase 1) ([60afce4](https://github.com/michaeltkuo/localmind/commit/60afce445e464f8bc86a8a50772c7c2499dfb229))

### 🐛 Bug Fixes

* add GH_TOKEN to build step for electron-builder ([2a5590f](https://github.com/michaeltkuo/localmind/commit/2a5590ff8bd3d1fd3a485f4101b41526f8f78a23))
* add package-lock.json and update workflows to handle missing lock file ([64a18d9](https://github.com/michaeltkuo/localmind/commit/64a18d983ccaf56cae8d2daf11eab533a296fa44))
* enable persist-credentials for GITHUB_TOKEN ([86092bb](https://github.com/michaeltkuo/localmind/commit/86092bbfde94425332ab17e9fc5e77a766408dac))
* resolve GitHub Actions release workflow failures ([81c7aa5](https://github.com/michaeltkuo/localmind/commit/81c7aa539a7060fc02b13ab271f8b02053537cf4))
* resolve security vulnerabilities in dependencies ([34ee85b](https://github.com/michaeltkuo/localmind/commit/34ee85b95034828be625cd11dfb69d1f6c6f9799))
* update Node.js version to 22 for semantic-release ([d5aed07](https://github.com/michaeltkuo/localmind/commit/d5aed07317e352c3f8b9ad810fe10e93f0b8c2a7))
* update semantic-release to resolve security vulnerabilities ([6032671](https://github.com/michaeltkuo/localmind/commit/6032671799496eea7b7d19788f8ae37af077f766))

### 📝 Documentation

* clean up README and update to v1.1.0 with web search feature ([aea2c62](https://github.com/michaeltkuo/localmind/commit/aea2c62195ef778e2b2b991af0ba4e9314cc9e7d))

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
