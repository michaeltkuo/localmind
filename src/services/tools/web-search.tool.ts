// Web Search Tool
// Provides web search capability to the LLM via Ollama's web search or DuckDuckGo

import { BaseTool, type ToolExecutionResult } from './base.tool';
import { SearchService, type SearchResult } from '../search.service';

export interface WebSearchArgs {
  query: string;
  max_results?: number;
}

export class WebSearchTool extends BaseTool {
  name = 'web_search';
  description = 'Search the web ONLY when you need information about: (1) Real-time data that changes minute-to-minute (weather, stocks, sports scores), (2) Events from the past 48 hours, (3) Explicit user requests to search. DO NOT use for general knowledge, historical facts, conceptual explanations, or creative tasks.';
  
  parameters = {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query to look up on the web',
      },
      max_results: {
        type: 'number',
        description: 'Maximum number of search results to return (default: 5, max: 10)',
      },
    },
    required: ['query'],
  };

  async execute(args: Record<string, any>): Promise<ToolExecutionResult> {
    // Validate arguments
    const validation = this.validateArgs(args);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const { query, max_results = 8 } = args as WebSearchArgs; // Increased to 8 for better citation coverage

    // Validate max_results range
    const maxResults = Math.min(Math.max(1, max_results), 10); // Max 10 results

    try {
      console.log(`[WebSearchTool] Searching for: "${query}" (max ${maxResults} results)`);
      
      const searchResponse = await SearchService.search(query, maxResults);

      if (!searchResponse.results || searchResponse.results.length === 0) {
        return {
          success: true,
          data: {
            query,
            results: [],
            message: 'No search results found',
          },
        };
      }

      // Format results for the LLM
      const formattedResults = this.formatResultsForLLM(searchResponse.results);

      return {
        success: true,
        data: {
          query,
          results: searchResponse.results,
          formatted: formattedResults,
          count: searchResponse.results.length,
        },
      };
    } catch (error) {
      console.error('[WebSearchTool] Search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform web search',
      };
    }
  }

  /**
   * Format search results in a way that's easy for the LLM to parse and cite
   */
  private formatResultsForLLM(results: SearchResult[]): string {
    let formatted = '\n=== Web Search Results ===\n\n';
    
    results.forEach((result, idx) => {
      formatted += `[${idx + 1}] ${result.title}\n`;
      formatted += `${result.snippet}\n`;
      formatted += `Source: ${result.url}\n\n`;
    });
    
    formatted += `=== End of ${results.length} Results ===\n\n`;
    formatted += `Use the above information to provide a comprehensive answer. Cite sources inline using [1], [2], etc. after relevant facts. Only cite sources [1]-[${results.length}] that actually exist above.\n`;
    
    return formatted;
  }
}

// Create and export a singleton instance
export const webSearchTool = new WebSearchTool();
