import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string, forceSearch?: boolean) => void; // Phase 2B: forceSearch param
  disabled?: boolean;
  isStreaming?: boolean;
  isSearching?: boolean;
  webSearchEnabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
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
    <form onSubmit={(e) => handleSubmit(e, false)} className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex flex-col gap-2 max-w-4xl mx-auto">
        {/* Main input row */}
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isSearching ? "Searching the web..." : isStreaming ? "Waiting for response..." : "Type your message... (Shift+Enter for new line)"}
            disabled={disabled || isStreaming || isSearching}
            className="flex-1 resize-none border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed max-h-32 overflow-y-auto scrollbar-hide bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            rows={1}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          />
          
          {/* Button group */}
          <div className="flex gap-2">
            {/* Force search button - only show if web search enabled */}
            {webSearchEnabled && !isStreaming && !isSearching && input.trim() && (
              <button
                type="button"
                onClick={handleForceSearch}
                className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors flex items-center gap-2"
                title="Search the web for this query"
              >
                <span>🔎</span>
                <span>Search</span>
              </button>
            )}
            
            {/* Regular send button */}
            <button
              type="submit"
              disabled={!input.trim() || disabled || isStreaming || isSearching}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? 'Searching...' : isStreaming ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
        
        {/* Help text when force search available */}
        {webSearchEnabled && !isStreaming && !isSearching && (
          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
            <span>💡</span>
            <span>Click <strong>Search</strong> to force web search, or <strong>Send</strong> to let AI decide</span>
          </div>
        )}
      </div>
    </form>
  );
};
