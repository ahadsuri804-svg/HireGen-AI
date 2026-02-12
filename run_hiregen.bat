@echo off
echo ===================================================
echo   HIREGEN AI - ONE-CLICK START
echo ===================================================
echo.

echo 1. Cleaning up old processes...
taskkill /F /IM python.exe /T >nul 2>&1
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo 2. Starting BACKEND (Port 8000)...
start "HireGen Backend" cmd /k "cd backend_python && python -m uvicorn Backend.main:app --reload"

echo.
echo 3. Starting FRONTEND (Port 5173)...
start "HireGen Frontend" cmd /k "cd frontend-react && npm run dev"

echo.
echo ===================================================
echo   SYSTEM STARTED!
echo   Please wait 10 seconds, then open:
echo   http://localhost:5173
echo ===================================================
pause
