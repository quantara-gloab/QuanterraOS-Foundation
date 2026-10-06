/**
 * Anthropic Model Context Protocol (MCP) — Open-Source Engine Specification
 *
 * Implements the standard Model Context Protocol (MCP v1.2) JSON-RPC 2.0 engine,
 * enabling sub-millisecond tool execution, dynamic prompt registration, and
 * structured context injection for high-velocity quantitative trading systems.
 */

export interface McpJsonRpcRequest<T = any> {
  jsonrpc: "2.0";
  id: string | number;
  method: string;
  params?: T;
}

export interface McpJsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  id: string | number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
  handler: (args: any, context?: any) => Promise<any> | any;
}

export interface McpResourceDefinition {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
  load: () => Promise<string> | string;
}

export interface McpPromptDefinition {
  name: string;
  description: string;
  arguments?: Array<{ name: string; description: string; required?: boolean }>;
  render: (args: Record<string, string>) => Array<{ role: "user" | "assistant" | "system"; content: string }>;
}

export interface McpServerCapabilities {
  tools?: { listChanged?: boolean };
  resources?: { subscribe?: boolean; listChanged?: boolean };
  prompts?: { listChanged?: boolean };
  logging?: Record<string, any>;
}

export class McpEngine {
  private tools = new Map<string, McpToolDefinition>();
  private resources = new Map<string, McpResourceDefinition>();
  private prompts = new Map<string, McpPromptDefinition>();
  private capabilities: McpServerCapabilities;
  private serverInfo = {
    name: "QuanterraOS-MCP-Engine",
    version: "1.2.0-f1-race",
  };

  constructor(capabilities: McpServerCapabilities = { tools: {}, resources: {}, prompts: {} }) {
    this.capabilities = capabilities;
  }

  registerTool(tool: McpToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  registerResource(resource: McpResourceDefinition): void {
    this.resources.set(resource.uri, resource);
  }

  registerPrompt(prompt: McpPromptDefinition): void {
    this.prompts.set(prompt.name, prompt);
  }

  listTools(): Array<{ name: string; description: string; inputSchema: any }> {
    return Array.from(this.tools.values()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  listResources(): Array<{ uri: string; name: string; mimeType: string; description?: string }> {
    return Array.from(this.resources.values()).map(r => ({
      uri: r.uri,
      name: r.name,
      mimeType: r.mimeType,
      description: r.description,
    }));
  }

  listPrompts(): Array<{ name: string; description: string; arguments?: any[] }> {
    return Array.from(this.prompts.values()).map(p => ({
      name: p.name,
      description: p.description,
      arguments: p.arguments,
    }));
  }

  async handleRequest(request: McpJsonRpcRequest): Promise<McpJsonRpcResponse> {
    const startTime = performance.now();

    try {
      switch (request.method) {
        case "initialize": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              protocolVersion: "2024-11-05",
              serverInfo: this.serverInfo,
              capabilities: this.capabilities,
            },
          };
        }

        case "tools/list": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { tools: this.listTools() },
          };
        }

        case "tools/call": {
          const { name, arguments: toolArgs } = request.params || {};
          const tool = this.tools.get(name);
          if (!tool) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32601, message: `Tool not found: ${name}` },
            };
          }
          const content = await tool.handler(toolArgs || {});
          const elapsed = (performance.now() - startTime).toFixed(2);
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              content: typeof content === "string" ? [{ type: "text", text: content }] : content,
              isError: false,
              _telemetry: { executionTimeMs: parseFloat(elapsed), engine: "MCP-v1.2-F1" },
            },
          };
        }

        case "resources/list": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { resources: this.listResources() },
          };
        }

        case "resources/read": {
          const { uri } = request.params || {};
          const res = this.resources.get(uri);
          if (!res) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32602, message: `Resource not found: ${uri}` },
            };
          }
          const contents = await res.load();
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: {
              contents: [{ uri, mimeType: res.mimeType, text: contents }],
            },
          };
        }

        case "prompts/list": {
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { prompts: this.listPrompts() },
          };
        }

        case "prompts/get": {
          const { name, arguments: promptArgs } = request.params || {};
          const prompt = this.prompts.get(name);
          if (!prompt) {
            return {
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32601, message: `Prompt not found: ${name}` },
            };
          }
          const messages = prompt.render(promptArgs || {});
          return {
            jsonrpc: "2.0",
            id: request.id,
            result: { messages },
          };
        }

        default:
          return {
            jsonrpc: "2.0",
            id: request.id,
            error: { code: -32601, message: `Unsupported method: ${request.method}` },
          };
      }
    } catch (err: any) {
      return {
        jsonrpc: "2.0",
        id: request.id,
        error: { code: -32000, message: err?.message || "Internal MCP error" },
      };
    }
  }
}
