@echo off
echo Starting Maktabi Tech Application...
echo.

echo Starting Python backend server...
start "Backend Server" cmd /c "python device_api.py"

timeout /t 3

echo Starting React frontend...
start "Frontend Server" cmd /c "npm run dev"

echo.
echo Both servers are starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:5000
echo.
echo Press any key to close this window...
pause > nul