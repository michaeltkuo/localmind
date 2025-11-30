// Query classification service for smart web search triggering
// Analyzes user queries to determine if web search is needed

export enum QueryType {
  EXPLICIT_SEARCH,      // "search for", "look up", "find"
  REAL_TIME_DATA,       // weather, stocks, sports scores
  VERY_RECENT_EVENT,    // "today", "yesterday", "breaking"
  CURRENT_EVENT,        // "recent", "latest", "new" (past week)
  GENERAL_CURRENT,      // "current", "now" (past month)
  FACTUAL,              // General knowledge questions
  CONCEPTUAL,           // "how", "why", "what is", "explain"
  CREATIVE,             // "write", "create", "imagine", "brainstorm"
  CONVERSATIONAL,       // greetings, self-referential
}

export class QueryClassifier {
  /**
   * Classify a user query into one of the QueryType categories
   * Uses regex patterns to detect keywords and intent
   */
  static classify(query: string): QueryType {
    const lower = query.toLowerCase();
    
    // Explicit search requests (highest priority)
    // Match patterns like "search for", "look up", "find information about"
    if (/\b(search|look\s*up|find|google)\s+(for|about|information)?\b/i.test(query)) {
      return QueryType.EXPLICIT_SEARCH;
    }
    
    // Real-time data queries
    // Weather, stocks, sports scores - data that changes constantly
    if (/\b(weather|temperature|forecast|stock\s*price|score|game\s*result)\b/i.test(lower)) {
      return QueryType.REAL_TIME_DATA;
    }
    
    // Very recent events (today/yesterday)
    // Events from past 24-48 hours
    if (/\b(today|yesterday|tonight|this\s*morning|breaking|just\s*announced)\b/i.test(lower)) {
      return QueryType.VERY_RECENT_EVENT;
    }
    
    // Current events (this week)
    // Recent developments, latest news
    if (/\b(latest|recent|new|this\s*week|currently)\b/i.test(lower)) {
      return QueryType.CURRENT_EVENT;
    }
    
    // General current (this month/year)
    // Current state of things, present situation
    if (/\b(current|now|nowadays|2025)\b/i.test(lower)) {
      return QueryType.GENERAL_CURRENT;
    }
    
    // Creative tasks
    // Writing, brainstorming, imagination - no external info needed
    if (/\b(write|create|generate|compose|draft|brainstorm|imagine)\b/i.test(lower)) {
      return QueryType.CREATIVE;
    }
    
    // Conceptual questions
    // How/why questions, definitions, explanations
    if (/\b(how\s+does|how\s+do|what\s+is|why\s+is|why\s+do|explain|define|difference\s+between)\b/i.test(lower)) {
      return QueryType.CONCEPTUAL;
    }
    
    // Conversational
    // Greetings, self-referential questions
    if (/\b(hello|hi|hey|what\s+can\s+you|who\s+are\s+you|help\s+me|thank|thanks)\b/i.test(lower)) {
      return QueryType.CONVERSATIONAL;
    }
    
    // Default to factual for everything else
    return QueryType.FACTUAL;
  }
  
  /**
   * Determine if a query type should FORCE search to be enabled
   * These are queries that definitely need current web information
   */
  static shouldForceSearch(queryType: QueryType): boolean {
    return [
      QueryType.EXPLICIT_SEARCH,
      QueryType.REAL_TIME_DATA,
      QueryType.VERY_RECENT_EVENT,
    ].includes(queryType);
  }
  
  /**
   * Determine if a query type should DISABLE search
   * These are queries that definitely don't need web search
   */
  static shouldDisableSearch(queryType: QueryType): boolean {
    return [
      QueryType.CONCEPTUAL,
      QueryType.CREATIVE,
      QueryType.CONVERSATIONAL,
      QueryType.FACTUAL,
    ].includes(queryType);
  }
  
  /**
   * Get a human-readable description of the query type
   * Useful for debugging and UI feedback
   */
  static getTypeDescription(queryType: QueryType): string {
    const descriptions: Record<QueryType, string> = {
      [QueryType.EXPLICIT_SEARCH]: 'Explicit search request',
      [QueryType.REAL_TIME_DATA]: 'Real-time data query',
      [QueryType.VERY_RECENT_EVENT]: 'Very recent event (24-48 hours)',
      [QueryType.CURRENT_EVENT]: 'Current event (past week)',
      [QueryType.GENERAL_CURRENT]: 'General current information',
      [QueryType.FACTUAL]: 'Factual question',
      [QueryType.CONCEPTUAL]: 'Conceptual question',
      [QueryType.CREATIVE]: 'Creative task',
      [QueryType.CONVERSATIONAL]: 'Conversational',
    };
    
    return descriptions[queryType];
  }
}
