import { useState, useEffect, useCallback } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch current devices
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/devices`);
      const data = await response.json();

      if (data.status === 'success') {
        setDevices(data.data.devices);
        setDeviceCategories(data.data.device_categories);
        setTotalDevices(data.data.total_devices);
        setLastScan(data.data.scan_timestamp);
      } else {
        setError('Failed to fetch devices');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error('Error fetching devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get scanning status
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
      console.error('Error fetching scan status:', err);
    }
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/scan/start`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        setIsScanning(true);
        // Start polling for updates
        pollForUpdates();
      } else {
        setError(data.message);
      }

      return data;
    } catch (err) {
      setError(`Failed to start scanning: ${err.message}`);
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
      }

      return data;
    } catch (err) {
      setError(`Failed to stop scanning: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }, []);

  // Trigger immediate rescan
  const triggerRescan = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/rescan`, {
        method: 'POST'
      });
      const data = await response.json();

      if (data.status === 'success') {
        // Refresh devices after a short delay
        setTimeout(() => {
          fetchDevices();
        }, 2000);
      }

      return data;
    } catch (err) {
      setError(`Failed to trigger rescan: ${err.message}`);
      return { status: 'error', message: err.message };
    }
  }, [fetchDevices]);

  // Poll for updates when scanning is active
  const pollForUpdates = useCallback(() => {
    const interval = setInterval(async () => {
      await fetchScanStatus();
      await fetchDevices();
    }, 5000); // Poll every 5 seconds

    return interval;
  }, [fetchDevices, fetchScanStatus]);

  // Get device by ID
  const getDeviceById = useCallback((deviceId) => {
    return devices.find(device => device.id === deviceId);
  }, [devices]);

  // Get devices by category
  const getDevicesByCategory = useCallback((category) => {
    return deviceCategories[category] || [];
  }, [deviceCategories]);

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

  // Initialize: fetch current state on mount
  useEffect(() => {
    fetchScanStatus();
    fetchDevices();
  }, [fetchScanStatus, fetchDevices]);

  // Set up polling when scanning is active
  useEffect(() => {
    let interval;

    if (isScanning) {
      interval = pollForUpdates();
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isScanning, pollForUpdates]);

  return {
    // State
    devices,
    deviceCategories,
    isScanning,
    lastScan,
    totalDevices,
    loading,
    error,

    // Actions
    startScanning,
    stopScanning,
    triggerRescan,
    fetchDevices,
    fetchScanStatus,

    // Utilities
    getDeviceById,
    getDevicesByCategory,
    deviceToImageFormat,

    // Status helpers
    hasDevices: totalDevices > 0,
    hasError: error !== null,
    isLoading: loading
  };
};