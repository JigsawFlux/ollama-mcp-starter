import express, { Request, Response } from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { MCPSessionManager } from './mcp-session.js';

// Load environment variables
dotenv.config();

const PORT = parseInt(process.env.BACKEND_PORT || '3001', 10);
const MCP_SERVER_PATH =
  process.env.MCP_SERVER_PATH || '../mcp-server/src/server.ts';

// Initialize MCP session
const mcpSession = new MCPSessionManager(MCP_SERVER_PATH);

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// Middleware: Request logging with correlation ID
app.use((req: Request, res: Response, next) => {
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  res.setHeader('x-correlation-id', correlationId);
  console.log(`[${correlationId}] ${req.method} ${req.path}`);
  next();
});

/**
 * Health endpoint: returns backend, MCP, and Ollama status
 */
app.get('/health', async (req: Request, res: Response) => {
  const correlationId = res.getHeader('x-correlation-id');

  try {
    const mcpHealth = mcpSession.getHealth();

    // Call MCP health_check tool to verify Ollama status
    let ollamaHealth = { status: 'unknown', model: 'unknown' };
    if (mcpHealth.healthy) {
      try {
        const toolResult = await mcpSession.callTool('health_check', {});
        const content = toolResult.content[0]?.text;
        if (content) {
          ollamaHealth = JSON.parse(content);
        }
      } catch (error) {
        console.error(`[${correlationId}] Ollama health check failed:`, error);
      }
    }

    res.json({
      correlationId,
      timestamp: new Date().toISOString(),
      backend: {
        status: 'healthy',
        message: 'Backend is running',
      },
      mcp: mcpHealth,
      ollama: ollamaHealth,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({
      correlationId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Chat endpoint: forward prompt to Ollama via MCP
 */
app.post('/chat', async (req: Request, res: Response) => {
  const correlationId = res.getHeader('x-correlation-id');
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      correlationId,
      error: 'prompt is required',
    });
  }

  try {
    console.log(`[${correlationId}] Chat request: ${prompt.substring(0, 50)}...`);

    const toolResult = await mcpSession.callTool('chat', { prompt });
    const content = toolResult.content[0]?.text;
    const result = content ? JSON.parse(content) : {};

    res.json({
      correlationId,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${correlationId}] Chat failed:`, errorMessage);
    res.status(500).json({
      correlationId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Summarize endpoint: forward text to Ollama for summarization via MCP
 */
app.post('/summarize', async (req: Request, res: Response) => {
  const correlationId = res.getHeader('x-correlation-id');
  const { text, style } = req.body;

  if (!text) {
    return res.status(400).json({
      correlationId,
      error: 'text is required',
    });
  }

  try {
    console.log(
      `[${correlationId}] Summarize request: ${text.substring(0, 50)}...`
    );

    const toolResult = await mcpSession.callTool('summarize', { text, style });
    const content = toolResult.content[0]?.text;
    const result = content ? JSON.parse(content) : {};

    res.json({
      correlationId,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${correlationId}] Summarize failed:`, errorMessage);
    res.status(500).json({
      correlationId,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

/**
 * Start server
 */
async function main() {
  try {
    console.log('[Backend] Starting backend server...');
    console.log('[Backend] Port:', PORT);
    console.log('[Backend] MCP Server Path:', MCP_SERVER_PATH);

    // Initialize MCP connection
    await mcpSession.connect();

    // Start Express server
    const httpServer = app.listen(PORT, () => {
      console.log(`[Backend] Server running on http://localhost:${PORT}`);
      console.log(`[Backend] Health endpoint: GET http://localhost:${PORT}/health`);
      console.log(`[Backend] Chat endpoint: POST http://localhost:${PORT}/chat`);
      console.log(
        `[Backend] Summarize endpoint: POST http://localhost:${PORT}/summarize`
      );
    });

    // Node's default headersTimeout (60s) and requestTimeout (300s) are too
    // short for a cold-start LLM on a remote server — disable them.
    httpServer.headersTimeout = 0;
    httpServer.requestTimeout = 0;
  } catch (error) {
    console.error('[Backend] Fatal error:', error);
    process.exit(1);
  }
}

main();
