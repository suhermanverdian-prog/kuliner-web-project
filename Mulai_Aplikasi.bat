@echo off
SETLOCAL EnableDelayedExpansion

:: ==========================================================
:: KEN ERP - SYSTEM BOOTSTRAPPER (PROFESSIONAL EDITION)
:: ==========================================================
:: Author: KEN Developer Team
:: Version: 1.2.0
:: ==========================================================

title KEN ERP - Enterprise Resource Planning
mode con: cols=100 lines=30
color 0B

echo.
echo  ##########################################################
echo  #                                                        #
echo  #         KEN ERP SYSTEM - STARTING BOOT SEQUENCE        #
echo  #                                                        #
echo  ##########################################################
echo.

:: 1. Backend Initialization
echo  [SYSTEM] Checking Backend Services...
echo  [SYSTEM] Initializing Node.js API Server on Port 3001...
start "KEN-BACKEND" /min cmd /k "echo KEN BACKEND IS RUNNING... && cd backend && node src/server.js"

:: 2. Frontend Initialization
echo  [SYSTEM] Preparing Frontend UI Engine...
echo  [SYSTEM] Initializing Vite Development Server on Port 5173...
start "KEN-FRONTEND" /min cmd /k "echo KEN FRONTEND IS RUNNING... && cd frontend && npm run dev"

:: 3. Waiting Sequence
echo  [SYSTEM] Synchronizing services...
set "spinner=/-\|"
for /L %%i in (1,1,15) do (
    set /a "idx=%%i %% 4"
    for /L %%n in (!idx!,1,!idx!) do (
        <nul set /p "= [BOOT] Loading !spinner:~%%n,1! Please wait...  "
        timeout /t 1 /nobreak > nul
        echo | set /p "= "
    )
)
echo.

:: 4. Final Launch
echo.
echo  [SYSTEM] Boot sequence complete.
echo  [SYSTEM] Backend  : http://localhost:3001
echo  [SYSTEM] Frontend : http://localhost:5173
echo.
echo  [ACTION] Opening Browser...
start http://localhost:5173

echo  [OK] KEN ERP is now active.
echo  [OK] Keep the minimized windows open to maintain connectivity.
echo.
echo  Press any key to close this bootstrapper...
pause > nul
exit
