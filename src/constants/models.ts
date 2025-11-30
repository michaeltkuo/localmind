// Model capabilities and constants
// Tracks which models support tool calling
//
// NOTE: For web search agents, Ollama recommends models with ~32k context length
// to handle search results effectively. Cloud models run at full context length.
// See: https://docs.ollama.com/capabilities/web-search#building-a-search-agent

/**
 * Models that support native tool calling
 * Based on https://ollama.com/search?c=tools
 */
export const TOOL_SUPPORTED_MODELS = [
  // Llama family
  'llama3.1',
  'llama3.2',
  'llama3.3',
  'llama4',
  'llama3-groq-tool-use',
  
  // Qwen family
  'qwen2',
  'qwen2.5',
  'qwen2.5-coder',
  'qwen3',
  'qwen3-coder',
  'qwen3-vl',
  'qwq',
  
  // Mistral family
  'mistral',
  'mistral-nemo',
  'mistral-small',
  'mistral-small3.1',
  'mistral-small3.2',
  'mistral-large',
  
  // DeepSeek
  'deepseek-r1',
  'deepseek-v3',
  'deepseek-v3.1',
  
  // Command family
  'command-r',
  'command-r-plus',
  'command-r7b',
  'command-r7b-arabic',
  'command-a',
  
  // Granite family
  'granite3-dense',
  'granite3.1-dense',
  'granite3.1-moe',
  'granite3-moe',
  'granite3.2',
  'granite3.2-vision',
  'granite3.3',
  'granite4',
  
  // Other models with tool support
  'mixtral',
  'hermes3',
  'nemotron',
  'nemotron-mini',
  'firefunction-v2',
  'gpt-oss',
  'gpt-oss-safeguard',
  'cogito',
  'magistral',
  'phi4-mini',
  'smollm2',
  'devstral',
  'athene-v2',
  'aya-expanse',
];

/**
 * Recommended models for web search with tool calling
 */
export const RECOMMENDED_TOOL_MODELS = [
  { name: 'llama3.2:3b', description: 'Lightweight, fast, excellent tool support' },
  { name: 'qwen3:4b', description: 'Best balance of speed and quality' },
  { name: 'mistral-nemo:12b', description: 'Larger context, better reasoning' },
  { name: 'deepseek-r1:7b', description: 'Strong reasoning capabilities' },
];

/**
 * Check if a model supports tool calling
 * @param modelName - Full model name (e.g., 'llama3.2:latest', 'qwen3:4b')
 * @returns true if model supports tools, false otherwise
 */
export function supportsTools(modelName: string): boolean {
  if (!modelName) return false;
  
  // Extract base model name (before : or -)
  const baseName = modelName.toLowerCase().split(':')[0].split('-')[0];
  
  // Check if any supported model starts with this base name
  return TOOL_SUPPORTED_MODELS.some(model => {
    const supportedBase = model.toLowerCase().split('-')[0];
    return baseName.startsWith(supportedBase) || supportedBase.startsWith(baseName);
  });
}

/**
 * Get recommended alternative models when current model doesn't support tools
 */
export function getRecommendedModels(): string[] {
  return RECOMMENDED_TOOL_MODELS.map(m => m.name);
}

/**
 * Get a user-friendly message about tool support
 */
export function getToolSupportMessage(modelName: string): string {
  if (supportsTools(modelName)) {
    return `✓ "${modelName}" supports tool calling`;
  }
  
  const recommendations = RECOMMENDED_TOOL_MODELS.map(m => m.name).join(', ');
  return `⚠️ "${modelName}" doesn't support tool calling. Try: ${recommendations}`;
}

/**
 * Model context window limits (in tokens)
 * Used for warning when approaching context limits with web search
 */
export const MODEL_CONTEXT_LIMITS: Record<string, number> = {
  // Llama models
  'llama3.2': 128000,
  'llama3.1': 128000,
  'llama3.3': 128000,
  'llama4': 128000,
  
  // Qwen models
  'qwen2': 32768,
  'qwen2.5': 32768,
  'qwen3': 32768,
  'qwq': 32768,
  
  // Mistral models
  'mistral': 128000,
  'mistral-nemo': 128000,
  'ministral': 128000,
  
  // DeepSeek models
  'deepseek-r1': 65536,
  'deepseek-v3': 65536,
  
  // Phi models (smaller context)
  'phi3': 4096,
  'phi4': 16384,
  
  // Gemma models
  'gemma': 8192,
  'gemma2': 8192,
  
  // Default fallback
  'default': 4096,
};

/**
 * Get context window limit for a model
 * @param modelName - Full model name (e.g., 'llama3.2:latest')
 * @returns Context window size in tokens
 */
export function getContextLimit(modelName: string): number {
  if (!modelName) return MODEL_CONTEXT_LIMITS.default;
  
  // Extract base model name
  const baseName = modelName.toLowerCase().split(':')[0];
  
  // Check for exact match first
  if (MODEL_CONTEXT_LIMITS[baseName]) {
    return MODEL_CONTEXT_LIMITS[baseName];
  }
  
  // Check for partial match
  for (const [key, limit] of Object.entries(MODEL_CONTEXT_LIMITS)) {
    if (baseName.startsWith(key) || key.startsWith(baseName)) {
      return limit;
    }
  }
  
  return MODEL_CONTEXT_LIMITS.default;
}

/**
 * Estimate token count for a string
 * Rough approximation: ~4 characters per token for English text
 * @param text - Text to estimate tokens for
 * @returns Estimated token count
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Rough approximation: 1 token ≈ 4 characters for English
  return Math.ceil(text.length / 4);
}

/**
 * Check if adding text would exceed context limit
 * @param currentTokens - Current token count
 * @param additionalText - Text to be added
 * @param modelName - Model name to check limit for
 * @param threshold - Warning threshold (0.0 to 1.0, default 0.8 = 80%)
 * @returns Object with isNearLimit and percentUsed
 */
export function checkContextLimit(
  currentTokens: number,
  additionalText: string,
  modelName: string,
  threshold: number = 0.8
): { isNearLimit: boolean; percentUsed: number; limit: number } {
  const limit = getContextLimit(modelName);
  const additionalTokens = estimateTokenCount(additionalText);
  const totalTokens = currentTokens + additionalTokens;
  const percentUsed = totalTokens / limit;
  
  return {
    isNearLimit: percentUsed >= threshold,
    percentUsed,
    limit,
  };
}
