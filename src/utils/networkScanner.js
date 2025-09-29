// utils/networkScanner.js - Real network discovery
export class NetworkScanner {
  constructor() {
    this.foundDevices = [];
    this.isScanning = false;
    this.localNetworkRange = null;
  }

  // Get the actual local network IP range
  async getLocalNetworkRange() {
    return new Promise((resolve) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      pc.createDataChannel('');
      pc.createOffer().then(offer => pc.setLocalDescription(offer));
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate;
          const match = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
          
          if (match) {
            const ip = match[1];
            // Make sure it's a local network IP
            if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
              const baseIP = ip.substring(0, ip.lastIndexOf('.'));
              pc.close();
              resolve(baseIP);
              return;
            }
          }
        }
      };

      // Fallback: try to detect from current page if possible
      setTimeout(() => {
        pc.close();
        // Common office networks
        resolve('192.168.1'); // Default fallback
      }, 5000);
    });
  }

  // Test if an IP:port combination is reachable
  async testIPPort(ip, port, timeout = 3000) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => resolve(false), timeout);
      
      if (port === 80 || port === 8080 || port === 8081) {
        // Test HTTP ports by trying to load an image
        const img = new Image();
        
        img.onload = () => {
          clearTimeout(timeoutId);
          resolve(true);
        };
        
        img.onerror = () => {
          clearTimeout(timeoutId);
          // Even if image fails, the connection might be valid
          // Try a different approach - fetch with no-cors
          fetch(`http://${ip}:${port}/`, { 
            method: 'HEAD', 
            mode: 'no-cors',
            signal: AbortSignal.timeout(1000)
          })
          .then(() => resolve(true))
          .catch(() => resolve(false));
        };
        
        // Try common camera snapshot URLs
        img.src = `http://${ip}:${port}/snapshot.jpg?t=${Date.now()}`;
        
      } else if (port === 554) {
        // Test RTSP port (554) by attempting WebSocket connection to common streaming proxies
        // or by testing if the port responds
        this.testRTSPPort(ip, port).then(resolve);
        
      } else {
        // For other ports, try a basic connectivity test
        fetch(`http://${ip}:${port}/`, { 
          method: 'HEAD', 
          mode: 'no-cors',
          signal: AbortSignal.timeout(2000)
        })
        .then(() => {
          clearTimeout(timeoutId);
          resolve(true);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          resolve(false);
        });
      }
    });
  }

  // Test RTSP port specifically
  async testRTSPPort(ip, port) {
    return new Promise((resolve) => {
      // Try to create a video element and test RTSP URL
      const video = document.createElement('video');
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      
      const timeout = setTimeout(() => {
        document.body.removeChild(video);
        resolve(false);
      }, 3000);
      
      video.onloadstart = () => {
        clearTimeout(timeout);
        document.body.removeChild(video);
        resolve(true);
      };
      
      video.onerror = () => {
        clearTimeout(timeout);
        document.body.removeChild(video);
        // RTSP might not work in browser, but port could still be open
        // For RTSP, we assume it might be a camera if other indicators suggest so
        resolve(false);
      };
      
      // Test common RTSP URLs
      const rtspUrls = [
        `rtsp://${ip}:${port}/stream`,
        `rtsp://${ip}:${port}/live`,
        `rtsp://${ip}:${port}/Streaming/Channels/1`
      ];
      
      video.src = rtspUrls[0];
      video.load();
    });
  }

  // Scan entire network range for devices
  async scanNetwork(progressCallback, maxConcurrent = 10) {
    this.isScanning = true;
    this.foundDevices = [];
    
    try {
      // Get actual network range
      const baseIP = await this.getLocalNetworkRange();
      this.localNetworkRange = baseIP;
      
      if (progressCallback) {
        progressCallback(`Scanning network ${baseIP}.1-254...`);
      }
      
      console.log(`🔍 Scanning network range: ${baseIP}.1-254`);
      
      // Common camera/streaming device ports
      const portsToScan = [
        80,    // HTTP
        554,   // RTSP  
        8080,  // HTTP Alt
        8081,  // HTTP Alt 2
        1935,  // RTMP
        8554   // RTSP Alt
      ];
      
      const ipRange = [];
      // Create IP range (1-254)
      for (let i = 1; i <= 254; i++) {
        ipRange.push(`${baseIP}.${i}`);
      }
      
      // Batch processing to avoid overwhelming the network
      const batches = this.createBatches(ipRange, maxConcurrent);
      let processedCount = 0;
      
      for (const batch of batches) {
        const batchPromises = batch.map(async (ip) => {
          const deviceInfo = await this.scanIPForDevices(ip, portsToScan);
          processedCount++;
          
          if (progressCallback) {
            progressCallback(`Scanned ${processedCount}/${ipRange.length} IPs... Found ${this.foundDevices.length} devices`);
          }
          
          return deviceInfo;
        });
        
        const batchResults = await Promise.all(batchPromises);
        
        // Add found devices
        batchResults.forEach(deviceInfo => {
          if (deviceInfo) {
            this.foundDevices.push(deviceInfo);
            console.log(`✅ Found device: ${deviceInfo.name} at ${deviceInfo.ip}:${deviceInfo.port}`);
          }
        });
        
        // Small delay between batches to not overwhelm network
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      if (progressCallback) {
        progressCallback(`Scan complete! Found ${this.foundDevices.length} streaming devices.`);
      }
      
    } catch (error) {
      console.error('Network scan failed:', error);
      if (progressCallback) {
        progressCallback(`Scan failed: ${error.message}`);
      }
    } finally {
      this.isScanning = false;
    }
    
    return this.foundDevices;
  }

  // Scan a specific IP for camera/streaming services
  async scanIPForDevices(ip, ports) {
    for (const port of ports) {
      const isOpen = await this.testIPPort(ip, port, 2000);
      
      if (isOpen) {
        // Try to identify what type of device this is
        const deviceType = this.identifyDevice(ip, port);
        
        return {
          id: `scanned-${ip}-${port}`,
          name: `${deviceType.name} (${ip}:${port})`,
          ip: ip,
          port: port,
          protocol: deviceType.protocol,
          url: deviceType.url,
          thumbnail: deviceType.thumbnail,
          deviceType: deviceType.type,
          isOnline: true
        };
      }
    }
    
    return null;
  }

  // Try to identify what type of device this is based on IP and port
  identifyDevice(ip, port) {
    switch (port) {
      case 554:
        return {
          name: 'RTSP Camera',
          protocol: 'rtsp',
          url: `rtsp://${ip}:554/stream`,
          thumbnail: `/api/placeholder/160/120?text=RTSP%20${ip}`,
          type: 'camera'
        };
        
      case 8080:
        return {
          name: 'IP Camera',
          protocol: 'http',
          url: `http://${ip}:8080/video`,
          thumbnail: `http://${ip}:8080/snapshot.jpg`,
          type: 'camera'
        };
        
      case 80:
        return {
          name: 'Web Camera',
          protocol: 'http', 
          url: `http://${ip}/video`,
          thumbnail: `http://${ip}/snapshot.jpg`,
          type: 'camera'
        };
        
      case 1935:
        return {
          name: 'RTMP Stream',
          protocol: 'rtmp',
          url: `rtmp://${ip}:1935/live`,
          thumbnail: `/api/placeholder/160/120?text=RTMP%20${ip}`,
          type: 'stream'
        };
        
      default:
        return {
          name: 'Network Device',
          protocol: 'http',
          url: `http://${ip}:${port}`,
          thumbnail: `/api/placeholder/160/120?text=${ip}`,
          type: 'unknown'
        };
    }
  }

  // Create batches for concurrent processing
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Quick scan - only scan common camera IPs and a small range
  async quickScan(progressCallback) {
    this.isScanning = true;
    
    try {
      const baseIP = await this.getLocalNetworkRange();
      
      if (progressCallback) {
        progressCallback(`Quick scanning ${baseIP}.1-50...`);
      }
      
      // Only scan first 50 IPs + common camera IPs
      const quickIPs = [];
      for (let i = 1; i <= 50; i++) {
        quickIPs.push(`${baseIP}.${i}`);
      }
      
      // Add common camera IPs if not already included
      const commonCameraLastOctets = [64, 100, 101, 108, 200, 201, 250];
      commonCameraLastOctets.forEach(lastOctet => {
        const ip = `${baseIP}.${lastOctet}`;
        if (!quickIPs.includes(ip)) {
          quickIPs.push(ip);
        }
      });
      
      const foundDevices = [];
      let processed = 0;
      
      for (const ip of quickIPs) {
        const device = await this.scanIPForDevices(ip, [554, 8080, 80]);
        processed++;
        
        if (progressCallback) {
          progressCallback(`Quick scan: ${processed}/${quickIPs.length} - Found ${foundDevices.length}`);
        }
        
        if (device) {
          foundDevices.push(device);
        }
      }
      
      this.foundDevices = foundDevices;
      
      if (progressCallback) {
        progressCallback(`Quick scan complete! Found ${foundDevices.length} devices.`);
      }
      
      return foundDevices;
      
    } finally {
      this.isScanning = false;
    }
  }

  getFoundDevices() {
    return this.foundDevices;
  }
  
  getIsScanning() {
    return this.isScanning;
  }
}

// React hook for the network scanner
export const useNetworkScanner = () => {
  const [devices, setDevices] = React.useState([]);
  const [isScanning, setIsScanning] = React.useState(false);
  const [status, setStatus] = React.useState('');
  const [networkRange, setNetworkRange] = React.useState('');
  const scannerRef = React.useRef(new NetworkScanner());

  const startFullScan = async () => {
    setIsScanning(true);
    setDevices([]);
    
    const foundDevices = await scannerRef.current.scanNetwork((progress) => {
      setStatus(progress);
    });
    
    setDevices(foundDevices);
    setIsScanning(false);
    setNetworkRange(scannerRef.current.localNetworkRange);
  };

  const startQuickScan = async () => {
    setIsScanning(true);
    setDevices([]);
    
    const foundDevices = await scannerRef.current.quickScan((progress) => {
      setStatus(progress);
    });
    
    setDevices(foundDevices);
    setIsScanning(false);
    setNetworkRange(scannerRef.current.localNetworkRange);
  };

  return {
    devices,
    isScanning,
    status,
    networkRange,
    startFullScan,
    startQuickScan
  };
};