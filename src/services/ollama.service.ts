// Ollama service for interacting with the local Ollama server
import type { Message, OllamaModel, ToolCall } from '../types';
import type { ToolDefinition } from './tools/base.tool';
import { toolRegistry } from './tools/registry';

const OLLAMA_BASE_URL = 'http://localhost:11434';

// Response types from Ollama API
interface OllamaMessage {
  role: string;
  content: string;
  tool_calls?: ToolCall[];
}

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

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
    onError: (error: string) => void,
    tools?: ToolDefinition[]
  ): Promise<void> {
    try {
      const requestBody: any = {
        model,
        messages: messages.map(m => {
          const msg: any = {
            role: m.role,
            content: m.content,
          };
          
          // Include tool_calls if present (for assistant messages)
          if (m.tool_calls) {
            msg.tool_calls = m.tool_calls;
          }
          
          return msg;
        }),
        stream: true,
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
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
   * Chat with tool calling support (non-streaming)
   * Used for tool-calling loop to detect when model wants to use tools
   */
  static async chatWithTools(
    model: string,
    messages: Message[],
    tools?: ToolDefinition[],
    signal?: AbortSignal
  ): Promise<OllamaChatResponse> {
    try {
      const requestBody: any = {
        model,
        messages: messages.map(m => {
          const msg: any = {
            role: m.role,
            content: m.content,
          };
          
          // Include tool_calls if present (for assistant messages)
          if (m.tool_calls) {
            msg.tool_calls = m.tool_calls;
          }
          
          // Include tool metadata for tool result messages
          if (m.role === 'tool') {
            if (m.tool_call_id) msg.tool_call_id = m.tool_call_id;
            if (m.tool_name) msg.name = m.tool_name;
          }
          
          return msg;
        }),
        stream: false, // Non-streaming for tool detection
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data: OllamaChatResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in chatWithTools:', error);
      throw error;
    }
  }

  /**
   * Execute a complete tool-calling loop
   * Handles iterative tool calls until model produces final response
   */
  static async executeToolLoop(
    model: string,
    messages: Message[],
    maxIterations: number = 5,
    onToolCall?: (toolName: string, args: any) => void,
    onToolResult?: (result: any) => void,
    signal?: AbortSignal
  ): Promise<{ content: string; iterations: number; toolCalls: number }> {
    const tools = toolRegistry.getToolDefinitions();
    let iterations = 0;
    let toolCallCount = 0;
    const conversationMessages = [...messages];

    console.log('[OllamaService] Starting tool execution loop', { 
      model, 
      toolsAvailable: tools.length,
      maxIterations 
    });

    while (iterations < maxIterations) {
      iterations++;
      console.log(`[OllamaService] Tool loop iteration ${iterations}/${maxIterations}`);

      // Call model with tools
      const response = await this.chatWithTools(model, conversationMessages, tools, signal);

      // Check if model wants to use tools
      if (response.message.tool_calls && response.message.tool_calls.length > 0) {
        console.log('[OllamaService] Model requested tool calls:', response.message.tool_calls);
        
        // Add assistant's tool call message to conversation
        // Note: Don't include content here - it may contain thinking/reasoning that shouldn't be shown
        conversationMessages.push({
          id: `tool-call-${Date.now()}`,
          role: 'assistant',
          content: '', // Keep empty to avoid showing intermediate reasoning
          tool_calls: response.message.tool_calls,
          timestamp: Date.now(),
        });

        // Execute each tool call
        for (const toolCall of response.message.tool_calls) {
          toolCallCount++;
          const toolName = toolCall.function.name;
          
          // Parse arguments if they're a string
          let args: any;
          if (typeof toolCall.function.arguments === 'string') {
            try {
              args = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              console.error('[OllamaService] Failed to parse tool arguments:', e);
              args = {};
            }
          } else {
            args = toolCall.function.arguments;
          }

          console.log(`[OllamaService] Executing tool: ${toolName}`, args);
          onToolCall?.(toolName, args);

          // Execute the tool
          const result = await toolRegistry.execute(toolName, args);
          console.log(`[OllamaService] Tool result:`, result);
          onToolResult?.(result);

          // Format result for model
          let resultContent: string;
          if (result.success && result.data) {
            // If it's a web search, use the formatted results
            if (result.data.formatted) {
              resultContent = result.data.formatted;
            } else {
              resultContent = JSON.stringify(result.data, null, 2);
            }
          } else {
            resultContent = result.error || 'Tool execution failed';
          }

          // Add tool result to conversation
          conversationMessages.push({
            id: `tool-result-${Date.now()}-${toolCallCount}`,
            role: 'tool',
            content: resultContent,
            tool_call_id: toolCall.id,
            tool_name: toolName,
            timestamp: Date.now(),
          });
        }

        // Continue loop to get model's response with tool results
        continue;
      }

      // No tool calls - we have the final response
      console.log('[OllamaService] Tool loop complete', { 
        iterations, 
        toolCallCount,
        finalContent: response.message.content 
      });
      
      return {
        content: response.message.content,
        iterations,
        toolCalls: toolCallCount,
      };
    }

    // Max iterations reached
    console.warn('[OllamaService] Max tool iterations reached');
    throw new Error('Maximum tool calling iterations reached. The model may be stuck in a loop.');
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
