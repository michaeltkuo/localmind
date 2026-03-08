// Chat store using Zustand for state management
import { create } from 'zustand';
import type { Conversation, Message, ChatSettings, OllamaModel, UploadedDocument, DocumentChunk } from '../types';
import { OllamaService } from '../services/ollama.service';
import { StorageService } from '../services/storage.service';
import { DocumentStorageService, DOCUMENT_TTL_MS } from '../services/document-storage.service';
import { DocumentService } from '../services/document.service';
import { RagService } from '../services/rag.service';
import { VectorService } from '../services/vector.service';
// SearchService kept for potential future use - currently using tool-based search
// import { SearchService } from '../services/search.service';
import { toolRegistry } from '../services/tools/registry';
import { webSearchTool } from '../services/tools/web-search.tool';
import { supportsTools, getToolSupportMessage, estimateTokenCount, getContextLimit } from '../constants/models';
import { getSystemPrompt } from '../constants/prompts';
import { QueryClassifier } from '../services/query-classifier.service';
import { debugService } from '../services/debug.service'; // Phase 3B: Debug logging

const INTERNAL_EMBEDDING_MODEL = 'bge-m3';
// Raise this so medium-sized PDFs (≤~20 pages / 8K tokens) bypass embedding entirely
// and are stuffed directly into the LLM context. Zero embedding cost for those files.
const INLINE_CONTEXT_MAX_TOKENS = 8000;

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
  uploadedDocuments: UploadedDocument[];
  documentChunks: DocumentChunk[];
  isIndexingDocument: boolean;
  indexingProgress: { current: number; total: number } | null;
  indexingFileName: string | null;
  indexingConversationId: string | null;
  pendingAttachmentIdsByConversation: Record<string, string[]>;

  // Actions
  initializeApp: () => Promise<void>;
  getModelStatus: () => 'offline' | 'loading' | 'ready';
  createNewConversation: () => void;
  sendMessage: (
    content: string,
    forceSearch?: boolean,
    metadata?: { parentMessageId?: string; editedFrom?: string }
  ) => Promise<void>; // Phase 2B: forceSearch param
  regenerateAt: (assistantMessageIndex: number) => Promise<void>;
  editAndResubmit: (userMessageIndex: number, newContent: string) => Promise<void>;
  stopStreaming: () => void;
  loadConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  toggleArchiveConversation: (id: string) => Promise<void>;
  setSelectedModel: (model: string) => void;
  updateSettings: (settings: Partial<ChatSettings>) => void;
  toggleTheme: () => void;
  exportConversation: (id: string, format: 'json' | 'markdown') => void;
  uploadDocument: (file: File) => Promise<void>;
  removeDocument: (documentId: string) => Promise<void>;
  clearError: () => void;
}

