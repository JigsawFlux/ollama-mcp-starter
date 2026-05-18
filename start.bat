@echo off
REM Run all services together (Windows batch)

echo [Start] Ollama Chat System
echo ======================================

REM Create .env files if they don't exist
if not exist mcp-server\.env (
  copy mcp-server\.env.example mcp-server\.env
  echo Created mcp-server\.env
)
if not exist backend\.env (
  copy backend\.env.example backend\.env
  echo Created backend\.env
)
if not exist frontend\.env (
  copy frontend\.env.example frontend\.env
  echo Created frontend\.env
)

echo.
echo Installing dependencies...
cd mcp-server && call npm install && cd ..
cd backend && call npm install && cd ..

echo.
echo ======================================
echo Starting services...
echo ======================================
echo.

REM The MCP server is started automatically as a subprocess by the backend.
REM Only two processes need to be started manually.

if not exist logs mkdir logs

echo [1/2] Starting backend server (also starts MCP server internally)...
cd backend
start "Backend Server" cmd /k "npm run dev"
cd ..
timeout /t 3 /nobreak

echo [2/2] Starting frontend server...
cd frontend
start "Frontend Server" cmd /k "python -m http.server 3000 --directory public"
cd ..

echo.
echo ======================================
echo Services started!
echo ======================================
echo.
echo   Frontend:  http://localhost:3000
echo   Backend:   http://localhost:3001
echo.
echo Backend log (includes MCP output): logs\backend.log
echo.
