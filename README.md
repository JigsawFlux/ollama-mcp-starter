# ollama-claude

Starter workspace for integrating Ollama with MCP-driven workflows, plus a simple path to add a UI and backend.

## Current Contents
- `documentation/` project planning and skill docs
- `ollama-connect-test.py` quick connectivity test to remote Ollama server

## Prerequisites
- Python 3.12+
- Ollama server reachable on your network
- Git installed

## Quick Start
1. Update host and model in `ollama-connect-test.py` if needed.
2. Run the connectivity test:
   - Windows PowerShell:
     - `& "C:/Program Files/python312/python.exe" .\ollama-connect-test.py`
3. Confirm a valid response from the configured model.

## Documentation
- `documentation/implementation-plan.md`
- `documentation/architecture.md`
- `documentation/SKILL.md`
- `documentation/SKILL.agent.md`

## GitHub Setup
After creating a new empty repository on GitHub, run:

1. Add remote:
   - `git remote add origin <YOUR_GITHUB_REPO_URL>`
2. Stage files:
   - `git add .`
3. First commit:
   - `git commit -m "Initial project scaffold and documentation"`
4. Push to GitHub:
   - `git push -u origin main`

## Suggested Next Steps
1. Scaffold MCP server (`health_check`, `chat`, `summarize`).
2. Add a lightweight Node backend to call MCP tools.
3. Add a minimal web UI for chat and summarize flows.
