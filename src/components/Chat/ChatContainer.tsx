import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { useChatStore } from '../../stores/chatStore';
import { DocDrawerTrigger } from '../Documents/DocDrawerTrigger';
import { DocDrawer } from '../Documents/DocDrawer';

export const ChatContainer: React.FC = () => {
  const { 
    currentConversation, 
    sendMessage, 
    regenerateAt,
    editAndResubmit,
    uploadDocument,
    removeDocument,
    uploadedDocuments,
    isIndexingDocument,
    indexingProgress,
    indexingFileName,
    indexingConversationId,
    isStreaming,
    modelLoaded,
    error,
    deleteConversation,
    exportConversation,
    forkConversation,
    stopStreaming,
    isSearching,
    settings,
    promptTemplates,
    addPromptTemplate,
    deletePromptTemplate,
  } = useChatStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  // Use instant scroll during streaming for better responsiveness
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: isStreaming ? 'instant' : 'smooth' 
    });
  }, [currentConversation?.messages, isStreaming]);

  const handleSendMessage = (content: string, forceSearch = false) => {
    sendMessage(content, forceSearch);
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
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl text-center space-y-8">
            <h2 className="text-4xl font-semibold text-gray-900 dark:text-white">Ready when you are.</h2>
            <ChatInput
              onSendMessage={handleSendMessage}
              onUploadDocument={uploadDocument}
              isIndexingDocument={isIndexingDocument}
              disabled={!modelLoaded}
              isStreaming={isStreaming}
              isSearching={isSearching}
              webSearchEnabled={settings.webSearchEnabled}
              promptTemplates={promptTemplates}
              onSavePrompt={addPromptTemplate}
              onDeletePrompt={deletePromptTemplate}
              layout="centered"
            />
          </div>
        </div>
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

  const handleRegenerate = (assistantMessageIndex: number) => {
    regenerateAt(assistantMessageIndex);
  };

  const handleContinue = () => {
    if (isStreaming) return;
    sendMessage('Continue.', false);
  };

  const handleEditAndResubmit = (userMessageIndex: number, newContent: string) => {
    editAndResubmit(userMessageIndex, newContent);
  };

  const handleFork = (assistantMessageIndex: number) => {
    if (!currentConversation) {
      return;
    }
    forkConversation(currentConversation.id, assistantMessageIndex);
  };

  if (currentConversation.messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="w-full max-w-3xl text-center space-y-8">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
            <ChatInput
              onSendMessage={handleSendMessage}
              onUploadDocument={uploadDocument}
              isIndexingDocument={isIndexingDocument}
              indexingFileName={currentConversation.id === indexingConversationId ? indexingFileName : null}
              indexingProgress={currentConversation.id === indexingConversationId ? indexingProgress : null}
              disabled={!modelLoaded}
              isStreaming={isStreaming}
              isSearching={isSearching}
              webSearchEnabled={settings.webSearchEnabled}
              promptTemplates={promptTemplates}
              onSavePrompt={addPromptTemplate}
              onDeletePrompt={deletePromptTemplate}
              layout="centered"
            />
          </div>
        </div>

        <DocDrawer
          open={isDocDrawerOpen}
          onClose={() => setIsDocDrawerOpen(false)}
          documents={uploadedDocuments}
          onRemove={removeDocument}
          onUpload={uploadDocument}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-gray-50 dark:bg-gray-900">
      {currentConversation && currentConversation.messages.length > 0 && (
        <div className="px-4 py-2">
          <div className="max-w-3xl mx-auto flex items-center justify-end gap-2">
            {/* Export Buttons */}
            <button
              onClick={() => handleExport('json')}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              title="Export as JSON"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              JSON
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-gray-800 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
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
                className="text-sm text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:bg-orange-100/60 dark:hover:bg-orange-900/40 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
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
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/40 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
              title="Delete conversation"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="max-w-3xl mx-auto">
          {currentConversation.messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isActivelyStreaming={
                isStreaming && index === currentConversation.messages.length - 1
              }
              isLatestAssistant={
                message.role === 'assistant' && index === currentConversation.messages.length - 1
              }
              onRegenerate={
                message.role === 'assistant'
                  ? () => handleRegenerate(index)
                  : undefined
              }
              onFork={
                message.role === 'assistant'
                  ? () => handleFork(index)
                  : undefined
              }
              onContinue={
                message.role === 'assistant' && index === currentConversation.messages.length - 1
                  ? handleContinue
                  : undefined
              }
              onEdit={
                message.role === 'user'
                  ? (newContent) => handleEditAndResubmit(index, newContent)
                  : undefined
              }
            />
          ))}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <DocDrawerTrigger
        documents={uploadedDocuments}
        onOpen={() => setIsDocDrawerOpen(true)}
        onRemove={removeDocument}
      />

      {/* Input area */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        onUploadDocument={uploadDocument}
        isIndexingDocument={isIndexingDocument}
        indexingFileName={currentConversation.id === indexingConversationId ? indexingFileName : null}
        indexingProgress={currentConversation.id === indexingConversationId ? indexingProgress : null}
        disabled={!modelLoaded}
        isStreaming={isStreaming}
        isSearching={isSearching}
        webSearchEnabled={settings.webSearchEnabled}
        promptTemplates={promptTemplates}
        onSavePrompt={addPromptTemplate}
        onDeletePrompt={deletePromptTemplate}
        layout="bottom"
      />

      <DocDrawer
        open={isDocDrawerOpen}
        onClose={() => setIsDocDrawerOpen(false)}
        documents={uploadedDocuments}
        onRemove={removeDocument}
        onUpload={uploadDocument}
      />
    </div>
  );
};
