# Implementation Plan

## Objective
Deliver a simple end-to-end system where a web UI interacts with a Node.js backend, the backend invokes MCP tools, and the MCP server communicates with Ollama for health, chat, and summarize capabilities.

## Architecture Summary
1. Frontend UI sends requests to backend endpoints.
2. Node.js backend validates input and calls MCP tools.
3. MCP server exposes tool contracts and forwards to Ollama.
4. Ollama runs configured local/remote model inference.

## Scope
### In Scope
- Web UI for prompt, summarize, and health display
- Node.js backend endpoints (`/health`, `/chat`, `/summarize`)
- MCP server with `health_check`, `chat`, `summarize` tools
- Env-based configuration for model/host/timeout
- Baseline tests for success and failure paths
- Basic documentation and runbook

### Out of Scope
- Authentication and user accounts
- Conversation persistence/database storage
- Streaming tokens in MVP
- CI/CD and production deployment automation

## Work Breakdown (Board-Ready)

| Ticket | Title | Priority | Estimate | Owner | Dependencies |
|---|---|---|---|---|---|
| A1 | Project Skeleton | P0 | S | Platform | None |
| A3 | Ollama Client Adapter | P0 | M | AI Integration | A1 |
| A2 | MCP Server Core | P0 | M | AI Integration | A1, A3 |
| B1 | Node Backend API + MCP Session | P0 | M | Backend | A2 |
| C1 | Frontend MVP | P1 | M | Frontend | B1 |
| D1 | End-to-End Validation | P1 | S | QA | B1, C1 |
| B2 | Error Handling + Observability | P2 | M | Backend | B1 |
| C2 | UX Hardening | P2 | S | Frontend | C1 |
| D2 | Documentation + Runbook | P2 | S | Platform | D1 |

Legend:
- Priority: P0 critical path, P1 MVP required, P2 quality hardening
- Estimate: S (0.5-1 day), M (1-3 days), L (3-5 days)

## Ticket Details

### A1 - Project Skeleton
Goal: Establish local runnable baseline.
- Create folders for frontend, backend, and mcp-server.
- Add environment templates.
- Add scripts to run services independently and together.
Acceptance:
- All services start without runtime errors.
- Port and env checks are clear on startup.

### A3 - Ollama Client Adapter
Goal: Isolate all Ollama communication.
- Implement adapter methods for health, chat, summarize.
- Normalize response schema and error mapping.
Acceptance:
- Adapter returns consistent shape.
- Timeout/connection failures handled cleanly.

### A2 - MCP Server Core
Goal: Expose tool interface for Copilot workflows.
- Implement `ListTools` and `CallTool` handlers.
- Register `health_check`, `chat`, and `summarize` tools.
Acceptance:
- All tools return valid structured responses.
- Errors map to consistent MCP error format.

### B1 - Node Backend API + MCP Session
Goal: Serve UI and route requests to MCP tools.
- Implement `GET /health`, `POST /chat`, `POST /summarize`.
- Validate request payloads.
- Maintain persistent MCP session with reconnect logic.
Acceptance:
- Endpoints proxy tool calls correctly.
- Backend handles MCP disconnect/reconnect gracefully.

### C1 - Frontend MVP
Goal: Deliver first interactive UI.
- Build page with input area, health indicator, output panel.
- Connect chat and summarize actions to backend.
Acceptance:
- User receives responses end-to-end.
- Clear loading and error states.

### D1 - End-to-End Validation
Goal: Verify complete request path.
- Health, chat, summarize smoke tests.
- Failure tests for Ollama down, MCP unavailable, timeout.
Acceptance:
- Success and failure behaviors match API contracts.

### B2 - Error Handling + Observability
Goal: Improve operability.
- Add correlation IDs.
- Add structured logs and latency metrics.
- Redact sensitive prompt content in error logs.
Acceptance:
- Every request is traceable.
- Error root cause is diagnosable from logs.

### C2 - UX Hardening
Goal: Improve UX reliability.
- Prevent duplicate submit.
- Add clear/reset and copy response actions.
Acceptance:
- No duplicate requests during in-flight operations.

### D2 - Documentation + Runbook
Goal: Enable fast onboarding.
- Setup, env config, run commands, troubleshooting.
Acceptance:
- New developer can run the system in under 15 minutes.

## Milestones
1. M1: Foundation complete (A1, A3, A2)
- MCP tools callable and stable locally.

2. M2: MVP complete (B1, C1, D1)
- Browser to backend to MCP to Ollama works end-to-end.

3. M3: Hardening complete (B2, C2, D2)
- Improved reliability, observability, and onboarding docs.

## Risks and Mitigations
1. MCP session instability in backend
- Mitigation: persistent session manager with bounded reconnect and health probes.

2. Ollama model variability
- Mitigation: normalize responses in adapter and handle empty/partial outputs.

3. Environment mismatch across machines
- Mitigation: strict startup validation and `.env.example` defaults.

## Validation Checklist
- [ ] MCP server starts and lists all tools
- [ ] Backend health endpoint reflects MCP and Ollama status
- [ ] Chat endpoint returns expected payload shape
- [ ] Summarize endpoint returns concise output
- [ ] Timeout and unreachable-host errors are actionable
- [ ] Frontend handles loading and failures clearly
- [ ] Core tests pass locally

## Suggested Next Steps
1. Create ticket board using this document as source.
2. Implement A1, A3, and A2 first on a single feature branch.
3. Add baseline tests before wiring UI to reduce integration churn.
