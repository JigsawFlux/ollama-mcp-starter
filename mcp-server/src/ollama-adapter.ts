import axios, { AxiosInstance } from 'axios';

/**
 * OllamaAdapter isolates all Ollama API communication.
 * Normalizes responses and handles errors consistently.
 */
export interface AdapterConfig {
  host: string;
  model: string;
  timeout?: number; // milliseconds
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  model: string;
  message: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  model: string;
  durationMs: number;
}

export interface SummarizeResponse {
  summary: string;
  model: string;
  durationMs: number;
}

export class OllamaAdapter {
  private client: AxiosInstance;
  private config: AdapterConfig;

  constructor(config: AdapterConfig) {
    this.config = {
      timeout: 30000, // 30s default
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.host,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Health check to verify Ollama server reachability and model availability.
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const startTime = Date.now();
    try {
      // Attempt to call the Ollama /api/tags endpoint to verify connectivity
      const response = await this.client.get('/api/tags');
      const models = response.data.models || [];
      const modelExists = models.some((m: any) => m.name === this.config.model);

      if (!modelExists) {
        return {
          status: 'unhealthy',
          model: this.config.model,
          message: `Model '${this.config.model}' not found on server. Available: ${models.map((m: any) => m.name).join(', ')}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        status: 'healthy',
        model: this.config.model,
        message: `Connected to Ollama at ${this.config.host}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const message = this.mapError(error);
      return {
        status: 'unhealthy',
        model: this.config.model,
        message: `Health check failed: ${message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Chat endpoint: send a prompt and receive a model response.
   */
  async chat(prompt: string): Promise<ChatResponse> {
    const startTime = Date.now();
    try {
      const response = await this.client.post('/api/chat', {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      const durationMs = Date.now() - startTime;
      return {
        response: response.data.message?.content || '',
        model: this.config.model,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message = this.mapError(error);
      throw new Error(`Chat failed: ${message} (duration: ${durationMs}ms)`);
    }
  }

  /**
   * Summarize endpoint: condense provided text using the model.
   */
  async summarize(text: string, style?: string): Promise<SummarizeResponse> {
    const startTime = Date.now();
    const prompt = style
      ? `Summarize the following text in ${style} style:\n\n${text}`
      : `Summarize the following text:\n\n${text}`;

    try {
      const response = await this.client.post('/api/chat', {
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        stream: false,
      });

      const durationMs = Date.now() - startTime;
      return {
        summary: response.data.message?.content || '',
        model: this.config.model,
        durationMs,
      };
    } catch (error) {
      const durationMs = Date.now() - startTime;
      const message = this.mapError(error);
      throw new Error(`Summarize failed: ${message} (duration: ${durationMs}ms)`);
    }
  }

  /**
   * Map various error types to actionable messages.
   */
  private mapError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return `Cannot connect to Ollama at ${this.config.host}. Ensure Ollama is running.`;
      }
      if (error.code === 'ENOTFOUND') {
        return `Ollama host '${this.config.host}' not found. Check OLLAMA_HOST environment variable.`;
      }
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return `Request timed out (${this.config.timeout}ms). Ollama may be overloaded.`;
      }
      if (error.response?.status === 404) {
        return `Ollama API endpoint not found. Check Ollama version compatibility.`;
      }
      if (error.response?.status === 500) {
        return `Ollama server error: ${error.response.data?.error || 'Unknown'}`;
      }
      return error.message || 'Unknown HTTP error';
    }
    return String(error);
  }
}
