import React, { useId, useMemo, useState } from 'react';
import type { ToolEvent } from '../../types';

interface ToolTimelineProps {
  events: ToolEvent[];
  isStreaming: boolean;
}

const formatDuration = (startedAt: number, endedAt?: number): string => {
  if (!endedAt || endedAt < startedAt) {
    return '';
  }

  return `${((endedAt - startedAt) / 1000).toFixed(1)}s`;
};

export const ToolTimeline: React.FC<ToolTimelineProps> = ({ events, isStreaming }) => {
  const timelineId = useId();
  const [expanded, setExpanded] = useState(false);

  const summaryDuration = useMemo(() => {
    if (!events.length) {
      return '';
    }

    const first = events[0].startedAt;
    const lastWithEnd = [...events].reverse().find((event) => event.endedAt);
    if (!lastWithEnd?.endedAt) {
      return '';
    }

    return `${((lastWithEnd.endedAt - first) / 1000).toFixed(1)}s`;
  }, [events]);

  return (
    <div className="mb-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-900/40">
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className="w-full px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        aria-expanded={expanded}
        aria-controls={timelineId}
      >
        <span>Activity ({events.length} step{events.length !== 1 ? 's' : ''})</span>
        <span className="text-gray-500 dark:text-gray-400">{summaryDuration || (isStreaming ? 'Running' : '')}</span>
      </button>

      {expanded && (
        <div id={timelineId} className="px-3 pb-3 space-y-2">
          {events.map((event, index) => {
            const isLatest = index === events.length - 1;
            const isActive = isStreaming && isLatest && !event.endedAt;
            return (
              <div key={`${event.label}-${event.startedAt}-${index}`} className="flex items-start justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <div className="text-gray-800 dark:text-gray-200">{event.label}</div>
                  {event.detail && (
                    <div className="text-gray-500 dark:text-gray-400 truncate">{event.detail}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 text-gray-500 dark:text-gray-400">
                  {isActive ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" aria-hidden="true" />
                  ) : null}
                  <span>{formatDuration(event.startedAt, event.endedAt) || (isActive ? 'Running' : '')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
