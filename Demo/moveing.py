import socket
import json
import time

class QSysAuroraDIDO:
    """
    Controller for Aurora DIDO plugin in Q-SYS Core
    Controls window positions and routing
    """
    
    def __init__(self, core_ip, core_port=1710, component_name="AuroraDIDO"):
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
        
        # Convert to JSON and add null terminator
        message = json.dumps(command) + "\x00"
        
        try:
            self.sock.sendall(message.encode())
            print(f"Sent: {json.dumps(command, indent=2)}")
            
            # Receive response
            response = self.sock.recv(4096).decode().strip('\x00')
            if response:
                print(f"Response: {response}")
            return response
        except Exception as e:
            print(f"Error sending command: {e}")
            return None
    
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
            print("Error: Window number must be 1-4")
            return
        
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
            print("No parameters to set")
    
    def enable_window(self, window_num, enable=True):
        """
        Enable or disable a window
        
        Args:
            window_num: Window number (1-4)
            enable: True to enable, False to disable
        """
        if window_num not in [1, 2, 3, 4]:
            print("Error: Window number must be 1-4")
            return
        
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


# Example usage
if __name__ == "__main__":
    # Initialize controller
    controller = QSysAuroraDIDO(
        core_ip="192.168.100.10",
        component_name="AuroraDIDO",
    )
    
    # Connect to Q-SYS Core
    if controller.connect():
        try:
            # Step 1: Set windowing output (REQUIRED - tells Aurora which output displays windows)
            print("\n=== Step 1: Setting windowing output ===")
            controller.set_windowing_output("out1")
            time.sleep(1.0)

            # Step 2: Enable Window 1
            print("\n=== Step 2: Enabling Window 1 ===")
            controller.enable_window(1, True)
            time.sleep(1.0)

            # Step 3: Set Window 1 position and size
            print("\n=== Step 3: Setting Window 1 position ===")
            controller.set_window_position(1, x=0, y=0, w=50, h=20)
            time.sleep(1.0)
            
            # # Example 2: Set Window 2 position
            # print("\n=== Example 2: Setting Window 2 ===")
            # controller.set_window_position(2, x=30, y=30, w=40, h=40)
            # time.sleep(0.5)
            
            # # Example 3: Set Window 3 position
            # print("\n=== Example 3: Setting Window 3 ===")
            # controller.set_window_position(3, x=0, y=0, w=25, h=25)
            # time.sleep(0.5)
            
            # # Example 4: Set Window 4 position
            # print("\n=== Example 4: Setting Window 4 ===")
            # controller.set_window_position(4, x=75, y=75, w=25, h=25)
            # time.sleep(0.5)
            
            # # Example 5: Enable/Disable windows
            # print("\n=== Example 5: Enabling Window 1 ===")
            # controller.enable_window(1, True)
            # time.sleep(0.5)
            
            # # Example 6: Set windowing output
            # print("\n=== Example 6: Setting windowing output ===")
            # controller.set_windowing_output("out1")
            # time.sleep(0.5)
            
            # # Example 7: Update only X and Y position
            # print("\n=== Example 7: Moving Window 1 ===")
            # controller.set_window_position(1, x=50, y=50)
            
        finally:
            # Always disconnect
            controller.disconnect()
    else:
        print("Failed to connect to Q-SYS Core")