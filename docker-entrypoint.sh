#!/bin/sh
set -e

echo "=========================================="
echo "Starting TrafficSense AI Application Stack"
echo "=========================================="

# Start FastAPI backend
echo "Starting FastAPI backend on port 8000..."
cd /app/backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait briefly for backend to initialize
sleep 2

# Start Next.js frontend
echo "Starting Next.js frontend on port 3000..."
cd /app/frontend
npm start -- -p 3000 &
FRONTEND_PID=$!

echo "Both services launched successfully."
echo "- Backend:  http://0.0.0.0:8000"
echo "- Frontend: http://0.0.0.0:3000"

# Forward termination signals cleanly to child processes
trap 'echo "Stopping services..."; kill -TERM $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait $BACKEND_PID $FRONTEND_PID; exit 0' SIGTERM SIGINT

# Wait for any process to exit
wait -n $BACKEND_PID $FRONTEND_PID
