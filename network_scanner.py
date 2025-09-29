import socket
import subprocess
import threading
import time
import platform
import requests
from urllib.parse import urlparse
import urllib3
try:
    from scapy.all import *
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False
    print("Warning: scapy not available. Packet capture will be disabled.")
import netifaces
import ipaddress
import json
from collections import defaultdict

# Disable SSL warnings for local network scanning
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

class NetworkStreamScanner:
    def __init__(self):
        self.active_hosts = []
        self.streaming_ports = [80, 443, 554, 1935, 8080, 8554, 5004, 5005, 1234]  # Common streaming ports
        self.detected_streams = []
        self.traffic_data = defaultdict(list)
        self.device_info = {}  # Store device identification results
        
    def get_local_network(self):
        """Get the local network range"""
        try:
            # Get default gateway interface
            gateways = netifaces.gateways()
            default_interface = gateways['default'][netifaces.AF_INET][1]
            
            # Get network info for the interface
            addrs = netifaces.ifaddresses(default_interface)
            ipv4_info = addrs[netifaces.AF_INET][0]
            
            ip = ipv4_info['addr']
            netmask = ipv4_info['netmask']
            
            # Calculate network range
            network = ipaddress.IPv4Network(f"{ip}/{netmask}", strict=False)
            return str(network)
        except:
            return "192.168.100.0/24"  # Fallback
    
    def ping_host(self, ip):
        """Check if host is alive"""
        try:
            # Use appropriate ping command for OS
            if platform.system().lower() == 'windows':
                result = subprocess.run(['ping', '-n', '1', '-w', '1000', ip],
                                      capture_output=True, text=True, timeout=2)
            else:
                result = subprocess.run(['ping', '-c', '1', '-W', '1000', ip],
                                      capture_output=True, text=True, timeout=2)
            return result.returncode == 0
        except:
            return False
    
    def scan_port(self, ip, port):
        """Check if port is open"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((ip, port))
            sock.close()
            return result == 0
        except:
            return False

    def identify_device(self, ip, open_ports):
        """Identify device type and manufacturer"""
        device_info = {
            'ip': ip,
            'type': 'Unknown',
            'manufacturer': 'Unknown',
            'model': 'Unknown',
            'confidence': 0,
            'services': []
        }

        # Check HTTP services for device identification
        for port in [80, 443, 8080, 8081]:
            if port in open_ports:
                http_info = self.get_http_info(ip, port)
                if http_info:
                    device_info['services'].append(http_info)
                    if http_info['device_type'] != 'Unknown':
                        device_info['type'] = http_info['device_type']
                        device_info['manufacturer'] = http_info['manufacturer']
                        device_info['model'] = http_info['model']
                        device_info['confidence'] = http_info['confidence']

        # Check RTSP service
        if 554 in open_ports:
            rtsp_info = self.get_rtsp_info(ip)
            if rtsp_info:
                device_info['services'].append(rtsp_info)
                if device_info['type'] == 'Unknown' and rtsp_info['device_type'] != 'Unknown':
                    device_info['type'] = rtsp_info['device_type']
                    device_info['manufacturer'] = rtsp_info['manufacturer']
                    device_info['confidence'] = rtsp_info['confidence']

        # Port-based inference
        if device_info['type'] == 'Unknown':
            device_info.update(self.infer_from_ports(open_ports))

        self.device_info[ip] = device_info
        return device_info

    def get_http_info(self, ip, port):
        """Get device info from HTTP headers and content"""
        try:
            protocol = 'https' if port == 443 else 'http'
            url = f"{protocol}://{ip}:{port}"

            response = requests.get(url, timeout=5, verify=False,
                                  headers={'User-Agent': 'NetworkScanner/1.0'})

            headers = response.headers
            content = response.text.lower()

            # Device signatures - expanded
            signatures = {
                'hikvision': {
                    'patterns': ['hikvision', 'web service', 'ipcam', 'dvr', 'nvr', 'hik-connect'],
                    'headers': ['server', 'www-authenticate'],
                    'type': 'IP Camera',
                    'manufacturer': 'HikVision'
                },
                'dahua': {
                    'patterns': ['dahua', 'dhipcam', 'netsurf', 'webs', 'dss'],
                    'headers': ['server', 'www-authenticate'],
                    'type': 'IP Camera',
                    'manufacturer': 'Dahua'
                },
                'axis': {
                    'patterns': ['axis', 'vapix', 'axis communications'],
                    'headers': ['server'],
                    'type': 'IP Camera',
                    'manufacturer': 'Axis'
                },
                'foscam': {
                    'patterns': ['foscam', 'ipcamera', 'netwave'],
                    'headers': ['server'],
                    'type': 'IP Camera',
                    'manufacturer': 'Foscam'
                },
                'ubiquiti': {
                    'patterns': ['ubiquiti', 'unifi', 'airmax', 'edgeos'],
                    'headers': ['server'],
                    'type': 'Network Device',
                    'manufacturer': 'Ubiquiti'
                },
                'tp-link': {
                    'patterns': ['tp-link', 'tplink', 'archer'],
                    'headers': ['server'],
                    'type': 'Router',
                    'manufacturer': 'TP-Link'
                },
                'netgear': {
                    'patterns': ['netgear', 'readynas'],
                    'headers': ['server'],
                    'type': 'Router',
                    'manufacturer': 'Netgear'
                },
                'linksys': {
                    'patterns': ['linksys', 'cisco'],
                    'headers': ['server'],
                    'type': 'Router',
                    'manufacturer': 'Linksys'
                },
                'generic_camera': {
                    'patterns': ['camera', 'webcam', 'ipcam', 'surveillance', 'cctv', 'dvr', 'nvr'],
                    'headers': ['server', 'www-authenticate'],
                    'type': 'IP Camera',
                    'manufacturer': 'Generic'
                }
            }

            for vendor, sig in signatures.items():
                confidence = 0
                model = 'Unknown'

                # Check content patterns
                for pattern in sig['patterns']:
                    if pattern in content:
                        confidence += 30
                        # Try to extract model
                        if vendor == 'hikvision' and 'ds-' in content:
                            import re
                            model_match = re.search(r'ds-\w+', content)
                            if model_match:
                                model = model_match.group().upper()

                # Check headers
                for header in sig['headers']:
                    if header in headers:
                        header_value = headers[header].lower()
                        for pattern in sig['patterns']:
                            if pattern in header_value:
                                confidence += 40

                if confidence > 50:
                    return {
                        'service': f'HTTP ({port})',
                        'device_type': sig['type'],
                        'manufacturer': sig['manufacturer'],
                        'model': model,
                        'confidence': confidence,
                        'server_header': headers.get('server', ''),
                        'title': self.extract_title(content)
                    }

            # Generic web service detection
            return {
                'service': f'HTTP ({port})',
                'device_type': 'Web Service',
                'manufacturer': 'Unknown',
                'model': 'Unknown',
                'confidence': 20,
                'server_header': headers.get('server', ''),
                'title': self.extract_title(content)
            }

        except Exception as e:
            return None

    def get_rtsp_info(self, ip):
        """Get device info from RTSP service"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, 554))

            # Send RTSP OPTIONS request
            request = f"OPTIONS rtsp://{ip}:554/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: NetworkScanner\r\n\r\n"
            sock.send(request.encode())

            response = sock.recv(1024).decode()
            sock.close()

            # Look for device signatures in RTSP response
            response_lower = response.lower()

            if 'hikvision' in response_lower:
                return {
                    'service': 'RTSP (554)',
                    'device_type': 'IP Camera',
                    'manufacturer': 'HikVision',
                    'confidence': 80
                }
            elif 'dahua' in response_lower:
                return {
                    'service': 'RTSP (554)',
                    'device_type': 'IP Camera',
                    'manufacturer': 'Dahua',
                    'confidence': 80
                }
            else:
                return {
                    'service': 'RTSP (554)',
                    'device_type': 'IP Camera',
                    'manufacturer': 'Unknown',
                    'confidence': 60
                }

        except Exception as e:
            return None

    def extract_title(self, content):
        """Extract title from HTML content"""
        try:
            import re
            title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE)
            if title_match:
                return title_match.group(1).strip()
        except:
            pass
        return ''

    def infer_from_ports(self, open_ports):
        """Infer device type from open ports"""
        open_set = set(open_ports)

        # RTSP port strongly indicates camera
        if 554 in open_set:
            confidence = 70
            if 80 in open_set or 443 in open_set:
                confidence = 80
            return {
                'type': 'IP Camera',
                'manufacturer': 'Unknown',
                'confidence': confidence
            }

        # Web + streaming ports
        if 8080 in open_set and 80 in open_set:
            return {'type': 'Network Device', 'manufacturer': 'Unknown', 'confidence': 60}

        # RTMP streaming
        if 1935 in open_set:
            return {'type': 'Streaming Server', 'manufacturer': 'Unknown', 'confidence': 70}

        # Standard web services
        if 80 in open_set or 443 in open_set:
            return {'type': 'Web Service', 'manufacturer': 'Unknown', 'confidence': 30}

        # SSH + web = likely Linux server
        if 22 in open_set and (80 in open_set or 443 in open_set):
            return {'type': 'Linux Server', 'manufacturer': 'Unknown', 'confidence': 60}

        # Windows file sharing
        if 135 in open_set or 445 in open_set:
            return {'type': 'Windows PC', 'manufacturer': 'Unknown', 'confidence': 70}

        return {'type': 'Unknown', 'manufacturer': 'Unknown', 'confidence': 0}
    
    def scan_network(self):
        """Scan network for active hosts"""
        print("🔍 Scanning network for active hosts...")
        network_range = self.get_local_network()
        print(f"📡 Network range: {network_range}")
        
        network = ipaddress.IPv4Network(network_range)
        threads = []
        
        def check_host(ip):
            if self.ping_host(str(ip)):
                self.active_hosts.append(str(ip))
                print(f"✅ Found active host: {ip}")
        
        # Scan all IPs in network (limit to reasonable range for demo)
        for ip in list(network.hosts())[:50]:  # Limit to first 50 IPs for demo
            thread = threading.Thread(target=check_host, args=(ip,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads
        for thread in threads:
            thread.join()
        
        print(f"📊 Found {len(self.active_hosts)} active hosts")
        return self.active_hosts
    
    def scan_streaming_ports(self):
        """Scan for streaming-related ports on active hosts"""
        print("\n🎥 Scanning for streaming ports and identifying devices...")
        streaming_hosts = []

        for host in self.active_hosts:
            open_ports = []
            for port in self.streaming_ports:
                if self.scan_port(host, port):
                    open_ports.append(port)
                    print(f"🔓 {host}:{port} - OPEN")

            if open_ports:
                # Identify device type and manufacturer
                print(f"🔍 Identifying device at {host}...")
                device_info = self.identify_device(host, open_ports)

                streaming_hosts.append({
                    'host': host,
                    'open_ports': open_ports,
                    'device_type': device_info['type'],
                    'manufacturer': device_info['manufacturer'],
                    'model': device_info['model'],
                    'confidence': device_info['confidence'],
                    'services': device_info['services']
                })

                # Print identification results
                if device_info['confidence'] > 50:
                    print(f"📷 Identified: {device_info['manufacturer']} {device_info['type']}")
                    if device_info['model'] != 'Unknown':
                        print(f"   Model: {device_info['model']}")
                else:
                    print(f"❓ Unknown device type (confidence: {device_info['confidence']}%)")
                    # Debug info for unknown devices
                    print(f"   Debug: Open ports {open_ports}")
                    if device_info['services']:
                        for service in device_info['services']:
                            print(f"   Service: {service.get('service', 'N/A')} - {service.get('server_header', 'No header')}")
                            if service.get('title'):
                                print(f"   Title: {service['title'][:50]}...")

        return streaming_hosts
    
    def analyze_packet(self, packet):
        """Analyze packet for streaming protocols"""
        try:
            if packet.haslayer(IP):
                src_ip = packet[IP].src
                dst_ip = packet[IP].dst
                
                # Check for common streaming protocols
                stream_indicators = {
                    'RTSP': b'RTSP/',
                    'RTP': packet.haslayer(UDP) and len(packet) > 12,
                    'HTTP_STREAM': b'video/' in bytes(packet) or b'audio/' in bytes(packet),
                    'RTMP': packet.haslayer(TCP) and packet[TCP].dport == 1935
                }
                
                for protocol, condition in stream_indicators.items():
                    if protocol == 'RTP' and condition:
                        # Basic RTP detection (UDP packets with specific characteristics)
                        stream_info = {
                            'timestamp': time.time(),
                            'src_ip': src_ip,
                            'dst_ip': dst_ip,
                            'protocol': 'RTP (possible)',
                            'size': len(packet)
                        }
                        self.traffic_data[f"{src_ip}->{dst_ip}"].append(stream_info)
                    elif isinstance(condition, bytes) and condition in bytes(packet):
                        stream_info = {
                            'timestamp': time.time(),
                            'src_ip': src_ip,
                            'dst_ip': dst_ip,
                            'protocol': protocol,
                            'size': len(packet)
                        }
                        self.detected_streams.append(stream_info)
                        print(f"🎬 Stream detected: {protocol} from {src_ip} to {dst_ip}")
                    elif protocol == 'RTMP' and condition:
                        stream_info = {
                            'timestamp': time.time(),
                            'src_ip': src_ip,
                            'dst_ip': dst_ip,
                            'protocol': 'RTMP',
                            'size': len(packet)
                        }
                        self.detected_streams.append(stream_info)
                        print(f"🎬 Stream detected: RTMP from {src_ip} to {dst_ip}")
                
        except Exception as e:
            pass  # Ignore packet parsing errors
    
    def start_packet_capture(self, duration=30):
        """Start capturing packets for stream detection"""
        if not SCAPY_AVAILABLE:
            print("❌ Packet capture disabled: scapy not available")
            return

        print(f"\n📡 Starting packet capture for {duration} seconds...")
        print("🎯 Looking for streaming protocols (RTSP, RTP, HTTP streams, RTMP)...")
        print("⚠️  Note: Packet capture requires administrator/root privileges")

        try:
            # Capture packets for specified duration
            packets = sniff(timeout=duration, prn=self.analyze_packet, store=False)
            print(f"✅ Packet capture completed. Analyzed packets for {duration} seconds.")
        except Exception as e:
            print(f"❌ Error during packet capture: {e}")
            print("💡 Try running as administrator/root for packet capture")
    
    def generate_report(self):
        """Generate a comprehensive report"""
        streaming_hosts = self.scan_streaming_ports()

        # Categorize devices
        device_categories = {
            'IP Cameras': [],
            'Network Devices': [],
            'Servers': [],
            'PCs': [],
            'Unknown': []
        }

        for host_info in streaming_hosts:
            device_type = host_info['device_type']
            if 'Camera' in device_type:
                device_categories['IP Cameras'].append(host_info)
            elif 'Network' in device_type:
                device_categories['Network Devices'].append(host_info)
            elif 'Server' in device_type:
                device_categories['Servers'].append(host_info)
            elif 'PC' in device_type:
                device_categories['PCs'].append(host_info)
            else:
                device_categories['Unknown'].append(host_info)

        report = {
            'scan_timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'network_range': self.get_local_network(),
            'active_hosts': self.active_hosts,
            'streaming_hosts': streaming_hosts,
            'device_categories': device_categories,
            'device_info': self.device_info,
            'detected_streams': self.detected_streams,
            'traffic_summary': {
                'total_streams_detected': len(self.detected_streams),
                'unique_protocols': list(set([s['protocol'] for s in self.detected_streams])),
                'active_connections': len(self.traffic_data),
                'identified_devices': len([h for h in streaming_hosts if h['confidence'] > 50])
            }
        }

        return report

# Create and run the scanner
def main():
    scanner = NetworkStreamScanner()
    
    print("🚀 Network Stream Scanner Starting...")
    print("=" * 50)
    
    # Step 1: Scan network for active hosts
    active_hosts = scanner.scan_network()
    
    # Step 2: Scan for streaming ports
    streaming_hosts = scanner.scan_streaming_ports()
    
    # Step 3: Capture packets (shorter duration for demo)
    print("\n⚠️  Note: Packet capture requires root privileges")
    print("🔄 Starting packet capture (10 seconds for demo)...")
    scanner.start_packet_capture(duration=10)
    
    # Step 4: Generate report
    report = scanner.generate_report()
    
    print("\n" + "=" * 50)
    print("📋 SCAN RESULTS")
    print("=" * 50)
    
    print(f"🌐 Network Range: {report['network_range']}")
    print(f"💻 Active Hosts: {len(report['active_hosts'])}")
    
    if report['active_hosts']:
        for host in report['active_hosts']:
            print(f"   • {host}")
    
    print(f"\n🎥 Hosts with Streaming Ports: {len(report['streaming_hosts'])}")

    # Display devices by category
    for category, devices in report['device_categories'].items():
        if devices:
            print(f"\n📂 {category}: {len(devices)}")
            for device in devices:
                confidence_indicator = "✅" if device['confidence'] > 70 else "⚠️" if device['confidence'] > 50 else "❓"
                print(f"   {confidence_indicator} {device['host']} - {device['manufacturer']} {device['device_type']}")
                if device['model'] != 'Unknown':
                    print(f"      Model: {device['model']}")
                print(f"      Ports: {device['open_ports']} (Confidence: {device['confidence']}%)")

    print(f"\n📡 Detected Streams: {report['traffic_summary']['total_streams_detected']}")
    if report['detected_streams']:
        for stream in report['detected_streams'][-5:]:  # Show last 5
            print(f"   • {stream['protocol']}: {stream['src_ip']} → {stream['dst_ip']}")

    print(f"\n🎯 Device Identification Summary:")
    print(f"   • Successfully identified: {report['traffic_summary']['identified_devices']} devices")
    print(f"   • IP Cameras found: {len(report['device_categories']['IP Cameras'])}")
    print(f"   • Network devices found: {len(report['device_categories']['Network Devices'])}")
    print(f"   • Unknown devices: {len(report['device_categories']['Unknown'])}")
    
    # Save detailed report to file
    with open('network_stream_report.json', 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"\n💾 Detailed report saved to: network_stream_report.json")
    print("✅ Scan completed!")

if __name__ == "__main__":
    main()