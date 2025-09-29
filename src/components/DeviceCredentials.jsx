import React, { useState } from 'react';

const DeviceCredentials = ({ device, onConnect, onCancel }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const handleConnect = () => {
    const credentials = { username, password, remember };

    // Build connection URL based on device type
    let connectionUrl = '';

    if (device.type === 'IP Camera' && device.ports.includes(554)) {
      // RTSP URL format
      connectionUrl = `rtsp://${username}:${password}@${device.ip}:554/stream`;
    } else if (device.ports.includes(80) || device.ports.includes(8080)) {
      // HTTP URL format
      const port = device.ports.includes(80) ? 80 : 8080;
      connectionUrl = `http://${username}:${password}@${device.ip}:${port}`;
    }

    onConnect({
      ...device,
      credentials,
      connectionUrl,
      isAuthenticated: true
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">
          Connect to {device.name}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device: {device.ip}
            </label>
            <p className="text-xs text-gray-500">
              Type: {device.type} | Manufacturer: {device.manufacturer}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter password"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
              Remember credentials for this device
            </label>
          </div>

          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-xs text-yellow-800">
              <strong>Common defaults:</strong><br/>
              • HikVision: admin / 12345<br/>
              • Dahua: admin / admin<br/>
              • Generic: admin / admin
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceCredentials;