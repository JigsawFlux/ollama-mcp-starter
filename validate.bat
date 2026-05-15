@echo off
REM Validation script to verify system setup and connectivity

setlocal enabledelayedexpansion

set BACKEND_URL=http://localhost:3001
set TIMEOUT=10

echo.
echo ==========================================
echo Ollama Chat System - Validation Script
echo ==========================================
echo.

echo [1/5] Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
  echo [OK] Node.js installed: !NODE_VERSION!
) else (
  echo [ERROR] Node.js not found. Please install Node.js 18+
  exit /b 1
)

echo.
echo [2/5] Checking Python...
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
  echo [OK] Python installed: !PYTHON_VERSION!
) else (
  echo [WARNING] Python not found. Frontend dev server may not work.
)

echo.
echo [3/5] Checking backend connectivity...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%/health' -UseBasicParsing -TimeoutSec %TIMEOUT% 2>$null; if ($response.StatusCode -eq 200) { Write-Host '[OK] Backend is running'; exit 0 } } catch { exit 1 }" >nul 2>nul

if %ERRORLEVEL% EQU 0 (
  echo [OK] Backend is running
  echo [OK] Ollama is reachable
) else (
  echo [ERROR] Cannot reach backend at %BACKEND_URL%
  echo Please ensure backend is running on port 3001
  exit /b 1
)

echo.
echo [4/5] Testing chat endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%/chat' -Method Post -Body '{\"prompt\": \"Hello, how are you?\"}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec %TIMEOUT% 2>$null; if ($response.Content -like '*response*') { Write-Host '[OK] Chat endpoint working'; exit 0 } } catch { exit 1 }" >nul 2>nul

if %ERRORLEVEL% EQU 0 (
  echo [OK] Chat endpoint working
) else (
  echo [ERROR] Chat endpoint error
  exit /b 1
)

echo.
echo [5/5] Testing summarize endpoint...
powershell -Command "try { $response = Invoke-WebRequest -Uri '%BACKEND_URL%/summarize' -Method Post -Body '{\"text\": \"This is a test document that should be summarized.\", \"style\": \"brief\"}' -ContentType 'application/json' -UseBasicParsing -TimeoutSec %TIMEOUT% 2>$null; if ($response.Content -like '*summary*') { Write-Host '[OK] Summarize endpoint working'; exit 0 } } catch { exit 1 }" >nul 2>nul

if %ERRORLEVEL% EQU 0 (
  echo [OK] Summarize endpoint working
) else (
  echo [ERROR] Summarize endpoint error
  exit /b 1
)

echo.
echo ==========================================
echo All validations passed!
echo ==========================================
echo.
echo Next steps:
echo 1. Open http://localhost:3000 in your browser
echo 2. Try the chat and summarize features
echo 3. Check logs directory for detailed logs
echo.
