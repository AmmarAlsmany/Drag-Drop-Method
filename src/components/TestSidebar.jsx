import React from 'react';

// Hardcoded test devices with your streaming URLs
const TEST_DEVICES = [
  {
    id: 'test-1',
    name: 'Security Camera 1',
    ip: '77.222.181.11',
    streamUrl: 'http://77.222.181.11:8080/mjpg/video.mjpg',
  },
  {
    id: 'test-2',
    name: 'Japan Camera',
    ip: 'honjin1.miemasu.net',
    streamUrl: 'http://honjin1.miemasu.net/nphMotionJpeg?Resolution=640x480&Quality=Standard',
  },
  {
    id: 'test-3',
    name: 'Asia Pacific Cam',
    ip: '61.211.241.239',
    streamUrl: 'http://61.211.241.239/nphMotionJpeg?Resolution=320x240&Quality=Standard',
  },
  {
    id: 'test-4',
    name: 'European Camera',
    ip: '195.196.36.242',
    streamUrl: 'https://195.196.36.242/mjpg/video.mjpg',
  },
  {
    id: 'test-5',
    name: 'Public Camera 5',
    ip: '158.58.130.148',
    streamUrl: 'http://158.58.130.148/mjpg/video.mjpg',
  }
];

const TestSidebar = ({ onDragStart }) => {
  // Generate simple colored box for each device
  const getDeviceColor = (index) => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
    return colors[index % colors.length];
  };

  const handleDragStart = (e, device) => {
    // Create data for drag and drop
    const dragData = {
      id: device.id,
      name: device.name,
      src: device.streamUrl, // Use the stream URL as source
      type: 'mjpeg-stream',
      streamUrl: device.streamUrl,
      device: device
    };

    // Store in dataTransfer
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));

    // Also call parent handler if provided
    if (onDragStart) {
      onDragStart(e, dragData);
    }
  };

  return (
    <div className="w-64 h-full bg-[#1A1F2E] text-white p-4">
      <h2 className="text-lg font-semibold mb-4">Test Streams</h2>
      <p className="text-xs text-gray-400 mb-4">Drag cameras to display area</p>

      <div className="space-y-3">
        {TEST_DEVICES.map((device, index) => (
          <div
            key={device.id}
            draggable
            onDragStart={(e) => handleDragStart(e, device)}
            className="cursor-grab hover:opacity-80 transition-opacity"
          >
            <div
              className="rounded-lg p-3 text-white"
              style={{ backgroundColor: getDeviceColor(index) }}
            >
              <div className="font-medium text-sm">{device.name}</div>
              <div className="text-xs opacity-75">{device.ip}</div>
              <div className="text-xs mt-1 opacity-60">MJPEG Stream</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-300">
          ℹ️ These are public MJPEG streams for testing.
          Drag and drop them to the display area to view.
        </p>
      </div>
    </div>
  );
};

export default TestSidebar;