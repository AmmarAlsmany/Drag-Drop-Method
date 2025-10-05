from flask import Flask, jsonify, request, Response
from flask_cors import CORS
import time
import json
import io
import os
import sys
from datetime import datetime, timedelta
import socket
import struct

# Fix Windows console encoding for emoji characters
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})  # Enable CORS for React frontend

# Static HDMI device list (no scanning needed)
hdmi_devices = {
    'devices': [
        {
            'id': 'hdmi-input-1',
            'name': 'HDMI Input 1',
            'ip': 'local',
            'type': 'HDMI Source',
            'manufacturer': 'Q-SYS',
            'model': 'Aurora DIDO',
            'confidence': 100,
            'ports': [],
            'services': ['HDMI'],
            'src': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%234A90E2"/%3E%3Ctext x="100" y="75" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EHDMI 1%3C/text%3E%3C/svg%3E',
            'inputNumber': 1,
            'status': 'online'
        },
        {
            'id': 'hdmi-input-2',
            'name': 'HDMI Input 2',
            'ip': 'local',
            'type': 'HDMI Source',
            'manufacturer': 'Q-SYS',
            'model': 'Aurora DIDO',
            'confidence': 100,
            'ports': [],
            'services': ['HDMI'],
            'src': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%2350C878"/%3E%3Ctext x="100" y="75" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EHDMI 2%3C/text%3E%3C/svg%3E',
            'inputNumber': 2,
            'status': 'online'
        },
        {
            'id': 'hdmi-input-3',
            'name': 'HDMI Input 3',
            'ip': 'local',
            'type': 'HDMI Source',
            'manufacturer': 'Q-SYS',
            'model': 'Aurora DIDO',
            'confidence': 100,
            'ports': [],
            'services': ['HDMI'],
            'src': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23F5A623"/%3E%3Ctext x="100" y="75" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EHDMI 3%3C/text%3E%3C/svg%3E',
            'inputNumber': 3,
            'status': 'online'
        },
        {
            'id': 'hdmi-input-4',
            'name': 'HDMI Input 4',
            'ip': 'local',
            'type': 'HDMI Source',
            'manufacturer': 'Q-SYS',
            'model': 'Aurora DIDO',
            'confidence': 100,
            'ports': [],
            'services': ['HDMI'],
            'src': 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"%3E%3Crect width="200" height="150" fill="%23D0021B"/%3E%3Ctext x="100" y="75" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle"%3EHDMI 4%3C/text%3E%3C/svg%3E',
            'inputNumber': 4,
            'status': 'online'
        }
    ],
    'scan_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
    'total_devices': 4,
    'device_categories': {
        'HDMI Sources': [],
        'IP Cameras': [],
        'Network Devices': [],
        'Servers': [],
        'PCs': [],
        'Unknown': []
    }
}

# Populate categories
for device in hdmi_devices['devices']:
    hdmi_devices['device_categories']['HDMI Sources'].append(device)

# Thumbnail caching removed - using inline SVG for HDMI sources

@app.route('/api/devices', methods=['GET'])
def get_devices():
    """Get current list of HDMI devices"""
    return jsonify({
        'status': 'success',
        'data': hdmi_devices
    })

@app.route('/api/devices/categories', methods=['GET'])
def get_device_categories():
    """Get devices organized by categories"""
    return jsonify({
        'status': 'success',
        'categories': hdmi_devices['device_categories'],
        'total': hdmi_devices['total_devices'],
        'timestamp': hdmi_devices['scan_timestamp']
    })

# Scan and thumbnail routes removed - using static HDMI inputs with inline SVG