const DEFAULT_SETTINGS: ChatSettings = {
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
  systemPrompt: '', // Empty string defers to getSystemPrompt() — the canonical prompts in src/constants/prompts.ts
  webSearchEnabled: false,
  autoDetectSearchQueries: true,
  searchMode: 'off',
  braveApiKey: '',
  debugMode: false,
  maxSearchResults: 8,
  searchTimeout: 10000,
  ragEnabled: true,
  embeddingModel: INTERNAL_EMBEDDING_MODEL,
  ragTopK: 5,
  ragChunkSize: 3000,  // bge-m3 has an 8192-token window; 3000 chars (~750 tokens) gives rich semantic units with headroom to spare
  ragChunkOverlap: 200,
  ragMaxContextTokens: 8000,
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
  uploadedDocuments: [],
  documentChunks: [],
  isIndexingDocument: false,
  indexingProgress: null,
  indexingFileName: null,
  indexingConversationId: null,
  pendingAttachmentIdsByConversation: {},

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
      pinned: false,
      archived: false,
    };

    set({ 
      currentConversation: newConversation,
      conversations: [newConversation, ...get().conversations],
      uploadedDocuments: [],
      documentChunks: [],
      indexingProgress: null,
      indexingConversationId: null,
    });

    StorageService.saveConversation(newConversation);
  },

  // Send a message
  sendMessage: async (
    content: string,
    forceSearch = false,
    metadata?: { parentMessageId?: string; editedFrom?: string }
  ) => { // Phase 2B: forceSearch param
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
    const activeConversationId = conversation.id;

    const expiredDocumentIds = await DocumentStorageService.pruneExpired(conversation.id);
    if (expiredDocumentIds.length) {
      const expiredSet = new Set(expiredDocumentIds);
      set((state) => ({
        uploadedDocuments: state.uploadedDocuments.filter((doc) => !expiredSet.has(doc.id)),
        documentChunks: state.documentChunks.filter((chunk) => !expiredSet.has(chunk.documentId)),
      }));
    }

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
      editedFrom: metadata?.editedFrom,
      attachments: get()
        .uploadedDocuments
        .filter((doc) =>
          (get().pendingAttachmentIdsByConversation[activeConversationId] || []).includes(doc.id)
        )
        .map((doc) => ({
          documentId: doc.id,
          name: doc.originalName || doc.name,
          mimeType: doc.mimeType,
          sizeBytes: doc.sizeBytes,
        })),
    };

    // Create assistant placeholder
    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      status: 'thinking',
      parentMessageId: metadata?.parentMessageId,
      toolEvents: [{ type: 'thinking', label: 'Thinking', startedAt: Date.now() }],
    };

    // Update conversation with user message and assistant placeholder
    const updatedMessages = [...conversation.messages, userMessage, assistantMessage];
    const updatedConversation: Conversation = {
      ...conversation,
      messages: updatedMessages,
      updatedAt: Date.now(),
      title: conversation.messages.length === 0 ? content.slice(0, 50) : conversation.title,
    };

    // Whether this is the first user message — used after streaming to trigger
    // background LLM title generation.
    const isFirstMessage = conversation.messages.length === 0;

    // Upsert the conversation into conversations[] immediately so that
    // updateStreamingConversation() can always find it by ID during streaming,
    // even if the user navigates to a different chat before the stream completes.
    const existingConversations = get().conversations;
    const existingIndex = existingConversations.findIndex(c => c.id === updatedConversation.id);
    const updatedConversationList = existingIndex >= 0
      ? existingConversations.map((c, i) => i === existingIndex ? updatedConversation : c)
      : [updatedConversation, ...existingConversations];

    // If the pill is showing a ready file for this conversation, clear it now
    // that it's been stamped into the message bubble.
    const isThisConvPill = get().indexingConversationId === activeConversationId;

    set({ 
      currentConversation: updatedConversation,
      conversations: updatedConversationList,
      isStreaming: true,
      error: null,
      pendingAttachmentIdsByConversation: {
        ...get().pendingAttachmentIdsByConversation,
        [activeConversationId]: [],
      },
      ...(isThisConvPill ? { indexingFileName: null, indexingConversationId: null } : {}),
    });

    const updateConversationById = (
      conversationId: string,
      updater: (conv: Conversation) => Conversation
    ) => {
      const state = get();
      const conversations = [...state.conversations];
      const index = conversations.findIndex((c) => c.id === conversationId);
      if (index < 0) {
        return;
      }

      const updated = updater(conversations[index]);
      conversations[index] = updated;

      const nextState: any = { conversations };
      if (state.currentConversation?.id === conversationId) {
        nextState.currentConversation = updated;
      }
      set(nextState);
    };

    const appendToolEvent = (conversationId: string, messageId: string, event: NonNullable<Message['toolEvents']>[number]) => {
      updateConversationById(conversationId, (conv) => {
        const messages = conv.messages.map((message) => {
          if (message.id !== messageId) {
            return message;
          }

          return {
            ...message,
            toolEvents: [...(message.toolEvents || []), event],
          };
        });

        return {
          ...conv,
          messages,
          updatedAt: Date.now(),
        };
      });
    };

    const closeLastToolEvent = (conversationId: string, messageId: string) => {
      updateConversationById(conversationId, (conv) => {
        const messages = conv.messages.map((message) => {
          if (message.id !== messageId || !message.toolEvents?.length) {
            return message;
          }

          const nextEvents = [...message.toolEvents];
          const lastEvent = nextEvents[nextEvents.length - 1];
          if (!lastEvent.endedAt) {
            nextEvents[nextEvents.length - 1] = {
              ...lastEvent,
              endedAt: Date.now(),
            };
          }

          return {
            ...message,
            toolEvents: nextEvents,
          };
        });

        return {
          ...conv,
          messages,
          updatedAt: Date.now(),
        };
      });
    };

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

    // Fires after the first response completes: asks the model for a short title
    // and updates the conversation in state + storage. Runs entirely in the
    // background — never awaited, never blocks the chat stream.
    const generateTitleInBackground = (assistantContent: string) => {
      if (!isFirstMessage) return;
      const convId = updatedConversation.id;
      OllamaService.generateTitle(selectedModel, content, assistantContent)
        .then(title => {
          const state = get();
          const convs = [...state.conversations];
          const idx = convs.findIndex(c => c.id === convId);
          if (idx < 0) return;
          const updated = { ...convs[idx], title };
          convs[idx] = updated;
          const nextState: any = { conversations: convs };
          if (state.currentConversation?.id === convId) {
            nextState.currentConversation = updated;
          }
          set(nextState);
          StorageService.saveConversation(updated);
        })
        .catch(() => { /* title generation is best-effort */ });
    };

    let ragSystemPrefix = '';
    if (settings.ragEnabled && get().uploadedDocuments.length > 0 && get().documentChunks.length > 0) {
      try {
        ragSystemPrefix = await RagService.buildSystemPrefixForQuery(content, {
          enabled: settings.ragEnabled,
          embeddingModel: INTERNAL_EMBEDDING_MODEL,
          topK: settings.ragTopK || 5,
          maxContextTokens: settings.ragMaxContextTokens || 4000,
          documents: get().uploadedDocuments,
          chunks: get().documentChunks,
        });
      } catch (ragError) {
        console.warn('[ChatStore] RAG context retrieval failed, continuing without document context', ragError);
      }
    }

    try {
      if (useToolCalling) {
        // NEW: Use tool-calling architecture
        console.log('[ChatStore] Using tool-calling mode');
        
        // Prepare messages with appropriate system prompt
        const systemPrompt = `${ragSystemPrefix}${getSystemPrompt(true)}`; // true = tools enabled
        const apiMessages: Message[] = [
          { id: 'system', role: 'system', content: systemPrompt, timestamp: Date.now() },
          ...conversation.messages,
          userMessage,
        ];

        // Execute tool loop (non-streaming for now to handle tool calls properly)
        const result = await OllamaService.executeToolLoop(
          selectedModel,
          apiMessages,
          5, // max iterations
          (toolName, args) => {
            const toolStartedAt = Date.now();
            closeLastToolEvent(activeConversationId, assistantMessage.id);
            appendToolEvent(activeConversationId, assistantMessage.id, {
              type: 'tool_call',
              label: `Calling ${toolName}`,
              startedAt: toolStartedAt,
              endedAt: toolStartedAt,
            });

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
            updateConversationById(activeConversationId, (conv) => {
              const messages = [...conv.messages];
              const last = messages[messages.length - 1];
              if (last && last.role === 'assistant') {
                last.status = 'searching';
                if (toolName === 'web_search' && args.query) {
                  last.lastSearchQuery = args.query;
                }
              }
              return { ...conv, messages };
            });

            if (toolName === 'web_search' && args.query) {
              appendToolEvent(activeConversationId, assistantMessage.id, {
                type: 'search',
                label: 'Searching web',
                detail: String(args.query),
                startedAt: Date.now(),
              });
            }
          },
          (toolResult) => {
            console.log('[ChatStore] Tool result:', toolResult);
            closeLastToolEvent(activeConversationId, assistantMessage.id);

            appendToolEvent(activeConversationId, assistantMessage.id, {
              type: 'tool_result',
              label: toolResult.success ? 'Received tool result' : 'Tool error',
              detail: toolResult.success
                ? (toolResult.data?.results ? `${toolResult.data.results.length} results` : undefined)
                : toolResult.error,
              startedAt: Date.now(),
              endedAt: Date.now(),
            });
            
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
              updateConversationById(activeConversationId, (conv) => {
                const messages = [...conv.messages];
                const last = messages[messages.length - 1];
                if (last && last.role === 'assistant') {
                  last.searchResults = toolResult.data.results;
                }
                return { ...conv, messages };
              });
            } else if (!toolResult.success) {
              // Notify user of search failure
              set({ error: `Search failed: ${toolResult.error || 'Unknown error'}` });
            }
          }
        );

        // Update assistant message with final content
        let updatedConv: Conversation | null = null;
        updateConversationById(activeConversationId, (conv) => {
          const messages = [...conv.messages];
          const last = messages[messages.length - 1];
          if (last && last.role === 'assistant') {
            if (last.toolEvents?.length) {
              const nextEvents = [...last.toolEvents];
              const lastEvent = nextEvents[nextEvents.length - 1];
              if (lastEvent && !lastEvent.endedAt) {
                nextEvents[nextEvents.length - 1] = { ...lastEvent, endedAt: Date.now() };
              }
              last.toolEvents = nextEvents;
            }
            last.content = result.content;
            last.status = undefined;
          }
          updatedConv = { ...conv, messages, updatedAt: Date.now() };
          return updatedConv;
        });

        set({ isStreaming: false, abortController: null });

        if (updatedConv) {
          if (settings.debugMode && logId) {
            const responseDuration = Date.now() - startTime;
            const tokenCount = estimateTokenCount(result.content);
            debugService.logModelResponse(logId, result.content, responseDuration, tokenCount);
          }

          StorageService.saveConversation(updatedConv);
          generateTitleInBackground(result.content);
        }
      } else {
        // FALLBACK: Use legacy streaming mode (no tools)
        console.log('[ChatStore] Using legacy streaming mode (no tools)');
        
        const abortController = new AbortController();
        set({ abortController });

        // Use standard system prompt
        const basePrompt = settings.systemPrompt || getSystemPrompt(false);
        const systemPrompt = `${ragSystemPrefix}${basePrompt}`;
        const apiMessages: Message[] = [
          { id: 'system', role: 'system', content: systemPrompt, timestamp: Date.now() },
          ...conversation.messages,
          userMessage,
        ];

        // Capture the streaming conversation's ID so every callback targets it
        // by identity, not by get().currentConversation. This means navigating
        // to another chat mid-stream does not corrupt or drop tokens — the stream
        // continues writing to conversations[] in the background.
        const streamingConversationId = conversation.id;

        // Helper: find a conversation in the store by ID and apply an updater.
        // Also syncs currentConversation if the user is still viewing it.
        const updateStreamingConversation = (updater: (conv: Conversation) => Conversation) => {
          const state = get();
          const conversations = [...state.conversations];
          const index = conversations.findIndex(c => c.id === streamingConversationId);
          if (index < 0) return; // should never happen after the upsert above
          const updated = updater(conversations[index]);
          conversations[index] = updated;
          const nextState: any = { conversations };
          // Only update currentConversation if the user is still on this chat
          if (state.currentConversation?.id === streamingConversationId) {
            nextState.currentConversation = updated;
          }
          set(nextState);
        };

        let streamStarted = false;
        // rAF batching: buffer incoming tokens and flush to state at ~60fps
        // instead of calling set() on every single token (which would cause
        // a full React re-render for each one).
        let pendingContent = '';
        let rafId: number | null = null;

        const flushPending = () => {
          rafId = null;
          if (!pendingContent) return;
          const toFlush = pendingContent;
          pendingContent = '';
          updateStreamingConversation(conv => {
            const messages = [...conv.messages];
            const lastMessage = messages[messages.length - 1];
            if (lastMessage?.role === 'assistant') {
              lastMessage.content += toFlush;
            }
            return { ...conv, messages, updatedAt: Date.now() };
          });
        };

        const thinkingTimer = window.setTimeout(() => {
          updateStreamingConversation(conv => {
            const messages = [...conv.messages];
            const last = messages[messages.length - 1];
            if (last && last.role === 'assistant' && !last.content) {
              last.status = 'thinking';
            }
            return { ...conv, messages };
          });
        }, 250);

        await OllamaService.chat(
          selectedModel,
          apiMessages,
          abortController.signal,
          (chunk) => {
            if (!streamStarted) {
              streamStarted = true;
              window.clearTimeout(thinkingTimer);
              // Clear thinking status immediately on first chunk (don't wait for rAF)
              updateStreamingConversation(conv => {
                const messages = [...conv.messages];
                const last = messages[messages.length - 1];
                if (last?.role === 'assistant') {
                  if (last.toolEvents?.length) {
                    const nextEvents = [...last.toolEvents];
                    const lastEvent = nextEvents[nextEvents.length - 1];
                    if (lastEvent && !lastEvent.endedAt) {
                      nextEvents[nextEvents.length - 1] = {
                        ...lastEvent,
                        endedAt: Date.now(),
                      };
                    }
                    last.toolEvents = nextEvents;
                  }
                  last.status = undefined;
                }
                return { ...conv, messages };
              });
            }
            // Buffer the chunk — the rAF will flush it to state
            pendingContent += chunk;
            if (rafId === null) {
              rafId = requestAnimationFrame(flushPending);
            }
          },
          () => {
            // Flush any tokens that arrived since the last rAF tick
            if (rafId !== null) {
              cancelAnimationFrame(rafId);
              rafId = null;
            }
            flushPending();
            set({ isStreaming: false, abortController: null });
            // Find the final state of the streamed conversation (may differ from
            // currentConversation if the user navigated away)
            const state = get();
            const finalConv = state.conversations.find(c => c.id === streamingConversationId);
            if (finalConv) {
              const messages = [...finalConv.messages];
              const last = messages[messages.length - 1];
              if (last && last.role === 'assistant') {
                if (last.toolEvents?.length) {
                  const nextEvents = [...last.toolEvents];
                  const lastEvent = nextEvents[nextEvents.length - 1];
                  if (lastEvent && !lastEvent.endedAt) {
                    nextEvents[nextEvents.length - 1] = {
                      ...lastEvent,
                      endedAt: Date.now(),
                    };
                  }
                  last.toolEvents = nextEvents;
                }
                last.status = undefined;
              }
              const updatedConv = { ...finalConv, messages };
              StorageService.saveConversation(updatedConv);

              // Background title generation for first message
              generateTitleInBackground(updatedConv.messages.find(m => m.role === 'assistant')?.content ?? '');

              const conversations = [...state.conversations];
              const index = conversations.findIndex(c => c.id === streamingConversationId);
              if (index >= 0) {
                conversations[index] = updatedConv;
                const nextState: any = { conversations };
                if (state.currentConversation?.id === streamingConversationId) {
                  nextState.currentConversation = updatedConv;
                }
                set(nextState);
              }
            }
          },
          (error: string) => {
            closeLastToolEvent(streamingConversationId, assistantMessage.id);
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

  regenerateAt: async (assistantMessageIndex: number) => {
    const state = get();
    const { currentConversation, isStreaming } = state;
    if (!currentConversation || isStreaming) {
      return;
    }

    const messages = currentConversation.messages;
    if (
      assistantMessageIndex < 0 ||
      assistantMessageIndex >= messages.length ||
      messages[assistantMessageIndex].role !== 'assistant'
    ) {
      return;
    }

    let userMessageIndex = -1;
    for (let index = assistantMessageIndex - 1; index >= 0; index -= 1) {
      if (messages[index].role === 'user') {
        userMessageIndex = index;
        break;
      }
    }

    if (userMessageIndex < 0) {
      return;
    }

    const userMessage = messages[userMessageIndex];
    const staleAssistant = messages[assistantMessageIndex];
    const trimmedConversation: Conversation = {
      ...currentConversation,
      messages: messages.slice(0, userMessageIndex + 1),
      updatedAt: Date.now(),
    };

    const conversations = state.conversations.map((conversation) =>
      conversation.id === trimmedConversation.id ? trimmedConversation : conversation
    );

    set({
      currentConversation: trimmedConversation,
      conversations,
    });
    StorageService.saveConversation(trimmedConversation);

    await get().sendMessage(userMessage.content, false, {
      parentMessageId: staleAssistant.id,
    });
  },

  editAndResubmit: async (userMessageIndex: number, newContent: string) => {
    const state = get();
    const { currentConversation, isStreaming } = state;
    const normalizedContent = newContent.trim();

    if (!currentConversation || isStreaming || !normalizedContent) {
      return;
    }

    const messages = currentConversation.messages;
    if (
      userMessageIndex < 0 ||
      userMessageIndex >= messages.length ||
      messages[userMessageIndex].role !== 'user'
    ) {
      return;
    }

    const originalUserMessage = messages[userMessageIndex];
    const trimmedConversation: Conversation = {
      ...currentConversation,
      messages: messages.slice(0, userMessageIndex),
      updatedAt: Date.now(),
    };

    const conversations = state.conversations.map((conversation) =>
      conversation.id === trimmedConversation.id ? trimmedConversation : conversation
    );

    set({
      currentConversation: trimmedConversation,
      conversations,
    });
    StorageService.saveConversation(trimmedConversation);

    await get().sendMessage(normalizedContent, false, {
      editedFrom: originalUserMessage.content,
    });
  },

  // Load a conversation
  // Checks in-memory state first so that switching back to a conversation that
  // is currently streaming shows live content rather than the stale disk version.
  loadConversation: async (id: string) => {
    const inMemory = get().conversations.find(c => c.id === id);
    if (inMemory) {
      const [uploadedDocuments, documentChunks] = await Promise.all([
        DocumentStorageService.loadDocuments(id),
        DocumentStorageService.loadChunks(id),
      ]);
      set({
        currentConversation: inMemory,
        uploadedDocuments,
        documentChunks,
      });
      return;
    }
    const conversation = StorageService.loadConversation(id);
    if (conversation) {
      const [uploadedDocuments, documentChunks] = await Promise.all([
        DocumentStorageService.loadDocuments(id),
        DocumentStorageService.loadChunks(id),
      ]);
      set({
        currentConversation: conversation,
        uploadedDocuments,
        documentChunks,
      });
    }
  },

  // Delete a conversation
  deleteConversation: async (id: string) => {
    StorageService.deleteConversation(id);
    await DocumentStorageService.clearConversation(id);
    const conversations = get().conversations.filter(c => c.id !== id);
    const pending = { ...get().pendingAttachmentIdsByConversation };
    delete pending[id];
    set({ conversations, pendingAttachmentIdsByConversation: pending });
    
    // If deleted conversation was current, clear it
    if (get().currentConversation?.id === id) {
      set({ currentConversation: null, uploadedDocuments: [], documentChunks: [] });
    }
  },

  // Rename a conversation
  renameConversation: async (id: string, title: string) => {
    const normalizedTitle = title.trim() || 'New Conversation';
    const conversations = get().conversations.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            title: normalizedTitle,
            updatedAt: Date.now(),
          }
        : conversation
    );

    const nextCurrentConversation =
      get().currentConversation?.id === id
        ? {
            ...get().currentConversation!,
            title: normalizedTitle,
            updatedAt: Date.now(),
          }
        : get().currentConversation;

    set({
      conversations,
      currentConversation: nextCurrentConversation,
    });

    const updatedConversation = conversations.find((conversation) => conversation.id === id);
    if (updatedConversation) {
      StorageService.saveConversation(updatedConversation);
    }
  },

  togglePinConversation: async (id: string) => {
    const now = Date.now();
    const conversations = get().conversations.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            pinned: !conversation.pinned,
            updatedAt: now,
          }
        : conversation
    );

    const nextCurrentConversation =
      get().currentConversation?.id === id
        ? {
            ...get().currentConversation!,
            pinned: !get().currentConversation!.pinned,
            updatedAt: now,
          }
        : get().currentConversation;

    set({
      conversations,
      currentConversation: nextCurrentConversation,
    });

    const updatedConversation = conversations.find((conversation) => conversation.id === id);
    if (updatedConversation) {
      StorageService.saveConversation(updatedConversation);
    }
  },

  toggleArchiveConversation: async (id: string) => {
    const now = Date.now();
    const conversations = get().conversations.map((conversation) =>
      conversation.id === id
        ? {
            ...conversation,
            archived: !conversation.archived,
            pinned: conversation.archived ? conversation.pinned : false,
            updatedAt: now,
          }
        : conversation
    );

    const nextCurrentConversation =
      get().currentConversation?.id === id
        ? {
            ...get().currentConversation!,
            archived: !get().currentConversation!.archived,
            pinned: get().currentConversation!.archived ? get().currentConversation!.pinned : false,
            updatedAt: now,
          }
        : get().currentConversation;

    set({
      conversations,
      currentConversation: nextCurrentConversation,
    });

    const updatedConversation = conversations.find((conversation) => conversation.id === id);
    if (updatedConversation) {
      StorageService.saveConversation(updatedConversation);
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

  uploadDocument: async (file: File) => {
    const { settings } = get();

    if (!file) {
      return;
    }

    if (!get().currentConversation) {
      get().createNewConversation();
    }

    const conversation = get().currentConversation;
    if (!conversation) {
      set({ error: 'Unable to create conversation for document upload.' });
      return;
    }

    if (!DocumentService.isSupportedFile(file)) {
      set({
        error: `Unsupported file type. Supported: ${DocumentService.getSupportedExtensions().join(', ')}`,
      });
      return;
    }

    set({
      isIndexingDocument: true,
      indexingProgress: { current: 0, total: 1 },
      indexingFileName: file.name,
      indexingConversationId: conversation.id,
      error: null,
    });

    const uploadConversationId = conversation.id;

    try {
      const text = await DocumentService.extractTextFromFile(file);
      const estimatedTokens = VectorService.estimateTokenCount(text);
      const ragBudget = settings.ragMaxContextTokens || 4000;
      const shouldUseInlineContext = estimatedTokens <= Math.min(ragBudget, INLINE_CONTEXT_MAX_TOKENS);

      if (!shouldUseInlineContext) {
        await OllamaService.ensureModelAvailable(INTERNAL_EMBEDDING_MODEL, (progress) => {
          if (progress < 100) {
            set({ indexingProgress: { current: 0, total: 1 } });
          }
        });
      }

      const { document, chunks } = await DocumentService.indexTextDocument({
        conversationId: conversation.id,
        documentName: file.name,
        mimeType: file.type || 'text/plain',
        sizeBytes: file.size,
        text,
        embeddingModel: INTERNAL_EMBEDDING_MODEL,
        chunkSize: settings.ragChunkSize,
        overlap: settings.ragChunkOverlap,
        skipEmbeddings: shouldUseInlineContext,
        // Batch size 8 with bge-m3: each 3000-char chunk is ~750 tokens; 8 chunks
        // per request is ~6000 tokens of payload — well within Ollama's limits.
        // embedWithRetry will halve batches automatically on any 500/EOF.
        embeddingBatchSize: 8,
        onProgress: (current, total) => {
          if (get().indexingConversationId === uploadConversationId) {
            set({ indexingProgress: { current, total } });
          }
        },
      });

      await DocumentStorageService.saveDocument(document);
      await DocumentStorageService.appendChunks(chunks);

      set((state) => {
        const nextPending = state.pendingAttachmentIdsByConversation[uploadConversationId] || [];
        const shouldSyncCurrentConversation = state.currentConversation?.id === uploadConversationId;

        return {
          pendingAttachmentIdsByConversation: {
            ...state.pendingAttachmentIdsByConversation,
            [uploadConversationId]: [...nextPending, document.id],
          },
          ...(shouldSyncCurrentConversation
            ? {
                uploadedDocuments: [...state.uploadedDocuments, document],
                documentChunks: [...state.documentChunks, ...chunks],
              }
            : {}),
        };
      });

      if (typeof window !== 'undefined') {
        const expiresIn = Math.max(0, document.uploadedAt + DOCUMENT_TTL_MS - Date.now());
        window.setTimeout(async () => {
          try {
            const expiredIds = await DocumentStorageService.pruneExpired(conversation.id);
            if (!expiredIds.length) {
              return;
            }

            if (get().currentConversation?.id !== uploadConversationId) {
              return;
            }

            const expiredSet = new Set(expiredIds);
            set((state) => ({
              uploadedDocuments: state.uploadedDocuments.filter((doc) => !expiredSet.has(doc.id)),
              documentChunks: state.documentChunks.filter((chunk) => !expiredSet.has(chunk.documentId)),
            }));
          } catch (ttlError) {
            console.warn('[ChatStore] TTL cleanup failed', ttlError);
          }
        }, expiresIn + 250);
      }
    } catch (error) {
      console.error('[ChatStore] uploadDocument failed', error);
      // On error, clear everything including the filename so the pill goes away.
      set({
        error: error instanceof Error ? error.message : 'Failed to upload document',
        isIndexingDocument: false,
        indexingProgress: null,
        indexingFileName: null,
        indexingConversationId: null,
      });
      return;
    }
    // Success path: clear the loading indicators but KEEP indexingFileName and
    // indexingConversationId so the input pill can display the "ready" file card
    // until the user sends their next message.
    set({
      isIndexingDocument: false,
      indexingProgress: null,
    });
  },

  removeDocument: async (documentId: string) => {
    const { currentConversation } = get();
    if (!currentConversation) {
      return;
    }

    await DocumentStorageService.removeDocument(currentConversation.id, documentId);
    set((state) => ({
      uploadedDocuments: state.uploadedDocuments.filter((doc) => doc.id !== documentId),
      documentChunks: state.documentChunks.filter((chunk) => chunk.documentId !== documentId),
      pendingAttachmentIdsByConversation: {
        ...state.pendingAttachmentIdsByConversation,
        [currentConversation.id]: (state.pendingAttachmentIdsByConversation[currentConversation.id] || []).filter(
          (id) => id !== documentId
        ),
      },
    }));
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
