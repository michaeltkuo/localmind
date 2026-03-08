import React from 'react';

interface MessageActionBarProps {
  isUser: boolean;
  isStreaming: boolean;
  copied: boolean;
  canRegenerate: boolean;
  canContinue: boolean;
  canEdit: boolean;
  onCopy: () => void;
  onRegenerate?: () => void;
  onContinue?: () => void;
  onStartEdit?: () => void;
}

const baseButtonClass =
  'px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';

export const MessageActionBar: React.FC<MessageActionBarProps> = ({
  isUser,
  isStreaming,
  copied,
  canRegenerate,
  canContinue,
  canEdit,
  onCopy,
  onRegenerate,
  onContinue,
  onStartEdit,
}) => {
  return (
    <div
      className={`mt-2 flex items-center gap-2 text-xs opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {isUser && canEdit && onStartEdit && (
        <button
          onClick={onStartEdit}
          className={baseButtonClass}
          aria-label="Edit message"
        >
          Edit
        </button>
      )}

      <button
        onClick={onCopy}
        className={baseButtonClass}
        aria-label="Copy message"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>

      {!isUser && canRegenerate && onRegenerate && (
        <button
          onClick={onRegenerate}
          disabled={isStreaming}
          className={`${baseButtonClass} ${isStreaming ? 'cursor-not-allowed opacity-40' : ''}`}
          aria-label="Regenerate response"
        >
          Regenerate
        </button>
      )}

      {!isUser && canContinue && onContinue && (
        <button
          onClick={onContinue}
          disabled={isStreaming}
          className={`${baseButtonClass} ${isStreaming ? 'cursor-not-allowed opacity-40' : ''}`}
          aria-label="Continue response"
        >
          Continue
        </button>
      )}
    </div>
  );
};