# Q-SYS Core Aurora DIDO Plugin Integration (using TCP JSON-RPC)
class QSysAuroraDIDO:
    """
    Controller for Aurora DIDO plugin in Q-SYS Core
    Controls window positions and routing via TCP socket with JSON-RPC 2.0
    """

    def __init__(self, core_ip="192.168.100.10", core_port=1710, component_name="AuroraDIDO"):
        """
        Initialize Q-SYS Aurora DIDO controller

        Args:
            core_ip: IP address of Q-SYS Core (e.g., "192.168.100.10")
            core_port: Q-SYS External Control port (default: 1710)
            component_name: Name of Aurora DIDO component in Q-SYS design
        """
        self.core_ip = core_ip
        self.core_port = core_port
        self.component_name = component_name
        self.sock = None
        self.request_id = 1

    def connect(self):
        """Establish connection to Q-SYS Core"""
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.sock.connect((self.core_ip, self.core_port))
            print(f"Connected to Q-SYS Core at {self.core_ip}:{self.core_port}")
            return True
        except Exception as e:
            print(f"Connection failed: {e}")
            return False

    def disconnect(self):
        """Close connection to Q-SYS Core"""
        if self.sock:
            self.sock.close()
            print("Disconnected from Q-SYS Core")

    def send_command(self, controls):
        """
        Send control command to Aurora DIDO component

        Args:
            controls: List of control dictionaries with Name, Type, and Value
        """
        command = {
            "jsonrpc": "2.0",
            "id": self.request_id,
            "method": "Component.Set",
            "params": {
                "Name": self.component_name,
                "Controls": controls
            }
        }

        self.request_id += 1

        # Convert to JSON string (compact, no spaces) and add null terminator
        message = json.dumps(command, separators=(',', ':')) + "\x00"

        try:
            self.sock.sendall(message.encode())
            print(f"Sent (compact): {message[:-1]}\\x00")  # Show actual compact message
            # print(f"Sent (pretty): {json.dumps(command, indent=2)}")  # Commented out for clarity

            # Receive response with timeout
            self.sock.settimeout(5.0)  # 5 second timeout
            response = self.sock.recv(4096).decode().strip('\x00')
            if response:
                print(f"Response: {response}")
                return {'status': 'success', 'response': response}
            return {'status': 'success', 'response': None}
        except socket.timeout:
            print(f"⚠️ Socket timeout - connection may be stale")
            self.sock = None  # Mark socket as invalid
            return {'status': 'error', 'message': 'Command timeout - connection lost'}
        except Exception as e:
            print(f"❌ Error sending command: {e}")
            self.sock = None  # Mark socket as invalid
            return {'status': 'error', 'message': f'Command failed: {str(e)}'}

    def set_window_position(self, window_num, x=None, y=None, w=None, h=None):
        """
        Set position and size for a specific window

        Args:
            window_num: Window number (1-4)
            x: X position (0-100), None to skip
            y: Y position (0-100), None to skip
            w: Width (0-100), None to skip
            h: Height (0-100), None to skip
        """
        if window_num not in [1, 2, 3, 4]:
            return {'status': 'error', 'message': 'Window number must be 1-4'}

        controls = []

        if x is not None:
            controls.append({
                "Name": f"Window{window_num}_x",
                "Type": "Text",
                "Value": str(x)
            })

        if y is not None:
            controls.append({
                "Name": f"Window{window_num}_y",
                "Type": "Text",
                "Value": str(y)
            })

        if w is not None:
            controls.append({
                "Name": f"Window{window_num}_w",
                "Type": "Text",
                "Value": str(w)
            })

        if h is not None:
            controls.append({
                "Name": f"Window{window_num}_h",
                "Type": "Text",
                "Value": str(h)
            })

        if controls:
            print(f"\nSetting Window {window_num} position...")
            return self.send_command(controls)
        else:
            return {'status': 'error', 'message': 'No parameters to set'}

    def set_window_source(self, window_num, output_num):
        """
        Set which output a window displays

        Args:
            window_num: Window number (1-4)
            output_num: Output number (1-4) to display in this window
        """
        if window_num not in [1, 2, 3, 4]:
            return {'status': 'error', 'message': 'Window number must be 1-4'}

        if output_num not in [1, 2, 3, 4]:
            return {'status': 'error', 'message': 'Output number must be 1-4'}

        controls = [{
            "Name": f"Window{window_num}Route",
            "Type": "Text",
            "Value": f"out{output_num}"
        }]

        print(f"Setting Window {window_num} to display Output {output_num}...")
        return self.send_command(controls)

    def enable_window(self, window_num, enable=True):
        """
        Enable or disable a window

        Args:
            window_num: Window number (1-4)
            enable: True to enable, False to disable
        """
        if window_num not in [1, 2, 3, 4]:
            return {'status': 'error', 'message': 'Window number must be 1-4'}

        controls = [{
            "Name": f"Window{window_num}Enable",
            "Type": "Boolean",
            "Value": enable
        }]

        print(f"\n{'Enabling' if enable else 'Disabling'} Window {window_num}...")
        return self.send_command(controls)

    def set_windowing_output(self, output):
        """
        Set windowing output

        Args:
            output: Output selection ("Disabled", "out1", "out2", "out3", "out4")
        """
        controls = [{
            "Name": "WindowingOutput",
            "Type": "Text",
            "Value": output
        }]

        print(f"\nSetting windowing output to {output}...")
        return self.send_command(controls)

    def route_input_to_output(self, input_num, output_num):
        """
        Route an input to an output

        Args:
            input_num: Input number (1-4)
            output_num: Output number (1-4)
        """
        controls = [{
            "Name": f"Output{output_num}Route",
            "Type": "Text",
            "Value": f"in{input_num}"
        }]

        print(f"\nRouting input {input_num} to output {output_num}...")
        return self.send_command(controls)

    def enable_output(self, output_num, enable=True):
        """
        Enable or disable windowing for a specific output

        Args:
            output_num: Output number (1-4)
            enable: True to enable, False to disable
        """
        try:
            if enable:
                # Enable windowing for this output
                controls = [
                    {"Name": "WindowingOutput", "Type": "Text", "Value": f"out{output_num}"},
                    {"Name": "Window1Enable", "Type": "Boolean", "Value": True},
                    {"Name": "Window2Enable", "Type": "Boolean", "Value": True},
                    {"Name": "Window3Enable", "Type": "Boolean", "Value": True},
                    {"Name": "Window4Enable", "Type": "Boolean", "Value": True}
                ]
            else:
                # Disable windowing - turn off all windows and disable windowing output
                controls = [
                    {"Name": "WindowingOutput", "Type": "Text", "Value": "Disabled"},
                    {"Name": "Window1Enable", "Type": "Boolean", "Value": False},
                    {"Name": "Window2Enable", "Type": "Boolean", "Value": False},
                    {"Name": "Window3Enable", "Type": "Boolean", "Value": False},
                    {"Name": "Window4Enable", "Type": "Boolean", "Value": False}
                ]

            result = self.send_command(controls)
            print(f"{'Enabled' if enable else 'Disabled'} windowing for Output {output_num}")
            return result

        except Exception as e:
            return {'status': 'error', 'message': f'Enable/disable failed: {str(e)}'}

    def clear_output(self, output_num):
        """Clear/reset DIDO output by disabling all windows and setting windowing to disabled"""
        try:
            controls = [
                {"Name": "WindowingOutput", "Type": "Text", "Value": "Disabled"},
                {"Name": "Window1Enable", "Type": "Boolean", "Value": False},
                {"Name": "Window2Enable", "Type": "Boolean", "Value": False},
                {"Name": "Window3Enable", "Type": "Boolean", "Value": False},
                {"Name": "Window4Enable", "Type": "Boolean", "Value": False}
            ]

            result = self.send_command(controls)
            return result

        except Exception as e:
            return {'status': 'error', 'message': f'Clear failed: {str(e)}'}

    def route_with_position(self, input_sources, output_num):
        """
        Route inputs with windowing positions
        Aurora DIDO Logic: Route first input directly to output, enable windowing,
        then configure windows with positions

        Args:
            input_sources: List of dicts [{"input": 1, "position": 0}, ...] where position 0-3 is quad position
            output_num: Final output to display windowed view
        """
        try:
            results = []

            # Step 1: Route FIRST input to the output
            # Aurora DIDO requires at least one input routed to use windowing
            if len(input_sources) > 0:
                first_input = input_sources[0]['input']
                route_result = self.route_input_to_output(first_input, output_num)
                results.append({
                    'command': 'route_primary_input',
                    'input': first_input,
                    'output': output_num,
                    'result': route_result
                })
                time.sleep(0.5)

            # Step 2: Enable windowing for the output
            windowing_result = self.set_windowing_output(f"out{output_num}")
            results.append({
                'command': 'enable_windowing',
                'output': output_num,
                'result': windowing_result
            })
            time.sleep(0.5)

            # Step 3: Configure ALL windows in a SINGLE batch command
            # This is more reliable than sending commands one by one
            controls = []

            # Map quad positions to Aurora DIDO window coordinates (0-100 scale)
            window_coords = {
                0: {'x': 0, 'y': 0, 'w': 50, 'h': 50},      # Top-left
                1: {'x': 50, 'y': 0, 'w': 50, 'h': 50},     # Top-right
                2: {'x': 0, 'y': 50, 'w': 50, 'h': 50},     # Bottom-left
                3: {'x': 50, 'y': 50, 'w': 50, 'h': 50},    # Bottom-right
            }

            # Map each input to a specific window number (consistent mapping)
            # Input 1 -> Window 1, Input 2 -> Window 2, etc.
            # This way, moving a source just changes its position, not its window
            used_windows = set()

            for i, source in enumerate(input_sources):
                input_num = source['input']
                quad_position = source['position']
                window_num = i + 1  # Use index to assign window (1st source = Window 1)
                used_windows.add(window_num)
                coords = window_coords[quad_position]

                # Add all controls for this window
                controls.extend([
                    {"Name": f"Window{window_num}Enable", "Type": "Boolean", "Value": "true"},
                    {"Name": f"Window{window_num}_x", "Type": "Text", "Value": str(coords['x'])},
                    {"Name": f"Window{window_num}_y", "Type": "Text", "Value": str(coords['y'])},
                    {"Name": f"Window{window_num}_w", "Type": "Text", "Value": str(coords['w'])},
                    {"Name": f"Window{window_num}_h", "Type": "Text", "Value": str(coords['h'])}
                ])

            # Disable unused windows
            for window_num in range(1, 5):
                if window_num not in used_windows:
                    controls.append(
                        {"Name": f"Window{window_num}Enable", "Type": "Boolean", "Value": "false"}
                    )

            # Send all window configurations in ONE batch command
            batch_result = self.send_command(controls)
            results.append({
                'command': 'configure_all_windows_batch',
                'windows_configured': len(input_sources),
                'controls_sent': len(controls),
                'result': batch_result
            })

            return results

        except Exception as e:
            return [{'status': 'error', 'message': f'Position routing failed: {str(e)}'}]

