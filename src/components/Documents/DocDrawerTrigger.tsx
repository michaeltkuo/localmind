import React from 'react';
import type { UploadedDocument } from '../../types';

interface DocDrawerTriggerProps {
  documents: UploadedDocument[];
  onOpen: () => void;
  onRemove: (id: string) => void;
}

export const DocDrawerTrigger: React.FC<DocDrawerTriggerProps> = ({
  documents,
  onOpen,
  onRemove,
}) => {
  if (!documents.length) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
      <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto">
        {documents.map((document) => (
          <div
            key={document.id}
            className="inline-flex items-center gap-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1 text-xs min-w-0"
          >
            <button
              type="button"
              onClick={onOpen}
              className="truncate max-w-[180px] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label={`Open document drawer for ${document.name}`}
            >
              {document.name}
            </button>
            <button
              type="button"
              onClick={() => onRemove(document.id)}
              className="text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label={`Remove ${document.name}`}
            >
              ×
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Open document drawer"
        >
          Manage docs
        </button>
      </div>
    </div>
  );
};
