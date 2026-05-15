#!/bin/bash
# Validation script to verify system setup and connectivity

set -e

BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
TIMEOUT=10

echo "=========================================="
echo "Ollama Chat System - Validation Script"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

echo "[1/5] Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  pass "Node.js installed: $NODE_VERSION"
else
  fail "Node.js not found. Please install Node.js 18+"
fi

echo ""
echo "[2/5] Checking Python..."
if command -v python3 &> /dev/null; then
  PYTHON_VERSION=$(python3 --version)
  pass "Python installed: $PYTHON_VERSION"
else
  warn "Python not found. Frontend dev server may not work."
fi

echo ""
echo "[3/5] Checking backend connectivity..."
if curl -s -m $TIMEOUT "$BACKEND_URL/health" > /dev/null 2>&1; then
  HEALTH=$(curl -s -m $TIMEOUT "$BACKEND_URL/health")
  
  # Extract status from JSON
  BACKEND_STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
  OLLAMA_STATUS=$(echo "$HEALTH" | grep -o '"status":"[^"]*"' | tail -1 | cut -d'"' -f4)
  
  pass "Backend is running"
  
  if [ "$BACKEND_STATUS" = "healthy" ]; then
    pass "Backend status: healthy"
  else
    warn "Backend status: $BACKEND_STATUS"
  fi
  
  if [ "$OLLAMA_STATUS" = "healthy" ]; then
    pass "Ollama status: healthy"
  else
    fail "Ollama status: $OLLAMA_STATUS. Check OLLAMA_HOST and ensure Ollama is running."
  fi
else
  fail "Cannot reach backend at $BACKEND_URL. Ensure backend is running on port 3001."
fi

echo ""
echo "[4/5] Testing chat endpoint..."
RESPONSE=$(curl -s -m $TIMEOUT -X POST "$BACKEND_URL/chat" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello, how are you?"}' 2>&1)

if echo "$RESPONSE" | grep -q '"response"'; then
  pass "Chat endpoint working"
  RESPONSE_PREVIEW=$(echo "$RESPONSE" | grep -o '"response":"[^"]*"' | cut -d'"' -f4 | head -c 50)
  echo "  Response: $RESPONSE_PREVIEW..."
else
  fail "Chat endpoint error: $RESPONSE"
fi

echo ""
echo "[5/5] Testing summarize endpoint..."
RESPONSE=$(curl -s -m $TIMEOUT -X POST "$BACKEND_URL/summarize" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test document that should be summarized.", "style": "brief"}' 2>&1)

if echo "$RESPONSE" | grep -q '"summary"'; then
  pass "Summarize endpoint working"
  SUMMARY_PREVIEW=$(echo "$RESPONSE" | grep -o '"summary":"[^"]*"' | cut -d'"' -f4 | head -c 50)
  echo "  Summary: $SUMMARY_PREVIEW..."
else
  fail "Summarize endpoint error: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "All validations passed! ✓"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Try the chat and summarize features"
echo "3. Check logs/ directory for detailed logs"
echo ""
