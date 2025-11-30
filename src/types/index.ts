// Core types for the chat application

// Tool calling types
export interface ToolCall {
  id?: string;
  type: 'function';
  function: {
    name: string;
    arguments: string | Record<string, any>; // Can be JSON string or parsed object
  };
}

export interface ToolCallMessage {
  role: 'assistant';
  content: string;
  tool_calls: ToolCall[];
}

export interface ToolResultMessage {
  role: 'tool';
  content: string;
  tool_call_id?: string;
  name?: string; // Tool name for context
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  searchResults?: SearchResult[];
  tool_calls?: ToolCall[]; // For assistant messages that call tools
  tool_call_id?: string; // For tool result messages
  tool_name?: string; // For tool result messages
  // UI status for assistant placeholder: searching/ thinking while awaiting content
  status?: 'searching' | 'thinking' | 'typing';
  lastSearchQuery?: string; // Phase 2B: Track what was searched for better UX
}

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  model: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format?: string;
    family?: string;
    families?: string[];
    parameter_size?: string;
    quantization_level?: string;
  };
}

export type SearchMode = 'off' | 'smart' | 'auto';

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  webSearchEnabled: boolean;
  autoDetectSearchQueries: boolean;
  searchMode: SearchMode;
  braveApiKey?: string;
  // Phase 3B: Debug settings
  debugMode?: boolean;
  maxSearchResults?: number;
  searchTimeout?: number;
}

export interface AppState {
  currentConversation: Conversation | null;
  conversations: Conversation[];
  selectedModel: string;
  settings: ChatSettings;
  theme: 'light' | 'dark';
  ollamaAvailable: boolean;
  modelLoaded: boolean;
  isLoadingModel: boolean;
  isLoading: boolean;
  error: string | null;
}

export type ModelStatus = 'offline' | 'loading' | 'ready';

export interface ExportFormat {
  type: 'json' | 'markdown';
  content: string;
  filename: string;
}