# Initialize Q-SYS core DIDO plugin controller
qsys = QSysAuroraDIDO()

# Maintain persistent connection to Q-SYS with retry
def ensure_qsys_connection(max_retries=3):
    """Ensure Q-SYS connection is active, reconnect if needed"""
    for attempt in range(max_retries):
        try:
            # Test if socket is still valid by checking if we can get socket info
            if qsys.sock:
                try:
                    qsys.sock.getpeername()  # This will raise an error if socket is closed
                    print(f"✅ Q-SYS connection active")
                    return True
                except:
                    print(f"⚠️ Q-SYS connection lost (attempt {attempt + 1}/{max_retries}), reconnecting...")
                    qsys.sock = None

            # No socket or socket invalid, reconnect
            print(f"⚠️ Q-SYS not connected, connecting (attempt {attempt + 1}/{max_retries})...")
            if qsys.connect():
                print(f"✅ Q-SYS connected successfully")
                return True

            # Wait before retry
            if attempt < max_retries - 1:
                time.sleep(1)

        except Exception as e:
            print(f"❌ Connection check failed (attempt {attempt + 1}/{max_retries}): {e}")
            qsys.sock = None
            if attempt < max_retries - 1:
                time.sleep(1)

    print(f"❌ Failed to connect to Q-SYS after {max_retries} attempts")
    return False

