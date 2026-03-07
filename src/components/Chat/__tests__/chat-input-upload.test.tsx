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

    const match = html.match(/<button[^>]*title="Upload document"[^>]*>/);
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

    const match = html.match(/<button[^>]*title="Upload document"[^>]*>/);
    expect(match).not.toBeNull();
    expect(match?.[0]).toMatch(/\sdisabled(=|\s|>)/);
  });
});
