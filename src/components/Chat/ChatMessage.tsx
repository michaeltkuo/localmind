import { Children, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types';
import { CitationPill } from './CitationPill';
import { MessageActionBar } from './MessageActionBar';
import { ToolTimeline } from './ToolTimeline';

interface ChatMessageProps {
  message: Message;
  /** When true, the message is actively being streamed. ReactMarkdown runs
   * as normal so markdown renders correctly throughout, but the Prism syntax
   * highlighter is swapped for a lightweight plain pre/code block to avoid
   * re-tokenizing code on every rAF flush. Prism is restored on completion. */
  isActivelyStreaming?: boolean;
  isLatestAssistant?: boolean;
  onRegenerate?: () => void;
  onContinue?: () => void;
  onEdit?: (newContent: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  isActivelyStreaming = false,
  isLatestAssistant = false,
  onRegenerate,
  onContinue,
  onEdit,
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
  // Track which sources are actually cited inline to show a summary later
  const usedUrls = new Set<string>();

  useEffect(() => {
    setEditText(message.content);
    setIsEditing(false);
  }, [message.id, message.content]);

  useEffect(() => {
    if (!isEditing || !editTextAreaRef.current) {
      return;
    }

    const textarea = editTextAreaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [isEditing, editText]);

  // Preprocess content to remove References/Sources sections and track citations
  const processedContent = useMemo(() => {
    if (!message.searchResults || message.searchResults.length === 0) {
      return message.content;
    }
    
    // Remove References: or Sources: sections at the end
    let content = message.content;
    
    // Remove everything after "References:" or "Sources:" headings
    const refMatch = content.match(/\n(?:References?|Sources?):\s*\n/i);
    if (refMatch && refMatch.index) {
      content = content.substring(0, refMatch.index).trim();
    }
    
    // Remove (Source: Name) patterns and replace with nothing
    // since the UI will show sources at the bottom
    content = content.replace(/\s*\(Source:\s*[^)]+\)/gi, '');
    
    // Track which citations are used
    const citationMatches = content.matchAll(/\[(\d+)\]/g);
    for (const match of citationMatches) {
      const num = parseInt(match[1], 10);
      const idx = num - 1;
      if (idx >= 0 && idx < message.searchResults.length) {
        usedUrls.add(message.searchResults[idx].url);
      }
    }
    
    return content;
  }, [message.content, message.searchResults]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEditSubmit = () => {
    const normalizedContent = editText.trim();
    if (!normalizedContent || normalizedContent === message.content) {
      setIsEditing(false);
      setEditText(message.content);
      return;
    }

    onEdit?.(normalizedContent);
    setIsEditing(false);
  };

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="space-y-2 mb-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.documentId}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 3h7l5 5v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{attachment.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-300 uppercase">
                      {(attachment.mimeType || 'file').split('/').pop() || 'File'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="relative group">
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {isUser ? (
              isEditing ? (
                <div className="space-y-2">
                  <textarea
                    ref={editTextAreaRef}
                    value={editText}
                    onChange={(event) => setEditText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') {
                        event.preventDefault();
                        setIsEditing(false);
                        setEditText(message.content);
                      }
                    }}
                    className="w-full rounded-md border border-blue-300 bg-white text-gray-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-none"
                    rows={3}
                    aria-label="Edit message"
                  />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditText(message.content);
                      }}
                      className="px-2 py-1 rounded border border-blue-200 text-blue-100 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEditSubmit}
                      className="px-2 py-1 rounded border border-blue-200 text-blue-100 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              )
            ) : (
              <>
                {/* Status bubble states - Phase 2B: Enhanced animations */}
                {message.status === 'searching' && (
                  <div className="space-y-2">
                    {/* Main indicator */}
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <div className="flex flex-col">
                        <span className="font-semibold">Searching the web</span>
                        {message.lastSearchQuery && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-md">
                            {message.lastSearchQuery}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress-bar" />
                    </div>
                  </div>
                )}
                {message.status === 'thinking' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400">
                      <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="font-semibold">Thinking</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-progress-bar" />
                    </div>
                  </div>
                )}

                {message.toolEvents && message.toolEvents.length > 0 && !message.status && (
                  <ToolTimeline
                    events={message.toolEvents}
                    isStreaming={isActivelyStreaming}
                  />
                )}

                <div className={`prose prose-sm dark:prose-invert max-w-none prose-pre:p-0 prose-pre:m-0 ${message.status ? 'hidden' : ''}`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      // Override paragraph nodes to handle citations
                      p({ children }: any) {
                        if (!message.searchResults || message.searchResults.length === 0) {
                          return <p>{children}</p>;
                        }
                        
                        // Process all text nodes to replace citation patterns
                        const processNode = (node: any, key: string | number): any => {
                          if (typeof node === 'string') {
                            // Split by citation pattern [number]
                            const parts = node.split(/(\[\d+\])/g);
                            
                            return parts.map((part, i) => {
                              const match = part.match(/^\[(\d+)\]$/);
                              if (match) {
                                const num = parseInt(match[1], 10);
                                const idx = num - 1;
                                if (idx >= 0 && idx < message.searchResults!.length) {
                                  return (
                                    <CitationPill
                                      key={`cite-${key}-${i}-${num}`}
                                      number={num}
                                      source={message.searchResults![idx]}
                                    />
                                  );
                                }
                                // Out of bounds citation - just show as text (model hallucinated)
                                return <Fragment key={`text-${key}-${i}`}>[{num}]</Fragment>;
                              }
                              // Return text parts (including empty strings for proper spacing)
                              return <Fragment key={`text-${key}-${i}`}>{part}</Fragment>;
                            });
                          }
                          
                          return node;
                        };
                        
                        // Process each child
                        const processedChildren = Children.map(children, (child, idx) => 
                          processNode(child, idx)
                        );
                        
                        return <p>{processedChildren}</p>;
                      },
                      code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isCodeBlock = match && String(children).includes('\n');
                        if (!isCodeBlock) {
                          return <code className={className}>{children}</code>;
                        }
                        // During streaming: skip Prism entirely — it re-tokenizes the full
                        // block on every rAF flush which is the main render bottleneck.
                        // Plain pre/code is visually consistent; Prism kicks in on completion.
                        if (isActivelyStreaming) {
                          return (
                            <div className="rounded bg-gray-900 px-4 py-3 overflow-x-auto my-2">
                              <pre className="text-gray-100 text-sm font-mono whitespace-pre">
                                <code>{String(children).replace(/\n$/, '')}</code>
                              </pre>
                            </div>
                          );
                        }
                        return (
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        );
                      },
                      a({ href, children }) {
                        // Standard link rendering - citations are handled in text() component
                        return (
                          <a
                            href={href as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {processedContent}
                  </ReactMarkdown>
                </div>
                {/* Sources list - clean, readable style */}
                {(!message.status) && message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Sources
                    </div>
                    <div className="space-y-1.5">
                      {message.searchResults.map((source, idx) => {
                        const domain = (() => { 
                          try { 
                            return new URL(source.url).hostname.replace(/^www\./, ''); 
                          } catch { 
                            return source.url; 
                          } 
                        })();
                        
                        return (
                          <a
                            key={idx}
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors"
                          >
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-blue-600 dark:text-blue-400 line-clamp-1 hover:underline">
                                {source.title}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 truncate text-[11px]">
                                {domain}
                              </div>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Response source badge */}
                {(!message.status) && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {message.searchResults && message.searchResults.length > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Web search used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          From knowledge base
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Message action bar */}
                {!message.status && (
                  <MessageActionBar
                    isUser={false}
                    isStreaming={isActivelyStreaming}
                    copied={copied}
                    canRegenerate={Boolean(onRegenerate)}
                    canContinue={Boolean(onContinue && isLatestAssistant)}
                    canEdit={false}
                    onCopy={handleCopy}
                    onRegenerate={onRegenerate}
                    onContinue={isLatestAssistant ? onContinue : undefined}
                  />
                )}
              </>
            )}
          </div>
        </div>
        {!message.status && isUser && !isEditing && (
          <MessageActionBar
            isUser={true}
            isStreaming={isActivelyStreaming}
            copied={copied}
            canRegenerate={false}
            canContinue={false}
            canEdit={Boolean(onEdit)}
            onCopy={handleCopy}
            onStartEdit={() => setIsEditing(true)}
          />
        )}
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
