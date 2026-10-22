@echo off
setlocal enabledelayedexpansion
title PatentIntel.AI - Enterprise Patent Intelligence Platform
cd /d "%~dp0"

echo ===============================================================================
echo            PatentIntel.AI - One-Click Project Launcher
echo ===============================================================================
echo.

:: Step 1: Check for Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not found on your system PATH!
    echo Please install Node.js from https://nodejs.org/
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

:: Step 2: Ensure .env exists from template
if not exist ".env" (
    if exist ".env.example" (
        echo [1/4] Generating .env configuration from .env.example...
        copy /y ".env.example" ".env" >nul
        echo       .env file created successfully.
    )
) else (
    echo [1/4] .env configuration file detected.
)

:: Step 3: Check and clean any stale lock files from previous abrupt shutdowns
if exist ".data\auth.lock" (
    echo [2/4] Clearing stale database lock...
    rmdir /s /q ".data\auth.lock" >nul 2>nul
)
if exist ".data\auth\postmaster.pid" (
    echo [2/4] Removing stale postmaster PID...
    del /f /q ".data\auth\postmaster.pid" >nul 2>nul
)
echo [2/4] Database state verified.

:: Step 4: Verify node_modules dependencies
if not exist "node_modules\" (
    echo [3/4] Dependencies missing. Installing node_modules...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo.
        echo [ERROR] npm install encountered an error.
        echo Please check your internet connection and try again.
        pause
        exit /b 1
    )
    echo       Dependencies installed successfully!
) else (
    echo [3/4] Node modules verified.
)

:: Step 5: Start the application and launch browser
echo [4/4] Starting PatentIntel.AI development server...
echo.
echo ===============================================================================
echo   Access URL: http://localhost:5173
echo   Press Ctrl+C in this terminal window anytime to stop the server.
echo ===============================================================================
echo.

:: Launch browser in background after 3 seconds
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:5173"

:: Run the Vite + Backend Server
call npm run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [NOTICE] Server process ended with code %ERRORLEVEL%.
    pause
)
