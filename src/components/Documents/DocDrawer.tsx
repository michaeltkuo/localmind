import React, { useEffect, useId, useRef } from 'react';
import type { UploadedDocument } from '../../types';
import { DocumentPanel } from './DocumentPanel';

interface DocDrawerProps {
  open: boolean;
  onClose: () => void;
  documents: UploadedDocument[];
  onRemove: (id: string) => void;
  onUpload: (file: File) => void;
}

export const DocDrawer: React.FC<DocDrawerProps> = ({
  open,
  onClose,
  documents,
  onRemove,
  onUpload,
}) => {
  const headingId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    closeButtonRef.current?.focus();
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
      event.target.value = '';
    }
  };

  return (
    <>
      <div
        className={`absolute inset-0 z-10 transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className={`absolute top-0 right-0 bottom-0 z-20 w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 transition-transform duration-200 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
            <h2 id={headingId} className="text-sm font-semibold text-gray-900 dark:text-white">Documents</h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              aria-label="Close document drawer"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <DocumentPanel documents={documents} onRemoveDocument={onRemove} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleUploadClick}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Upload document
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".txt,.md,.pdf"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </aside>
    </>
  );
};
