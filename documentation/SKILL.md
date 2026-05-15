# Skill: Ollama Remote Chat Starter

## Purpose
Define the implementation contract for a Python starter project that:
- Connects to a remote Ollama server
- Exposes both CLI and API chat interfaces
- Uses environment-based configuration
- Includes baseline automated tests

## Current Context
A remote Ollama endpoint is already verified and reachable.

## In Scope
- Python project scaffold for CLI and API
- Shared Ollama service layer reused by both interfaces
- Configurable host and model via environment variables
- Health check path and chat path
- Basic unit and endpoint tests
- Minimal README run instructions

## Out of Scope
- Authentication and user management
- Conversation persistence or database storage
- Streaming token responses
- Docker and CI pipeline setup
- Advanced observability and tracing

## Functional Requirements
1. Configuration
- Read Ollama host from environment variable with a default.
- Read model name from environment variable with a default.
- Support configurable timeout.

2. Shared Service Layer
- Provide a health check function to verify server reachability.
- Provide a chat function that accepts a user prompt and returns model output.
- Map network and timeout failures to consistent error messages.

3. CLI Interface
- Accept prompt from command argument or standard input.
- Return plain-text assistant response.
- Exit with non-zero status on failures and print actionable errors.

4. API Interface
- GET /health returns service status and configured model.
- POST /chat accepts prompt and returns response payload with model output.
- Return clear error payloads for timeout and connectivity failures.

5. Tests
- Config tests for defaults and environment overrides.
- Service tests for success and failure paths with mocked Ollama client.
- API tests for health and chat endpoints.
- Basic CLI smoke test with mocked service response.

## Non-Functional Requirements
- Keep architecture simple and easy to extend.
- Prefer readable, typed Python where practical.
- Ensure failures are explicit and user-actionable.
- Reuse shared logic and avoid duplicated chat calls.

## Suggested Project Structure
- src package for runtime code
- tests package for test suite
- env example file for settings
- dependency manifest
- README for setup and usage

## Acceptance Criteria
1. CLI can send a prompt and receive a response from remote Ollama.
2. API health endpoint confirms connectivity state.
3. API chat endpoint returns model output for valid requests.
4. Invalid host produces clear errors in both CLI and API.
5. Automated tests pass locally without requiring a live server for all cases.

## Risks and Mitigations
- Remote server unreachable:
  Add startup and runtime connectivity checks with clear guidance.
- Model name mismatch:
  Keep model configurable and return model-related errors verbosely.
- Slow responses:
  Enforce configurable timeouts and explicit timeout handling.

## Definition of Done
- Scope-complete scaffold exists for CLI and API.
- Core success and failure paths are tested.
- README contains exact run steps and environment setup.
- Manual verification against remote server succeeds.

## Iteration Notes
- First iteration target: correctness and clarity.
- Second iteration target: improved developer ergonomics and richer error handling.
- Later iterations can add streaming, auth, persistence, and deployment automation.
