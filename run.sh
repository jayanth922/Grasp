#!/bin/bash
# Run the Nexus full-stack application

echo "🧠 Starting Nexus..."
echo ""

# Check for .env
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found"
    echo "   Copy .env.example to .env and add your API keys"
    exit 1
fi

# Kill any existing processes
pkill -f "uvicorn api.main" 2>/dev/null
pkill -f "next dev" 2>/dev/null

# Start backend
echo "📡 Starting API server on http://localhost:8000..."
cd "$(dirname "$0")"
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Wait for backend
sleep 3

# Start frontend
echo "🌐 Starting frontend on http://localhost:3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Nexus is running!"
echo "   Frontend: http://localhost:3000"
echo "   API:      http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop..."

# Wait and cleanup
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
