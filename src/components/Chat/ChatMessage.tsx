import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Message } from '../../types';
import { CitationPill } from './CitationPill';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  // Track which sources are actually cited inline to show a summary later
  const usedUrls = new Set<string>();

  // Preprocess content to remove References/Sources sections and track citations
  const processedContent = React.useMemo(() => {
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

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-2' : 'order-1'}`}>
        <div className="relative group">
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <>
                {/* Status bubble states - Phase 2B: Enhanced animations */}
                {message.status === 'searching' && (
                  <div className="space-y-2">
                    {/* Main indicator */}
                    <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400">
                      <span className="inline-flex items-center justify-center w-6 h-6 animate-spin-slow">
                        🔎
                      </span>
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
                      <span className="inline-flex items-center justify-center w-6 h-6 animate-pulse">
                        💭
                      </span>
                      <span className="font-semibold">Thinking</span>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 animate-progress-bar" />
                    </div>
                  </div>
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
                                return <React.Fragment key={`text-${key}-${i}`}>[{num}]</React.Fragment>;
                              }
                              // Return text parts (including empty strings for proper spacing)
                              return <React.Fragment key={`text-${key}-${i}`}>{part}</React.Fragment>;
                            });
                          }
                          
                          return node;
                        };
                        
                        // Process each child
                        const processedChildren = React.Children.map(children, (child, idx) => 
                          processNode(child, idx)
                        );
                        
                        return <p>{processedChildren}</p>;
                      },
                      code({ className, children }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const isCodeBlock = match && String(children).includes('\n');
                        return isCodeBlock ? (
                          <SyntaxHighlighter
                            style={vscDarkPlus as any}
                            language={match[1]}
                            PreTag="div"
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className}>
                            {children}
                          </code>
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
              </>
            )}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded ${
              isUser 
                ? 'bg-blue-700 hover:bg-blue-800 text-white' 
                : 'bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
            title="Copy message"
          >
            {copied ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {new Date(message.timestamp).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
