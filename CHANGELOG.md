## [1.3.0](https://github.com/michaeltkuo/localmind/compare/v1.2.0...v1.3.0) (2026-03-06)

### ✨ Features

* generate conversation titles via LLM after first response ([08f428b](https://github.com/michaeltkuo/localmind/commit/08f428bfaee912649bb6e1c1ff6a7cf6a814d3b8))
* inject current date into system prompt at call time ([00463de](https://github.com/michaeltkuo/localmind/commit/00463deb2f08fa27f303c02b65cd288b8719f550))
* rewrite system prompts with XML structure, identity, and anti-sycophancy ([58ea90d](https://github.com/michaeltkuo/localmind/commit/58ea90d3f7de78dcd1c8906bf06fb7c66346e677))

### 🐛 Bug Fixes

* show LLM-generated title in sidebar instead of raw user message ([b388205](https://github.com/michaeltkuo/localmind/commit/b388205c456267ccee18fa4276f954b1a8a02085))
* streaming tokens no longer lost when navigating between conversations ([5e77420](https://github.com/michaeltkuo/localmind/commit/5e77420b6d653d92a412b9ac9c8647805aedb9c8))
* upsert conversation into list before streaming so token writes never drop ([3778ad2](https://github.com/michaeltkuo/localmind/commit/3778ad225223d5fe6d7470edb9064afa28b5f524))

### ⚡ Performance Improvements

* batch streaming tokens with rAF, skip ReactMarkdown during streaming ([453f163](https://github.com/michaeltkuo/localmind/commit/453f163d5465d1dd1a015d7712f8ff049bdd4617))
* defer only Prism during streaming, keep ReactMarkdown always active ([6d612a5](https://github.com/michaeltkuo/localmind/commit/6d612a508ca9f0ffb2b305d0e2f5d12889b53b6e))

### 📝 Documentation

* update README with GitHub Actions CI/CD information ([ec52bff](https://github.com/michaeltkuo/localmind/commit/ec52bff39275efeccfd31f105aca186643300477))

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
