# LocalMind 🧠# Local ChatBot 💬



**Your private AI assistant. All conversations stay on your computer.**A **native desktop application** for chatting with locally hosted LLM models using Ollama. Built with Electron, React, TypeScript, and Tailwind CSS.



A beautiful native desktop application for chatting with locally hosted LLM models using Ollama. Built with Electron, React, TypeScript, and Tailwind CSS.![Phase 1 MVP](https://img.shields.io/badge/Phase-1%20MVP-blue)

![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey)

![Platform](https://img.shields.io/badge/Platform-macOS-lightgrey)![License](https://img.shields.io/badge/License-MIT-green)

![License](https://img.shields.io/badge/License-MIT-green)

![Version](https://img.shields.io/badge/Version-1.0.0-blue)## 🚀 Features (Phase 1 MVP)



## ✨ Features- ✅ **Desktop Application** - Real macOS app, not a web interface

- ✅ **Local LLM Integration** - Chat with Llama 3.2 running on your computer

### 🎯 Core Features- ✅ **Streaming Responses** - See AI responses appear word-by-word

- **Multiple Conversations** - Create and manage unlimited chat sessions- ✅ **Clean UI** - Modern ChatGPT-like interface

- **Conversation Sidebar** - Easy navigation between chats with preview and timestamps- ✅ **100% Private** - All data stays on your computer

- **Streaming Responses** - Watch AI responses appear in real-time- ✅ **Offline Capable** - Works without internet (after setup)

- **Multiple Models** - Switch between different AI models instantly

- **Persistent Storage** - All conversations automatically saved locally## 📋 Prerequisites



### 🎨 User InterfaceBefore running the app, you need:

- **Dark Mode** - Easy on the eyes with beautiful dark theme

- **Markdown Support** - Formatted text, code blocks with syntax highlighting### 1. Install Ollama

- **Copy Code Blocks** - One-click copy buttons for code snippets

- **Clean Design** - Modern, ChatGPT-inspired interfaceOllama manages and runs LLM models locally.



### ⚙️ Advanced Features```bash

- **Customizable Settings** - Adjust temperature, max tokens, top-p, and system prompts# macOS (using Homebrew)

- **Export Conversations** - Save chats as JSON or Markdown filesbrew install ollama

- **Keyboard Shortcuts** - Fast navigation with keyboard commands

- **Stop Generation** - Cancel long-running responses anytime# Or download from: https://ollama.ai

- **Model Pre-loading** - Smart model warm-up for instant responses```



### 🔒 Privacy First### 2. Start Ollama Service

- **100% Local** - All data stays on your computer

- **No Internet Required** - Works completely offline (after setup)```bash

- **No Tracking** - Zero telemetry or data collection# Start Ollama (runs in background)

ollama serve

## 📸 Screenshots```



_(Screenshots would go here)_### 3. Download Llama 3.2 Model



## 🚀 Quick Start```bash

# Download the Llama 3.2 model (8B parameters, ~4.7GB)

### Prerequisitesollama pull llama3.2



1. **macOS** (10.15 or later)# Or use the smaller 3B version:

2. **Ollama** installed and running# ollama pull llama3.2:3b

```

### Install Ollama

### 4. Verify Ollama is Running

```bash

# Using Homebrew```bash

brew install ollama# Check if Ollama is running (should return JSON with model list)

curl http://localhost:11434/api/tags

# Or download from: https://ollama.com```

```

## 🛠️ Installation

### Start Ollama and Download Models

### 1. Clone or Download this Project

```bash

# Start Ollama service (in one terminal)```bash

ollama servecd local-chatbot

```

# Download AI models (in another terminal)

ollama pull llama3.2:latest    # 2GB - Original model### 2. Install Dependencies

ollama pull llama3.2:1b         # 1.3GB - Fastest

ollama pull deepseek-coder:6.7b # 3.8GB - Best for coding```bash

ollama pull mistral:7b          # 4.4GB - Great general purposenpm install

ollama pull llama3.1:8b         # 4.9GB - Most capable```

```

This will install all required packages including:

### Install LocalMind- Electron (desktop framework)

- React + TypeScript (UI)

Download the latest `.dmg` file from the [Releases](https://github.com/michaeltkuo/localmind/releases) page.- Vite (build tool)

- Tailwind CSS (styling)

1. Open the downloaded `.dmg` file- Zustand (state management)

2. Drag LocalMind to your Applications folder- React Markdown (message formatting)

3. Launch LocalMind from Applications

## 🎮 Running the App

## 🎮 Usage

### Development Mode

### Keyboard Shortcuts

```bash

| Shortcut | Action |# Start the development server

|----------|--------|npm run dev

| `⌘N` | New conversation |```

| `⌘K` | Open settings |

| `⌘D` | Toggle dark mode |This will:

1. Start Vite dev server on `http://localhost:5173`

### Tips2. Launch the Electron app

3. Enable hot-reload (changes update automatically)

- **Switch Models**: Use the dropdown in the top-right to change AI models4. Open DevTools for debugging

- **Clear Chat**: Click the trash icon to start fresh in current conversation

- **Delete Conversations**: Hover over a conversation in the sidebar and click the trash icon### Build for Production

- **Export Chats**: Use the export buttons (JSON/MD) to save your conversations

- **Stop Generation**: Click the stop button if a response is taking too long```bash

# Build the app

## 🛠️ Developmentnpm run build



Want to contribute or build from source?# This creates:

# - dist/ folder with compiled renderer code

### Setup# - dist-electron/ folder with compiled main process

# - release/ folder with .dmg installer (for distribution)

```bash```

# Clone the repository

git clone https://github.com/michaeltkuo/localmind.git## 📖 How to Use

cd localmind

1. **Launch the app** - Double-click the app icon or run `npm run dev`

# Install dependencies2. **Check status** - Look for green "Connected" indicator in the header

npm install3. **Start chatting** - Type a message in the input box and press Enter

4. **Watch responses stream** - See the AI's response appear word-by-word

# Start development server5. **New conversation** - Click "+ New Chat" button to start fresh

npm run dev

```### Keyboard Shortcuts



### Project Structure- `Enter` - Send message

- `Shift + Enter` - New line in message input

```

local-chatbot/## 🏗️ Project Structure

├── electron/           # Electron main process

│   ├── main.ts        # Main process entry```

│   └── preload.ts     # Preload scriptslocal-chatbot/

├── src/├── electron/

│   ├── components/    # React components│   ├── main.ts              # Electron main process (app window)

│   │   ├── Chat/     # Chat UI components│   └── preload.ts           # Secure IPC bridge

│   │   ├── Sidebar/  # Conversation sidebar├── src/

│   │   └── Settings/ # Settings panel│   ├── components/

│   ├── services/      # Business logic│   │   └── Chat/

│   │   ├── ollama.service.ts    # Ollama API integration│   │       ├── ChatContainer.tsx   # Main chat layout

│   │   └── storage.service.ts   # Local storage│   │       ├── ChatMessage.tsx     # Individual message display

│   ├── stores/        # Zustand state management│   │       └── ChatInput.tsx       # Message input box

│   ├── types/         # TypeScript types│   ├── services/

│   └── App.tsx        # Main app component│   │   ├── ollama.service.ts      # Ollama API integration

├── build/             # Build assets (icons, etc.)│   │   └── storage.service.ts     # Local conversation storage

└── dist/              # Production build output│   ├── stores/

```│   │   └── chatStore.ts           # Zustand state management

│   ├── types/

### Tech Stack│   │   └── index.ts               # TypeScript type definitions

│   ├── App.tsx                     # Main React component

- **Electron 28** - Desktop app framework│   ├── main.tsx                    # React entry point

- **React 18** - UI framework│   └── index.css                   # Global styles

- **TypeScript 5** - Type safety├── package.json                    # Dependencies and scripts

- **Vite 5** - Build tool├── vite.config.ts                  # Vite configuration

- **Tailwind CSS 3** - Styling├── tsconfig.json                   # TypeScript configuration

- **Zustand** - State management├── tailwind.config.js              # Tailwind CSS configuration

- **Ollama** - LLM runtime└── index.html                      # HTML entry point

```

### Build for Production

## 🔧 Troubleshooting

```bash

# Build for macOS### Ollama Not Connected

npm run build:mac

**Error**: "Ollama is not running. Please start Ollama and refresh."

# Build directory only (for testing)

npm run build:dir**Fix**:

```bash

# Output will be in release/ directory# Start Ollama

```ollama serve



## 🤝 Available Models# In another terminal, verify it's running:

curl http://localhost:11434/api/tags

LocalMind works with any Ollama-compatible model. Here are some recommendations:

# If successful, refresh the app

| Model | Size | Best For |```

|-------|------|----------|

| `llama3.2:1b` | 1.3 GB | Quick responses, low RAM |### Model Not Found

| `llama3.2:latest` | 2.0 GB | General chat |

| `deepseek-coder:6.7b` | 3.8 GB | Programming tasks |**Error**: Failed to load model or no response

| `mistral:7b` | 4.4 GB | Balanced performance |

| `llama3.1:8b` | 4.9 GB | Best reasoning |**Fix**:

```bash

Install any model with: `ollama pull <model-name>`# List installed models

ollama list

## ❓ Troubleshooting

# Pull Llama 3.2 if not installed

### Ollama Connection Errorollama pull llama3.2

```

**Problem**: "Ollama is not running. Please start Ollama and refresh."

### Port Already in Use

**Solution**:

1. Open Terminal**Error**: "Port 5173 is already in use"

2. Run `ollama serve`

3. Keep that terminal open**Fix**:

4. Restart LocalMind```bash

# Kill the process using port 5173

### No Models Availablelsof -ti:5173 | xargs kill -9



**Problem**: Model dropdown is empty# Or change the port in vite.config.ts

```

**Solution**:

```bash### TypeScript/Build Errors

# List installed models

ollama list**Fix**:

```bash

# If empty, download at least one model# Clear node modules and reinstall

ollama pull llama3.2:latestrm -rf node_modules package-lock.json

```npm install



### Model Loading Slow# Clear Vite cache

rm -rf .vite

**Problem**: Long wait when switching models```



**Explanation**: Models need to load into RAM on first use. Larger models take longer. This is normal and only happens once per model until you restart Ollama.## 🎯 Current Status: Phase 1 MVP ✅



### Port Already in Use (Development)**What's Working:**

- ✅ Electron desktop app launches

**Problem**: `Port 5173 is in use`- ✅ Connects to Ollama

- ✅ Sends messages to Llama 3.2

**Solution**: Vite automatically tries the next available port (5174, 5175, etc.)- ✅ Streams responses in real-time

- ✅ Clean, modern UI

## 🐛 Known Issues- ✅ Basic conversation support



- First response after switching models may take 10-30 seconds (model warm-up)**What's Coming in Phase 2:**

- Very large models (>10GB) may cause performance issues on machines with <16GB RAM- Multiple conversations (save/load/delete)

- Conversation sidebar

## 📝 License- Copy message button

- Better markdown rendering

MIT License - See [LICENSE](LICENSE) for details- Conversation export



## 🙏 Acknowledgments## 🤝 Contributing



- [Ollama](https://ollama.com) - For making local LLMs accessibleThis is a personal project, but feel free to:

- [Electron](https://electronjs.org) - Cross-platform desktop apps- Report bugs

- [Tailwind CSS](https://tailwindcss.com) - Beautiful styling- Suggest features

- Submit pull requests

## 📮 Contact & Support

## 📝 License

- **Issues**: [GitHub Issues](https://github.com/michaeltkuo/localmind/issues)

- **Discussions**: [GitHub Discussions](https://github.com/michaeltkuo/localmind/discussions)MIT License - feel free to use this project however you like!



---## 🙏 Acknowledgments



**Built with ❤️ for privacy-conscious AI enthusiasts**- **Ollama** - For making local LLM inference easy

- **Meta** - For Llama 3.2
- **Electron** - For enabling desktop apps with web tech
- **React Team** - For the excellent UI framework

## 📞 Support

Having issues? Check:
1. Ollama is running: `curl http://localhost:11434/api/tags`
2. Model is downloaded: `ollama list`
3. Node.js version: `node --version` (should be 18+)

---

**Built with ❤️ using Electron + React + TypeScript + Ollama**

*Last Updated: November 14, 2025*
