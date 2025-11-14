// Chat store using Zustand for state management
import { create } from 'zustand';
import type { Conversation, Message, ChatSettings, OllamaModel } from '../types';
import { OllamaService } from '../services/ollama.service';
import { StorageService } from '../services/storage.service';

interface ChatStore {
  // State
  currentConversation: Conversation | null;
  conversations: Conversation[];
  availableModels: OllamaModel[];
  selectedModel: string;
  settings: ChatSettings;
  theme: 'light' | 'dark';
  ollamaAvailable: boolean;
  modelLoaded: boolean;
  isLoadingModel: boolean;
  modelLoadingMessage: string;
  showLoadingOverlay: boolean;
  loadingOverlayMessage: string;
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  abortController: AbortController | null;

  // Actions
  initializeApp: () => Promise<void>;
  getModelStatus: () => 'offline' | 'loading' | 'ready';
  createNewConversation: () => void;
  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  setSelectedModel: (model: string) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  toggleTheme: () => void;
  exportConversation: (id: string, format: 'json' | 'markdown') => void;
  clearError: () => void;
}

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  systemPrompt: 'You are a helpful AI assistant.',
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  availableModels: [],
  selectedModel: 'llama3.2:latest',
  settings: DEFAULT_SETTINGS,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  ollamaAvailable: false,
  modelLoaded: false,
  isLoadingModel: false,
  modelLoadingMessage: '',
  showLoadingOverlay: false,
  loadingOverlayMessage: '',
  isLoading: false,
  isStreaming: false,
  abortController: null,
  error: null,

  // Get current model status
  getModelStatus: () => {
    const state = get();
    if (!state.ollamaAvailable) return 'offline';
    if (state.isLoadingModel) return 'loading';
    if (state.modelLoaded) return 'ready';
    return 'loading';
  },

  // Initialize the app
  initializeApp: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if Ollama is available
      const available = await OllamaService.isAvailable();
      set({ ollamaAvailable: available });

      if (!available) {
        set({ 
          error: 'Ollama is not running. Please start Ollama and refresh.',
          isLoading: false,
        });
        return;
      }

      // Load available models
      const models = await OllamaService.listModels();
      set({ availableModels: models });

      // Set default model if available
      if (models.length > 0 && !get().selectedModel) {
        set({ selectedModel: models[0].name });
      }

      // Load saved conversations
      const savedConversations = StorageService.loadAllConversations();
      set({ conversations: savedConversations });

      set({ isLoading: false });

      // Warm up the model in the background (load it into RAM)
      if (available && get().selectedModel) {
        set({ isLoadingModel: true, modelLoadingMessage: 'Loading model into memory...' });
        
        const warmedUp = await OllamaService.warmUpModel(
          get().selectedModel,
          (message) => {
            set({ modelLoadingMessage: message });
          }
        );

        set({ 
          modelLoaded: warmedUp,
          isLoadingModel: false,
          modelLoadingMessage: warmedUp ? 'Model ready!' : 'Model failed to load',
        });
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      set({ 
        error: 'Failed to initialize app',
        isLoading: false,
        isLoadingModel: false,
      });
    }
  },

  // Create a new conversation
  createNewConversation: () => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: get().selectedModel,
    };

    set({ 
      currentConversation: newConversation,
      conversations: [newConversation, ...get().conversations],
    });

    StorageService.saveConversation(newConversation);
  },

  // Send a message
  sendMessage: async (content: string) => {
    const { currentConversation, selectedModel, settings, modelLoaded } = get();
    
    // If model isn't loaded yet, warm it up first
    if (!modelLoaded) {
      set({ 
        showLoadingOverlay: true,
        loadingOverlayMessage: 'Loading model...',
      });

      try {
        const warmedUp = await OllamaService.warmUpModel(
          selectedModel,
          (message) => {
            set({ loadingOverlayMessage: message });
          }
        );

        set({ 
          modelLoaded: warmedUp,
          showLoadingOverlay: false,
        });

        if (!warmedUp) {
          set({ error: 'Failed to load model' });
          return;
        }
      } catch (error) {
        set({ 
          showLoadingOverlay: false,
          error: 'Failed to load model',
        });
        return;
      }
    }
    
    if (!currentConversation) {
      get().createNewConversation();
    }

    const conversation = get().currentConversation;
    if (!conversation) return;

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Create assistant message placeholder
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };

    // Update conversation with user message
    const updatedMessages = [...conversation.messages, userMessage, assistantMessage];
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
      title: conversation.messages.length === 0 ? content.slice(0, 50) : conversation.title,
    };

    // Create abort controller for this request
    const abortController = new AbortController();
    
    set({ 
      currentConversation: updatedConversation,
      isStreaming: true,
      abortController,
      error: null,
    });

    // Prepare messages for API (excluding the empty assistant message)
    const apiMessages = [
      { id: 'system', role: 'system' as const, content: settings.systemPrompt, timestamp: Date.now() },
      ...conversation.messages,
      userMessage,
    ];

    // Stream the response
    await OllamaService.chat(
      selectedModel,
      apiMessages,
      abortController.signal,
      (chunk) => {
        // Update assistant message with streamed content
        const current = get().currentConversation;
        if (!current) return;

        const messages = [...current.messages];
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant') {
          lastMessage.content += chunk;
          set({
            currentConversation: {
              ...current,
              messages,
              updatedAt: Date.now(),
            },
          });
        }
      },
      () => {
        // On complete
        set({ isStreaming: false, abortController: null });
        const final = get().currentConversation;
        if (final) {
          StorageService.saveConversation(final);
          
          // Update conversations list
          const conversations = get().conversations;
          const index = conversations.findIndex(c => c.id === final.id);
          if (index >= 0) {
            conversations[index] = final;
            set({ conversations: [...conversations] });
          }
        }
      },
      (error: string) => {
        // On error
        set({ 
          error: `Error: ${error}`,
          isStreaming: false,
          abortController: null,
        });
      }
    );
  },

  // Load a conversation
  loadConversation: (id: string) => {
    const conversation = StorageService.loadConversation(id);
    if (conversation) {
      set({ currentConversation: conversation });
    }
  },

  // Delete a conversation
  deleteConversation: (id: string) => {
    StorageService.deleteConversation(id);
    const conversations = get().conversations.filter(c => c.id !== id);
    set({ conversations });
    
    // If deleted conversation was current, clear it
    if (get().currentConversation?.id === id) {
      set({ currentConversation: null });
    }
  },

  // Set selected model
  setSelectedModel: async (model: string) => {
    set({ 
      selectedModel: model,
      modelLoaded: false, // Mark as not loaded when switching
      showLoadingOverlay: true,
      loadingOverlayMessage: 'Switching model...',
    });

    // Warm up the new model
    try {
      set({ loadingOverlayMessage: 'Loading model into memory...' });
      
      const warmedUp = await OllamaService.warmUpModel(
        model,
        (message) => {
          set({ loadingOverlayMessage: message });
        }
      );

      set({ 
        modelLoaded: warmedUp,
        showLoadingOverlay: false,
        loadingOverlayMessage: '',
      });
    } catch (error) {
      console.error('Error warming up model:', error);
      set({ 
        showLoadingOverlay: false,
        loadingOverlayMessage: '',
        error: 'Failed to load model',
      });
    }
  },

  // Update settings
  updateSettings: (newSettings: Partial<ChatSettings>) => {
    set({ 
      settings: { ...get().settings, ...newSettings },
    });
  },

  // Toggle theme
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    set({ theme: newTheme });
    
    // Update document class for Tailwind dark mode
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  // Stop streaming
  stopStreaming: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({ isStreaming: false, abortController: null });
  },

  // Export conversation
  exportConversation: (id: string, format: 'json' | 'markdown') => {
    const conversation = StorageService.loadConversation(id);
    if (!conversation) return;

    let content = '';
    let filename = '';

    if (format === 'json') {
      content = JSON.stringify(conversation, null, 2);
      filename = `conversation-${id}-${Date.now()}.json`;
    } else {
      // Markdown format
      content = `# ${conversation.title}\n\n`;
      content += `**Created:** ${new Date(conversation.createdAt).toLocaleString()}\n`;
      content += `**Model:** ${conversation.model}\n\n`;
      content += `---\n\n`;
      
      conversation.messages.forEach(msg => {
        if (msg.role === 'user') {
          content += `## 👤 User\n\n${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          content += `## 🤖 Assistant\n\n${msg.content}\n\n`;
        }
      });
      
      filename = `conversation-${id}-${Date.now()}.md`;
    }

    // Create download
    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
