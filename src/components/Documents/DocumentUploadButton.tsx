import React, { useRef } from 'react';

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

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
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
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        title="Upload document"
        aria-label="Upload document"
      >
        📎
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
};
