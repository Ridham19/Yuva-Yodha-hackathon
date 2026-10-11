@echo off
title GridPulse SCADA Launcher
echo ========================================================
echo        GridPulse Intelligent SCADA Platform
echo ========================================================
echo.
echo [1/2] Starting Python FastAPI Backend (Port 5000)...
start "GridPulse Backend (FastAPI :5000)" cmd /k "python backend/server.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend (Port 5173)...
start "GridPulse Frontend (Vite :5173)" cmd /k "npm run dev"

echo.
echo ========================================================
echo Both services launched!
echo Open your browser at: http://localhost:5173
echo ========================================================