# DIDO Routing API Endpoints
@app.route('/api/dido/route', methods=['POST'])
def dido_route():
    """Route inputs to outputs via Q-SYS Aurora DIDO"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        input_num = data.get('input')
        output_num = data.get('output')

        if input_num is None or output_num is None:
            return jsonify({'status': 'error', 'message': 'Both input and output are required'}), 400

        # Ensure connection
        if not ensure_qsys_connection():
            return jsonify({'status': 'error', 'message': 'Failed to connect to Q-SYS Core'}), 500

        result = qsys.route_input_to_output(input_num, output_num)

        if result['status'] == 'success':
            return jsonify({
                'status': 'success',
                'message': f'Routed input {input_num} to output {output_num}',
                'qsys_response': result.get('response')
            })
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Routing failed: {str(e)}'
        }), 500

@app.route('/api/dido/route-multiple', methods=['POST'])
def dido_route_multiple():
    """Route multiple inputs with windowing (deprecated - use route-with-positions instead)"""
    return jsonify({
        'status': 'error',
        'message': 'This endpoint is deprecated. Use /api/dido/route-with-positions instead'
    }), 400

@app.route('/api/dido/route-with-positions', methods=['POST'])
def dido_route_with_positions():
    """Route multiple inputs to output with specific quadrant positions via Q-SYS"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        sources = data.get('sources', [])
        output_num = data.get('output')

        if not sources or output_num is None:
            return jsonify({'status': 'error', 'message': 'Both sources array and output are required'}), 400

        # Validate source format: [{"input": 1, "position": 0}, {"input": 2, "position": 1}]
        for source in sources:
            if 'input' not in source or 'position' not in source:
                return jsonify({'status': 'error', 'message': 'Each source must have input and position'}), 400
            if source['position'] not in [0, 1, 2, 3]:
                return jsonify({'status': 'error', 'message': 'Position must be 0-3 (quad positions)'}), 400

        # Connect to Q-SYS
        if not qsys.connect():
            return jsonify({'status': 'error', 'message': 'Failed to connect to Q-SYS Core'}), 500

        try:
            # Use Q-SYS core DIDO plugin for positioning
            results = qsys.route_with_position(sources, output_num)

            # Check if Q-SYS operation was successful
            success = False
            if results and len(results) > 0:
                # Check if any operation succeeded
                for result in results:
                    if result.get('result', {}).get('status') == 'success':
                        success = True
                        break

            if success:
                print(f"SUCCESS: Q-SYS positioned {len(sources)} sources on output {output_num}")
            else:
                print(f"FAILED: Q-SYS positioning failed")

            return jsonify({
                'status': 'success' if success else 'error',
                'message': f'Q-SYS positioned {len(sources)} sources on output {output_num}' if success else 'Q-SYS positioning failed',
                'qsys_operations': results,
                'quad_map': {
                    0: 'Top-Left',
                    1: 'Top-Right',
                    2: 'Bottom-Left',
                    3: 'Bottom-Right'
                }
            })

        except Exception as inner_e:
            return jsonify({
                'status': 'error',
                'message': f'Q-SYS operation failed: {str(inner_e)}'
            }), 500
        finally:
            qsys.disconnect()

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Position-based routing failed: {str(e)}'
        }), 500

