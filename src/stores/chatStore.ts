// Chat store using Zustand for state management
import { create } from 'zustand';
import type { Conversation, Message, ChatSettings, OllamaModel } from '../types';
import { OllamaService } from '../services/ollama.service';
import { StorageService } from '../services/storage.service';
// SearchService kept for potential future use - currently using tool-based search
// import { SearchService } from '../services/search.service';
import { toolRegistry } from '../services/tools/registry';
import { webSearchTool } from '../services/tools/web-search.tool';
import { supportsTools, getToolSupportMessage, estimateTokenCount, getContextLimit } from '../constants/models';
import { getSystemPrompt } from '../constants/prompts';
import { QueryClassifier } from '../services/query-classifier.service';
import { debugService } from '../services/debug.service'; // Phase 3B: Debug logging

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
  isSearching: boolean;
  lastSearchQuery: string | null;

  // Actions
  initializeApp: () => Promise<void>;
  getModelStatus: () => 'offline' | 'loading' | 'ready';
  createNewConversation: () => void;
  sendMessage: (content: string, forceSearch?: boolean) => Promise<void>; // Phase 2B: forceSearch param
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
  webSearchEnabled: false,
  autoDetectSearchQueries: true,
  searchMode: 'off',
  braveApiKey: '',
  debugMode: false,
  maxSearchResults: 8,
  searchTimeout: 10000,
};

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  currentConversation: null,
  conversations: [],
  availableModels: [],
  selectedModel: 'llama3.2:latest',
  settings: DEFAULT_SETTINGS,
  theme: (typeof window !== 'undefined' && localStorage.getItem('theme') as 'light' | 'dark') || 'light',
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
  isSearching: false,
  lastSearchQuery: null,

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
      // Initialize tool registry
      console.log('[ChatStore] Initializing tool registry');
      toolRegistry.register(webSearchTool);
      console.log('[ChatStore] Registered tools:', toolRegistry.getToolNames());
      
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

      // Migrate existing users: if searchMode is missing, set it based on webSearchEnabled
      const currentSettings = get().settings;
      if (!currentSettings.searchMode) {
        console.log('[ChatStore] Migrating settings: adding searchMode');
        set({
          settings: {
            ...currentSettings,
            searchMode: currentSettings.webSearchEnabled ? 'smart' : 'off',
          }
        });
      }

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
  sendMessage: async (content: string, forceSearch = false) => { // Phase 2B: forceSearch param
    const { currentConversation, selectedModel, settings, modelLoaded } = get();
    
    // Phase 3B: Start debug logging
    const logId = settings.debugMode ? debugService.startLog(
      content,
      settings.searchMode || 'off',
      forceSearch,
      selectedModel
    ) : '';
    const startTime = Date.now();
    
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

    // Check if model supports tools
    const modelSupportsTools = supportsTools(selectedModel);
    
    // Phase 2B: Force search overrides all other logic
    if (forceSearch && modelSupportsTools) {
      console.log('[ChatStore] Force search requested');
      set({ lastSearchQuery: content }); // Track the search query
    }
    
    // Determine if tools should be enabled based on searchMode setting
    // OFF: Never search (fastest, most private)
    // SMART: Use intelligent query classification
    // AUTO: Let model decide when to search
    let useToolCalling = false;
    let queryType;
    const searchMode = settings.searchMode || 'off';

    if (forceSearch && modelSupportsTools) {
      // Phase 2B: Force search always enables tools
      useToolCalling = true;
    } else if (searchMode === 'off') {
      // Search disabled - never use tools
      useToolCalling = false;
    } else if (searchMode === 'auto') {
      // AUTO mode - let model decide (original behavior)
      useToolCalling = modelSupportsTools;
    } else if (searchMode === 'smart' && modelSupportsTools) {
      // SMART mode - classify query and decide intelligently
      queryType = QueryClassifier.classify(content);
      
      if (QueryClassifier.shouldForceSearch(queryType)) {
        // Force search ON for explicit/real-time/very-recent queries
        useToolCalling = true;
      } else if (QueryClassifier.shouldDisableSearch(queryType)) {
        // Force search OFF for conceptual/creative/conversational
        useToolCalling = false;
      } else {
        // Borderline cases (current events, general current) - let model decide
        useToolCalling = true;
      }
    }

    console.log('[ChatStore] Send message', {
      model: selectedModel,
      supportsTools: modelSupportsTools,
      searchMode: searchMode,
      queryType: queryType ? QueryClassifier.getTypeDescription(queryType) : 'N/A',
      useToolCalling,
    });

    // If trying to use tools but model doesn't support them, warn user
    if (useToolCalling && !modelSupportsTools) {
      console.warn('[ChatStore]', getToolSupportMessage(selectedModel));
      set({ 
        error: getToolSupportMessage(selectedModel),
      });
      useToolCalling = false; // Disable tool calling
    }

    // Create user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // Create assistant placeholder
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking',
    };

    // Update conversation with user message and assistant placeholder
    const updatedMessages = [...conversation.messages, userMessage, assistantMessage];
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
      title: conversation.messages.length === 0 ? content.slice(0, 50) : conversation.title,
    };

    set({ 
      currentConversation: updatedConversation,
      isStreaming: true,
      error: null,
    });

    // Save conversation
    StorageService.saveConversation(updatedConversation);

    // Context window monitoring (warn if approaching limit with web search enabled)
    if (useToolCalling && searchMode !== 'off') {
      // Estimate current conversation tokens
      const conversationText = updatedMessages
        .map(m => m.content)
        .join('\n');
      const estimatedTokens = estimateTokenCount(conversationText);
      const contextLimit = getContextLimit(selectedModel);
      const percentUsed = estimatedTokens / contextLimit;
      
      console.log('[ChatStore] Context usage:', {
        estimatedTokens,
        contextLimit,
        percentUsed: `${(percentUsed * 100).toFixed(1)}%`,
      });
      
      // Warn if approaching 80% of context limit
      if (percentUsed >= 0.8) {
        console.warn('[ChatStore] ⚠️ Approaching context limit!', {
          used: estimatedTokens,
          limit: contextLimit,
          percent: `${(percentUsed * 100).toFixed(1)}%`,
        });
        
        // Optional: Show warning to user if very close to limit
        if (percentUsed >= 0.9) {
          console.error('[ChatStore] 🚨 Context limit almost exceeded! Consider starting a new conversation.');
        }
      }
    }

    try {
      if (useToolCalling) {
        // NEW: Use tool-calling architecture with streaming
        console.log('[ChatStore] Using tool-calling mode with streaming');
        
        // Prepare messages with appropriate system prompt
        const systemPrompt = getSystemPrompt(true); // true = tools enabled
        const apiMessages: Message[] = [
          { id: 'system', role: 'system', content: systemPrompt, timestamp: Date.now() },
          ...conversation.messages,
          userMessage,
        ];

        const abortController = new AbortController();
        set({ abortController });

        // Execute tool loop with streaming for final response
        await OllamaService.executeToolLoopStreaming(
          selectedModel,
          apiMessages,
          5, // max iterations
          (toolName, args) => {
            // Inject maxSearchResults into web_search args if not specified
            if (toolName === 'web_search' && !args.max_results && settings.maxSearchResults) {
              args.max_results = settings.maxSearchResults;
            }
            console.log(`[ChatStore] Tool called: ${toolName}`, args);
            
            // Phase 3B: Log search start
            if (settings.debugMode && logId && toolName === 'web_search') {
              debugService.logSearchStart(logId, args.query);
            }
            
            // Update status to show we're searching
            const current = get().currentConversation;
            if (current) {
              const messages = [...current.messages];
              const last = messages[messages.length - 1];
              if (last && last.role === 'assistant') {
                last.status = 'searching';
                // Phase 2B: Track what's being searched
                if (toolName === 'web_search' && args.query) {
                  last.lastSearchQuery = args.query;
                }
                set({ currentConversation: { ...current, messages } });
              }
            }
          },
          (toolResult) => {
            console.log('[ChatStore] Tool result:', toolResult);
            
            // Phase 3B: Log search results or error
            if (settings.debugMode && logId) {
              if (toolResult.success && toolResult.data?.results) {
                debugService.logSearchComplete(
                  logId,
                  toolResult.data.results,
                  toolResult.data.duration || 0
                );
              } else if (!toolResult.success) {
                debugService.logSearchError(
                  logId,
                  toolResult.error || 'Unknown error',
                  'search_failed'
                );
              }
            }
            
            // Attach search results to assistant message if available
            if (toolResult.success && toolResult.data?.results) {
              const current = get().currentConversation;
              if (current) {
                const messages = [...current.messages];
                const last = messages[messages.length - 1];
                if (last && last.role === 'assistant') {
                  last.searchResults = toolResult.data.results;
                  // Keep status as 'searching' - it will transition to streaming soon
                  // Don't change status here to avoid flashing
                  set({ currentConversation: { ...current, messages } });
                }
              }
            } else if (!toolResult.success) {
              // Notify user of search failure
              set({ error: `Search failed: ${toolResult.error || 'Unknown error'}` });
            }
          },
          (chunk) => {
            // Stream chunks to UI
            const current = get().currentConversation;
            if (!current) return;

            const messages = [...current.messages];
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content += chunk;
              // Only clear status once we start receiving content
              if (lastMessage.content.length > 0) {
                lastMessage.status = undefined;
              }
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
            console.log('[ChatStore] Tool loop streaming complete');
            
            const current = get().currentConversation;
            if (current) {
              const messages = [...current.messages];
              const last = messages[messages.length - 1];
              if (last && last.role === 'assistant') {
                last.status = undefined;
                
                // Phase 3B: Log model response
                if (settings.debugMode && logId) {
                  const responseDuration = Date.now() - startTime;
                  const tokenCount = estimateTokenCount(last.content);
                  debugService.logModelResponse(logId, last.content, responseDuration, tokenCount);
                }
                
                const updatedConv = { ...current, messages, updatedAt: Date.now() };
                set({ 
                  currentConversation: updatedConv,
                  isStreaming: false,
                  abortController: null,
                });
                
                StorageService.saveConversation(updatedConv);
                
                // Update conversations list
                const conversations = get().conversations;
                const index = conversations.findIndex(c => c.id === updatedConv.id);
                if (index >= 0) {
                  conversations[index] = updatedConv;
                  set({ conversations: [...conversations] });
                }
              }
            }
          },
          abortController.signal
        );
      } else {
        // FALLBACK: Use legacy streaming mode (no tools)
        console.log('[ChatStore] Using legacy streaming mode (no tools)');
        
        const abortController = new AbortController();
        set({ abortController });

        // Use standard system prompt
        const systemPrompt = settings.systemPrompt || getSystemPrompt(false);
        const apiMessages: Message[] = [
          { id: 'system', role: 'system', content: systemPrompt, timestamp: Date.now() },
          ...conversation.messages,
          userMessage,
        ];

        let streamStarted = false;
        const thinkingTimer = window.setTimeout(() => {
          const current = get().currentConversation;
          if (!current) return;
          const messages = [...current.messages];
          const last = messages[messages.length - 1];
          if (last && last.role === 'assistant' && !last.content) {
            last.status = 'thinking';
            set({ currentConversation: { ...current, messages } });
          }
        }, 250);

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
              if (!streamStarted) {
                streamStarted = true;
                window.clearTimeout(thinkingTimer);
                lastMessage.status = undefined;
              }
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
              const messages = [...final.messages];
              const last = messages[messages.length - 1];
              if (last && last.role === 'assistant') {
                last.status = undefined;
              }
              const updatedConv = { ...final, messages };
              StorageService.saveConversation(updatedConv);
              
              const conversations = get().conversations;
              const index = conversations.findIndex(c => c.id === updatedConv.id);
              if (index >= 0) {
                conversations[index] = updatedConv;
                set({ conversations: [...conversations] });
              }
            }
          },
          (error: string) => {
            set({ 
              error: `Error: ${error}`,
              isStreaming: false,
              abortController: null,
            });
          }
        );
      }
    } catch (error) {
      console.error('[ChatStore] Error in sendMessage:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        isStreaming: false,
      });
    }
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
    const { settings } = get();
    
    // Check if model supports tools
    const modelSupportsTools = supportsTools(model);
    console.log('[ChatStore] Model change:', {
      model,
      supportsTools: modelSupportsTools,
      webSearchEnabled: settings.webSearchEnabled,
    });

    // If web search is enabled but model doesn't support tools, show warning
    if (settings.webSearchEnabled && !modelSupportsTools) {
      console.warn('[ChatStore]', getToolSupportMessage(model));
      // Don't auto-disable web search, just warn user
      // They can disable it manually if needed
    }

    set({ 
      selectedModel: model,
      modelLoaded: false, // Mark as not loaded when switching
      showLoadingOverlay: true,
      loadingOverlayMessage: 'Switching model...',
      error: null, // Clear any previous errors
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
