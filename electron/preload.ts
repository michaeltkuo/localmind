import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Ollama API calls
  checkOllamaStatus: () => ipcRenderer.invoke('ollama:checkStatus'),
  listModels: () => ipcRenderer.invoke('ollama:listModels'),
  sendChatMessage: (model: string, messages: any[]) => 
    ipcRenderer.invoke('ollama:chat', { model, messages, stream: false }),
  // Web search API
  search: (query: string, maxResults: number) =>
    ipcRenderer.invoke('search:web', { query, maxResults }),
  // Config
  setBraveApiKey: (key: string) => ipcRenderer.invoke('config:setBraveApiKey', key),
});

// Legacy alias for backward compatibility
contextBridge.exposeInMainWorld('electronAPI', {
  checkOllamaStatus: () => ipcRenderer.invoke('ollama:checkStatus'),
  listModels: () => ipcRenderer.invoke('ollama:listModels'),
  sendChatMessage: (model: string, messages: any[]) => 
    ipcRenderer.invoke('ollama:chat', { model, messages, stream: false }),
});

// Type definitions for the exposed API
export interface ElectronAPI {
  checkOllamaStatus: () => Promise<{ available: boolean }>;
  listModels: () => Promise<{ models: any[] }>;
  sendChatMessage: (model: string, messages: any[]) => Promise<{ success: boolean; response?: any; error?: string }>;
  search: (query: string, maxResults: number) => Promise<{ success: boolean; results: any[]; error?: string }>;
  setBraveApiKey: (key: string) => Promise<{ ok: boolean }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    api: ElectronAPI;
  }
}
