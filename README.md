# LocalMind 🧠

**Your private AI assistant. All conversations stay on your computer.**

A beautiful native desktop application for chatting with locally hosted LLM models using Ollama. Built with Electron, React, TypeScript, and Tailwind CSS.

![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)
![Version](https://img.shields.io/badge/Version-1.1.0-blue)
[![CI](https://github.com/michaeltkuo/localmind/actions/workflows/ci.yml/badge.svg)](https://github.com/michaeltkuo/localmind/actions/workflows/ci.yml)
[![Security Scan](https://github.com/michaeltkuo/localmind/actions/workflows/security.yml/badge.svg)](https://github.com/michaeltkuo/localmind/actions/workflows/security.yml)

## ✨ Features

### 🎯 Core Features
- ✅ **Desktop Application** - Real macOS app, not a web interface
- ✅ **Local LLM Integration** - Chat with Llama 3.2 and other models running on your computer
- ✅ **Streaming Responses** - See AI responses appear word-by-word
- ✅ **Multiple Conversations** - Create and manage unlimited chat sessions
- ✅ **Conversation Sidebar** - Easy navigation between chats with preview and timestamps
- ✅ **Clean UI** - Modern ChatGPT-like interface
- ✅ **100% Private** - All data stays on your computer
- ✅ **Offline Capable** - Works without internet (after setup)
- ✅ **Multiple Models** - Switch between different AI models instantly
- ✅ **Persistent Storage** - All conversations automatically saved locally

### 🎨 User Interface
- **Dark Mode** - Easy on the eyes with beautiful dark theme
- **Markdown Support** - Formatted text, code blocks with syntax highlighting
- **Copy Code Blocks** - One-click copy buttons for code snippets
- **Clean Design** - Modern, ChatGPT-inspired interface

### ⚙️ Advanced Features
- **Customizable Settings** - Adjust temperature, max tokens, top-p, and system prompts
- **Export Conversations** - Save chats as JSON or Markdown files
- **Keyboard Shortcuts** - Fast navigation with keyboard commands
- **Stop Generation** - Cancel long-running responses anytime
- **Model Pre-loading** - Smart model warm-up for instant responses
- **🌐 Web Search** - Search the internet for real-time information to supplement AI responses

### 🌐 Web Search Integration

LocalMind now supports internet search capability to supplement the AI's knowledge with real-time information from the web.

**Features:**
- 🔍 **Privacy-Focused Search** - Uses DuckDuckGo for searches (no tracking, no API key required)
- 🎯 **Auto-Detection** - Automatically detects when queries need current information
- 📚 **Source Citations** - Search results are displayed with clickable links
- ⚡ **Seamless Integration** - Search context is injected into conversations automatically
- 🌊 **Streaming Responses** - AI responses stream word-by-word even when using web search
- 🔒 **User Control** - Enable/disable via Settings panel

**How to Use:**
1. Open Settings (⌘K or click gear icon)
2. Scroll to "Web Search" section
3. Toggle "Enable Web Search" ON
4. (Optional) Enable/disable "Auto-Detect Search Queries"
5. Start asking questions that need current information!

**Use Cases:**
- Current events: "What are the latest developments in AI?"
- Recent tech: "What's new in TypeScript 5.4?"
- Documentation: "How do I use React Server Components?"
- Real-time data: "Current trends in web development"

**Technical Details:**
- Uses Ollama's tool-calling architecture for seamless integration
- Search results are fetched first, then the AI generates a streaming response
- Status indicators show when the AI is searching vs. generating response
- Smooth transition from "searching" to streaming without UI flashing

**Privacy Note:** Web searches are performed using DuckDuckGo's privacy-friendly API. No personal data is tracked.

### 🔒 Privacy First
- **100% Local** - All data stays on your computer
- **No Internet Required** - Works completely offline (after setup, search is optional)
- **No Tracking** - Zero telemetry or data collection

## 📋 Prerequisites

Before running the app, you need:

### 1. Install Ollama

Ollama manages and runs LLM models locally.

```bash
# Using Homebrew
brew install ollama

# Or download from: https://ollama.com
```

### 2. Start Ollama Service

```bash
# Start Ollama (runs in background)
ollama serve
```

### 3. Download Llama 3.2 Model

```bash
# Download the Llama 3.2 model (8B parameters, ~4.7GB)
ollama pull llama3.2

# Or use the smaller 3B version:
# ollama pull llama3.2:3b
```

### 4. Verify Ollama is Running

```bash
# Check if Ollama is running (should return JSON with model list)
curl http://localhost:11434/api/tags
```

## 🛠️ Installation

### Install LocalMind

Download the latest release for your platform from the [Releases](https://github.com/michaeltkuo/localmind/releases) page:
- **macOS**: `.dmg` file (built automatically via GitHub Actions)
- **Windows**: `.exe` installer (built automatically via GitHub Actions)

> **Automated Releases**: New versions are automatically built and released when code is merged to the main branch using semantic versioning.

#### macOS Installation
1. Open the downloaded `.dmg` file
2. Drag LocalMind to your Applications folder
3. Launch LocalMind from Applications
4. **First launch**: Right-click the app and select "Open" (required for unsigned apps)
   - You'll see a security warning because the app isn't code-signed
   - This is normal and safe - click "Open" to proceed
   - This is only needed the first time you run the app

#### Windows Installation
1. Run the downloaded `.exe` installer
2. Follow the installation wizard
3. Launch LocalMind from the Start Menu or Desktop shortcut

> **Note**: These builds are not code-signed. macOS users will see a security warning on first launch. This is because code signing requires an Apple Developer certificate ($99/year). The app is safe to use - just right-click and select "Open" to bypass Gatekeeper.

## 🎮 Usage

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘N` | New conversation |
| `⌘K` | Open settings |
| `⌘D` | Toggle dark mode |

### Tips

- **Switch Models**: Use the dropdown in the top-right to change AI models
- **Clear Chat**: Click the trash icon to start fresh in current conversation
- **Delete Conversations**: Hover over a conversation in the sidebar and click the trash icon
- **Export Chats**: Use the export buttons (JSON/MD) to save your conversations
- **Stop Generation**: Click the stop button if a response is taking too long
- **Enable Web Search**: Open Settings (⌘K) and toggle "Enable Web Search" for internet access

## 🛠️ Development

Want to contribute or build from source?

### Setup

```bash
# Clone the repository
git clone https://github.com/michaeltkuo/localmind.git
cd localmind

# Install dependencies
npm install

# Start development server
npm run dev
```

### Project Structure

```
local-chatbot/
├── electron/
│   ├── main.ts              # Electron main process (app window)
│   └── preload.ts           # Secure IPC bridge
├── src/
│   ├── components/
│   │   └── Chat/
│   │       ├── ChatContainer.tsx   # Main chat layout
│   │       ├── ChatMessage.tsx     # Individual message display
│   │       └── ChatInput.tsx       # Message input box
│   ├── services/
│   │   ├── ollama.service.ts      # Ollama API integration
│   │   ├── storage.service.ts     # Local conversation storage
│   │   └── search.service.ts      # Web search integration
│   ├── stores/
│   │   └── chatStore.ts           # Zustand state management
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── App.tsx                     # Main React component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Global styles
├── package.json                    # Dependencies and scripts
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── tailwind.config.js              # Tailwind CSS configuration
└── index.html                      # HTML entry point
```

### Tech Stack

- **Electron 39** - Desktop app framework
- **React 18** - UI framework
- **TypeScript 5** - Type safety
- **Vite 7** - Build tool
- **Tailwind CSS 3** - Styling
- **Zustand** - State management
- **Ollama** - LLM runtime
- **Jest 30** - Testing framework
- **semantic-release** - Automated versioning and releases

### Build for Production

```bash
# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for both platforms
npm run build:all

# Build directory only (for testing)
npm run build:dir

# Output will be in release/ directory
```

### CI/CD

This project uses GitHub Actions for automated testing, security scanning, and releases:

- **CI Workflow** - Runs tests and type-checking on every push/PR
- **Security Workflow** - Scans for vulnerabilities weekly and on security updates
- **Release Workflow** - Automatically builds and releases new versions on merge to main
  - Uses semantic-release for automated versioning based on commit messages
  - Builds macOS DMG files on macos-latest runners
  - Creates GitHub releases with attached binaries
  - Follow [Conventional Commits](https://www.conventionalcommits.org/) for automatic version bumps:
    - `feat:` → minor version bump (1.1.0 → 1.2.0)
    - `fix:` → patch version bump (1.1.0 → 1.1.1)
    - `BREAKING CHANGE:` → major version bump (1.1.0 → 2.0.0)

**Requirements for Release Workflow:**
- Node.js 22+ (required by semantic-release v25)
- macOS runner for building DMG files

## 🤝 Available Models

LocalMind works with any Ollama-compatible model. Here are some recommendations:

| Model | Size | Best For |
|-------|------|----------|
| `llama3.2:1b` | 1.3 GB | Quick responses, low RAM |
| `llama3.2:latest` | 2.0 GB | General chat |
| `deepseek-coder:6.7b` | 3.8 GB | Programming tasks |
| `mistral:7b` | 4.4 GB | Balanced performance |
| `llama3.1:8b` | 4.9 GB | Best reasoning |

Install any model with: `ollama pull <model-name>`

## ❓ Troubleshooting

### Ollama Connection Error

**Problem**: "Ollama is not running. Please start Ollama and refresh."

**Solution**:
1. Open Terminal
2. Run `ollama serve`
3. Keep that terminal open
4. Restart LocalMind

### No Models Available

**Problem**: Model dropdown is empty

**Solution**:
```bash
# List installed models
ollama list

# If empty, download at least one model
ollama pull llama3.2:latest
```

### Model Loading Slow

**Problem**: Long wait when switching models

**Explanation**: Models need to load into RAM on first use. Larger models take longer. This is normal and only happens once per model until you restart Ollama.

### Port Already in Use (Development)

**Problem**: `Port 5173 is in use`

**Solution**: Vite automatically tries the next available port (5174, 5175, etc.)

### Web Search Not Working

**Problem**: Search results not appearing or errors in console

**Solution**:
1. Check that "Enable Web Search" is toggled ON in Settings (⌘K)
2. Verify internet connection
3. DuckDuckGo may occasionally rate-limit requests - try again in a few seconds

## 🐛 Known Issues

- First response after switching models may take 10-30 seconds (model warm-up)
- Very large models (>10GB) may cause performance issues on machines with <16GB RAM
- Web search may occasionally timeout for complex queries

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

## 🙏 Acknowledgments

- **Ollama** - For making local LLM inference easy
- **Meta** - For Llama 3.2
- **Electron** - For enabling desktop apps with web tech
- **React Team** - For the excellent UI framework
- **DuckDuckGo** - For privacy-respecting search API

## 📞 Support

Having issues? Check:
1. Ollama is running: `curl http://localhost:11434/api/tags`
2. Model is downloaded: `ollama list`
3. Node.js version: `node --version` (should be 22+ for development)

For more help, open an issue on [GitHub Issues](https://github.com/michaeltkuo/localmind/issues).

---

**Built with ❤️ using Electron + React + TypeScript + Ollama**

*Last Updated: November 30, 2025*
