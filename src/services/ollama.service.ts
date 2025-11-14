// Ollama service for interacting with the local Ollama server
import type { Message, OllamaModel } from '../types';

const OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaService {
  /**
   * Check if Ollama is running and available
   */
  static async isAvailable(): Promise<boolean> {
    if (window.electronAPI) {
      const result = await window.electronAPI.checkOllamaStatus();
      return result.available;
    }
    
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List all available models
   */
  static async listModels(): Promise<OllamaModel[]> {
    if (window.electronAPI) {
      const result = await window.electronAPI.listModels();
      return result.models;
    }

    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Error listing models:', error);
      return [];
    }
  }

  /**
   * Send a chat message and get streaming response
   */
  static async chat(
    model: string,
    messages: Message[],
    signal: AbortSignal,
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          stream: true,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete();
          break;
        }

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              onChunk(json.message.content);
            }
            if (json.done) {
              onComplete();
              return;
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }
    } catch (error) {
      // Check if request was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Chat request aborted');
        onComplete(); // Treat abort as completion
        return;
      }
      console.error('Error in chat:', error);
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Warm up the model by sending a tiny test prompt
   * This loads the model into RAM so future requests are instant
   */
  static async warmUpModel(
    model: string,
    onProgress?: (message: string) => void
  ): Promise<boolean> {
    try {
      onProgress?.('Warming up model...');
      
      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          prompt: 'Hi',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      onProgress?.('Model ready!');
      return true;
    } catch (error) {
      console.error('Error warming up model:', error);
      onProgress?.('Failed to warm up model');
      return false;
    }
  }

  /**
   * Pull (download) a model
   */
  static async pullModel(
    modelName: string,
    onProgress: (progress: number) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No response body');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.total && json.completed) {
              const progress = (json.completed / json.total) * 100;
              onProgress(progress);
            }
          } catch (e) {
            console.error('Error parsing progress:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error pulling model:', error);
      throw error;
    }
  }
}
