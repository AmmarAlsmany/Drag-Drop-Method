// components/DeviceSources.jsx
import React, { useState, useEffect } from 'react';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useNetworkDevices } from '../hooks/useNetworkDevices';

const DeviceSources = ({ onDragStart }) => {
  const [activeTab, setActiveTab] = useState('local');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddDevice, setShowAddDevice] = useState(false);

  // Local devices
  const { 
    devices: localDevices, 
    loading: localLoading, 
    error: localError,
    startDeviceStream,
    stopDeviceStream,
    refreshDevices
  } = useMediaDevices();

  // Network devices
  const {
    networkDevices,
    loading: networkLoading,
    error: networkError,
    addManualDevice,
    discoverLocalDevices,
    startNetworkStream,
    stopNetworkStream,
    removeDevice
  } = useNetworkDevices();

  const [manualDevice, setManualDevice] = useState({
    name: '',
    url: '',
    type: 'ip-camera',
    protocol: 'rtsp'
  });

  // Filter devices based on search
  const filteredLocalDevices = localDevices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredNetworkDevices = networkDevices.filter(device =>
    device.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle drag start for devices
  const handleDeviceDragStart = (device, deviceType) => {
    const dragData = {
      id: device.id,
      name: device.name,
      type: deviceType,
      source: device.thumbnail || device.url || '/api/placeholder/160/120',
      device: device
    };

    if (onDragStart) {
      onDragStart(dragData);
    }
  };

  // Handle manual device submission
  const handleAddManualDevice = (e) => {
    e.preventDefault();
    if (manualDevice.name && manualDevice.url) {
      addManualDevice(manualDevice);
      setManualDevice({ name: '', url: '', type: 'ip-camera', protocol: 'rtsp' });
      setShowAddDevice(false);
    }
  };

  // Start preview for local devices
  const handleStartPreview = async (deviceId) => {
    const result = await startDeviceStream(deviceId);
    if (result) {
      console.log('Preview started for device:', deviceId);
    }
  };

  const DeviceCard = ({ device, deviceType, onStartPreview, onStopPreview, onRemove }) => (
    <div 
      className="bg-gray-800 rounded-lg p-3 mb-2 cursor-move hover:bg-gray-700 transition-colors border border-gray-600"
      draggable
      onDragStart={() => handleDeviceDragStart(device, deviceType)}
    >
      <div className="flex items-center space-x-3">
        {/* Thumbnail/Preview */}
        <div className="w-12 h-12 bg-gray-900 rounded flex items-center justify-center flex-shrink-0">
          {device.thumbnail ? (
            <img 
              src={device.thumbnail} 
              alt={device.name}
              className="w-full h-full object-cover rounded"
            />
          ) : device.isActive ? (
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          ) : (
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          )}
        </div>

        {/* Device Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{device.name}</p>
          <p className="text-xs text-gray-400">
            {deviceType === 'local' ? device.type : `${device.protocol?.toUpperCase()} - ${device.ip || 'Network'}`}
          </p>
          {device.isActive && (
            <p className="text-xs text-green-400">● Live</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-1">
          {deviceType === 'local' && (
            <button
              onClick={() => device.isActive ? onStopPreview(device.id) : onStartPreview(device.id)}
              className={`p-1 rounded text-xs ${
                device.isActive 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {device.isActive ? '⏹' : '▶'}
            </button>
          )}
          {deviceType === 'network' && onRemove && (
            <button
              onClick={() => onRemove(device.id)}
              className="p-1 rounded text-xs bg-red-600 hover:bg-red-700 text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-80 bg-gray-900 h-full flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-white mb-3">Device Sources</h2>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search devices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('local')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'local'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Local Devices ({filteredLocalDevices.length})
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`flex-1 py-2 px-4 text-sm font-medium ${
            activeTab === 'network'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Network ({filteredNetworkDevices.length})
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'local' && (
          <div>
            {/* Refresh Button */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">Camera & Microphone Devices</span>
              <button
                onClick={refreshDevices}
                disabled={localLoading}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
              >
                {localLoading ? '...' : '↻'}
              </button>
            </div>

            {/* Error Message */}
            {localError && (
              <div className="bg-red-900 text-red-200 p-2 rounded mb-4 text-sm">
                {localError}
              </div>
            )}

            {/* Local Devices */}
            {filteredLocalDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                deviceType="local"
                onStartPreview={handleStartPreview}
                onStopPreview={stopDeviceStream}
              />
            ))}

            {filteredLocalDevices.length === 0 && !localLoading && (
              <p className="text-gray-400 text-sm text-center py-8">
                No local devices found. Make sure to allow camera/microphone access.
              </p>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div>
            {/* Network Controls */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">IP Cameras & Network Devices</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddDevice(!showAddDevice)}
                  className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  + Add
                </button>
                <button
                  onClick={discoverLocalDevices}
                  disabled={networkLoading}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded"
                >
                  {networkLoading ? '...' : '🔍'}
                </button>
              </div>
            </div>

            {/* Add Device Form */}
            {showAddDevice && (
              <form onSubmit={handleAddManualDevice} className="bg-gray-800 rounded-lg p-3 mb-4">
                <input
                  type="text"
                  placeholder="Device name"
                  value={manualDevice.name}
                  onChange={(e) => setManualDevice({...manualDevice, name: e.target.value})}
                  className="w-full px-2 py-1 mb-2 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
                <input
                  type="url"
                  placeholder="Stream URL (rtsp://192.168.1.100:554/stream)"
                  value={manualDevice.url}
                  onChange={(e) => setManualDevice({...manualDevice, url: e.target.value})}
                  className="w-full px-2 py-1 mb-2 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  required
                />
                <div className="flex space-x-2">
                  <select
                    value={manualDevice.protocol}
                    onChange={(e) => setManualDevice({...manualDevice, protocol: e.target.value})}
                    className="flex-1 px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="rtsp">RTSP</option>
                    <option value="rtmp">RTMP</option>
                    <option value="http">HTTP</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Add
                  </button>
                </div>
              </form>
            )}

            {/* Error Message */}
            {networkError && (
              <div className="bg-red-900 text-red-200 p-2 rounded mb-4 text-sm">
                {networkError}
              </div>
            )}

            {/* Network Devices */}
            {filteredNetworkDevices.map(device => (
              <DeviceCard
                key={device.id}
                device={device}
                deviceType="network"
                onRemove={removeDevice}
              />
            ))}

            {filteredNetworkDevices.length === 0 && !networkLoading && (
              <p className="text-gray-400 text-sm text-center py-8">
                No network devices found. Try adding devices manually or running discovery.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSources;