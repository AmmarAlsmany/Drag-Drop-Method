import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE_URL = 'http://192.168.100.54:5000/api';

export const useDeviceScanner = () => {
  const [devices, setDevices] = useState([]);
  const [deviceCategories, setDeviceCategories] = useState({
    'IP Cameras': [],
    'Network Devices': [],
    'Servers': [],
    'PCs': [],
    'Unknown': []
  });
  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [totalDevices, setTotalDevices] = useState(0);
  const [error, setError] = useState(null);
  const [scanStatus, setScanStatus] = useState('idle'); // idle, scanning, found

  // Track if this is first load - only show loading on first load
  const isFirstLoad = useRef(true);
  const pollInterval = useRef(null);

  // Fetch devices silently in background
  const fetchDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/devices`);
      const data = await response.json();

      if (data.status === 'success') {
        const prevCount = totalDevices;
        const newCount = data.data.total_devices;

        setDevices(data.data.devices);
        setDeviceCategories(data.data.device_categories);
        setTotalDevices(newCount);
        setLastScan(data.data.scan_timestamp);

        // Update scan status based on device discovery
        if (newCount > prevCount) {
          setScanStatus('found');
          // Reset to scanning after showing found
          setTimeout(() => setScanStatus('scanning'), 2000);
        }
      }
    } catch (err) {
      // Silently handle errors - don't show to user
      console.error('Background fetch error:', err);
    } finally {
      isFirstLoad.current = false;
    }
  }, [totalDevices]);

  // Check scanning status
  const fetchScanStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scan/status`);
      const data = await response.json();

      if (data.status === 'success') {
        setIsScanning(data.is_scanning);
        setLastScan(data.last_scan);
        setTotalDevices(data.device_count);
      }
    } catch (err) {
      console.error('Status check error:', err);
    }
  }, []);

  // Start scanning silently
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      setScanStatus('scanning');

      const response = await fetch(`${API_BASE_URL}/scan/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        setIsScanning(true);
      } else if (data.status === 'info') {
        // Already scanning
        setIsScanning(true);
      }

      return data;
    } catch (err) {
      console.error('Failed to start scanning:', err);
      setScanStatus('idle');
      return { status: 'error', message: err.message };
    }
  }, []);

  // Stop scanning
  const stopScanning = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/scan/stop`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        setIsScanning(false);
        setScanStatus('idle');
      }

      return data;
    } catch (err) {
      console.error('Failed to stop scanning:', err);
      return { status: 'error', message: err.message };
    }
  }, []);

  // Trigger immediate rescan
  const triggerRescan = useCallback(async () => {
    try {
      setScanStatus('scanning');
      const response = await fetch(`${API_BASE_URL}/rescan`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Refresh devices after a short delay
        setTimeout(() => {
          fetchDevices();
        }, 1500);
      }

      return data;
    } catch (err) {
      console.error('Failed to trigger rescan:', err);
      return { status: 'error', message: err.message };
    }
  }, [fetchDevices]);

  // Convert device to image format for drag and drop
  const deviceToImageFormat = useCallback((device) => {
    return {
      id: device.id,
      name: device.name,
      src: device.src,
      type: 'network-device',
      device: device,
      metadata: {
        ip: device.ip,
        manufacturer: device.manufacturer,
        model: device.model,
        ports: device.ports,
        confidence: device.confidence
      }
    };
  }, []);

  // Initialize on mount - auto-start scanning
  useEffect(() => {
    const initialize = async () => {
      // Fetch initial state
      await fetchDevices();
      await fetchScanStatus();

      // Auto-start scanning if not running
      const statusResponse = await fetch(`${API_BASE_URL}/scan/status`);
      const statusData = await statusResponse.json();

      if (statusData.status === 'success' && !statusData.is_scanning) {
        // Start scanning automatically
        await startScanning();
      } else if (statusData.is_scanning) {
        setIsScanning(true);
        setScanStatus('scanning');
      }
    };

    initialize();
  }, []);

  // Background polling - always running
  useEffect(() => {
    // Start polling immediately
    pollInterval.current = setInterval(() => {
      fetchDevices();
      fetchScanStatus();
    }, 3000); // Poll every 3 seconds

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [fetchDevices, fetchScanStatus]);

  return {
    // State
    devices,
    deviceCategories,
    isScanning,
    lastScan,
    totalDevices,
    error,
    scanStatus,

    // Actions
    startScanning,
    stopScanning,
    triggerRescan,
    fetchDevices,
    fetchScanStatus,

    // Utilities
    deviceToImageFormat,

    // Status helpers
    hasDevices: totalDevices > 0,
    hasError: error !== null,
    isInitialLoad: isFirstLoad.current,
    loading: isFirstLoad.current && devices.length === 0
  };
};