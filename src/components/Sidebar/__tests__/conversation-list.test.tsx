import { renderToStaticMarkup } from 'react-dom/server';
import { ConversationList } from '../ConversationList';

describe('ConversationList', () => {
  test('renders search input and empty state', () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[]}
        currentConversationId={null}
        onSelectConversation={() => {}}
        onDeleteConversation={() => {}}
        onRenameConversation={() => {}}
        onTogglePinConversation={() => {}}
        onToggleArchiveConversation={() => {}}
        onNewConversation={() => {}}
      />
    );

    expect(html).toContain('Search conversations');
    expect(html).toContain('No conversations yet');
    expect(html).toContain('New Chat');
    expect(html).toContain('Active');
    expect(html).toContain('Archived');
  });

  test('renders ellipsis options trigger for conversations', () => {
    const html = renderToStaticMarkup(
      <ConversationList
        conversations={[
          {
            id: 'conv-1',
            title: 'Sample chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: 'llama3.2:latest',
          },
        ]}
        currentConversationId={null}
        onSelectConversation={() => {}}
        onDeleteConversation={() => {}}
        onRenameConversation={() => {}}
        onTogglePinConversation={() => {}}
        onToggleArchiveConversation={() => {}}
        onNewConversation={() => {}}
      />
    );

    expect(html).toContain('Conversation options');
  });
});
