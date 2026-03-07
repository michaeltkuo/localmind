import { useChatStore } from '../chatStore';
import { StorageService } from '../../services/storage.service';
import type { Conversation } from '../../types';

describe('chatStore rename integration', () => {
  test('renameConversation updates state and persists conversation', async () => {
    const saveSpy = jest.spyOn(StorageService, 'saveConversation').mockImplementation(() => {});

    const baseConversation: Conversation = {
      id: 'conv-1',
      title: 'Old title',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'llama3.2:latest',
    };

    useChatStore.setState({
      conversations: [baseConversation],
      currentConversation: baseConversation,
    });

    await useChatStore.getState().renameConversation('conv-1', 'New title');

    const state = useChatStore.getState();
    expect(state.conversations[0].title).toBe('New title');
    expect(state.currentConversation?.title).toBe('New title');
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'conv-1', title: 'New title' }));

    saveSpy.mockRestore();
  });

  test('togglePinConversation updates state and persists conversation', async () => {
    const saveSpy = jest.spyOn(StorageService, 'saveConversation').mockImplementation(() => {});

    const baseConversation: Conversation = {
      id: 'conv-1',
      title: 'Pinned candidate',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'llama3.2:latest',
      pinned: false,
    };

    useChatStore.setState({
      conversations: [baseConversation],
      currentConversation: baseConversation,
    });

    await useChatStore.getState().togglePinConversation('conv-1');

    const state = useChatStore.getState();
    expect(state.conversations[0].pinned).toBe(true);
    expect(state.currentConversation?.pinned).toBe(true);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'conv-1', pinned: true }));

    saveSpy.mockRestore();
  });

  test('toggleArchiveConversation archives and unpins conversation', async () => {
    const saveSpy = jest.spyOn(StorageService, 'saveConversation').mockImplementation(() => {});

    const baseConversation: Conversation = {
      id: 'conv-1',
      title: 'Archive candidate',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      model: 'llama3.2:latest',
      pinned: true,
      archived: false,
    };

    useChatStore.setState({
      conversations: [baseConversation],
      currentConversation: baseConversation,
    });

    await useChatStore.getState().toggleArchiveConversation('conv-1');

    const state = useChatStore.getState();
    expect(state.conversations[0].archived).toBe(true);
    expect(state.conversations[0].pinned).toBe(false);
    expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'conv-1', archived: true, pinned: false }));

    saveSpy.mockRestore();
  });
});
