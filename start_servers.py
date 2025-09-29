#!/usr/bin/env python3
"""
Startup script to run both React development server and Python API server
"""

import subprocess
import sys
import time
import threading
import os

def run_python_api():
    """Run the Python Flask API server"""
    print("🐍 Starting Python API server...")
    try:
        subprocess.run([sys.executable, "device_api.py"], cwd=os.getcwd())
    except KeyboardInterrupt:
        print("🛑 Python API server stopped")

def run_react_dev():
    """Run the React development server"""
    print("⚛️  Starting React development server...")
    try:
        subprocess.run(["npm", "run", "dev"], cwd=os.getcwd())
    except KeyboardInterrupt:
        print("🛑 React server stopped")

def main():
    print("🚀 Starting Maktabi Tech with Network Scanner Integration")
    print("=" * 60)

    # Start Python API server in background thread
    api_thread = threading.Thread(target=run_python_api, daemon=True)
    api_thread.start()

    # Give the API server time to start
    time.sleep(3)

    print("✅ Python API server should be running on http://localhost:5000")
    print("✅ Starting React development server...")
    print("✅ React app will be available on http://localhost:5173")
    print("\n📡 Available API endpoints:")
    print("   - GET  /api/devices - Get discovered network devices")
    print("   - POST /api/scan/start - Start network scanning")
    print("   - POST /api/scan/stop - Stop network scanning")
    print("   - GET  /api/scan/status - Get scanning status")
    print("\n💡 Features:")
    print("   - Real-time device discovery")
    print("   - Device categorization (Cameras, Routers, PCs, etc.)")
    print("   - Drag and drop network devices to video wall")
    print("   - Search and filter discovered devices")
    print("   - Live scanning status updates")
    print("\n🔧 Usage:")
    print("   1. The network scanner will auto-start when you open the app")
    print("   2. Discovered devices will appear in the left sidebar")
    print("   3. Drag devices from sidebar to video wall canvas")
    print("   4. Use search to filter devices by name, IP, or type")
    print("\n🛑 Press Ctrl+C to stop both servers")
    print("=" * 60)

    try:
        # Start React development server (this will block)
        run_react_dev()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down all servers...")
        print("✅ Goodbye!")

if __name__ == "__main__":
    main()