@app.route('/api/dido/route-with-coordinates', methods=['POST'])
def dido_route_with_coordinates():
    """Route inputs to output with custom coordinates via Q-SYS"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        sources = data.get('sources', [])
        output_num = data.get('output')

        if not sources or output_num is None:
            return jsonify({'status': 'error', 'message': 'Both sources array and output are required'}), 400

        # Validate source format: [{"input": 1, "coordinates": {"x": 10, "y": 10, "w": 40, "h": 40}}]
        for source in sources:
            if 'input' not in source or 'coordinates' not in source:
                return jsonify({'status': 'error', 'message': 'Each source must have input and coordinates'}), 400

            coords = source['coordinates']
            required_coords = ['x', 'y', 'w', 'h']
            if not all(coord in coords for coord in required_coords):
                return jsonify({'status': 'error', 'message': 'Coordinates must include x, y, w, h'}), 400

        # Connect to Q-SYS with retry mechanism
        if not ensure_qsys_connection():
            return jsonify({'status': 'error', 'message': 'Failed to connect to Q-SYS Core'}), 500

        try:
            results = []

            print(f"\n📍 Processing {len(sources)} sources for Output {output_num}")

            # Step 1: Route all inputs to the output first
            print(f"\n🔄 Step 1: Routing inputs to Output {output_num}")
            for source in sources:
                input_num = source['input']
                print(f"   Routing Input {input_num} → Output {output_num}")
                route_result = qsys.route_input_to_output(input_num, output_num)

                if route_result.get('status') == 'error':
                    print(f"   ⚠️ Command failed, attempting reconnection...")
                    if ensure_qsys_connection():
                        route_result = qsys.route_input_to_output(input_num, output_num)

                results.append({
                    'command': 'route_input',
                    'input': input_num,
                    'output': output_num,
                    'result': route_result
                })
                time.sleep(0.2)

            # Step 2: Enable windowing on the target output
            print(f"\n🪟 Step 2: Enabling windowing on Output {output_num}")

            if not ensure_qsys_connection():
                return jsonify({'status': 'error', 'message': 'Connection lost'}), 500

            windowing_result = qsys.set_windowing_output(f"out{output_num}")
            print(f"   Result: {windowing_result}")

            if windowing_result.get('status') == 'error':
                print(f"   ⚠️ Command failed, attempting reconnection...")
                if ensure_qsys_connection():
                    windowing_result = qsys.set_windowing_output(f"out{output_num}")

            results.append({
                'command': 'enable_windowing',
                'output': output_num,
                'result': windowing_result
            })
            time.sleep(0.5)

            # Configure windows: route each input to corresponding window
            print(f"\n📐 Configuring {len(sources)} windows on Output {output_num}")

            if not ensure_qsys_connection():
                return jsonify({'status': 'error', 'message': 'Connection lost'}), 500

            # Build window configurations, sorted by window number
            window_configs = {}

            for i, source in enumerate(sources):
                input_num = source['input']
                window_num = input_num  # Window number matches input number
                coords = source['coordinates']

                print(f"   📐 Window {window_num}: Input {input_num}, Position x={coords['x']}, y={coords['y']}, w={coords['w']}, h={coords['h']}")

                # Store window config
                window_configs[window_num] = [
                    {"Name": f"Window{window_num}Route", "Type": "Text", "Value": f"in{input_num}"},
                    {"Name": f"Window{window_num}Enable", "Type": "Boolean", "Value": True},
                    {"Name": f"Window{window_num}_x", "Type": "Text", "Value": str(coords['x'])},
                    {"Name": f"Window{window_num}_y", "Type": "Text", "Value": str(coords['y'])},
                    {"Name": f"Window{window_num}_w", "Type": "Text", "Value": str(coords['w'])},
                    {"Name": f"Window{window_num}_h", "Type": "Text", "Value": str(coords['h'])}
                ]

            # Build controls in window number order (1, 2, 3, 4)
            controls = []
            for window_num in range(1, 5):
                if window_num in window_configs:
                    controls.extend(window_configs[window_num])
                else:
                    # Disable unused window
                    controls.append(
                        {"Name": f"Window{window_num}Enable", "Type": "Boolean", "Value": False}
                    )

            # Send all window configurations in ONE batch command
            print(f"   📤 Sending batch command with {len(controls)} controls")
            batch_result = qsys.send_command(controls)
            print(f"   Result: {batch_result}")

            results.append({
                'command': 'configure_windows',
                'windows_configured': len(sources),
                'controls_sent': len(controls),
                'result': batch_result
            })

            return jsonify({
                'status': 'success' if batch_result.get('status') == 'success' else 'error',
                'message': f'Configured {len(sources)} windows on output {output_num}',
                'operations': results
            })
        finally:
            qsys.disconnect()

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Coordinate-based routing failed: {str(e)}'
        }), 500

@app.route('/api/dido/clear-output', methods=['POST'])
def dido_clear_output():
    """Clear/reset DIDO output (remove all windowing and routing) via Q-SYS"""
    try:
        data = request.get_json() or {}
        output_num = data.get('output', 1)  # Default to output 1

        # Connect to Q-SYS
        if not qsys.connect():
            return jsonify({'status': 'error', 'message': 'Failed to connect to Q-SYS Core'}), 500

        try:
            # Use Q-SYS core to clear output
            clear_result = qsys.clear_output(output_num)

            success = clear_result.get('status') == 'success'

            return jsonify({
                'status': 'success' if success else 'error',
                'message': f'Q-SYS cleared output {output_num}' if success else f'Q-SYS clear failed: {clear_result.get("message", "Unknown error")}',
                'qsys_operation': clear_result
            })
        finally:
            qsys.disconnect()

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Clear output failed: {str(e)}'
        }), 500

@app.route('/api/dido/status', methods=['GET'])
def dido_status():
    """Get DIDO routing status (deprecated)"""
    return jsonify({
        'status': 'info',
        'message': 'Status endpoint not yet implemented for Q-SYS TCP connection'
    })

@app.route('/api/dido/clear', methods=['POST'])
def dido_clear():
    """Clear/disconnect an output (alias for clear-output)"""
    return dido_clear_output()

@app.route('/api/dido/toggle-window', methods=['POST'])
def dido_toggle_window():
    """Enable or disable windowing for a specific output"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'status': 'error', 'message': 'No JSON data provided'}), 400

        output_num = data.get('output')
        enable = data.get('enable', True)

        if output_num is None:
            return jsonify({'status': 'error', 'message': 'Output number is required'}), 400

        # Ensure connection
        if not ensure_qsys_connection():
            return jsonify({'status': 'error', 'message': 'Failed to connect to Q-SYS Core'}), 500

        result = qsys.enable_output(output_num, enable)

        if result['status'] == 'success':
            return jsonify({
                'status': 'success',
                'message': f"{'Enabled' if enable else 'Disabled'} windowing for output {output_num}",
                'qsys_response': result.get('response')
            })
        else:
            return jsonify(result), 500

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Toggle window failed: {str(e)}'
        }), 500


