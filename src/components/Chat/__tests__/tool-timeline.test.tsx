import { renderToStaticMarkup } from 'react-dom/server';
import { ToolTimeline } from '../ToolTimeline';
import type { ToolEvent } from '../../../types';

describe('ToolTimeline', () => {
  const baseEvents: ToolEvent[] = [
    { type: 'thinking', label: 'Thinking', startedAt: 1000, endedAt: 1300 },
    { type: 'search', label: 'Searching web', startedAt: 1300, endedAt: 2100, detail: 'rag retrieval' },
  ];

  test('renders activity summary', () => {
    const html = renderToStaticMarkup(<ToolTimeline events={baseEvents} isStreaming={false} />);

    expect(html).toContain('Activity (2 steps)');
    expect(html).toContain('1.1s');
  });

  test('is collapsed by default while streaming', () => {
    const html = renderToStaticMarkup(<ToolTimeline events={baseEvents} isStreaming={true} />);

    expect(html).toContain('Activity (2 steps)');
    expect(html).not.toContain('rag retrieval');
  });
});
