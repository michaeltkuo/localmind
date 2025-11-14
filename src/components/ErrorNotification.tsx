import React, { useEffect, useState } from 'react';

interface ErrorNotificationProps {
  message: string;
  onClose: () => void;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setIsVisible(true);

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation
    }, 8000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // Check if it's an Ollama-specific error
  const isOllamaError = message.toLowerCase().includes('ollama');
  
  return (
    <div
      className={`fixed top-4 right-4 max-w-md w-full z-50 transition-all duration-300 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-l-4 border-red-500 p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {isOllamaError ? 'Ollama Connection Error' : 'Error'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {message}
            </p>

            {isOllamaError && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-700 dark:text-gray-300">
                <p className="font-semibold mb-2">To fix this:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Make sure Ollama is installed</li>
                  <li>Run <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">ollama serve</code> in Terminal</li>
                  <li>Refresh this app</li>
                </ol>
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
