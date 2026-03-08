import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Conversation } from '../../types';

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  onTogglePinConversation: (id: string) => void;
  onToggleArchiveConversation: (id: string) => void;
  onNewConversation: () => void;
  searchFocusToken?: number;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  currentConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onTogglePinConversation,
  onToggleArchiveConversation,
  onNewConversation,
  searchFocusToken,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [openActionsConversationId, setOpenActionsConversationId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const getConversationPreview = (conversation: Conversation): string => {
    return conversation.title || 'New conversation';
  };

  useEffect(() => {
    if (!searchFocusToken) {
      return;
    }

    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  }, [searchFocusToken]);

  const escapedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const getFirstMessageMatch = (conversation: Conversation) => {
    if (!escapedQuery) {
      return null;
    }

    for (let index = 0; index < conversation.messages.length; index += 1) {
      const content = conversation.messages[index]?.content || '';
      const lower = content.toLowerCase();
      const queryIndex = lower.indexOf(escapedQuery);
      if (queryIndex >= 0) {
        const snippetStart = Math.max(0, queryIndex - 36);
        const snippetEnd = Math.min(content.length, queryIndex + escapedQuery.length + 60);
        const snippet = content.slice(snippetStart, snippetEnd).replace(/\s+/g, ' ').trim();
        return {
          messageIndex: index + 1,
          snippet,
        };
      }
    }

    return null;
  };

  const highlightText = (text: string) => {
    if (!escapedQuery || !text) {
      return text;
    }

    const lower = text.toLowerCase();
    const matchIndex = lower.indexOf(escapedQuery);

    if (matchIndex < 0) {
      return text;
    }

    const before = text.slice(0, matchIndex);
    const match = text.slice(matchIndex, matchIndex + escapedQuery.length);
    const after = text.slice(matchIndex + escapedQuery.length);

    return (
      <>
        {before}
        <mark className="bg-yellow-200 dark:bg-yellow-800 rounded-sm px-0.5 text-inherit">{match}</mark>
        {after}
      </>
    );
  };

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      if ((a.pinned ?? false) !== (b.pinned ?? false)) {
        return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
      }
      return b.updatedAt - a.updatedAt;
    });
  }, [conversations]);

  const conversationsForTab = useMemo(
    () => sortedConversations.filter((conversation) => (conversation.archived ?? false) === showArchived),
    [sortedConversations, showArchived]
  );

  const filteredConversations = useMemo(() => {
    if (!escapedQuery) {
      return conversationsForTab;
    }

    return conversationsForTab.filter((conversation) => {
      const title = getConversationPreview(conversation).toLowerCase();
      if (title.includes(escapedQuery)) {
        return true;
      }

      return conversation.messages.some((message) =>
        (message.content || '').toLowerCase().includes(escapedQuery)
      );
    });
  }, [escapedQuery, conversationsForTab]);

  const startRenaming = (conversation: Conversation) => {
    setRenamingConversationId(conversation.id);
    setRenameTitle(getConversationPreview(conversation));
  };

  const commitRename = (conversationId: string) => {
    onRenameConversation(conversationId, renameTitle);
    setRenamingConversationId(null);
    setRenameTitle('');
  };

  const cancelRename = () => {
    setRenamingConversationId(null);
    setRenameTitle('');
  };

  const closeActionsMenu = () => {
    setOpenActionsConversationId(null);
  };

  return (
    <div className="flex flex-col bg-gray-50 dark:bg-gray-800">
      <div className="p-3">
        <button
          onClick={onNewConversation}
          className="w-full px-3 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
          title="New Chat (⌘N)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSearchQuery('');
              searchInputRef.current?.blur();
            }
          }}
          className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Search conversations"
          title="Search conversations (⌘F)"
          aria-label="Search conversations"
        />

        <div className="mt-2 grid grid-cols-2 gap-1 p-1 rounded-md bg-gray-100 dark:bg-gray-700">
          <button
            type="button"
            onClick={() => setShowArchived(false)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              !showArchived
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setShowArchived(true)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              showArchived
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Archived
          </button>
        </div>
      </div>

      <div>
        {filteredConversations.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-300 text-sm">
            {conversationsForTab.length === 0
              ? showArchived
                ? 'No archived conversations'
                : 'No conversations yet'
              : 'No matching conversations'}
          </div>
        ) : (
          <div className="p-1.5">
            {filteredConversations.map((conversation) => {
              const title = getConversationPreview(conversation);
              const messageMatch = getFirstMessageMatch(conversation);
              const showMessageMatch = Boolean(escapedQuery && messageMatch);

              return (
                <div
                  key={conversation.id}
                  className={`
                    group relative mb-1 p-2.5 rounded-md cursor-pointer transition-colors
                    ${currentConversationId === conversation.id
                      ? 'bg-white dark:bg-gray-700 shadow-sm'
                      : 'hover:bg-white dark:hover:bg-gray-700'
                    }
                  `}
                  onClick={() => onSelectConversation(conversation.id)}
                  onDoubleClick={() => startRenaming(conversation)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {renamingConversationId === conversation.id ? (
                        <input
                          type="text"
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onBlur={() => commitRename(conversation.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitRename(conversation.id);
                            }
                            if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelRename();
                            }
                          }}
                          autoFocus
                          className="w-full text-sm font-medium px-1 py-0.5 rounded border border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          aria-label="Rename conversation"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {conversation.pinned && <span title="Pinned">📌</span>}
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {highlightText(title)}
                          </p>
                        </div>
                      )}

                      {showMessageMatch && messageMatch && (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Match in message {messageMatch.messageIndex}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                            {highlightText(messageMatch.snippet)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionsConversationId((prev) =>
                            prev === conversation.id ? null : conversation.id
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-opacity"
                        title="Conversation options"
                        aria-label="Conversation options"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
                        </svg>
                      </button>

                      {openActionsConversationId === conversation.id && (
                        <div
                          className="absolute right-0 top-8 z-20 w-44 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              onTogglePinConversation(conversation.id);
                              closeActionsMenu();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {conversation.pinned ? 'Unpin' : 'Pin'} conversation
                          </button>

                          <button
                            onClick={() => {
                              onToggleArchiveConversation(conversation.id);
                              closeActionsMenu();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            {conversation.archived ? 'Unarchive' : 'Archive'} conversation
                          </button>

                          <button
                            onClick={() => {
                              startRenaming(conversation);
                              closeActionsMenu();
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            Rename conversation
                          </button>

                          <button
                            onClick={() => {
                              closeActionsMenu();
                              if (window.confirm('Delete this conversation?')) {
                                onDeleteConversation(conversation.id);
                              }
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
                          >
                            Delete conversation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 p-3 bg-gray-50 dark:bg-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversationsForTab.length} {showArchived ? 'archived' : 'active'} conversation
          {conversationsForTab.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
