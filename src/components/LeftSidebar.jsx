import React, { useState, useEffect, useRef } from 'react';
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

// Test streaming devices
const TEST_DEVICES = [
    {
    id: 'vpx-hdmi-40',
    name: 'VPX HDMI Input B',
    ip: '192.168.100.40',
    type: 'HDMI Source',
    manufacturer: 'Aurora VPX',
    streamUrl: 'http://192.168.100.40:8080/?action=stream&w=960&h=540&fps=15',
    confidence: 100,
    inputNumber: 2  // Aurora DIDO Input 2
  },
    {
    id: 'vpx-hdmi-42',
    name: 'VPX HDMI Input A',
    ip: '192.168.100.42',
    type: 'HDMI Source',
    manufacturer: 'Aurora VPX',
    streamUrl: 'http://192.168.100.42:8080/?action=stream&w=960&h=540&fps=15',
    confidence: 100,
    inputNumber: 1  // Aurora DIDO Input 1
  },
  {
    id: 'test-1',
    name: 'Security Camera 1',
    ip: '77.222.181.11',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    streamUrl: 'http://77.222.181.11:8080/mjpg/video.mjpg',
    confidence: 100,
    inputNumber: 3  // Aurora DIDO Input 3
  },
  {
    id: 'test-2',
    name: 'Japan Camera - Honjin',
    ip: 'honjin1.miemasu.net',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    streamUrl: 'http://honjin1.miemasu.net/nphMotionJpeg?Resolution=640x480&Quality=Standard',
    confidence: 100,
    inputNumber: 4  // Aurora DIDO Input 4
  },
  {
    id: 'test-3',
    name: 'Asia Pacific Camera',
    ip: '61.211.241.239',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    streamUrl: 'http://61.211.241.239/nphMotionJpeg?Resolution=320x240&Quality=Standard',
    confidence: 100,
    inputNumber: 1  // Can reuse inputs for different scenarios
  },
  {
    id: 'test-5',
    name: 'Public Camera 5',
    ip: '158.58.130.148',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    streamUrl: 'http://158.58.130.148/mjpg/video.mjpg',
    confidence: 100,
    inputNumber: 2  // Can reuse inputs for different scenarios
  },
];

const LeftSidebar = ({ onDragStart }) => {
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter test devices based on search term
  const filteredDevices = TEST_DEVICES.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.ip.includes(searchTerm) ||
    device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Simplified thumbnail component
  const StreamThumbnail = ({ device }) => {
    const [thumbnailSrc, setThumbnailSrc] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const createFallbackImage = (text = 'OFFLINE') => {
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 180;
      const ctx = canvas.getContext('2d');

      const colors = {
        'IP Camera': '#3b82f6',
        'Network Device': '#10b981',
        'Router': '#8b5cf6',
        'Server': '#f59e0b',
        'PC': '#ef4444',
        'Video Encoder': '#ec4899',
        'Video Decoder': '#06b6d4',
        'HDMI Source': '#f97316',
        'Unknown': '#6b7280'
      };

      ctx.fillStyle = colors[device.type] || colors['Unknown'];
      ctx.fillRect(0, 0, 320, 180);
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(device.type, 160, 70);
      ctx.fillText(text, 160, 100);
      ctx.font = '12px Arial';
      ctx.fillText(device.ip, 160, 120);

      return canvas.toDataURL();
    };

    useEffect(() => {
      const thumbnailUrl = `http://${window.location.hostname}:5000/api/thumbnail?url=${encodeURIComponent(device.streamUrl)}`;

      setIsLoading(true);
      setHasError(false);

      fetch(thumbnailUrl)
        .then(response => {

          if (response.ok) {
            return response.blob();
          }
          throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        })
        .then(blob => {
          const url = URL.createObjectURL(blob);
          setThumbnailSrc(url);
          setIsLoading(false);
          setHasError(false);
        })
        .catch(error => {
          console.error('❌ Thumbnail error for:', device.name, error);
          setThumbnailSrc(createFallbackImage('ERROR'));
          setIsLoading(false);
          setHasError(true);
        });
    }, [device.name, device.streamUrl]); // Include dependencies

    if (isLoading) {
      return (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-400 text-xs">Loading...</span>
        </div>
      );
    }

    return (
      <div className="w-full h-full relative">
        <img
          src={thumbnailSrc}
          alt={device.name}
          className="w-full h-full object-cover"
          onError={() => {
            console.error('🖼️ Image onError for:', device.name);
            if (!hasError) {
              setHasError(true);
              setThumbnailSrc(createFallbackImage('NO SIGNAL'));
            }
          }}
          onLoad={() => {
          }}
        />
        <div className="absolute top-1 right-1 text-xs text-white bg-black/50 rounded px-1">
          {hasError ? 'ERROR' : 'OK'}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black rounded-3xl w-1/5 h-full flex">
      {/* Navigation Column */}
      <div className="w-3/12 border-r border-[#292929] flex flex-col items-center justify-between">
        <img src={logo} alt="Logo" className="img-fluid mb-8 mt-4" />
        
        <div className="flex flex-col items-center space-y-4 flex-1 justify-center">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                item.active ? "bg-green-500" : "bg-[#20242B] hover:bg-green-500"
              }`}
              title={item.label}
            >
              <img
                src={item.icon}
                alt={item.label}
                className="w-6 h-6 filter brightness-0 invert"
              />
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center space-y-4 mb-4">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              className="w-12 h-12 flex items-center justify-center transition-colors hover:bg-green-500 rounded-full cursor-pointer"
              title={item.label}
            >
              <img
                src={item.icon}
                alt={item.label}
                className={`w-6 h-6 ${
                  item.isLogout ? "" : "filter brightness-0 invert"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Source Column */}
      <div className="w-10/12 p-6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white text-lg font-medium">Test Streams</h2>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">
              {TEST_DEVICES.length} devices
            </span>
          </div>
        </div>

        <div className="relative mb-6">
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#191D24] text-white placeholder-gray-600 px-4 py-3 rounded-xl focus:border-green-500 focus:outline-none pl-10"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
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
          <div className="space-y-4">
            {/* Show all test devices or filtered results */}
            {(searchTerm ? filteredDevices : TEST_DEVICES).map((device) => {
              const dragData = {
                id: device.id,
                name: device.name,
                src: device.streamUrl,
                type: 'mjpeg-stream',
                streamUrl: device.streamUrl,
                device: device
              };

              return (
                <div
                  key={device.id}
                  className="rounded-lg overflow-hidden cursor-grab hover:opacity-80 transition-opacity bg-[#191D24] border border-gray-700 hover:border-green-500 mb-2 draggable-element touch-optimized"
                  draggable
                  onDragStart={(e) => onDragStart(e, dragData)}
                >
                  <div className="aspect-video relative">
                    <StreamThumbnail device={device} />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <div className="text-white text-xs font-medium">{device.name}</div>
                      <div className="text-gray-300 text-xs">{device.ip}</div>
                      <div className="text-green-400 text-xs">MJPEG Stream</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {searchTerm && filteredDevices.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                No devices match your search
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;
