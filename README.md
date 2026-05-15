# ollama-claude

A full-stack web application that lets you chat with a locally or remotely hosted [Ollama](https://ollama.com) model through a browser UI. The backend uses the [Model Context Protocol (MCP)](https://modelcontextprotocol.io) to talk to Ollama, keeping the transport layer cleanly separated from the API layer.

---

## Architecture

```
Browser  ──►  Express Backend  ──►  MCP Server (subprocess)  ──►  Ollama
   ◄──────────────────────────────────────────────────────────────────
```

| Component | Location | Role |
| --- | --- | --- |
| **Frontend** | `frontend/public/` | Vanilla HTML/CSS/JS chat UI |
| **Backend** | `backend/src/` | Express API, MCP session manager |
| **MCP Server** | `mcp-server/src/` | Exposes Ollama as MCP tools over stdio |
| **Ollama** | Remote / local host | Model inference engine |

The MCP server is not a separate long-running process — it is spawned automatically as a **child process of the backend** over stdio when the backend starts. You only need to run two things: the backend and the frontend.

> See [documentation/architecture.md](documentation/architecture.md) for full component diagrams and request-flow sequences.

---

## Prerequisites

| Requirement | Version | Notes |
| --- | --- | --- |
| Node.js | 18 or later | Used by backend and MCP server |
| npm | bundled with Node | Dependency management |
| Python | 3.8 or later | Used only to serve the static frontend |
| Ollama | any recent | Must be reachable at `OLLAMA_HOST` |

Check your versions:

```bash
node --version    # should print v18.x or higher
python3 --version # should print 3.8 or higher
```

To verify Ollama is reachable before starting:

```bash
curl http://<your-ollama-host>:11434/api/tags
```

---

## First-Time Setup

### 1. Install dependencies

```bash
cd mcp-server && npm install && cd ..
cd backend    && npm install && cd ..
```

The frontend has no npm dependencies — it is plain HTML/CSS/JS.

### 2. Configure environment

Each service reads its own `.env` file. Copy the templates:

```bash
cp .env.example          .env
cp mcp-server/.env.example  mcp-server/.env
cp backend/.env.example     backend/.env
cp frontend/.env.example    frontend/.env
```

Open `backend/.env` and set your Ollama details:

```ini
OLLAMA_HOST=http://192.168.1.80:11434   # IP/hostname of your Ollama server
OLLAMA_MODEL=llama3.2:3b                # exact model name from `ollama list`
OLLAMA_TIMEOUT=180000                   # milliseconds — keep high for cold starts
BACKEND_PORT=3001
MCP_SERVER_PATH=../mcp-server/src/server.ts
```

> **Tip:** Run `ollama list` on the machine hosting Ollama to see exactly what model names are available. The value must match precisely (e.g. `llama3.2:3b`, not `llama3.2`).

---

## Starting the Application

### Option A — Startup scripts

**Windows:**

```bat
start.bat
```

**macOS / Linux:**

```bash
chmod +x start.sh
./start.sh
```

Both scripts install dependencies, start the backend (which spawns the MCP server internally), and start the frontend server. Logs are written to `logs/`.

### Option B — Manual (recommended for development)

Open two terminals:

**Terminal 1 — Backend** (also starts the MCP server automatically):

```bash
cd backend
npm run dev
```

You should see:

```
[MCP Server] Starting Ollama MCP server...
[MCP Server] MCP server running on stdio
[MCP] Connected successfully
[Backend] Server running on http://localhost:3001
```

**Terminal 2 — Frontend:**

```bash
cd frontend
python3 -m http.server 3000 --directory public
```

### Access the application

| URL | What it is |
| --- | --- |
| <http://localhost:3000> | Chat UI |
| <http://localhost:3001/health> | API health check |

---

## Using the Chat UI

1. Open <http://localhost:3000>
2. The status indicator in the top-right shows the model name and a green dot when Ollama is reachable
3. Type a message and press **Enter** (or click **Send**)
4. **Shift+Enter** adds a new line without sending
5. Your messages appear on the right (blue); model responses appear on the left (grey)
6. Each response shows the model name and how long it took

> **First request may be slow.** If the Ollama server hasn't run the model recently, it needs to load it into memory — this can take 30–60 seconds. The UI shows a hint while waiting. Subsequent requests are faster.

---

## API Reference

All endpoints are served from `http://localhost:3001`. Every response includes a `correlationId` for tracing requests through logs.

### `GET /health`

Returns the status of each layer in the stack.

```bash
curl http://localhost:3001/health
```

```json
{
  "correlationId": "f1e3af0b-...",
  "timestamp": "2026-05-15T14:38:45.824Z",
  "backend": { "status": "healthy", "message": "Backend is running" },
  "mcp":     { "healthy": true,     "message": "MCP session is healthy" },
  "ollama":  { "status": "healthy", "model": "llama3.2:3b",
               "message": "Connected to Ollama at http://192.168.1.80:11434" }
}
```

### `POST /chat`

Send a prompt, receive a model response.

```bash
curl -X POST http://localhost:3001/chat \
  -H "Content-Type: application/json" \
  -d '{"prompt": "What is the capital of France?"}'
```

```json
{
  "correlationId": "d8769d5a-...",
  "timestamp": "2026-05-15T14:39:54.908Z",
  "response": "The capital of France is Paris.",
  "model": "llama3.2:3b",
  "durationMs": 3674
}
```

### `POST /summarize`

Summarize text with an optional style.

```bash
curl -X POST http://localhost:3001/summarize \
  -H "Content-Type: application/json" \
  -d '{"text": "Long article text here...", "style": "bullet points"}'
```

| Field | Required | Values |
| --- | --- | --- |
| `text` | yes | the text to summarize |
| `style` | no | `"bullet points"`, `"paragraph"`, `"brief"` |

```json
{
  "correlationId": "fc9afcca-...",
  "summary": "• Key point one\n• Key point two",
  "model": "llama3.2:3b",
  "durationMs": 3911
}
```

---

## Project Structure

```
ollama-claude/
│
├── backend/                       # Express API + MCP session manager
│   ├── src/
│   │   ├── server.ts              # HTTP endpoints (/health, /chat, /summarize)
│   │   └── mcp-session.ts         # Manages the MCP client connection
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── mcp-server/                    # MCP server (spawned by backend over stdio)
│   ├── src/
│   │   ├── server.ts              # MCP tool handlers (health_check, chat, summarize)
│   │   └── ollama-adapter.ts      # All Ollama HTTP communication
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                      # Browser UI (no build step required)
│   ├── public/
│   │   ├── index.html             # Chat page markup
│   │   ├── app.js                 # Fetch calls, conversation rendering
│   │   └── style.css              # Layout and chat bubble styles
│   └── .env.example
│
├── documentation/                 # Technical docs
│   ├── architecture.md            # Component diagrams, request-flow sequences
│   └── implementation-plan.md     # Work breakdown, tickets, milestones
│
├── .ai/                           # AI agent context files (not runtime code)
│   ├── SKILL.md                   # Original project spec
│   └── SKILL.agent.md             # Agent skill definition
│
├── .env.example                   # Root env template
├── start.sh                       # macOS/Linux startup script
├── start.bat                      # Windows startup script
├── ollama-connect-test.py         # Standalone Python connectivity test
└── README.md
```

---

## Environment Variables

Set these in `backend/.env` and `mcp-server/.env`. Both files must have matching Ollama settings because the MCP server process inherits the backend's environment at startup.

| Variable | Default | Description |
| --- | --- | --- |
| `OLLAMA_HOST` | `http://192.168.1.80:11434` | Full URL of the Ollama server |
| `OLLAMA_MODEL` | `llama3.2:3b` | Model name — must match `ollama list` output exactly |
| `OLLAMA_TIMEOUT` | `180000` | Max ms to wait for a model response (3 minutes) |
| `BACKEND_PORT` | `3001` | Port the Express server listens on |
| `MCP_SERVER_PATH` | `../mcp-server/src/server.ts` | Path to the MCP server entry point, relative to `backend/` |

---

## Troubleshooting

### "Ollama unhealthy" or model not found

Run `ollama list` on the server machine and copy the exact model name into `OLLAMA_MODEL`. The name is case-sensitive and must include the tag (e.g. `llama3.2:3b`, not `llama3.2`).

### First request always times out

The model is cold — Ollama is loading it from disk into RAM. This can take 30–90 seconds on first use. The timeout is set to 3 minutes (`180000`ms) to handle this. If your server is particularly slow, increase `OLLAMA_TIMEOUT` further.

### "Backend offline" in the UI

The frontend cannot reach `http://localhost:3001`. Check that the backend is running (`npm run dev` in `backend/`), and look at the terminal for startup errors.

### MCP connection failed on backend startup

The backend spawns the MCP server from `MCP_SERVER_PATH`. Make sure:

- You ran `npm install` in `mcp-server/`
- `MCP_SERVER_PATH` in `backend/.env` points to the correct relative path (`../mcp-server/src/server.ts`)
- You are starting the backend from the `backend/` directory

### Port already in use

```bash
# Find what is using port 3001
netstat -ano | findstr :3001    # Windows
lsof -i :3001                   # macOS/Linux
```

---

## Development Guide

### Making backend or MCP server changes

Both services run TypeScript via `tsx` with no compile step needed in development:

```bash
cd backend && npm run dev       # live-reloads on save
```

To type-check without running:

```bash
cd backend    && npx tsc --noEmit
cd mcp-server && npx tsc --noEmit
```

### How the MCP server is connected

The backend's `mcp-session.ts` uses `StdioClientTransport` from the MCP SDK to spawn `mcp-server/src/server.ts` as a child process. Communication happens over the child process's stdin/stdout — there is no network port involved. You do **not** need to run the MCP server manually.

### Adding a new Ollama tool

1. Add the tool definition to `mcp-server/src/server.ts` (in the `tools` array)
2. Add a `case` block in the `CallToolRequestSchema` handler in the same file
3. Add the corresponding method to `mcp-server/src/ollama-adapter.ts`
4. Optionally expose it via a new Express endpoint in `backend/src/server.ts`

### Quick connectivity test (Python)

If you want to verify Ollama is reachable before starting the Node stack:

```bash
pip install ollama
python3 ollama-connect-test.py
```

---

## Documentation

| Document | Description |
| --- | --- |
| [documentation/architecture.md](documentation/architecture.md) | System design, component diagrams, request-flow sequences, API contracts |
| [documentation/implementation-plan.md](documentation/implementation-plan.md) | Work breakdown, ticket details, milestones, risk register |

---

## What's Next

The MVP (Milestones 1 & 2) is complete and running. Planned improvements:

| Phase | Tickets | Description |
| --- | --- | --- |
| **Phase 2** | B2, C2, D2 | Structured logging with correlation IDs, MCP auto-reconnect, UX hardening (duplicate-submit prevention, copy button), full runbook |
| **Phase 3** | — | Streaming responses, conversation history |
| **Phase 4** | — | Authentication, Docker, production deployment |

See [documentation/implementation-plan.md](documentation/implementation-plan.md) for full ticket details.
