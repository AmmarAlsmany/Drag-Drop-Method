#!/bin/bash

echo "================================"
echo "Maktabi Tech Setup Script"
echo "================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "Error: Python is not installed. Please install Python first."
    exit 1
fi

echo
echo "Installing Node.js dependencies..."
if ! npm install; then
    echo "Error: Failed to install Node.js dependencies"
    exit 1
fi

echo
echo "Installing Python dependencies..."
if command -v python3 &> /dev/null; then
    if ! python3 -m pip install -r requirements.txt; then
        echo "Error: Failed to install Python dependencies"
        exit 1
    fi
else
    if ! python -m pip install -r requirements.txt; then
        echo "Error: Failed to install Python dependencies"
        exit 1
    fi
fi

echo
echo "================================"
echo "Setup completed successfully!"
echo "================================"
echo
echo "To start the application:"
echo "1. Backend: python device_api.py (or python3 device_api.py)"
echo "2. Frontend: npm run dev"
echo
echo "Frontend will be available at: http://localhost:5173"
echo "Backend API will be available at: http://localhost:5000"
echo