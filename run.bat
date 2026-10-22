@echo off
setlocal enabledelayedexpansion
title AeroSight - Aerial Surveillance & Object Detection

echo =====================================================================
echo  AeroSight: Aerial Object Detection and Surveillance System
echo  YOLO-OBB on DOTA v1.0 ^| FastAPI Backend ^| React + Vite Frontend
echo =====================================================================
echo.

:: Detect Python executable
set PYTHON_CMD=python
if exist "C:\Users\%USERNAME%\miniconda3\envs\mlops311\python.exe" (
    set "PYTHON_CMD=C:\Users\%USERNAME%\miniconda3\envs\mlops311\python.exe"
) else if exist "C:\Users\Lenovo\miniconda3\envs\mlops311\python.exe" (
    set "PYTHON_CMD=C:\Users\Lenovo\miniconda3\envs\mlops311\python.exe"
)

echo [*] Using Python interpreter: !PYTHON_CMD!

:: Check requirements
echo [*] Checking dependencies...
cd /d "%~dp0"
"!PYTHON_CMD!" -c "import torch, ultralytics, fastapi, uvicorn" 2>nul
if %errorlevel% neq 0 (
    echo [!] Installing required Python dependencies...
    "!PYTHON_CMD!" -m pip install -r requirements.txt
)

:: Start Backend server in background
echo [*] Starting FastAPI Backend on http://127.0.0.1:8000 ...
cd /d "%~dp0backend"
start "AeroSight Backend (FastAPI)" /min cmd /k ""!PYTHON_CMD!" -m uvicorn main:app --host 127.0.0.1 --port 8000"

:: Start Frontend server
echo [*] Starting Frontend UI on http://127.0.0.1:5173 ...
cd /d "%~dp0frontend"
start "AeroSight Frontend (Vite)" cmd /k "npm run dev"

echo.
echo =====================================================================
echo  AeroSight System is Launching!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API & Docs: http://localhost:8000/docs
echo =====================================================================
echo.
pause
