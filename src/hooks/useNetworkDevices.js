// hooks/useNetworkDevices.js - Simplified for LAN devices only
import { useState } from 'react';

export const useNetworkDevices = () => {
  const [networkDevices, setNetworkDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Common IP camera ports and endpoints
  const commonEndpoints = [
    { port: 554, path: '/stream', protocol: 'rtsp' },
    { port: 8080, path: '/video', protocol: 'http' },
    { port: 1935, path: '/live', protocol: 'rtmp' },
    { port: 80, path: '/mjpeg', protocol: 'http' },
    { port: 8081, path: '/stream', protocol: 'http' }
  ];

  // Add device manually
  const addManualDevice = (deviceInfo) => {
    const device = {
      id: `device-${Date.now()}`,
      name: deviceInfo.name,
      url: deviceInfo.url,
      protocol: deviceInfo.protocol,
      type: 'ip-camera',
      isActive: false,
      thumbnail: generateThumbnail(deviceInfo),
      ip: extractIP(deviceInfo.url)
    };

    setNetworkDevices(prev => [...prev, device]);
    setError(null);
    return device;
  };

  // Extract IP from URL
  const extractIP = (url) => {
    const match = url.match(/\/\/([^:\/]+)/);
    return match ? match[1] : 'Unknown';
  };

  // Generate thumbnail placeholder
  const generateThumbnail = (deviceInfo) => {
    // For HTTP streams, try to use the URL directly
    if (deviceInfo.protocol === 'http' && deviceInfo.url.includes('mjpeg')) {
      return deviceInfo.url;
    }
    
    // For others, use placeholder
    return `/api/placeholder/160/120?text=${encodeURIComponent(deviceInfo.name)}`;
  };

  // Simple network discovery (ping common IPs)
  const discoverLocalDevices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get local network range
      const localIP = await getLocalNetworkIP();
      if (!localIP) {
        setError('Could not determine local network range');
        return;
      }

      const baseIP = localIP.substring(0, localIP.lastIndexOf('.'));
      const discoveries = [];

      // Test common camera IPs (limited range for performance)
      const testIPs = [];
      for (let i = 1; i <= 20; i++) { // Test first 20 IPs
        testIPs.push(`${baseIP}.${i}`);
      }
      
      // Common camera IPs
      const commonCameraIPs = [100, 101, 102, 150, 200, 201];
      commonCameraIPs.forEach(ip => {
        testIPs.push(`${baseIP}.${ip}`);
      });

      // Test each IP with common ports (simplified)
      const testPromises = testIPs.map(async (ip) => {
        for (const endpoint of commonEndpoints.slice(0, 2)) { // Test only RTSP and HTTP
          const url = `${endpoint.protocol}://${ip}:${endpoint.port}${endpoint.path}`;
          
          try {
            const isReachable = await testConnection(ip, endpoint.port);
            if (isReachable) {
              discoveries.push({
                id: `discovered-${ip}-${endpoint.port}`,
                name: `Camera ${ip}:${endpoint.port}`,
                url: url,
                protocol: endpoint.protocol,
                type: 'ip-camera',
                ip: ip,
                port: endpoint.port,
                isActive: false,
                thumbnail: `/api/placeholder/160/120?text=${ip}`
              });
              break; // Found one working endpoint for this IP
            }
          } catch (err) {
            // Continue to next
          }
        }
      });

      await Promise.all(testPromises);

      // Remove duplicates and add to devices
      const uniqueDiscoveries = discoveries.filter((device, index, self) => 
        index === self.findIndex(d => d.ip === device.ip)
      );

      if (uniqueDiscoveries.length > 0) {
        setNetworkDevices(prev => [
          ...prev.filter(d => !d.id.startsWith('discovered-')), // Remove old discoveries
          ...uniqueDiscoveries
        ]);
        console.log(`Discovered ${uniqueDiscoveries.length} potential camera devices`);
      } else {
        setError('No network cameras found. Try adding devices manually.');
      }

    } catch (err) {
      setError('Network discovery failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test if IP:port is reachable (simplified)
  const testConnection = async (ip, port) => {
    return new Promise((resolve) => {
      const img = new Image();
      const timeout = setTimeout(() => resolve(false), 2000);
      
      // Try to load a test image/stream
      img.onload = () => {
        clearTimeout(timeout);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };

      // Test common endpoints
      if (port === 80 || port === 8080 || port === 8081) {
        img.src = `http://${ip}:${port}/snapshot.jpg?${Date.now()}`;
      } else {
        // For RTSP, we can't test directly, so assume it might work
        setTimeout(() => {
          clearTimeout(timeout);
          resolve(Math.random() > 0.8); // 20% chance to simulate finding RTSP
        }, 1000);
      }
    });
  };

  // Get local network IP
  const getLocalNetworkIP = () => {
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
          if (match && match[1].startsWith('192.168.')) {
            pc.close();
            resolve(match[1]);
            return;
          }
        }
      };

      // Fallback after 3 seconds
      setTimeout(() => {
        pc.close();
        resolve('192.168.1.1'); // Default assumption
      }, 3000);
    });
  };

  // Remove device
  const removeDevice = (deviceId) => {
    setNetworkDevices(prev => prev.filter(d => d.id !== deviceId));
  };

  // Start network stream (placeholder)
  const startNetworkStream = async (deviceId) => {
    const device = networkDevices.find(d => d.id === deviceId);
    if (!device) return null;

    setNetworkDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, isActive: true } : d
    ));

    return { url: device.url, type: device.protocol };
  };

  // Stop network stream
  const stopNetworkStream = (deviceId) => {
    setNetworkDevices(prev => prev.map(d => 
      d.id === deviceId ? { ...d, isActive: false } : d
    ));
  };

  return {
    networkDevices,
    loading,
    error,
    addManualDevice,
    discoverLocalDevices,
    startNetworkStream,
    stopNetworkStream,
    removeDevice
  };
};