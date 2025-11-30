// Query Classifier Test Suite
// Tests classification accuracy for different query types
//
// NOTE: This project doesn't have a test runner configured yet.
// To run these tests, install Jest:
// npm install --save-dev jest @types/jest ts-jest
// Then add to package.json: "test": "jest"
//
// For now, these tests serve as documentation of expected behavior
// and can be manually verified in the console.

import { QueryClassifier, QueryType } from '../query-classifier.service';

// Uncomment the following lines when Jest is installed:
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck

describe('QueryClassifier', () => {
  describe('Explicit Search Requests', () => {
    test('should classify "search for" queries', () => {
      expect(QueryClassifier.classify('search for latest AI news')).toBe(QueryType.EXPLICIT_SEARCH);
      expect(QueryClassifier.classify('can you search for iPhone 16 reviews')).toBe(QueryType.EXPLICIT_SEARCH);
      expect(QueryClassifier.classify('look up information about quantum computing')).toBe(QueryType.EXPLICIT_SEARCH);
    });

    test('should classify "find" queries', () => {
      expect(QueryClassifier.classify('find information about Tesla')).toBe(QueryType.EXPLICIT_SEARCH);
      expect(QueryClassifier.classify('please find articles about climate change')).toBe(QueryType.EXPLICIT_SEARCH);
    });

    test('should force search for explicit requests', () => {
      expect(QueryClassifier.shouldForceSearch(QueryType.EXPLICIT_SEARCH)).toBe(true);
    });
  });

  describe('Real-Time Data Queries', () => {
    test('should classify weather queries', () => {
      expect(QueryClassifier.classify('What\'s the weather in Tokyo?')).toBe(QueryType.REAL_TIME_DATA);
      expect(QueryClassifier.classify('weather forecast for London')).toBe(QueryType.REAL_TIME_DATA);
      expect(QueryClassifier.classify('current temperature in Paris')).toBe(QueryType.REAL_TIME_DATA);
    });

    test('should classify stock price queries', () => {
      expect(QueryClassifier.classify('What\'s Apple stock price?')).toBe(QueryType.REAL_TIME_DATA);
      expect(QueryClassifier.classify('Tesla stock price today')).toBe(QueryType.REAL_TIME_DATA);
      expect(QueryClassifier.classify('current MSFT stock price')).toBe(QueryType.REAL_TIME_DATA);
    });

    test('should classify sports score queries', () => {
      expect(QueryClassifier.classify('Who won the game yesterday?')).toBe(QueryType.VERY_RECENT_EVENT); // Note: "yesterday" triggers VERY_RECENT_EVENT
      expect(QueryClassifier.classify('Lakers game score')).toBe(QueryType.REAL_TIME_DATA);
      expect(QueryClassifier.classify('game result for Warriors')).toBe(QueryType.REAL_TIME_DATA);
    });

    test('should force search for real-time data', () => {
      expect(QueryClassifier.shouldForceSearch(QueryType.REAL_TIME_DATA)).toBe(true);
    });
  });

  describe('Very Recent Events', () => {
    test('should classify today/yesterday queries', () => {
      expect(QueryClassifier.classify('What happened at the conference today?')).toBe(QueryType.VERY_RECENT_EVENT);
      expect(QueryClassifier.classify('news from yesterday')).toBe(QueryType.VERY_RECENT_EVENT);
      expect(QueryClassifier.classify('this morning\'s announcement')).toBe(QueryType.VERY_RECENT_EVENT);
    });

    test('should classify breaking news', () => {
      expect(QueryClassifier.classify('breaking news about elections')).toBe(QueryType.VERY_RECENT_EVENT);
      expect(QueryClassifier.classify('just announced features')).toBe(QueryType.VERY_RECENT_EVENT);
    });

    test('should force search for very recent events', () => {
      expect(QueryClassifier.shouldForceSearch(QueryType.VERY_RECENT_EVENT)).toBe(true);
    });
  });

  describe('Current Events', () => {
    test('should classify latest/recent queries', () => {
      expect(QueryClassifier.classify('latest developments in AI')).toBe(QueryType.CURRENT_EVENT);
      expect(QueryClassifier.classify('recent news about SpaceX')).toBe(QueryType.CURRENT_EVENT);
      expect(QueryClassifier.classify('new features in iOS')).toBe(QueryType.CURRENT_EVENT);
    });

    test('should classify this week queries', () => {
      expect(QueryClassifier.classify('What happened this week in tech?')).toBe(QueryType.CURRENT_EVENT);
      expect(QueryClassifier.classify('currently trending topics')).toBe(QueryType.CURRENT_EVENT);
    });

    test('should NOT force search for current events (borderline)', () => {
      expect(QueryClassifier.shouldForceSearch(QueryType.CURRENT_EVENT)).toBe(false);
      expect(QueryClassifier.shouldDisableSearch(QueryType.CURRENT_EVENT)).toBe(false);
      // This is a borderline case - model should decide
    });
  });

  describe('General Current Information', () => {
    test('should classify current state queries', () => {
      expect(QueryClassifier.classify('What\'s the current state of Twitter?')).toBe(QueryType.GENERAL_CURRENT);
      expect(QueryClassifier.classify('Tell me about AI now')).toBe(QueryType.GENERAL_CURRENT);
      expect(QueryClassifier.classify('nowadays social media trends')).toBe(QueryType.GENERAL_CURRENT);
    });

    test('should classify year-specific queries', () => {
      expect(QueryClassifier.classify('What\'s new in 2025?')).toBe(QueryType.GENERAL_CURRENT);
    });

    test('should NOT force or disable search (borderline)', () => {
      expect(QueryClassifier.shouldForceSearch(QueryType.GENERAL_CURRENT)).toBe(false);
      expect(QueryClassifier.shouldDisableSearch(QueryType.GENERAL_CURRENT)).toBe(false);
    });
  });

  describe('Conceptual Questions', () => {
    test('should classify how/why questions', () => {
      expect(QueryClassifier.classify('How does photosynthesis work?')).toBe(QueryType.CONCEPTUAL);
      expect(QueryClassifier.classify('What is machine learning?')).toBe(QueryType.CONCEPTUAL);
      expect(QueryClassifier.classify('Why is the sky blue?')).toBe(QueryType.CONCEPTUAL);
      expect(QueryClassifier.classify('Explain recursion in programming')).toBe(QueryType.CONCEPTUAL);
    });

    test('should classify definition queries', () => {
      expect(QueryClassifier.classify('Define quantum computing')).toBe(QueryType.CONCEPTUAL);
      expect(QueryClassifier.classify('What\'s the difference between AI and ML?')).toBe(QueryType.CONCEPTUAL);
    });

    test('should disable search for conceptual questions', () => {
      expect(QueryClassifier.shouldDisableSearch(QueryType.CONCEPTUAL)).toBe(true);
    });
  });

  describe('Creative Tasks', () => {
    test('should classify creative writing requests', () => {
      expect(QueryClassifier.classify('Write a poem about cats')).toBe(QueryType.CREATIVE);
      expect(QueryClassifier.classify('Create a story about dragons')).toBe(QueryType.CREATIVE);
      expect(QueryClassifier.classify('Generate a business name for a coffee shop')).toBe(QueryType.CREATIVE);
    });

    test('should classify brainstorming requests', () => {
      expect(QueryClassifier.classify('Brainstorm ideas for a startup')).toBe(QueryType.CREATIVE);
      expect(QueryClassifier.classify('Help me imagine a future city')).toBe(QueryType.CREATIVE);
    });

    test('should disable search for creative tasks', () => {
      expect(QueryClassifier.shouldDisableSearch(QueryType.CREATIVE)).toBe(true);
    });
  });

  describe('Conversational Queries', () => {
    test('should classify greetings', () => {
      expect(QueryClassifier.classify('Hello!')).toBe(QueryType.CONVERSATIONAL);
      expect(QueryClassifier.classify('Hi there')).toBe(QueryType.CONVERSATIONAL);
      expect(QueryClassifier.classify('Hey, how are you?')).toBe(QueryType.CONVERSATIONAL);
    });

    test('should classify self-referential questions', () => {
      expect(QueryClassifier.classify('What can you do?')).toBe(QueryType.CONVERSATIONAL);
      expect(QueryClassifier.classify('Who are you?')).toBe(QueryType.CONVERSATIONAL);
      expect(QueryClassifier.classify('Can you help me?')).toBe(QueryType.CONVERSATIONAL);
    });

    test('should classify thanks/gratitude', () => {
      expect(QueryClassifier.classify('Thank you!')).toBe(QueryType.CONVERSATIONAL);
      expect(QueryClassifier.classify('Thanks for your help')).toBe(QueryType.CONVERSATIONAL);
    });

    test('should disable search for conversational queries', () => {
      expect(QueryClassifier.shouldDisableSearch(QueryType.CONVERSATIONAL)).toBe(true);
    });
  });

  describe('Factual Questions', () => {
    test('should classify historical facts as factual', () => {
      expect(QueryClassifier.classify('When did World War II end?')).toBe(QueryType.FACTUAL);
      expect(QueryClassifier.classify('Who wrote Pride and Prejudice?')).toBe(QueryType.FACTUAL);
      expect(QueryClassifier.classify('What is the capital of France?')).toBe(QueryType.FACTUAL);
    });

    test('should disable search for factual questions', () => {
      expect(QueryClassifier.shouldDisableSearch(QueryType.FACTUAL)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle ambiguous queries with temporal keywords', () => {
      // "recent" should trigger CURRENT_EVENT, not CONCEPTUAL even if "how" is present
      const result = QueryClassifier.classify('How recent is this information?');
      expect(result).toBe(QueryType.CURRENT_EVENT);
    });

    test('should prioritize explicit search over other classifications', () => {
      // Even if query has "how", explicit search should take precedence
      const result = QueryClassifier.classify('search for how to build a website');
      expect(result).toBe(QueryType.EXPLICIT_SEARCH);
    });

    test('should handle mixed signals gracefully', () => {
      // "write" (creative) but "latest" (current) - first match wins
      const result = QueryClassifier.classify('write about latest AI trends');
      expect(result).toBe(QueryType.CURRENT_EVENT); // "latest" comes first in regex order
    });

    test('should handle empty or very short queries', () => {
      expect(QueryClassifier.classify('')).toBe(QueryType.FACTUAL); // Default
      expect(QueryClassifier.classify('help')).toBe(QueryType.CONVERSATIONAL);
    });
  });

  describe('getTypeDescription', () => {
    test('should return readable descriptions', () => {
      expect(QueryClassifier.getTypeDescription(QueryType.EXPLICIT_SEARCH)).toBe('Explicit search request');
      expect(QueryClassifier.getTypeDescription(QueryType.REAL_TIME_DATA)).toBe('Real-time data query');
      expect(QueryClassifier.getTypeDescription(QueryType.VERY_RECENT_EVENT)).toBe('Very recent event (24-48 hours)');
      expect(QueryClassifier.getTypeDescription(QueryType.CURRENT_EVENT)).toBe('Current event (past week)');
      expect(QueryClassifier.getTypeDescription(QueryType.GENERAL_CURRENT)).toBe('General current information');
      expect(QueryClassifier.getTypeDescription(QueryType.FACTUAL)).toBe('Factual question');
      expect(QueryClassifier.getTypeDescription(QueryType.CONCEPTUAL)).toBe('Conceptual question');
      expect(QueryClassifier.getTypeDescription(QueryType.CREATIVE)).toBe('Creative task');
      expect(QueryClassifier.getTypeDescription(QueryType.CONVERSATIONAL)).toBe('Conversational');
    });
  });

  describe('Realistic User Queries', () => {
    test('should correctly classify common real-world queries', () => {
      // Should search
      expect(QueryClassifier.shouldForceSearch(
        QueryClassifier.classify('What\'s the weather like today?')
      )).toBe(true);

      expect(QueryClassifier.shouldForceSearch(
        QueryClassifier.classify('Search for the latest iPhone release date')
      )).toBe(true);

      // Should not search
      expect(QueryClassifier.shouldDisableSearch(
        QueryClassifier.classify('Explain how neural networks work')
      )).toBe(true);

      expect(QueryClassifier.shouldDisableSearch(
        QueryClassifier.classify('Write me a haiku about winter')
      )).toBe(true);

      expect(QueryClassifier.shouldDisableSearch(
        QueryClassifier.classify('What is the difference between Java and JavaScript?')
      )).toBe(true);

      // Borderline - let model decide
      const borderlineQuery = QueryClassifier.classify('Tell me about recent advances in quantum computing');
      expect(QueryClassifier.shouldForceSearch(borderlineQuery)).toBe(false);
      expect(QueryClassifier.shouldDisableSearch(borderlineQuery)).toBe(false);
    });
  });
});
