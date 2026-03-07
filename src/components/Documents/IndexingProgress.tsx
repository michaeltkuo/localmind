import React from 'react';

interface IndexingProgressProps {
  current: number;
  total: number;
}

export const IndexingProgress: React.FC<IndexingProgressProps> = ({ current, total }) => {
  const safeTotal = Math.max(total, 1);
  const percent = Math.round((current / safeTotal) * 100);

  return (
    <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-2">
      <span className="animate-spin">⏳</span>
      <span>Indexing {current}/{safeTotal} chunks ({percent}%)</span>
    </div>
  );
};
