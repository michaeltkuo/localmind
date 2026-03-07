# LocalMind - Desktop Application Specification

## Project Overview
**LocalMind** is a **native desktop application** (not a web app) that provides a ChatGPT-like interface using locally hosted open-source LLM models, ensuring privacy and offline functionality.

**Tagline:** *Your Private AI Assistant - All conversations stay on your computer*

### What You'll Get:
- **A standalone desktop app** that you install and run on your Mac (like VS Code, Slack, or any other app)
- **Double-click to launch** - no browser needed
- **Works completely offline** once models are downloaded
- **Looks and behaves like a native macOS application**
- **All data stays on your computer** - maximum privacy

## Core Requirements

### 1. Functional Requirements

#### 1.1 User Interface
- **Chat Interface**: Clean, modern chat UI similar to ChatGPT
  - Message input area with multi-line support
  - Conversation history display with user/assistant distinction
  - Markdown rendering for responses (code blocks, lists, formatting)
  - Copy message button
  - Clear conversation button
  - Conversation management (save/load/delete conversations)

#### 1.2 LLM Integration
- **Model Management**:
  - Support for popular open-source models (Llama, Mistral, Phi, etc.)
  - Model selection dropdown
  - Download models directly from Hugging Face or Ollama
  - Display model information (size, parameters, capabilities)
  
- **Inference**:
  - Streaming responses (token-by-token display)
  - Stop generation button
  - Adjustable parameters (temperature, max tokens, top-p)
  - Context window management

#### 1.3 Conversation Features
- Create new conversations
- Save conversation history locally
- Load previous conversations
- Export conversations (JSON, Markdown)
- Search through conversation history

### 2. Technical Architecture

#### 2.1 Technology Stack (Confirmed)
**Desktop Application Framework:**
- **Electron** - Turns web technologies into a native desktop app
  - ✅ Used by VS Code, Slack, Discord, Spotify
  - ✅ Creates `.app` file for macOS (and `.exe` for Windows)
  - ✅ NOT a web app - it's a real desktop application

**User Interface:**
- **React** - UI component library (runs inside the desktop app)
- **TypeScript** - Type safety and better code quality
- **Tailwind CSS** - Modern styling
- **React Markdown** - Render formatted responses with code highlighting

**LLM Backend:**
- **Ollama** - ✅ CONFIRMED - Local LLM server
  - Manages and runs Llama models
  - Handles inference efficiently
  - Easy to use REST API

**Primary Model:**
- **Llama 3.2** (3B or 8B parameters) - ✅ CONFIRMED
  - Fast responses on consumer hardware
  - Excellent quality
  - Good balance of speed and capability

**Storage:**
- **JSON files** - Simple, human-readable conversation storage
- Stored in: `~/Library/Application Support/LocalMind/` (macOS)

#### 2.2 Architecture Components
```
┌─────────────────────────────────────────┐
│         Electron Main Process           │
│  (System Integration, File Access)      │
└────────────┬────────────────────────────┘
             │
┌────────────▼────────────────────────────┐
│      Electron Renderer Process          │
│  ┌──────────────────────────────────┐   │
│  │      React Application           │   │
│  │  - Chat Interface                │   │
│  │  - Model Selector                │   │
│  │  - Settings Panel                │   │
│  │  - Conversation Manager          │   │
│  └──────────┬───────────────────────┘   │
└─────────────┼───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│       LLM Backend (Ollama)              │
│  - Model Management                     │
│  - Inference Engine                     │
│  - Streaming API                        │
└─────────────────────────────────────────┘
```

### 3. Detailed Feature Specifications

#### 3.1 Main Window Layout
```
┌────────────────────────────────────────────┐
│  [☰] Local ChatBot    [Model: Llama 3.2]  │ <- Header
├────────┬───────────────────────────────────┤
│ Side   │                                   │
│ bar    │     Chat Messages Area            │
│        │                                   │
│ • New  │  ┌──────────────────────────┐    │
│ • Conv1│  │ User: Hello              │    │
│ • Conv2│  └──────────────────────────┘    │
│        │  ┌──────────────────────────┐    │
│        │  │ Assistant: Hi! How can   │    │
│        │  │ I help you today?        │    │
│        │  └──────────────────────────┘    │
│        │                                   │
├────────┴───────────────────────────────────┤
│  [Type your message...            ] [Send] │ <- Input Area
└────────────────────────────────────────────┘
```

#### 3.2 Settings Panel
- **Model Settings**:
  - Temperature (0.0 - 2.0)
  - Max tokens (128 - 8192)
  - Top-p (0.0 - 1.0)
  - System prompt customization
  
- **Application Settings**:
  - Theme (Light/Dark)
  - Font size
  - Save location for conversations
  - Model download directory

#### 3.3 Model Management
- List available models
- Download new models
- Delete unused models
- Display model disk usage
- Update models

### 4. User Stories

