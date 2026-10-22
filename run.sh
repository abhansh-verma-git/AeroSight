#!/usr/bin/env bash
set -e

echo "====================================================================="
echo " AeroSight: Aerial Object Detection and Surveillance System"
echo " YOLO-OBB on DOTA v1.0 | FastAPI Backend | React + Vite Frontend"
echo "====================================================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Start FastAPI backend
echo "[*] Starting FastAPI Backend on http://127.0.0.1:8000 ..."
cd "$SCRIPT_DIR/backend"
python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!

# Start Frontend
echo "[*] Starting Frontend on http://127.0.0.1:5173 ..."
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true" EXIT

echo ""
echo "====================================================================="
echo " AeroSight System is Online!"
echo " - Frontend Dashboard: http://localhost:5173"
echo " - Backend API & Docs: http://localhost:8000/docs"
echo "====================================================================="
echo ""

wait
