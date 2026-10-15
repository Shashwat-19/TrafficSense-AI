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

# Wait until the backend answers its health endpoint (max BACKEND_WAIT_TIMEOUT seconds)
BACKEND_HEALTH_URL="${BACKEND_HEALTH_URL:-http://127.0.0.1:8000/api/v1/health}"
BACKEND_WAIT_TIMEOUT="${BACKEND_WAIT_TIMEOUT:-30}"
start=$(date +%s)
elapsed() { echo $(( $(date +%s) - start )); }
# Each probe may use at most the remaining wait budget (min 1s), so a stalled response cannot overrun the limit.
probe() {
    left=$(( BACKEND_WAIT_TIMEOUT - $(elapsed) ))
    [ "$left" -ge 1 ] || left=1
    curl -fsS --max-time "$left" "$BACKEND_HEALTH_URL" >/dev/null 2>&1
}
until probe; do
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Backend exited during startup. Aborting."
        exit 1
    fi
    if [ "$(elapsed)" -ge "$BACKEND_WAIT_TIMEOUT" ]; then
        echo "Backend not healthy after ${BACKEND_WAIT_TIMEOUT}s. Aborting."
        kill -TERM $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo "Backend is healthy."

# Start Next.js frontend
echo "Starting Next.js frontend on port 3000..."
cd /app/frontend
npm start -- -p 3000 &
FRONTEND_PID=$!

echo "Both services launched successfully."
echo "- Backend:  http://0.0.0.0:8000"
echo "- Frontend: http://0.0.0.0:3000"

# Forward termination signals cleanly to child processes
trap 'echo "Stopping services..."; kill -TERM $BACKEND_PID $FRONTEND_PID 2>/dev/null; wait $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' SIGTERM SIGINT

# Supervise child processes: if either backend or frontend crashes, exit
while kill -0 $BACKEND_PID 2>/dev/null && kill -0 $FRONTEND_PID 2>/dev/null; do
    sleep 2
done

echo "One of the services terminated unexpectedly. Shutting down stack..."
kill -TERM $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
exit 1