# Q-SYS Configuration API
@app.route('/api/qsys/config', methods=['GET', 'POST'])
def qsys_config():
    """Get or update Q-SYS core configuration"""
    global qsys

    if request.method == 'GET':
        # Return current Q-SYS configuration
        return jsonify({
            'status': 'success',
            'config': {
                'core_ip': qsys.core_ip,
                'core_port': qsys.core_port,
                'component_name': qsys.component_name,
                'request_id': qsys.request_id
            }
        })

    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'status': 'error', 'message': 'No configuration data provided'}), 400

            # Update Q-SYS configuration
            core_ip = data.get('core_ip', qsys.core_ip)
            core_port = data.get('core_port', qsys.core_port)
            component_name = data.get('component_name', qsys.component_name)

            # Create new Q-SYS controller with updated settings
            qsys = QSysAuroraDIDO(core_ip, core_port, component_name)

            return jsonify({
                'status': 'success',
                'message': 'Q-SYS configuration updated',
                'config': {
                    'core_ip': qsys.core_ip,
                    'core_port': qsys.core_port,
                    'component_name': qsys.component_name,
                    'request_id': qsys.request_id
                }
            })

        except Exception as e:
            return jsonify({
                'status': 'error',
                'message': f'Configuration update failed: {str(e)}'
            }), 500

