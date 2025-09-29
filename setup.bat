@echo off
echo ================================
echo Maktabi Tech Setup Script
echo ================================

echo.
echo Installing Node.js dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)

echo.
echo Installing Python dependencies...
call pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)

echo.
echo ================================
echo Setup completed successfully!
echo ================================
echo.
echo To start the application:
echo 1. Backend: python device_api.py
echo 2. Frontend: npm run dev
echo.
echo Frontend will be available at: http://localhost:5173
echo Backend API will be available at: http://localhost:5000
echo.
pause