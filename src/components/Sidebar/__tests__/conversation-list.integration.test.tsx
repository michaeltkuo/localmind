import { createRoot, Root } from 'react-dom/client';
import { act } from 'react';
import { ConversationList } from '../ConversationList';
import type { Conversation } from '../../../types';

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
  if (!setter) {
    throw new Error('Unable to get native value setter for input element');
  }
  setter.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
};

describe('ConversationList integration', () => {
  let container: HTMLDivElement;
  let root: Root;

  const conversations: Conversation[] = [
    {
      id: 'conv-1',
      title: 'Project roadmap',
      messages: [],
      createdAt: Date.now() - 10000,
      updatedAt: Date.now() - 10000,
      model: 'llama3.2:latest',
    },
    {
      id: 'conv-2',
      title: 'Shopping list',
      messages: [],
      createdAt: Date.now() - 5000,
      updatedAt: Date.now() - 5000,
      model: 'llama3.2:latest',
    },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  test('filters conversations by search query', () => {
    act(() => {
      root.render(
        <ConversationList
          conversations={conversations}
          currentConversationId={null}
          onSelectConversation={() => {}}
          onDeleteConversation={() => {}}
          onRenameConversation={() => {}}
          onTogglePinConversation={() => {}}
          onToggleArchiveConversation={() => {}}
          onNewConversation={() => {}}
        />
      );
    });

    const searchInput = container.querySelector('input[aria-label="Search conversations"]') as HTMLInputElement;
    expect(searchInput).toBeTruthy();

    act(() => {
      setInputValue(searchInput, 'project');
    });

    expect(container.textContent).toContain('Project roadmap');
    expect(container.textContent).not.toContain('Shopping list');
  });

  test('renames a conversation via inline edit', () => {
    const onRenameConversation = jest.fn();

    act(() => {
      root.render(
        <ConversationList
          conversations={conversations}
          currentConversationId={null}
          onSelectConversation={() => {}}
          onDeleteConversation={() => {}}
          onRenameConversation={onRenameConversation}
          onTogglePinConversation={() => {}}
          onToggleArchiveConversation={() => {}}
          onNewConversation={() => {}}
        />
      );
    });

    const optionButtons = container.querySelectorAll('button[title="Conversation options"]');
    expect(optionButtons.length).toBeGreaterThan(0);

    act(() => {
      optionButtons[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const renameMenuItem = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Rename conversation'
    );
    expect(renameMenuItem).toBeTruthy();

    act(() => {
      renameMenuItem!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    const renameInput = container.querySelector('input[aria-label="Rename conversation"]') as HTMLInputElement;
    expect(renameInput).toBeTruthy();

    act(() => {
      setInputValue(renameInput, 'Renamed roadmap');
      renameInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    });

    expect(onRenameConversation).toHaveBeenCalledWith('conv-2', 'Renamed roadmap');
  });

  test('shows archived conversations when archived tab is selected', () => {
    const archivedConversations: Conversation[] = [
      {
        id: 'conv-archived',
        title: 'Old archived chat',
        messages: [],
        createdAt: Date.now() - 20000,
        updatedAt: Date.now() - 20000,
        model: 'llama3.2:latest',
        archived: true,
      },
      {
        id: 'conv-active',
        title: 'Current active chat',
        messages: [],
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
        model: 'llama3.2:latest',
      },
    ];

    act(() => {
      root.render(
        <ConversationList
          conversations={archivedConversations}
          currentConversationId={null}
          onSelectConversation={() => {}}
          onDeleteConversation={() => {}}
          onRenameConversation={() => {}}
          onTogglePinConversation={() => {}}
          onToggleArchiveConversation={() => {}}
          onNewConversation={() => {}}
        />
      );
    });

    expect(container.textContent).toContain('Current active chat');
    expect(container.textContent).not.toContain('Old archived chat');

    const archivedTab = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Archived'
    );
    expect(archivedTab).toBeTruthy();

    act(() => {
      archivedTab!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Old archived chat');
    expect(container.textContent).not.toContain('Current active chat');
  });

  test('opens ellipsis menu with text actions', () => {
    const onTogglePinConversation = jest.fn();

    act(() => {
      root.render(
        <ConversationList
          conversations={conversations}
          currentConversationId={null}
          onSelectConversation={() => {}}
          onDeleteConversation={() => {}}
          onRenameConversation={() => {}}
          onTogglePinConversation={onTogglePinConversation}
          onToggleArchiveConversation={() => {}}
          onNewConversation={() => {}}
        />
      );
    });

    const optionsButton = container.querySelector('button[title="Conversation options"]') as HTMLButtonElement;
    expect(optionsButton).toBeTruthy();

    act(() => {
      optionsButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(container.textContent).toContain('Pin conversation');
    expect(container.textContent).toContain('Archive conversation');
    expect(container.textContent).toContain('Rename conversation');
    expect(container.textContent).toContain('Delete conversation');

    const pinMenuItem = Array.from(container.querySelectorAll('button')).find(
      (button) => button.textContent === 'Pin conversation'
    );
    expect(pinMenuItem).toBeTruthy();

    act(() => {
      pinMenuItem!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });

    expect(onTogglePinConversation).toHaveBeenCalledWith('conv-2');
  });
});
