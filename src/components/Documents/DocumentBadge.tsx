import React from 'react';
import type { UploadedDocument } from '../../types';

interface DocumentBadgeProps {
  document: UploadedDocument;
  onRemove: (documentId: string) => void;
  disabled?: boolean;
}

export const DocumentBadge: React.FC<DocumentBadgeProps> = ({
  document,
  onRemove,
  disabled = false,
}) => {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
      <span>📄</span>
      <span className="max-w-[160px] truncate" title={document.name}>{document.name}</span>
      <button
        type="button"
        onClick={() => onRemove(document.id)}
        disabled={disabled}
        className="text-green-700 dark:text-green-300 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50"
        aria-label={`Remove ${document.name}`}
        title="Remove document"
      >
        ×
      </button>
    </div>
  );
};
