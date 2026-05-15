import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * MCPSessionManager maintains a persistent connection to the MCP server.
 * Handles reconnection and health management.
 */
export class MCPSessionManager {
  private client: Client | null = null;
  private serverPath: string;
  private maxReconnectAttempts: number = 5;
  private reconnectDelayMs: number = 1000;
  private isHealthy: boolean = false;

  constructor(serverPath: string) {
    this.serverPath = serverPath;
  }

  /**
   * Initialize connection to MCP server
   */
  async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }

    console.log(`[MCP] Connecting to MCP server: ${this.serverPath}`);

    try {
      // tsx is in backend/node_modules/.bin/ — use absolute path so it works
      // regardless of how the process was started
      const tsxBin = resolve(
        __dirname,
        '../node_modules/.bin/' + (process.platform === 'win32' ? 'tsx.cmd' : 'tsx')
      );

      // StdioClientTransport uses a restricted env by default; pass the full
      // process.env so OLLAMA_* vars loaded by dotenv reach the MCP server
      const env: Record<string, string> = Object.fromEntries(
        Object.entries(process.env).filter(
          (entry): entry is [string, string] => entry[1] !== undefined
        )
      );

      // StdioClientTransport manages the child process internally — no manual spawn needed
      const transport = new StdioClientTransport({
        command: tsxBin,
        args: [this.serverPath],
        env,
      });

      this.client = new Client({
        name: 'backend-client',
        version: '1.0.0',
      });

      await this.client.connect(transport);
      this.isHealthy = true;
      console.log('[MCP] Connected successfully');
    } catch (error) {
      console.error('[MCP] Connection failed:', error);
      this.isHealthy = false;
      throw error;
    }
  }

  /**
   * Call a tool via MCP
   */
  async callTool(
    toolName: string,
    args: Record<string, any>
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    if (!this.client || !this.isHealthy) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: args,
      });
      return result as { content: Array<{ type: string; text: string }> };
    } catch (error) {
      console.error(`[MCP] Tool call failed (${toolName}):`, error);
      throw error;
    }
  }

  /**
   * Get list of available tools
   */
  async listTools(): Promise<any[]> {
    if (!this.client || !this.isHealthy) {
      throw new Error('MCP client not connected');
    }

    try {
      const tools = await this.client.listTools();
      return tools.tools || [];
    } catch (error) {
      console.error('[MCP] Failed to list tools:', error);
      throw error;
    }
  }

  /**
   * Check if session is healthy
   */
  getHealth(): { healthy: boolean; message: string } {
    if (!this.client || !this.isHealthy) {
      return {
        healthy: false,
        message: 'MCP client not initialized or unhealthy',
      };
    }
    return {
      healthy: true,
      message: 'MCP session is healthy',
    };
  }

  /**
   * Disconnect from MCP server
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
    }
    this.isHealthy = false;
    console.log('[MCP] Disconnected');
  }
}
