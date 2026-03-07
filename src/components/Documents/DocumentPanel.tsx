import React from 'react';
import type { UploadedDocument } from '../../types';

interface DocumentPanelProps {
  documents: UploadedDocument[];
  onRemoveDocument: (documentId: string) => void;
}

const formatBytes = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DocumentPanel: React.FC<DocumentPanelProps> = ({
  documents,
  onRemoveDocument,
}) => {
  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Documents</div>
      {documents.length === 0 ? (
        <div className="text-xs text-gray-500 dark:text-gray-400">No indexed documents</div>
      ) : (
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {documents.map((doc) => (
            <div key={doc.id} className="text-xs rounded-md border border-gray-200 dark:border-gray-700 p-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-gray-800 dark:text-gray-200 truncate" title={doc.name}>{doc.name}</div>
                  <div className="text-gray-500 dark:text-gray-400 mt-1">
                    {doc.chunkCount} chunks • {formatBytes(doc.sizeBytes)}
                  </div>
                </div>
                <button
                  onClick={() => onRemoveDocument(doc.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  title="Remove document"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
