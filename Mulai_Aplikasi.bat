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

:: 3. Application Selector Menu
echo.
echo  --------------------------------------------------------
echo   SELECT FRONTEND APPLICATION TO RUN:
echo  --------------------------------------------------------
echo   [1] Merchant Office (ERP, POS, Back-office) - DEFAULT
echo   [2] POS Client (Kasir, KDS, Shift Management)
echo   [3] Customer Portal (QR Menu and Customer Self-Order)
echo   [4] SaaS Super Admin (Control Portal)
echo   [5] Run ALL Applications Concurrently
echo  --------------------------------------------------------
set /p app_choice="Select application number (1-5, default 1): "

if "%app_choice%"=="" set app_choice=1

:: 4. Service Initialization
echo.
echo  [SYSTEM] Initializing KEN API Server (Development Mode)...
start "KEN-BACKEND" /min cmd /k "title KEN API && cd backend && npm run dev"

if "%app_choice%"=="1" (
    echo  [SYSTEM] Initializing KEN UI Engine (Merchant Office)...
    start "KEN-MERCHANT-OFFICE" /min cmd /k "title KEN Merchant Office && npm run dev:merchant"
    set TARGET_PORT=5178
)
if "%app_choice%"=="2" (
    echo  [SYSTEM] Initializing KEN UI Engine (POS Client)...
    start "KEN-POS-CLIENT" /min cmd /k "title KEN POS Client && npm run dev:pos"
    set TARGET_PORT=5175
)
if "%app_choice%"=="3" (
    echo  [SYSTEM] Initializing KEN UI Engine (Customer Portal)...
    start "KEN-CUSTOMER-PORTAL" /min cmd /k "title KEN Customer Portal && npm run dev:customer"
    set TARGET_PORT=5176
)
if "%app_choice%"=="4" (
    echo  [SYSTEM] Initializing KEN UI Engine (SaaS Super Admin)...
    start "KEN-SUPER-ADMIN" /min cmd /k "title KEN SaaS Super Admin && npm run dev:admin"
    set TARGET_PORT=5177
)
if "%app_choice%"=="5" (
    echo  [SYSTEM] Initializing ALL Applications...
    start "KEN-MONOREPO" /min cmd /k "title KEN Monorepo All && npm run dev:all"
    set TARGET_PORT=5178
)

:: 5. Sync Sequence
echo.
echo  [SYSTEM] Synchronizing enterprise nodes...
timeout /t 5 /nobreak > nul

:: 6. Launch
echo.
echo  [SYSTEM] Boot sequence complete.
echo  [SERVICES] ---------------------------------------------
echo  [API]      : http://localhost:3001
echo  [FRONTEND] : http://localhost:%TARGET_PORT%
echo  [STATUS]   : ACTIVE
echo  --------------------------------------------------------
echo.
echo  [ACTION] Launching Active Service...
start http://localhost:%TARGET_PORT%

echo.
echo  [SUCCESS] KEN Enterprise is now online.
echo  Press any key to exit bootstrapper...
pause > nul
exit
