import React, { useEffect, useRef } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../../stores/chatStore';
import { supportsTools } from '../../constants/models';

export const ChatContainer: React.FC = () => {
  const { 
    currentConversation, 
    sendMessage, 
    isStreaming,
    modelLoaded,
    error,
    deleteConversation,
    exportConversation,
    stopStreaming,
    isSearching,
    settings,
    selectedModel, // Phase 2B: Need selectedModel for header display
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  // Use instant scroll during streaming for better responsiveness
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: isStreaming ? 'instant' : 'smooth' 
    });
  }, [currentConversation?.messages, isStreaming]);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
          {!modelLoaded && (
            <div className="text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <p>To fix this:</p>
              <ol className="list-decimal list-inside text-left">
                <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">ollama.ai</a></li>
                <li>Run: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">ollama pull llama3.2</code></li>
                <li>Refresh this app</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentConversation) {
    return (
      <div className="flex-1 flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center p-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Welcome to LocalMind</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">Your private AI assistant. All conversations stay on your computer.</p>
            <div className="text-6xl mb-4">🧠</div>
          </div>
        </div>
        <ChatInput 
          onSendMessage={handleSendMessage} 
          disabled={!modelLoaded}
          isStreaming={isStreaming}
          isSearching={isSearching}
          webSearchEnabled={settings.webSearchEnabled}
        />
      </div>
    );
  }

  const handleClearConversation = () => {
    if (currentConversation && window.confirm('Delete this conversation? This cannot be undone.')) {
      deleteConversation(currentConversation.id);
    }
  };

  const handleExport = (format: 'json' | 'markdown') => {
    if (currentConversation) {
      exportConversation(currentConversation.id, format);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header with actions - Phase 2B: Enhanced with mode indicator */}
      {currentConversation && currentConversation.messages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between max-w-full">
            {/* Left: Model info + capabilities */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {selectedModel}
              </div>
              
              {/* Capability badges */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {supportsTools(selectedModel) && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    <span>🛠️</span>
                    <span>Tools</span>
                  </span>
                )}
                
                {settings.webSearchEnabled && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium">
                    <span>🌐</span>
                    <span>Web Search</span>
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentConversation.messages.length} message{currentConversation.messages.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            <button
              onClick={() => handleExport('json')}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 rounded transition-colors flex items-center gap-1"
              title="Export as JSON"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              JSON
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 rounded transition-colors flex items-center gap-1"
              title="Export as Markdown"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              MD
            </button>

            {/* Stop Button (when streaming) */}
            {isStreaming && (
              <button
                onClick={stopStreaming}
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900 px-3 py-1 rounded transition-colors flex items-center gap-1"
                title="Stop generation"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
                Stop
              </button>
            )}

            {/* Clear Button */}
            <button
              onClick={handleClearConversation}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 px-3 py-1 rounded transition-colors flex items-center gap-1"
              title="Delete conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {currentConversation.messages.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            currentConversation.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={!modelLoaded}
        isStreaming={isStreaming}
        isSearching={isSearching}
        webSearchEnabled={settings.webSearchEnabled}
      />
    </div>
  );
};
