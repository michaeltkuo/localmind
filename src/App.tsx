import { useEffect, useState } from 'react';
import { ChatContainer } from './components/Chat/ChatContainer';
import { ConversationList } from './components/Sidebar/ConversationList';
import { SettingsPanel } from './components/Settings/SettingsPanel';
import { LoadingOverlay } from './components/LoadingOverlay';
import { ErrorNotification } from './components/ErrorNotification';
import { useChatStore } from './stores/chatStore';

function App() {
  const { 
    initializeApp, 
    createNewConversation,
    loadConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    toggleArchiveConversation,
    refreshModels,
    currentConversation,
    conversations,
    selectedModel,
    setSelectedModel,
    availableModels,
    settings,
    updateSettings,
    theme,
    toggleTheme,
    isLoadingModel,
    modelLoadingMessage,
    isLoading,
    getModelStatus,
    showLoadingOverlay,
    loadingOverlayMessage,
    error,
    clearError,
  } = useChatStore();

  const [showSettings, setShowSettings] = useState(false);
  const [searchFocusToken, setSearchFocusToken] = useState(0);
  const modelStatus = getModelStatus();

  useEffect(() => {
    initializeApp();
    
    // Apply initial theme
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        createNewConversation();
      }
      
      // Cmd/Ctrl + K: Settings
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSettings(true);
      }
      
      // Cmd/Ctrl + D: Toggle dark mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        toggleTheme();
      }

      // Cmd/Ctrl + F: Focus sidebar search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setSearchFocusToken((value) => value + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [initializeApp, theme, createNewConversation, toggleTheme]);

  if (isLoading) {
    return (
      <div className={`h-screen flex items-center justify-center ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="h-screen flex flex-col bg-white dark:bg-gray-900">
        {/* Main content with sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside className="w-80 flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex-1 overflow-y-auto">
            <div className="sticky top-0 z-10 px-3 py-2 bg-gray-50 dark:bg-gray-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-base font-semibold text-gray-900 dark:text-white">LocalMind</h1>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title={`${theme === 'light' ? 'Dark' : 'Light'} mode (⌘D)`}
                  >
                    {theme === 'light' ? (
                      <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings(true)}
                    className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Settings (⌘K)"
                  >
                    <svg className="w-4 h-4 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>

              {availableModels.length > 0 ? (
                <select
                  value={selectedModel}
                  onChange={(e) => useChatStore.getState().setSelectedModel(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  title="Select AI model"
                >
                  {availableModels.map(model => (
                    <option key={model.name} value={model.name}>
                      {model.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">No models available</div>
              )}

              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                <span className={`w-2 h-2 rounded-full ${
                  modelStatus === 'ready' ? 'bg-green-500' :
                  modelStatus === 'loading' ? 'bg-yellow-500 animate-pulse' :
                  'bg-red-500'
                }`}></span>
                <span>
                  {modelStatus === 'ready' ? 'Ready' :
                    modelStatus === 'loading' ? (isLoadingModel ? modelLoadingMessage : 'Loading...') :
                    'Offline'}
                </span>
              </div>
            </div>


            <ConversationList
                conversations={conversations}
                currentConversationId={currentConversation?.id || null}
                onSelectConversation={loadConversation}
                onDeleteConversation={deleteConversation}
                onRenameConversation={renameConversation}
                onTogglePinConversation={togglePinConversation}
                onToggleArchiveConversation={toggleArchiveConversation}
                onNewConversation={createNewConversation}
                searchFocusToken={searchFocusToken}
              />
            </div>
          </aside>

          {/* Chat area */}
          <main className="flex-1 overflow-hidden">
            <ChatContainer />
          </main>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            availableModels={availableModels}
            selectedModel={selectedModel}
            onUpdateSettings={updateSettings}
            onSelectModel={setSelectedModel}
            onRefreshModels={refreshModels}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* Loading Overlay */}
        {showLoadingOverlay && (
          <LoadingOverlay message={loadingOverlayMessage} />
        )}

        {/* Error Notification */}
        {error && (
          <ErrorNotification
            message={error}
            onClose={clearError}
          />
        )}
      </div>
    </div>
  );
}

export default App;
