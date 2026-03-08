import { act } from 'react';
import { useChatStore } from '../chatStore';
import type { Conversation } from '../../types';

jest.mock('../../services/storage.service', () => ({
  StorageService: {
    saveConversation: jest.fn(),
    loadConversation: jest.fn(),
    loadAllConversations: jest.fn(() => []),
    deleteConversation: jest.fn(),
  },
}));

describe('chatStore P1 actions', () => {
  beforeEach(() => {
    useChatStore.setState({
      currentConversation: null,
      conversations: [],
      isStreaming: false,
    });
  });

  test('regenerateAt trims to prior user message and forwards parentMessageId', async () => {
    const conversation: Conversation = {
      id: 'conv-1',
      title: 'Test',
      model: 'llama3.2:latest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        { id: 'u1', role: 'user', content: 'First', timestamp: 1 },
        { id: 'a1', role: 'assistant', content: 'First answer', timestamp: 2 },
      ],
    };

    const sendSpy = jest.fn().mockResolvedValue(undefined);
    useChatStore.setState({
      currentConversation: conversation,
      conversations: [conversation],
      sendMessage: sendSpy,
    } as any);

    await act(async () => {
      await useChatStore.getState().regenerateAt(1);
    });

    expect(useChatStore.getState().currentConversation?.messages).toHaveLength(1);
    expect(sendSpy).toHaveBeenCalledWith('First', false, { parentMessageId: 'a1' });
  });

  test('editAndResubmit trims after previous message and sets editedFrom metadata', async () => {
    const conversation: Conversation = {
      id: 'conv-2',
      title: 'Test',
      model: 'llama3.2:latest',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [
        { id: 'u1', role: 'user', content: 'Original question', timestamp: 1 },
        { id: 'a1', role: 'assistant', content: 'Original answer', timestamp: 2 },
      ],
    };

    const sendSpy = jest.fn().mockResolvedValue(undefined);
    useChatStore.setState({
      currentConversation: conversation,
      conversations: [conversation],
      sendMessage: sendSpy,
    } as any);

    await act(async () => {
      await useChatStore.getState().editAndResubmit(0, 'Updated question');
    });

    expect(useChatStore.getState().currentConversation?.messages).toHaveLength(0);
    expect(sendSpy).toHaveBeenCalledWith('Updated question', false, { editedFrom: 'Original question' });
  });
});
