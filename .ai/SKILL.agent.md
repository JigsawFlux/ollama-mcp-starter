# Agent Skill: Ollama CLI and API Builder

## Description
Use this skill to implement, refine, or troubleshoot a Python project that talks to a remote Ollama server through both a CLI and an HTTP API.

## Use For
- Scaffolding project structure for Ollama integration
- Implementing env-driven config for host, model, and timeout
- Building shared service logic for health and chat
- Adding CLI command behavior and API endpoints
- Writing baseline tests and usage documentation

## Do Not Use For
- Deploying cloud infrastructure
- Adding authentication systems
- Building persistent chat history or database models
- Implementing streaming unless explicitly requested

## Trigger Phrases
- "build ollama starter"
- "create ollama cli and api"
- "set up remote ollama python project"
- "add health and chat endpoints for ollama"
- "write tests for ollama client wrapper"

## Inputs Expected
- OLLAMA_HOST (example: http://192.168.1.80:11434)
- OLLAMA_MODEL (example: llama3.2:3b)
- Optional timeout settings
- Desired interface scope (CLI only, API only, or both)

## Outputs Expected
- Runtime modules for config, service, CLI, and API
- Tests for config, service behavior, API endpoints, and CLI smoke path
- Run instructions in README

## Workflow
1. Confirm desired scope and defaults.
2. Build config loader and shared Ollama service abstraction.
3. Implement CLI and API using the same service layer.
4. Add tests using mocks for deterministic behavior.
5. Validate with one live call against the configured remote server.

## Guardrails
- Keep host and model configurable; do not hardcode unless requested.
- Keep service logic centralized; avoid duplicating calls across layers.
- Return actionable error messages for connectivity and timeout failures.
- Preserve simple architecture over premature abstractions.

## Quality Bar
- Code is readable and minimal.
- Tests cover success and failure behavior.
- Manual verification succeeds against the configured server.
- README is sufficient for another developer to run quickly.

## Completion Checklist
- Config defaults and env overrides implemented
- Shared service methods implemented
- CLI flow implemented
- API health and chat endpoints implemented
- Tests implemented and passing
- README implementation and run instructions complete
