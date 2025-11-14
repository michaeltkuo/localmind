import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Ollama API calls
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
