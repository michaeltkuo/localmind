// Web search service for retrieving real-time information
// Uses DuckDuckGo for privacy-friendly searches (no API key required)

export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
  timestamp: number;
}

export class SearchService {
  /**
   * Search the web using DuckDuckGo
   * Returns formatted search results with titles, snippets, and URLs
   */
  static async search(query: string, maxResults: number = 5): Promise<SearchResponse> {
    try {
      // Check if running in Electron with IPC available
      // @ts-ignore - window.api is injected by preload script
      if (typeof window !== 'undefined' && window.api?.search) {
        // Use Electron IPC to bypass CORS
        // @ts-ignore
        try { console.log('[WebSearch] path: electron-ipc'); } catch {}
        const result = await window.api.search(query, maxResults);
        if (result.success && result.results) {
          try { console.log('[WebSearch] electron-ipc returned', result.results.length); } catch {}
          return {
            query,
            results: result.results,
            timestamp: Date.now(),
          };
        }
      }

      // Fallback for web/dev mode: use Vite proxy to Ollama Web Search
      try { console.log('[WebSearch] path: vite-proxy (Ollama Web Search)'); } catch {}
      const response = await fetch('/ollama-web-search', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, max_results: Math.min(Math.max(1, Number(maxResults) || 5), 10) }),
      });

      const results: SearchResult[] = [];
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.results)) {
          for (const r of data.results.slice(0, maxResults)) {
            if (r.url && r.title) {
              // Use snippet field if available, otherwise use content
              // Per Ollama docs, content field contains "relevant content snippet"
              // Truncate aggressively to save context window tokens (400 chars ≈ 100 tokens)
              let snippet = r.snippet || r.description || r.content || '';
              
              // Aggressive truncation for context efficiency (400 chars per result)
              // 3 results × 100 tokens = ~300 tokens total (down from ~2,500)
              const maxLength = 400;
              if (snippet.length > maxLength) {
                snippet = snippet.substring(0, maxLength).trim() + '...';
              }
              
              // Final fallback to title
              if (!snippet) {
                snippet = r.title;
              }
              
              results.push({
                url: r.url,
                title: r.title,
                snippet: snippet,
              });
            }
          }
        }
        try { console.log('[WebSearch] vite-proxy returned', results.length); } catch {}
      } else {
        console.warn('Ollama web search proxy response not OK:', response.status);
      }

      return { query, results, timestamp: Date.now() };
    } catch (error) {
      console.error('Search error:', error);
      // Return empty results rather than throwing
      return {
        query,
        results: [],
        timestamp: Date.now(),
      };
    }
  }

  /**
   * Fallback: Parse DuckDuckGo HTML search results
   * This is used when the instant answer API doesn't return results
   */
  // Removed old DuckDuckGo HTML fallback for dev (replaced by SearXNG proxy)

  /**
   * Format search results into a context string for the LLM
   */
  static formatResultsForContext(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return '';
    }

    let context = `[Web Search Results for: "${searchResponse.query}"]\n\n`;
    
    searchResponse.results.forEach((result, index) => {
      context += `${index + 1}. ${result.title}\n`;
      context += `   ${result.snippet}\n`;
      context += `   Source: ${result.url}\n\n`;
    });

    context += '[End of Web Search Results]\n\n';
    context += 'Please use the above web search results to provide an accurate and up-to-date response. ';
    context += 'Cite sources when referring to specific information.';

    return context;
  }

  /**
   * Format search results for display in the UI
   */
  static formatResultsForDisplay(searchResponse: SearchResponse): string {
    if (searchResponse.results.length === 0) {
      return '🔍 No search results found.';
    }

    let display = `🔍 **Web Search Results:**\n\n`;
    
    searchResponse.results.forEach((result, index) => {
      display += `**${index + 1}. [${result.title}](${result.url})**\n`;
      display += `${result.snippet}\n\n`;
    });

    return display;
  }

  // Removed HTML entity decode helper (no longer parsing HTML)

  /**
   * Detect if a query would benefit from web search
   * Returns true if the query seems to be asking about current events, dates, or real-time info
   */
  static shouldUseWebSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Keywords that suggest current/recent information or web lookup
    const currentKeywords = [
      // Time-sensitive
      'latest', 'recent', 'new', 'current', 'today', 'now', 'this year',
      '2024', '2025', '2026', 'update', 'news', 'breaking', 'just', 'happening',
      // Explicit search intent
      'search', 'find', 'lookup', 'look up', 'google', 'search for', 'find me',
      // Price/commerce/data
      'price', 'stock', 'weather', 'score', 'what is', 'who is', 'who are',
      // Location-based queries
      'near', 'near me', 'nearby', 'local', 'in the', 'area', 'where can i',
      'where is', 'how do i get', 'directions', 'located',
      // Business/service lookups
      'phone number', 'address', 'hours', 'open', 'reviews', 'rating',
      'best', 'top', 'recommended',
    ];

    return currentKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}
