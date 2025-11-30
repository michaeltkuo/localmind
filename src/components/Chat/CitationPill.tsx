import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { SearchResult } from '../../types';

interface CitationPillProps {
  number: number;
  source: SearchResult;
}

/**
 * ChatGPT-style citation pill component
 * Renders as small numbered badge with hover preview
 */
export const CitationPill: React.FC<CitationPillProps> = ({ number, source }) => {
  const [showPreview, setShowPreview] = useState(false);
  
  const domain = (() => {
    try {
      return new URL(source.url).hostname.replace(/^www\./, '');
    } catch {
      return source.url;
    }
  })();

  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setShowPreview(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      top: rect.top - 8,
      left: rect.left
    });
  };

  return (
    <>
      <button
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowPreview(false)}
        onClick={() => window.open(source.url, '_blank')}
        className="inline-flex items-center justify-center w-5 h-5 mx-0.5 
                   text-xs font-medium text-blue-600 hover:text-blue-800 
                   bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300
                   dark:hover:bg-blue-900/50 dark:hover:text-blue-200
                   rounded border border-blue-300 dark:border-blue-700
                   cursor-pointer transition-all hover:scale-110"
        title={`${source.title} - ${domain}`}
      >
        {number}
      </button>
      
      {/* Hover preview tooltip - rendered via portal */}
      {showPreview && tooltipPosition && createPortal(
        <div 
          className="fixed w-72 p-3 
                     bg-white dark:bg-gray-800 rounded-lg shadow-xl 
                     border border-gray-200 dark:border-gray-700 z-50
                     animate-in fade-in slide-in-from-bottom-2 duration-200"
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateY(-100%)'
          }}
        >
          <div className="text-xs font-semibold mb-1 text-gray-900 dark:text-gray-100 line-clamp-2">
            {source.title}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
            {source.snippet}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate">
            {domain}
          </div>
          {/* Small arrow pointing down */}
          <div className="absolute -bottom-1 left-2 w-2 h-2 rotate-45 
                          bg-white dark:bg-gray-800 border-r border-b 
                          border-gray-200 dark:border-gray-700"></div>
        </div>,
        document.body
      )}
    </>
  );
};
