// Tool registry for managing available tools
// Provides centralized tool management and execution

import type { Tool, ToolDefinition, ToolExecutionResult } from './base.tool';

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool in the registry
   */
  register(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      console.warn(`Tool "${tool.name}" is already registered. Overwriting.`);
    }
    this.tools.set(tool.name, tool);
    console.log(`[ToolRegistry] Registered tool: ${tool.name}`);
  }

  /**
   * Unregister a tool from the registry
   */
  unregister(toolName: string): boolean {
    const result = this.tools.delete(toolName);
    if (result) {
      console.log(`[ToolRegistry] Unregistered tool: ${toolName}`);
    }
    return result;
  }

  /**
   * Get a specific tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Check if a tool is registered
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get all registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool definitions in Ollama-compatible format
   * This is what we pass to the Ollama API
   */
  getToolDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => tool.getDefinition());
  }

  /**
   * Execute a tool by name with given arguments
   */
  async execute(toolName: string, args: Record<string, any>): Promise<ToolExecutionResult> {
    const tool = this.tools.get(toolName);
    
    if (!tool) {
      return {
        success: false,
        error: `Tool "${toolName}" not found in registry`,
      };
    }

    try {
      console.log(`[ToolRegistry] Executing tool: ${toolName}`, args);
      const result = await tool.execute(args);
      console.log(`[ToolRegistry] Tool execution result:`, result);
      return result;
    } catch (error) {
      console.error(`[ToolRegistry] Tool execution error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during tool execution',
      };
    }
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear();
    console.log('[ToolRegistry] Cleared all tools');
  }

  /**
   * Get the number of registered tools
   */
  get size(): number {
    return this.tools.size;
  }
}

// Create and export a singleton instance
export const toolRegistry = new ToolRegistry();
