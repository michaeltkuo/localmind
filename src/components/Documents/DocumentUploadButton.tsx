import React, { useEffect, useRef, useState } from 'react';

interface DocumentUploadButtonProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

const ACCEPTED_FILE_TYPES = '.txt,.md,.csv,.json,.pdf,.docx';

export const DocumentUploadButton: React.FC<DocumentUploadButtonProps> = ({
  onUpload,
  disabled = false,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMenuOpen]);

  const handleToggleMenu = () => {
    if (!disabled) {
      setIsMenuOpen((prev) => !prev);
    }
  };

  const handleUploadClick = () => {
    if (!disabled) {
      inputRef.current?.click();
      setIsMenuOpen(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    event.target.value = '';
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggleMenu}
        disabled={disabled}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        title="Add attachment"
        aria-label="Add attachment"
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {isMenuOpen && !disabled && (
        <div className="absolute left-0 bottom-full mb-2 w-52 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-20 p-1.5">
          <button
            type="button"
            onClick={handleUploadClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Upload document"
          >
            <span aria-hidden="true">📄</span>
            <span>Upload document</span>
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
};
