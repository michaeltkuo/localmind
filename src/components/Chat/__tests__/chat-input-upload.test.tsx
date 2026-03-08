import { renderToStaticMarkup } from 'react-dom/server';
import { ChatInput } from '../ChatInput';

describe('ChatInput upload behavior', () => {
  test('keeps upload button enabled during streaming', () => {
    const html = renderToStaticMarkup(
      <ChatInput
        onSendMessage={() => {}}
        onUploadDocument={() => {}}
        disabled={false}
        isStreaming={true}
        isSearching={false}
        webSearchEnabled={false}
      />
    );

    const match = html.match(/<button[^>]*title="Add attachment"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[0]).not.toMatch(/\sdisabled(=|\s|>)/);
  });

  test('disables upload button while document indexing is active', () => {
    const html = renderToStaticMarkup(
      <ChatInput
        onSendMessage={() => {}}
        onUploadDocument={() => {}}
        disabled={false}
        isStreaming={false}
        isSearching={false}
        isIndexingDocument={true}
        webSearchEnabled={false}
      />
    );

    const match = html.match(/<button[^>]*title="Add attachment"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[0]).toMatch(/\sdisabled(=|\s|>)/);
  });

  test('shows prompt library button when templates are provided', () => {
    const html = renderToStaticMarkup(
      <ChatInput
        onSendMessage={() => {}}
        onUploadDocument={() => {}}
        disabled={false}
        isStreaming={false}
        isSearching={false}
        webSearchEnabled={false}
        promptTemplates={[
          {
            id: 'prompt-1',
            name: 'Summarize',
            content: 'Summarize this.',
            createdAt: Date.now(),
            builtIn: true,
          },
        ]}
      />
    );

    expect(html).toContain('Prompts');
  });

  test('renders context window indicator when usage is provided', () => {
    const html = renderToStaticMarkup(
      <ChatInput
        onSendMessage={() => {}}
        onUploadDocument={() => {}}
        disabled={false}
        isStreaming={false}
        isSearching={false}
        webSearchEnabled={false}
        contextWindowUsage={{
          usedTokens: 1200,
          limitTokens: 4096,
          percentUsed: 1200 / 4096,
          source: 'measured',
        }}
      />
    );

    expect(html).toContain('Context usage: 1,200 / 4,096 tokens');
  });
});