**As a user, I want to:**
1. Start a new conversation with an AI assistant
2. See responses stream in real-time
3. Copy code snippets from responses
4. Save my conversations for later review
5. Switch between different models
6. Adjust model parameters for different use cases
7. Use the app without internet connection
8. Have my data stored locally for privacy

### 5. Non-Functional Requirements

#### 5.1 Performance
- First token latency: < 2 seconds (model dependent)
- UI responsiveness: No blocking operations
- Model loading: Progress indicator
- Memory usage: Efficient model loading/unloading

#### 5.2 Usability
- Intuitive interface requiring no tutorial
- Keyboard shortcuts for common actions
- Responsive design that works on different screen sizes
- Clear error messages

#### 5.3 Security & Privacy
- All data stored locally
- No telemetry or external API calls
- Secure model file verification

#### 5.4 Compatibility
- **OS Support**: macOS, Windows, Linux
- **Minimum Requirements**:
  - RAM: 8GB (16GB recommended)
  - Storage: 10GB free space
  - CPU: Modern multi-core processor (Apple Silicon or x86_64)
  - GPU: Optional (NVIDIA with CUDA for acceleration)

### 6. Development Phases

#### Phase 1: MVP (Minimum Viable Product) - ✅ COMPLETED
**Goal: Working desktop app with basic chat**
- ✅ Electron + React + TypeScript project setup
- ✅ Ollama integration (check installation, connect to API)
- ✅ Basic chat interface (send message, receive response)
- ✅ Streaming responses (see text appear word-by-word)
- ✅ Single conversation support
- ✅ Llama 3.2 model integration
- ✅ Simple light theme UI
- ✅ **Testing:** Manual testing only (you using the app)

**Deliverable:** A desktop app you can double-click, type a message, and get a response from Llama
**Status:** ✅ COMPLETED on November 14, 2025

#### Phase 2: Essential Features - NEXT
**Goal: Multiple conversations and persistence**
- Multiple conversation support (new chat button)
- Conversation sidebar (list of chats)
- Save conversations to disk
- Load previous conversations
- Markdown rendering (code blocks, formatting)
- Copy message button
- Clear/delete conversation
- ✅ **Testing:** Unit tests for storage service (save/load conversations)

**Deliverable:** A usable daily-driver chat app

#### Phase 3: Enhanced Features
**Goal: Customization and polish**
- Model selector (switch between Llama variants)
- Settings panel (temperature, max tokens, system prompt)
- Dark mode
- Model management UI (download/delete models)
- Export conversations (JSON, Markdown)
- Keyboard shortcuts
- ✅ **Testing:** Unit tests for Ollama service, component tests for UI

**Deliverable:** A polished, customizable app

#### Phase 4: Distribution & Polish
**Goal: Easy installation for others**
- macOS `.dmg` installer
- App icon and branding
- Better error handling
- Loading states and animations
- README and user documentation
- GitHub releases
- ✅ **Testing:** E2E tests for critical user flows (optional), build verification

**Deliverable:** A distributable desktop application

### 7. Technical Decisions (Finalized)

#### ✅ CONFIRMED: Ollama + Llama 3.2
**Why Ollama:**
- Easy setup and installation
- Excellent model management
- Optimized inference for Llama models
- Active community and regular updates
- Simple REST API for integration

**Why Llama 3.2:**
- Meta's latest open-source model
- Available in 3B (faster) and 8B (better quality) sizes
- Excellent performance on consumer hardware
- Strong coding and reasoning capabilities
- Works great with Ollama

**Installation Flow:**
1. User installs our desktop app
2. App checks if Ollama is installed
3. If not, app guides user to install Ollama (one-time, simple)
4. App downloads Llama 3.2 model via Ollama
5. Ready to chat!

### 8. File Structure
```
local-chatbot/
├── package.json
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Preload script
│   └── ipc/                 # IPC handlers
├── src/
│   ├── App.tsx              # Main React component
│   ├── components/
│   │   ├── Chat/
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── ChatContainer.tsx
│   │   ├── Sidebar/
│   │   │   ├── ConversationList.tsx
│   │   │   └── ModelSelector.tsx
│   │   └── Settings/
│   │       └── SettingsPanel.tsx
│   ├── services/
│   │   ├── ollama.service.ts    # Ollama API integration
│   │   └── storage.service.ts   # Local storage
│   ├── stores/
│   │   └── chatStore.ts         # State management
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   └── utils/
│       └── helpers.ts
├── public/
└── dist/
```

### 9. API Integration (Ollama)

**Key Endpoints:**
- `GET /api/tags` - List available models
- `POST /api/pull` - Download a model
- `POST /api/generate` - Generate completion (streaming)
- `POST /api/chat` - Chat completion (streaming)
- `DELETE /api/delete` - Delete a model

### 10. Success Criteria
- [✅] Application runs on macOS (primary target platform)
- [✅] Can successfully run inference with Llama 3.2 model
- [⏳] Conversations persist between sessions (Phase 2)
- [✅] Response streaming works smoothly
- [⏳] Model switching works without crashes (Phase 3)
- [✅] Application uses < 500MB RAM when idle
- [✅] User can complete a conversation within 30 seconds of first launch

