#!/bin/bash
# Run all services together

echo "[Start] Ollama Chat System"
echo "======================================"

# Create .env files if they don't exist
for service in mcp-server backend frontend; do
  if [ ! -f "$service/.env" ]; then
    cp "$service/.env.example" "$service/.env"
    echo "✓ Created $service/.env"
  fi
done

echo ""
echo "Installing dependencies..."
cd mcp-server && npm install && cd ..
cd backend && npm install && cd ..

mkdir -p logs

echo ""
echo "======================================"
echo "Starting services..."
echo "======================================"
echo ""

# Note: the MCP server is started automatically as a subprocess by the backend.
# Only two processes need to be started manually.

echo "[1/2] Starting backend server (also starts MCP server internally)..."
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
cd ..

sleep 3

echo "[2/2] Starting frontend server..."
cd frontend
python3 -m http.server 3000 --directory public > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
cd ..

echo ""
echo "======================================"
echo "Services started!"
echo "======================================"
echo ""
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo ""
echo "Logs:"
echo "  Backend:  logs/backend.log  (includes MCP server output)"
echo "  Frontend: logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

wait $BACKEND_PID $FRONTEND_PID

echo "[End] All services stopped"
