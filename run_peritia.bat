@echo off
title PERITIA — Interview Trainer

echo.
echo  ================================================
echo   PERITIA — AI-Powered Interview Trainer
echo  ================================================
echo.

:: ── Locate Python launcher ───────────────────────────────────────────────────
where py >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python launcher "py" not found.
    echo  Install Python 3.11+ from https://python.org
    pause
    exit /b 1
)

:: ── Locate Node ──────────────────────────────────────────────────────────────
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Node.js not found.
    echo  Install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

:: ── Kill anything already on port 8000 or 3000 ──────────────────────────────
echo  Clearing ports 8000 and 3000...
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R ":8000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
for /f "tokens=5" %%p in ('netstat -ano 2^>nul ^| findstr /R ":3000 "') do (
    taskkill /PID %%p /F >nul 2>&1
)
timeout /t 1 /nobreak >nul

:: ── Start Backend ─────────────────────────────────────────────────────────────
echo  Starting backend  (http://localhost:8000) ...
start "PERITIA Backend" /D "%~dp0backend" cmd /k "py -m uvicorn main:app --port 8000 --reload"

:: ── Poll until backend responds (max ~60 s) ───────────────────────────────────
echo  Waiting for backend to be ready...
set /a tries=0
:poll
timeout /t 3 /nobreak >nul
curl -s -f http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 goto backend_ok
set /a tries+=1
if %tries% lss 20 goto poll
echo.
echo  [WARNING] Backend did not respond within 60 s.
echo  It may still be loading (first-run model download can take a few minutes).
echo  Check the "PERITIA Backend" window for errors.
echo  You can try opening http://localhost:3000 once that window shows:
echo    "Application startup complete."
goto open_frontend

:backend_ok
echo  Backend is ready.

:: ── Start Frontend ────────────────────────────────────────────────────────────
:open_frontend
echo  Starting frontend (http://localhost:3000) ...
start "PERITIA Frontend" /D "%~dp0frontend" cmd /k "npm.cmd run dev"

:: ── Open browser ──────────────────────────────────────────────────────────────
echo  Opening browser in 6 seconds...
timeout /t 6 /nobreak >nul
start http://localhost:3000

echo.
echo  ================================================
echo   PERITIA is running
echo.
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API docs : http://localhost:8000/api/docs
echo.
echo   Close the Backend and Frontend windows to stop.
echo  ================================================
echo.
