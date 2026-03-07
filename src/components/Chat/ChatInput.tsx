import React, { useState, useRef, useEffect } from 'react';
import { DocumentUploadButton } from '../Documents/DocumentUploadButton';

interface ChatInputProps {
  onSendMessage: (message: string, forceSearch?: boolean) => void; // Phase 2B: forceSearch param
  onUploadDocument: (file: File) => void;
  isIndexingDocument?: boolean;
  indexingFileName?: string | null;
  indexingProgress?: { current: number; total: number } | null;
  disabled?: boolean;
  isStreaming?: boolean;
  isSearching?: boolean;
  webSearchEnabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onUploadDocument,
  isIndexingDocument = false,
  indexingFileName = null,
  indexingProgress = null,
  disabled = false,
  isStreaming = false,
  isSearching = false,
  webSearchEnabled = false, // Phase 2B: Now used for force search button
}) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent, forceSearch = false) => {
    e.preventDefault();
    if (input.trim() && !disabled && !isStreaming) {
      onSendMessage(input.trim(), forceSearch);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleForceSearch = () => {
    if (input.trim() && !disabled && !isStreaming && !isSearching) {
      onSendMessage(input.trim(), true);
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">

        {/* File attachment pill — shows during indexing and while file is ready-to-send */}
        {indexingFileName && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <div className="w-8 h-8 rounded-md bg-red-500 flex-shrink-0 flex items-center justify-center text-sm">
              📄
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{indexingFileName}</div>
              {isIndexingDocument && indexingProgress ? (
                <>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Indexing… {Math.min(100, Math.round((indexingProgress.current / Math.max(1, indexingProgress.total)) * 100))}%
                  </div>
                  <div className="mt-1.5 w-full h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-200"
                      style={{ width: `${Math.min(100, Math.round((indexingProgress.current / Math.max(1, indexingProgress.total)) * 100))}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">Ready · send message to attach</div>
              )}
            </div>
          </div>
        )}

        {/* Main input row */}
        <div className="flex items-end rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-colors">
          <DocumentUploadButton
            onUpload={onUploadDocument}
            disabled={disabled || isIndexingDocument}
            className="h-8 w-8 px-0 py-0 border-0 rounded-md bg-transparent hover:bg-gray-100 dark:hover:bg-gray-600"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSearching ? "Searching the web..." : isStreaming ? "Waiting for response..." : "Ask anything"}
            disabled={disabled || isStreaming || isSearching}
            className="flex-1 resize-none border-0 bg-transparent px-2.5 py-1.5 min-h-9 max-h-32 overflow-y-auto scrollbar-hide text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />

          {/* Button group */}
          <div className="flex items-center gap-2">
            {/* Force search button - only show if web search enabled */}
            {webSearchEnabled && !isStreaming && !isSearching && input.trim() && (
              <button
                type="button"
                onClick={handleForceSearch}
                className="h-8 px-3 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                title="Search the web for this query"
              >
                Web
              </button>
            )}

            {/* Regular send button */}
            <button
              type="submit"
              disabled={!input.trim() || disabled || isStreaming || isSearching}
              className="h-8 w-8 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
              title="Send message"
            >
              {isSearching ? (
                <span className="text-xs">…</span>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Help text when force search available */}
        {webSearchEnabled && !isStreaming && !isSearching && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Web runs a forced search; send uses normal routing.
          </div>
        )}
      </div>
    </form>
  );
};
