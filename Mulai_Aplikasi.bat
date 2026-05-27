@echo off
SETLOCAL EnableDelayedExpansion
title KEN ENTERPRISE — Global ERP Node
mode con: cols=100 lines=30
color 0E

:: ASCII Art for KEN (Enterprise Standard)
echo.
echo    _  _________ _   _ 
echo   ^| ^|/ /_   ___^| \ ^| ^|
echo   ^| ' /  ^| ^|_  ^|  \^| ^|
echo   ^|  \  ^|  _^| ^| ^|\  ^|
echo   ^|_^|\_\^|_____^|_^| \_^|
echo.
echo   [ ELITE ENTERPRISE - SYSTEM BOOTSTRAPPER ]
echo.

:: 1. Cleanup stale processes
echo  [SYSTEM] Terminating stale services on Port 3001 ^& 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul
echo  [SYSTEM] Environment cleaned.
echo.

:: 2. Dependency Check
echo  [SYSTEM] Verifying system dependencies...
if not exist "backend\node_modules" (
    echo  [!] Backend node_modules missing. Rebuilding...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
    echo  [!] Frontend node_modules missing. Rebuilding...
    cd frontend && call npm install && cd ..
)

:: 3. Service Initialization
echo  [SYSTEM] Initializing KEN API Server (Development Mode)...
start "KEN-BACKEND" /min cmd /k "title KEN API && cd backend && npm start"

echo  [SYSTEM] Initializing KEN UI Engine (Development Mode)...
start "KEN-FRONTEND" /min cmd /k "title KEN UI && cd frontend && npm run dev"

:: 4. Sync Sequence
echo.
echo  [SYSTEM] Synchronizing enterprise nodes...
timeout /t 5 /nobreak > nul

:: 5. Launch
echo.
echo  [SYSTEM] Boot sequence complete.
echo  [SERVICES] ---------------------------------------------
echo  [API]      : http://localhost:3001
echo  [FRONTEND] : http://localhost:5173
echo  [STATUS]   : ACTIVE
echo  --------------------------------------------------------
echo.
echo  [ACTION] Launching Global Dashboard...
start http://localhost:5173

echo.
echo  [SUCCESS] KEN Enterprise is now online.
echo  Press any key to exit bootstrapper...
pause > nul
exit
