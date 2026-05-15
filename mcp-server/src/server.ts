import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  TextContent,
} from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as dotenv from 'dotenv';
import { OllamaAdapter } from './ollama-adapter.js';

// Load environment variables
dotenv.config();

// Configuration from environment
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama2';
const OLLAMA_TIMEOUT = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10);

// Initialize Ollama adapter
const ollamaAdapter = new OllamaAdapter({
  host: OLLAMA_HOST,
  model: OLLAMA_MODEL,
  timeout: OLLAMA_TIMEOUT,
});

// Create MCP server with tool capabilities declared upfront
const server = new Server(
  { name: 'ollama-mcp-server', version: '1.0.0' },
  { capabilities: { tools: {} } }
);
const tools: Tool[] = [
  {
    name: 'health_check',
    description: 'Check Ollama server health and model availability',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'chat',
    description: 'Send a prompt to Ollama and receive a response',
    inputSchema: {
      type: 'object' as const,
      properties: {
        prompt: {
          type: 'string',
          description: 'The prompt to send to the model',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'summarize',
    description: 'Summarize provided text using Ollama',
    inputSchema: {
      type: 'object' as const,
      properties: {
        text: {
          type: 'string',
          description: 'The text to summarize',
        },
        style: {
          type: 'string',
          description:
            'Optional summary style (e.g., "bullet points", "paragraph", "brief")',
        },
      },
      required: ['text'],
    },
  },
];

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

/**
 * Call tool handler
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      case 'health_check': {
        result = await ollamaAdapter.healthCheck();
        break;
      }

      case 'chat': {
        const { prompt } = args as { prompt: string };
        if (!prompt) {
          throw new Error('prompt is required');
        }
        result = await ollamaAdapter.chat(prompt);
        break;
      }

      case 'summarize': {
        const { text, style } = args as { text: string; style?: string };
        if (!text) {
          throw new Error('text is required');
        }
        result = await ollamaAdapter.summarize(text, style);
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    const content: TextContent[] = [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ];

    return { content };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const content: TextContent[] = [
      {
        type: 'text',
        text: JSON.stringify(
          {
            error: errorMessage,
            tool: name,
          },
          null,
          2
        ),
      },
    ];
    return {
      content,
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  console.error('[MCP Server] Starting Ollama MCP server...');
  console.error(`[MCP Server] Ollama Host: ${OLLAMA_HOST}`);
  console.error(`[MCP Server] Ollama Model: ${OLLAMA_MODEL}`);
  console.error(`[MCP Server] Timeout: ${OLLAMA_TIMEOUT}ms`);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP Server] MCP server running on stdio');
}

main().catch((error) => {
  console.error('[MCP Server] Fatal error:', error);
  process.exit(1);
});
