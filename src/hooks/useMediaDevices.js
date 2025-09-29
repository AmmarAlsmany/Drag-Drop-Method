// hooks/useMediaDevices.js
import { useState, useEffect } from 'react';

export const useMediaDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getDevices = async () => {
    try {
      setLoading(true);
      
      // Request permissions first
      await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      }).then(stream => {
        // Stop the stream immediately, we just needed permissions
        stream.getTracks().forEach(track => track.stop());
      });

      // Now enumerate devices
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      
      const processedDevices = deviceList
        .filter(device => device.kind === 'videoinput' || device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `${device.kind === 'videoinput' ? 'Camera' : 'Microphone'} ${device.deviceId.slice(0, 8)}`,
          type: device.kind === 'videoinput' ? 'camera' : 'microphone',
          kind: device.kind,
          groupId: device.groupId,
          stream: null,
          thumbnail: null,
          isActive: false
        }));

      setDevices(processedDevices);
      setError(null);
    } catch (err) {
      console.error('Error accessing media devices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startDeviceStream = async (deviceId) => {
    try {
      const device = devices.find(d => d.id === deviceId);
      if (!device || device.type !== 'camera') return null;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false
      });

      // Generate thumbnail
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      return new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 120;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
          
          // Update device with stream and thumbnail
          setDevices(prev => prev.map(d => 
            d.id === deviceId 
              ? { ...d, stream, thumbnail, isActive: true }
              : d
          ));

          resolve({ stream, thumbnail });
        });
      });
    } catch (err) {
      console.error('Error starting device stream:', err);
      return null;
    }
  };

  const stopDeviceStream = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    if (device?.stream) {
      device.stream.getTracks().forEach(track => track.stop());
      
      setDevices(prev => prev.map(d => 
        d.id === deviceId 
          ? { ...d, stream: null, isActive: false }
          : d
      ));
    }
  };

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      getDevices();
      
      // Listen for device changes
      navigator.mediaDevices.addEventListener('devicechange', getDevices);
      
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', getDevices);
      };
    } else {
      setError('Media devices not supported in this browser');
      setLoading(false);
    }
  }, []);

  return {
    devices,
    loading,
    error,
    refreshDevices: getDevices,
    startDeviceStream,
    stopDeviceStream
  };
};