@app.route('/api/qsys/test', methods=['GET'])
def qsys_test():
    """Test Q-SYS core connection with Aurora DIDO plugin"""
    try:
        # Connect to Q-SYS
        if not qsys.connect():
            return jsonify({
                'status': 'error',
                'message': 'Failed to connect to Q-SYS Core',
                'qsys_config': {
                    'core_ip': qsys.core_ip,
                    'core_port': qsys.core_port,
                    'component_name': qsys.component_name
                }
            }), 500

        try:
            # Try to read a status value
            test_controls = [
                {"Name": "IPAddress", "Type": "Text", "Value": ""}
            ]
            result = qsys.send_command(test_controls)

            return jsonify({
                'status': 'success' if result.get('status') == 'success' else 'error',
                'message': 'Q-SYS Aurora DIDO plugin connection test completed',
                'test_result': result,
                'qsys_config': {
                    'core_ip': qsys.core_ip,
                    'core_port': qsys.core_port,
                    'component_name': qsys.component_name
                }
            })
        finally:
            qsys.disconnect()

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Q-SYS connection test failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("Starting Device Discovery API Server...")
    print("API will be available at http://localhost:5000")
    print(" Available endpoints:")
    print("   GET  /api/devices - Get all discovered devices")
    print("   GET  /api/devices/categories - Get categorized devices")
    print("   POST /api/scan/start - Start network scanning")
    print("   POST /api/scan/stop - Stop network scanning")
    print("   GET  /api/scan/status - Get scanning status")
    print("   POST /api/rescan - Trigger immediate rescan")
    print("   GET  /api/thumbnail?url=<stream_url> - Get thumbnail from MJPEG stream")
    print("   POST /api/dido/route - Route single input to output")
    print("   POST /api/dido/route-multiple - Route multiple inputs to single output")
    print("   GET  /api/dido/status - Get DIDO routing status")
    print("   POST /api/dido/clear - Clear/disconnect output")

    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)