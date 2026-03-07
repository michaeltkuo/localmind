import { useState } from 'react';
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
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [renamingConversationId, setRenamingConversationId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [openActionsConversationId, setOpenActionsConversationId] = useState<string | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getConversationPreview = (conversation: Conversation): string => {
    return conversation.title || 'New conversation';
  };

  // Sort conversations by pin status, then recency
  const sortedConversations = [...conversations].sort((a, b) => {
    if ((a.pinned ?? false) !== (b.pinned ?? false)) {
      return (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0);
    }
    return b.updatedAt - a.updatedAt;
  });

  const conversationsForTab = sortedConversations.filter(
    (conversation) => (conversation.archived ?? false) === showArchived
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = normalizedQuery
    ? conversationsForTab.filter((conversation) =>
        getConversationPreview(conversation).toLowerCase().includes(normalizedQuery)
      )
    : conversationsForTab;

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-800">
      {/* New Chat Button */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
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
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          placeholder="Search conversations"
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-3 text-center text-gray-500 dark:text-gray-300 text-sm">
            {conversationsForTab.length === 0
              ? (showArchived ? 'No archived conversations' : 'No conversations yet')
              : 'No matching conversations'}
          </div>
        ) : (
          <div className="p-1.5">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`
                  group relative mb-1 p-2.5 rounded-md cursor-pointer transition-colors
                  ${currentConversationId === conversation.id 
                    ? 'bg-white dark:bg-gray-700 shadow-sm border border-blue-200 dark:border-blue-500' 
                    : 'hover:bg-white dark:hover:bg-gray-700'
                  }
                `}
                onClick={() => onSelectConversation(conversation.id)}
                onDoubleClick={() => startRenaming(conversation)}
              >
                {/* Conversation Preview */}
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
                          {getConversationPreview(conversation)}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-300 whitespace-nowrap">
                        {formatDate(conversation.updatedAt)}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-400 whitespace-nowrap">
                        {conversation.messages.length} messages
                      </span>
                    </div>
                  </div>

                  {/* Action menu */}
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
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {conversationsForTab.length} {showArchived ? 'archived' : 'active'} conversation{conversationsForTab.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};
