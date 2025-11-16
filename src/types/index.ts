// Core types for the chat application

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  searchResults?: SearchResult[];
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

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  webSearchEnabled: boolean;
  autoDetectSearchQueries: boolean;
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
