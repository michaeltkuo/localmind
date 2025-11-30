// Debug logging service for search operations
// Phase 3B: Track search queries, results, performance, and errors

export interface SearchLog {
  id: string;
  timestamp: number;
  query: string;
  searchMode: 'off' | 'smart' | 'auto';
  forcedSearch: boolean;
  modelName: string;
  
  // Search execution
  searchTriggered: boolean;
  searchQuery?: string; // The actual query sent to search API
  searchDuration?: number; // milliseconds
  searchResultCount?: number;
  
  // Results
  searchResults?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  
  // Response
  modelResponse?: string;
  responseDuration?: number;
  citationsUsed?: number[]; // Which citations were used [1], [2], etc.
  
  // Errors
  error?: string;
  errorType?: 'search_failed' | 'model_error' | 'timeout' | 'rate_limit' | 'network';
  
  // Performance
  totalDuration?: number;
  tokenCount?: number;
}

export interface DebugStats {
  totalQueries: number;
  searchQueries: number;
  successfulSearches: number;
  failedSearches: number;
  averageSearchDuration: number;
  averageResponseDuration: number;
  totalTokensUsed: number;
}

class SearchDebugService {
  private logs: SearchLog[] = [];
  private maxLogs = 100; // Keep last 100 logs
  private storageKey = 'localmind_search_debug_logs';
  
  constructor() {
    this.loadLogs();
  }
  
  /**
   * Create a new log entry
   */
  startLog(query: string, searchMode: string, forcedSearch: boolean, modelName: string): string {
    const log: SearchLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      query,
      searchMode: searchMode as 'off' | 'smart' | 'auto',
      forcedSearch,
      modelName,
      searchTriggered: false,
    };
    
    this.logs.unshift(log); // Add to beginning
    
    // Keep only maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    this.saveLogs();
    return log.id;
  }
  
  /**
   * Update log when search is triggered
   */
  logSearchStart(logId: string, searchQuery: string) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.searchTriggered = true;
      log.searchQuery = searchQuery;
      this.saveLogs();
    }
  }
  
  /**
   * Update log with search results
   */
  logSearchComplete(
    logId: string,
    results: Array<{ title: string; url: string; snippet: string }>,
    duration: number
  ) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.searchResults = results;
      log.searchResultCount = results.length;
      log.searchDuration = duration;
      this.saveLogs();
    }
  }
  
  /**
   * Update log with search error
   */
  logSearchError(logId: string, error: string, errorType: SearchLog['errorType']) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.error = error;
      log.errorType = errorType;
      this.saveLogs();
    }
  }
  
  /**
   * Update log with model response
   */
  logModelResponse(
    logId: string,
    response: string,
    duration: number,
    tokenCount?: number
  ) {
    const log = this.logs.find(l => l.id === logId);
    if (log) {
      log.modelResponse = response;
      log.responseDuration = duration;
      log.tokenCount = tokenCount;
      
      // Calculate total duration
      log.totalDuration = (log.searchDuration || 0) + duration;
      
      // Extract citation numbers from response
      const citationMatches = response.match(/\[(\d+)\]/g);
      if (citationMatches) {
        log.citationsUsed = [...new Set(citationMatches.map(m => parseInt(m.match(/\d+/)![0])))];
      }
      
      this.saveLogs();
    }
  }
  
  /**
   * Get all logs
   */
  getLogs(): SearchLog[] {
    return [...this.logs];
  }
  
  /**
   * Get logs filtered by criteria
   */
  getFilteredLogs(filter: {
    searchOnly?: boolean;
    errorsOnly?: boolean;
    modelName?: string;
    since?: number; // timestamp
  }): SearchLog[] {
    let filtered = this.logs;
    
    if (filter.searchOnly) {
      filtered = filtered.filter(log => log.searchTriggered);
    }
    
    if (filter.errorsOnly) {
      filtered = filtered.filter(log => log.error);
    }
    
    if (filter.modelName) {
      filtered = filtered.filter(log => log.modelName === filter.modelName);
    }
    
    if (filter.since !== undefined) {
      const since = filter.since;
      filtered = filtered.filter(log => log.timestamp >= since);
    }
    
    return filtered;
  }
  
  /**
   * Get statistics
   */
  getStats(): DebugStats {
    const searchLogs = this.logs.filter(log => log.searchTriggered);
    const successfulSearches = searchLogs.filter(log => log.searchResults && log.searchResults.length > 0);
    const failedSearches = searchLogs.filter(log => log.error);
    
    const avgSearchDuration = searchLogs.length > 0
      ? searchLogs.reduce((sum, log) => sum + (log.searchDuration || 0), 0) / searchLogs.length
      : 0;
      
    const avgResponseDuration = this.logs.length > 0
      ? this.logs.reduce((sum, log) => sum + (log.responseDuration || 0), 0) / this.logs.length
      : 0;
      
    const totalTokens = this.logs.reduce((sum, log) => sum + (log.tokenCount || 0), 0);
    
    return {
      totalQueries: this.logs.length,
      searchQueries: searchLogs.length,
      successfulSearches: successfulSearches.length,
      failedSearches: failedSearches.length,
      averageSearchDuration: Math.round(avgSearchDuration),
      averageResponseDuration: Math.round(avgResponseDuration),
      totalTokensUsed: totalTokens,
    };
  }
  
  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify({
      exported: new Date().toISOString(),
      version: '1.0',
      stats: this.getStats(),
      logs: this.logs,
    }, null, 2);
  }
  
  /**
   * Export logs as CSV
   */
  exportLogsCSV(): string {
    const headers = [
      'Timestamp',
      'Query',
      'Model',
      'Search Mode',
      'Forced',
      'Search Triggered',
      'Search Query',
      'Result Count',
      'Search Duration (ms)',
      'Response Duration (ms)',
      'Total Duration (ms)',
      'Citations',
      'Error',
    ];
    
    const rows = this.logs.map(log => [
      new Date(log.timestamp).toISOString(),
      `"${log.query.replace(/"/g, '""')}"`,
      log.modelName,
      log.searchMode,
      log.forcedSearch ? 'Yes' : 'No',
      log.searchTriggered ? 'Yes' : 'No',
      log.searchQuery ? `"${log.searchQuery.replace(/"/g, '""')}"` : '',
      log.searchResultCount || 0,
      log.searchDuration || 0,
      log.responseDuration || 0,
      log.totalDuration || 0,
      log.citationsUsed ? log.citationsUsed.join(',') : '',
      log.error ? `"${log.error.replace(/"/g, '""')}"` : '',
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
  
  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogs();
  }
  
  /**
   * Clear old logs (older than X days)
   */
  clearOldLogs(daysOld: number) {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp >= cutoff);
    this.saveLogs();
  }
  
  /**
   * Save logs to localStorage
   */
  private saveLogs() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
    } catch (error) {
      console.error('[DebugService] Failed to save logs:', error);
    }
  }
  
  /**
   * Load logs from localStorage
   */
  private loadLogs() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('[DebugService] Failed to load logs:', error);
      this.logs = [];
    }
  }
}

// Export singleton instance
export const debugService = new SearchDebugService();