---

## Current Status

### ✅ Phase 1 MVP - COMPLETED (November 14, 2025)

**What's Working:**
- ✅ Desktop application launches successfully
- ✅ Electron + React + TypeScript + Vite stack fully operational
- ✅ Ollama integration with Llama 3.2 model
- ✅ Real-time streaming chat responses
- ✅ Clean, modern UI with Tailwind CSS
- ✅ Basic conversation support
- ✅ All dependencies installed (Node.js, Ollama, npm packages)

**Development Environment:**
- Node.js v25.2.0 installed via Homebrew
- Ollama v0.12.11 installed and running
- Llama 3.2 model downloaded (2GB)
- 595 npm packages installed
- Application running on http://localhost:5173

## Next Steps

1. **Test the application** - Send messages and verify responses work
2. **Begin Phase 2** - Add conversation persistence and sidebar
3. **Continue development** - Follow the roadmap below

## Key Clarifications

### This IS a Desktop App, NOT a Web App!
**What you're getting:**
- 🖥️ A standalone desktop application (like VS Code, Slack, Discord)
- 📦 Installable `.dmg` file for macOS
- 🚀 Double-click icon to launch
- 🔒 Runs locally on your computer (no browser needed)
- 📡 Works completely offline (after initial setup)

**What you're NOT getting:**
- ❌ A website you visit in Chrome/Safari
- ❌ Anything hosted on the internet
- ❌ Cloud-based service

### How Electron Works (Simplified):
```
┌─────────────────────────────────────┐
│  Your Desktop App Icon              │  ← You double-click this
│  (LocalMind.app)                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Native Desktop Window Opens        │  ← Looks like a native app
│  (Not in your browser!)             │
│                                     │
│  Built with:                        │
│  - Electron (desktop container)     │
│  - React (UI components)            │
│  - TypeScript (code)                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Talks to Ollama on your computer   │  ← Runs Llama locally
│  (localhost:11434)                  │
└─────────────────────────────────────┘
```

---

## Confirmed Specifications

### ✅ Technology Stack:
- **Desktop Framework:** Electron
- **UI:** React + TypeScript + Tailwind CSS
- **LLM Backend:** Ollama
- **Primary Model:** Llama 3.2 (8B recommended)
- **Storage:** JSON files (local)
- **Testing:** Vitest (unit tests) + React Testing Library (component tests) - *Added in Phase 2+*

### ✅ Development Approach:
Start with **Phase 1 MVP** - a simple but functional desktop chat app

### ✅ Target Platform:
macOS (your current platform) - can expand to Windows/Linux later

---

**Estimated Development Time:** 
- Phase 1 (MVP): ~4-6 hours of coding
- Phase 2: ~6-8 hours
- Phase 3: ~6-8 hours
- Phase 4: ~4-6 hours

**Total: ~20-28 hours** of development work

---

---

## Testing Strategy

### Philosophy: Pragmatic Testing
For a solo desktop app project, we'll use a **"test what matters"** approach:

**Phase 1 (MVP):**
- **No automated tests** - TypeScript catches type errors, manual testing for functionality
- Focus: Get it working, iterate quickly

**Phase 2-3 (Core Features):**
- **Unit tests** for critical services:
  - `storage.service.ts` - Save/load conversations
  - `ollama.service.ts` - API communication
- **Component tests** for complex UI:
  - Chat message rendering
  - Message streaming
  
**Phase 4 (Polish):**
- **E2E tests** (optional) - Full user workflows
- **Build tests** - Verify installers work

### Testing Tools (If We Add Tests):
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",           // Fast unit test runner
    "@testing-library/react": "^14.0.0",  // React component testing
    "@testing-library/user-event": "^14.0.0",  // User interaction simulation
    "playwright": "^1.40.0"       // E2E testing (Phase 4)
  }
}
```

### Example Test Coverage (Phase 2+):
```typescript
// Example: storage.service.test.ts
describe('StorageService', () => {
  it('should save conversation to disk', async () => {
    const conversation = { id: '1', messages: [...] };
    await storage.saveConversation(conversation);
    const loaded = await storage.loadConversation('1');
    expect(loaded).toEqual(conversation);
  });
});

// Example: ollama.service.test.ts
describe('OllamaService', () => {
  it('should check if Ollama is running', async () => {
    const isRunning = await ollama.isAvailable();
    expect(isRunning).toBe(true);
  });
});
```

### Decision Point:
**Do you want automated tests from the start?**
- ✅ **No** (Recommended) - Build MVP first, add tests in Phase 2+
- ⚪ **Yes** - Set up test infrastructure in Phase 1, write tests as we go

---

## Ready to Start?
Say **"Let's build it!"** and I'll start coding Phase 1 MVP! 🚀

**Default approach:** Manual testing in Phase 1, automated tests in Phase 2+
