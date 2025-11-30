// Base tool interface for extensible tool system
// All tools must implement this interface to be used by the LLM

export interface ToolParameter {
  type: string;
  description: string;
  enum?: string[];
  items?: ToolParameter;
  properties?: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, ToolParameter>;
      required?: string[];
    };
  };
}

export interface ToolExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface Tool {
  // Tool metadata
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };

  // Tool execution
  execute(args: Record<string, any>): Promise<ToolExecutionResult>;

  // Get Ollama-compatible tool definition
  getDefinition(): ToolDefinition;
}

/**
 * Abstract base class for tools
 * Provides common functionality and enforces interface
 */
export abstract class BaseTool implements Tool {
  abstract name: string;
  abstract description: string;
  abstract parameters: {
    type: 'object';
    properties: Record<string, ToolParameter>;
    required?: string[];
  };

  abstract execute(args: Record<string, any>): Promise<ToolExecutionResult>;

  getDefinition(): ToolDefinition {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    };
  }

  /**
   * Validate arguments against parameter schema
   */
  protected validateArgs(args: Record<string, any>): { valid: boolean; error?: string } {
    const required = this.parameters.required || [];
    
    for (const requiredParam of required) {
      if (!(requiredParam in args) || args[requiredParam] === undefined || args[requiredParam] === null) {
        return {
          valid: false,
          error: `Missing required parameter: ${requiredParam}`,
        };
      }
    }

    return { valid: true };
  }
}
