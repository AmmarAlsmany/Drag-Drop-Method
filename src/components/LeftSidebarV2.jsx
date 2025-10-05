import React, { useState, useEffect } from 'react';
import { useDeviceScanner } from '../hooks/useDeviceScannerV2';
import logo from '../assets/logo.png';
import houseIcon from '../assets/icon/House.png';
import monitorPlayIcon from '../assets/icon/MonitorPlay.png';
import pictureInPictureIcon from '../assets/icon/PictureInPicture.png';
import videoCameraIcon from '../assets/icon/VideoCamera.png';
import lightbulbIcon from '../assets/icon/Lightbulb.png';
import lightningIcon from '../assets/icon/Lightning.png';
import callBellIcon from '../assets/icon/CallBell.png';
import settingsIcon from '../assets/icon/SettingsIcon.png';
import logoutIcon from '../assets/icon/LogoutIcon.png';

const LeftSidebar = ({ onDragStart, onRemoveWindow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [touchDragData, setTouchDragData] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const {
    devices,
    deviceCategories,
    isScanning,
    scanStatus,
    totalDevices,
    loading,
    error,
    startScanning,
    stopScanning,
    triggerRescan,
    deviceToImageFormat,
    hasDevices
  } = useDeviceScanner();

  // Touch drag support for mobile/iPad
  const handleTouchStart = (e, imageData) => {
    const touch = e.touches[0];
    setTouchDragData({
      data: imageData,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY
    });
  };

  const handleTouchMove = (e) => {
    if (!touchDragData) return;

    const touch = e.touches[0];
    setTouchDragData(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    }));

    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = (e) => {
    if (!touchDragData) return;

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    // Find the canvas element
    const canvas = dropTarget?.closest('[data-canvas]');
    if (canvas) {
      // Trigger the drop handler with proper position
      const rect = canvas.getBoundingClientRect();
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: touch.clientX,
        clientY: touch.clientY,
        detail: touchDragData.data,
        dataTransfer: {
          getData: () => ''
        }
      };

      // Call the global drop handler
      if (window.__videocallTouchDrop) {
        window.__videocallTouchDrop(syntheticEvent);
      }
    }

    setTouchDragData(null);
  };

  const navItems = [
    { icon: houseIcon, label: "Home", active: false },
    { icon: monitorPlayIcon, label: "Presentation", active: true },
    { icon: pictureInPictureIcon, label: "Folder", active: false },
    { icon: videoCameraIcon, label: "Camera", active: false },
    { icon: lightbulbIcon, label: "Light", active: false },
    { icon: lightningIcon, label: "Lightning", active: false },
    { icon: callBellIcon, label: "Notifications", active: false },
  ];

  const bottomNavItems = [
    { icon: settingsIcon, label: "Settings", active: false },
    { icon: logoutIcon, label: "Logout", active: false, isLogout: true },
  ];

  // Filter devices based on search term
  const filteredDevices = devices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip.includes(searchTerm) ||
    device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate fallback placeholder icon
  const getPlaceholderIcon = (device) => {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');

    const colors = {
      'IP Camera': '#3b82f6',
      'Network Device': '#10b981',
      'Router': '#8b5cf6',
      'Server': '#f59e0b',
      'PC': '#ef4444',
      'Unknown': '#6b7280'
    };

    // Background color
    ctx.fillStyle = colors[device.type] || colors['Unknown'];
    ctx.fillRect(0, 0, 200, 120);

    // White text
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';

    // Device name (top)
    ctx.font = 'bold 14px Arial';
    ctx.fillText(device.name || device.type, 100, 30);

    // IP address (middle)
    ctx.font = 'bold 16px monospace';
    ctx.fillText(device.ip, 100, 60);

    // "Loading..." text
    ctx.font = '12px Arial';
    ctx.fillText('Loading preview...', 100, 90);

    return canvas.toDataURL();
  };

  // No need to fetch thumbnails - we'll use the MJPEG stream directly
  useEffect(() => {
    console.log(`📊 Devices loaded: ${devices.length}`);
    devices.forEach(device => {
      console.log(`  - ${device.name} (${device.ip}): src=${device.src || 'NO SRC'}`);
    });
  }, [devices]);

  // Handle reverse drag (from canvas to sidebar to remove)
  const handleSidebarDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleSidebarDragLeave = (e) => {
    setIsDragOver(false);
  };

  const handleSidebarDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    // Get the window ID from drag data
    try {
      const data = e.dataTransfer.getData('application/x-window-id');
      if (data && onRemoveWindow) {
        onRemoveWindow(data);
      }
    } catch (error) {
      console.error('Error handling reverse drag:', error);
    }
  };

  return (
    <aside
      className={`h-screen bg-[#1A1F2E] text-white flex transition-all ${
        isDragOver ? 'ring-4 ring-red-500 ring-inset' : ''
      }`}
      onDragOver={handleSidebarDragOver}
      onDragLeave={handleSidebarDragLeave}
      onDrop={handleSidebarDrop}
    >
      <div className="w-20 flex flex-col items-center py-4 border-r border-gray-800">
        <img src={logo} alt="Logo" className="w-14 h-14 mb-6" />
        <nav className="flex-1 flex flex-col items-center space-y-4">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all hover:bg-[#2A3441] ${
                item.active ? 'bg-[#2A3441]' : ''
              }`}
            >
              <img src={item.icon} alt={item.label} className="w-7 h-7" />
            </button>
          ))}
        </nav>
        <nav className="flex flex-col items-center space-y-4">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              className={`w-14 h-14 rounded-lg flex items-center justify-center transition-all ${
                item.isLogout ? 'hover:bg-red-900/20' : 'hover:bg-[#2A3441]'
              } ${item.active ? 'bg-[#2A3441]' : ''}`}
            >
              <img src={item.icon} alt={item.label} className="w-7 h-7" />
            </button>
          ))}
        </nav>
      </div>

      <div className="w-64 flex flex-col relative">
        {/* Reverse Drag Indicator */}
        {isDragOver && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <div className="font-bold text-lg">Drop to Remove</div>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Images</h2>
            {isScanning && totalDevices > 0 && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full opacity-75 animate-pulse"></div>
                <span className="text-xs text-gray-400">{totalDevices}</span>
              </div>
            )}
          </div>
        </div>

        {/* Search bar */}
        <div className="p-4 relative">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#242837] text-white placeholder-gray-500 rounded-lg py-2 px-10 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <div className="absolute left-7 top-1/2 transform -translate-y-1/2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "transparent transparent" }}
        >
          <div className="px-4 pb-4">
          {/* Only show initial loading message */}
          {loading && devices.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-sm">Scanning network...</div>
            </div>
          )}

          {/* Show devices immediately as they're found */}
          {devices.length > 0 && (
            <div className="space-y-4">
              {/* Show devices by category */}
              {Object.entries(deviceCategories).map(([category, categoryDevices]) => (
                categoryDevices.length > 0 && (
                  <div key={category}>
                    <h3 className="text-gray-300 text-sm font-medium mb-2">{category}</h3>
                    {categoryDevices
                      .filter(device =>
                        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        device.ip.includes(searchTerm) ||
                        device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((device) => {
                        const imageData = deviceToImageFormat(device);

                        // Use MJPEG stream directly for real-time thumbnail, fallback to placeholder
                        const thumbnailSrc = device.src || getPlaceholderIcon(device);

                        // Use REAL video URL for both canvas and sidebar
                        const fullImageData = {
                          ...imageData,
                          src: device.src || imageData.src, // Real video URL
                          thumbnail: thumbnailSrc // Real-time MJPEG stream for sidebar
                        };

                        return (
                          <div
                            key={device.id}
                            className="rounded-lg overflow-hidden cursor-grab active:opacity-50 transition-opacity bg-[#191D24] border border-gray-700 hover:border-green-500 mb-2"
                            draggable
                            onDragStart={(e) => onDragStart(e, fullImageData)}
                            onTouchStart={(e) => handleTouchStart(e, fullImageData)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                          >
                            <div className="aspect-video relative">
                              <img
                                src={thumbnailSrc}
                                alt={device.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to placeholder on error
                                  e.target.src = getPlaceholderIcon(device);
                                }}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <div className="text-white text-xs font-medium">{device.name}</div>
                                <div className="text-gray-300 text-xs">{device.ip}</div>
                                {device.confidence > 50 && (
                                  <div className="text-green-400 text-xs">
                                    {device.confidence}% confident
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )
              ))}
            </div>
          )}

          {/* No devices yet, but scanning */}
          {!loading && devices.length === 0 && isScanning && (
            <div className="text-center text-gray-400 py-8">
              <div className="text-sm">Scanning your network...</div>
              <div className="text-xs mt-2 text-gray-500">Devices will appear here</div>
            </div>
          )}

          {/* No devices found message */}
          {!loading && devices.length === 0 && !isScanning && (
            <div className="text-center text-gray-400 py-8">
              <div className="mb-4">No devices found</div>
              <button
                onClick={startScanning}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Start Scanning
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Touch drag visual feedback for mobile/iPad */}
        {touchDragData && (
          <div
            style={{
              position: 'fixed',
              left: touchDragData.currentX - 60,
              top: touchDragData.currentY - 40,
              width: '120px',
              height: '80px',
              pointerEvents: 'none',
              zIndex: 9999,
              opacity: 0.7,
              transform: 'scale(1.1)',
              transition: 'none'
            }}
            className="bg-blue-500 border-2 border-white rounded-lg shadow-2xl flex items-center justify-center"
          >
            <div className="text-white text-xs font-semibold text-center px-2">
              {touchDragData.data.name || 'Dragging...'}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default LeftSidebar;