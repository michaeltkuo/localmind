import { renderToStaticMarkup } from 'react-dom/server';
import App from '../App';

const mockUseChatStore = jest.fn();

jest.mock('../stores/chatStore', () => ({
  useChatStore: () => mockUseChatStore(),
}));

jest.mock('../components/Chat/ChatContainer', () => ({
  ChatContainer: () => null,
}));

jest.mock('../components/Sidebar/ConversationList', () => ({
  ConversationList: () => null,
}));

jest.mock('../components/Settings/SettingsPanel', () => ({
  SettingsPanel: () => null,
}));

jest.mock('../components/LoadingOverlay', () => ({
  LoadingOverlay: () => null,
}));

jest.mock('../components/ErrorNotification', () => ({
  ErrorNotification: () => null,
}));

describe('App loading theme consistency', () => {
  const baseStoreState = {
    initializeApp: jest.fn(),
    createNewConversation: jest.fn(),
    loadConversation: jest.fn(),
    deleteConversation: jest.fn(),
    renameConversation: jest.fn(),
    togglePinConversation: jest.fn(),
    toggleArchiveConversation: jest.fn(),
    currentConversation: null,
    conversations: [],
    selectedModel: 'llama3.2:latest',
    setSelectedModel: jest.fn(),
    availableModels: [],
    settings: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9,
      systemPrompt: '',
      webSearchEnabled: false,
      autoDetectSearchQueries: true,
      searchMode: 'off' as const,
    },
    updateSettings: jest.fn(),
    toggleTheme: jest.fn(),
    isLoadingModel: false,
    modelLoadingMessage: '',
    isLoading: true,
    getModelStatus: jest.fn(() => 'ready' as const),
    showLoadingOverlay: false,
    loadingOverlayMessage: '',
    error: null,
    clearError: jest.fn(),
  };

  test('renders dark loading state classes', () => {
    mockUseChatStore.mockReturnValue({ ...baseStoreState, theme: 'dark' as const });

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('bg-gray-900');
    expect(html).toContain('dark');
    expect(html).toContain('text-gray-300');
  });

  test('renders light loading state classes', () => {
    mockUseChatStore.mockReturnValue({ ...baseStoreState, theme: 'light' as const });

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('bg-gray-50');
    expect(html).not.toContain('bg-gray-900');
    expect(html).toContain('text-gray-300');
  });

  test('uses wider sidebar layout in main app shell', () => {
    mockUseChatStore.mockReturnValue({
      ...baseStoreState,
      theme: 'dark' as const,
      isLoading: false,
    });

    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('w-80');
  });
});
