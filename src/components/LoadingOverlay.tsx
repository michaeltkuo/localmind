import React from 'react';

interface LoadingOverlayProps {
  message: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-8 max-w-md mx-4">
        <div className="flex flex-col items-center space-y-4">
          {/* Animated spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 dark:border-blue-400 rounded-full border-t-transparent animate-spin"></div>
          </div>
          
          {/* Loading message */}
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {message}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This may take a few moments...
            </p>
          </div>
          
          {/* Animated dots */}
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
