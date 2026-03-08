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
  layout?: 'bottom' | 'centered';
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
  layout = 'bottom',
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
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className={`${
        layout === 'centered'
          ? 'w-full max-w-3xl mx-auto'
          : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur px-3 py-3'
      }`}
    >
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">

        {/* File attachment pill — shows during indexing and while file is ready-to-send */}
        {indexingFileName && (
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800/80">
            <div className="w-8 h-8 rounded-md bg-red-500 flex-shrink-0 flex items-center justify-center text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
              </svg>
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
        <div className="flex items-end rounded-3xl bg-gray-100 dark:bg-gray-800 px-3 py-2 transition-colors">
          <DocumentUploadButton
            onUpload={onUploadDocument}
            disabled={disabled || isIndexingDocument}
            className="self-end bg-gray-200/80 dark:bg-gray-700/70 text-gray-700 dark:text-gray-200 hover:bg-gray-300/90 dark:hover:bg-gray-600/90"
          />

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSearching ? "Searching the web..." : isStreaming ? "Waiting for response..." : "Ask anything"}
            disabled={disabled || isStreaming || isSearching}
            className="flex-1 resize-none border-0 bg-transparent px-2.5 py-1.5 min-h-9 max-h-48 overflow-y-auto scrollbar-hide text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none disabled:cursor-not-allowed"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />

          {/* Button group */}
          <div className="self-end flex items-center gap-2 pb-0.5">
            {/* Force search button - only show if web search enabled */}
            {webSearchEnabled && !isStreaming && !isSearching && input.trim() && (
              <button
                type="button"
                onClick={handleForceSearch}
                className="h-8 px-3 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Search the web for this query"
              >
                Web
              </button>
            )}

            {/* Regular send button */}
            <button
              type="submit"
              disabled={!input.trim() || disabled || isStreaming || isSearching}
              className="h-10 w-10 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:text-gray-200 dark:disabled:text-gray-300 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center"
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
      </div>
    </form>
  );
};
