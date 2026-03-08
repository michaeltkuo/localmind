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

  test('forkConversation creates a new branch conversation up to assistant message', async () => {
    const now = Date.now();
    const conversation: Conversation = {
      id: 'conv-3',
      title: 'Original Thread',
      model: 'llama3.2:latest',
      createdAt: now,
      updatedAt: now,
      messages: [
        { id: 'u1', role: 'user', content: 'Question', timestamp: 1 },
        { id: 'a1', role: 'assistant', content: 'Answer', timestamp: 2 },
        { id: 'u2', role: 'user', content: 'Follow-up', timestamp: 3 },
      ],
    };

    useChatStore.setState({
      currentConversation: conversation,
      conversations: [conversation],
      isStreaming: false,
    } as any);

    await act(async () => {
      await useChatStore.getState().forkConversation('conv-3', 1);
    });

    const state = useChatStore.getState();
    expect(state.currentConversation).not.toBeNull();
    expect(state.currentConversation?.id).not.toBe('conv-3');
    expect(state.currentConversation?.title).toBe('[forked from: Original Thread]');
    expect(state.currentConversation?.messages).toHaveLength(2);
    expect(state.currentConversation?.messages[1].content).toBe('Answer');
    expect(state.conversations[0].id).toBe(state.currentConversation?.id);
  });

  test('updatePromptTemplate updates custom prompt content', () => {
    useChatStore.setState({
      promptTemplates: [
        {
          id: 'prompt-summarize',
          name: 'Summarize',
          content: 'Summarize this text.',
          createdAt: 0,
          builtIn: true,
        },
        {
          id: 'prompt-custom-1',
          name: 'My Prompt',
          content: 'Old content',
          createdAt: Date.now(),
          builtIn: false,
        },
      ],
    } as any);

    useChatStore.getState().updatePromptTemplate('prompt-custom-1', 'Updated Prompt', 'New content');

    const updated = useChatStore.getState().promptTemplates.find((template) => template.id === 'prompt-custom-1');
    expect(updated?.name).toBe('Updated Prompt');
    expect(updated?.content).toBe('New content');
  });

  test('movePromptTemplate reorders custom prompts', () => {
    useChatStore.setState({
      promptTemplates: [
        {
          id: 'prompt-summarize',
          name: 'Summarize',
          content: 'Summarize this text.',
          createdAt: 0,
          builtIn: true,
        },
        {
          id: 'prompt-custom-1',
          name: 'Prompt A',
          content: 'A',
          createdAt: Date.now(),
          builtIn: false,
        },
        {
          id: 'prompt-custom-2',
          name: 'Prompt B',
          content: 'B',
          createdAt: Date.now() + 1,
          builtIn: false,
        },
      ],
    } as any);

    useChatStore.getState().movePromptTemplate('prompt-custom-2', 'up');

    const customIds = useChatStore
      .getState()
      .promptTemplates.filter((template) => !template.builtIn)
      .map((template) => template.id);

    expect(customIds).toEqual(['prompt-custom-2', 'prompt-custom-1']);
  });
});
