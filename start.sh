#!/bin/bash

echo "Starting Maktabi Tech Application..."
echo

# Function to start backend
start_backend() {
    echo "Starting Python backend server..."
    if command -v python3 &> /dev/null; then
        python3 device_api.py &
    else
        python device_api.py &
    fi
    BACKEND_PID=$!
    echo "Backend server started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "Starting React frontend..."
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend server started with PID: $FRONTEND_PID"
}

# Start both servers
start_backend
sleep 3
start_frontend

echo
echo "Both servers are running:"
echo "Frontend: http://localhost:5173"
echo "Backend: http://localhost:5000"
echo
echo "Press Ctrl+C to stop both servers..."

# Function to cleanup on exit
cleanup() {
    echo
    echo "Stopping servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "Frontend server stopped"
    fi
    exit 0
}

# Setup trap for cleanup
trap cleanup INT

# Wait for user interrupt
wait