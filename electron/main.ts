import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;
// Prefer environment variable; can be overridden via Settings at runtime
let ollamaApiKey: string | undefined = process.env.OLLAMA_API_KEY || process.env.BRAVE_API_KEY;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default', // Changed to default so you can move the window
    backgroundColor: '#ffffff',
    title: 'LocalMind',
  });

  // Load the app
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('ollama:checkStatus', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    return { available: response.ok };
  } catch (error) {
    return { available: false };
  }
});

ipcMain.handle('ollama:listModels', async () => {
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) throw new Error('Failed to fetch models');
    const data = await response.json();
    return { models: data.models || [] };
  } catch (error) {
    console.error('Error listing models:', error);
    return { models: [] };
  }
});

ipcMain.handle('ollama:chat', async (_event, { model, messages, stream = true }) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return { success: true, response };
  } catch (error) {
    console.error('Error in ollama:chat:', error);
    return { success: false, error: String(error) };
  }
});

// Config: set Ollama API key securely in main process (backwards compat name)
ipcMain.handle('config:setBraveApiKey', async (_event, key: string) => {
  try {
    ollamaApiKey = (key || '').trim() || undefined;
    console.log('[Config] Ollama API key set:', ollamaApiKey ? 'present' : 'empty');
    return { ok: true };
  } catch (e) {
    console.error('[Config] Failed to set Ollama API key', e);
    return { ok: false };
  }
});

ipcMain.handle('search:web', async (_event, { query, maxResults = 5 }) => {
  try {
    console.log('[Search] Using Ollama Web Search API for:', query);
    const apiKey = ollamaApiKey || process.env.OLLAMA_API_KEY;
    if (!apiKey) {
      throw new Error('Ollama API key not set. Add OLLAMA_API_KEY to your environment or set it in Settings.');
    }

    const response = await fetch('https://ollama.com/api/web_search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        max_results: Math.min(Math.max(1, Number(maxResults) || 5), 10),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Search] Ollama API error:', response.status, errorText);
      throw new Error(`Ollama Web Search returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const results: Array<{ title: string; snippet: string; url: string }> = [];

    if (Array.isArray(data.results)) {
      for (const result of data.results.slice(0, maxResults)) {
        if (result.url && result.title) {
              // Use snippet field if available, otherwise use content
              // Per Ollama docs, content field contains "relevant content snippet"
              // but may be long (docs suggest truncating to ~8000 chars per result)
              let snippet = result.snippet || result.description || result.content || '';
              
              // Truncate if too long (Ollama recommends ~8000 chars, we use 2000 for UI)
              const maxLength = 2000;
              if (snippet.length > maxLength) {
                snippet = snippet.substring(0, maxLength).trim() + '...';
              }
              
              // Final fallback to title
              if (!snippet) {
                snippet = result.title;
              }          results.push({
            url: result.url,
            title: result.title,
            snippet: snippet,
          });
        }
      }
    }

    console.log('[Search] Ollama returned', results.length, 'results');
    return { success: true, results };
  } catch (error) {
    console.error('[Search] Error:', error);
    return { success: false, results: [], error: String(error) };
  }
});
