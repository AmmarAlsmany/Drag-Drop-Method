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

const LeftSidebar = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');
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

  // Generate device icon based on type
  const getDeviceIcon = (device) => {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    const colors = {
      'IP Camera': '#3b82f6',
      'Network Device': '#10b981',
      'Router': '#8b5cf6',
      'Server': '#f59e0b',
      'PC': '#ef4444',
      'Unknown': '#6b7280'
    };

    ctx.fillStyle = colors[device.type] || colors['Unknown'];
    ctx.fillRect(0, 0, 100, 60);

    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(device.type, 50, 25);
    ctx.fillText(device.manufacturer, 50, 40);

    return canvas.toDataURL();
  };

  return (
    <aside className="h-screen bg-[#1A1F2E] text-white flex">
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

      <div className="w-64 flex flex-col">
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
                        return (
                          <div
                            key={device.id}
                            className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity bg-[#191D24] border border-gray-700 hover:border-green-500 mb-2"
                            draggable
                            onDragStart={(e) => onDragStart(e, {
                              ...imageData,
                              src: getDeviceIcon(device)
                            })}
                          >
                            <div className="aspect-video relative">
                              <img
                                src={getDeviceIcon(device)}
                                alt={device.name}
                                className="w-full h-full object-cover"
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
      </div>
    </aside>
  );
};

export default LeftSidebar;