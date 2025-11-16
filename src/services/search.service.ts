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
      // Use DuckDuckGo's instant answer API
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_html=1&skip_disambig=1`
      );

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];

      // Extract abstract if available
      if (data.Abstract && data.AbstractText) {
        results.push({
          title: data.Heading || 'Overview',
          snippet: data.AbstractText,
          url: data.AbstractURL || data.AbstractSource || '',
        });
      }

      // Extract related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics.slice(0, maxResults - results.length)) {
          // Skip topic groups
          if (topic.Topics) continue;
          
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related',
              snippet: topic.Text,
              url: topic.FirstURL,
            });
          }
        }
      }

      // If no results from instant answer, try HTML scraping as fallback
      if (results.length === 0) {
        const htmlResults = await this.searchDuckDuckGoHTML(query, maxResults);
        results.push(...htmlResults);
      }

      return {
        query,
        results: results.slice(0, maxResults),
        timestamp: Date.now(),
      };
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
  private static async searchDuckDuckGoHTML(
    query: string,
    maxResults: number
  ): Promise<SearchResult[]> {
    try {
      const encodedQuery = encodeURIComponent(query);
      const response = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodedQuery}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const html = await response.text();
      const results: SearchResult[] = [];

      // Parse HTML using regex (simple parsing for basic results)
      // Look for result links and snippets
      const resultPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/g;
      
      let match;
      while ((match = resultPattern.exec(html)) !== null && results.length < maxResults) {
        const url = this.decodeHTMLEntities(match[1]);
        const title = this.decodeHTMLEntities(match[2]);
        const snippet = this.decodeHTMLEntities(match[3]);

        if (url && title) {
          results.push({
            url,
            title,
            snippet: snippet || title,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('HTML search error:', error);
      return [];
    }
  }

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

  /**
   * Helper to decode HTML entities
   */
  private static decodeHTMLEntities(text: string): string {
    const textArea = document.createElement('textarea');
    textArea.innerHTML = text;
    return textArea.value;
  }

  /**
   * Detect if a query would benefit from web search
   * Returns true if the query seems to be asking about current events, dates, or real-time info
   */
  static shouldUseWebSearch(query: string): boolean {
    const lowerQuery = query.toLowerCase();
    
    // Keywords that suggest current/recent information
    const currentKeywords = [
      'latest', 'recent', 'new', 'current', 'today', 'now', 'this year',
      '2024', '2025', 'update', 'news', 'breaking', 'just', 'happening',
      'price', 'stock', 'weather', 'score', 'what is', 'who is',
    ];

    return currentKeywords.some(keyword => lowerQuery.includes(keyword));
  }
}
