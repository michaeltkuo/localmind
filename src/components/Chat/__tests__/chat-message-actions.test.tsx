import { renderToStaticMarkup } from 'react-dom/server';
import { ChatMessage } from '../ChatMessage';
import type { Message } from '../../../types';

jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('remark-gfm', () => ({
  __esModule: true,
  default: () => undefined,
}));

jest.mock('react-syntax-highlighter', () => ({
  Prism: ({ children }: { children: any }) => <>{children}</>,
}));

jest.mock('react-syntax-highlighter/dist/esm/styles/prism', () => ({
  vscDarkPlus: {},
}));

describe('ChatMessage action bar', () => {
  test('renders assistant actions on latest assistant message', () => {
    const message: Message = {
      id: 'msg-1',
      role: 'assistant',
      content: 'Answer content',
      timestamp: Date.now(),
    };

    const html = renderToStaticMarkup(
      <ChatMessage
        message={message}
        isLatestAssistant={true}
        onRegenerate={() => {}}
        onContinue={() => {}}
      />
    );

    expect(html).toContain('Copy');
    expect(html).toContain('Regenerate');
    expect(html).toContain('Continue');
  });
});
