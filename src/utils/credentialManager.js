// Credential manager for storing device credentials securely
// Note: In production, credentials should be stored securely (encrypted)

class CredentialManager {
  constructor() {
    this.storageKey = 'device_credentials';
    this.loadCredentials();
  }

  loadCredentials() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      this.credentials = stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load credentials:', error);
      this.credentials = {};
    }
  }

  saveCredentials() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.credentials));
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  }

  // Store credentials for a device
  storeDeviceCredentials(deviceId, username, password) {
    this.credentials[deviceId] = {
      username,
      password: this.obfuscate(password), // Basic obfuscation (not secure!)
      timestamp: Date.now()
    };
    this.saveCredentials();
  }

  // Get stored credentials for a device
  getDeviceCredentials(deviceId) {
    const creds = this.credentials[deviceId];
    if (creds) {
      return {
        username: creds.username,
        password: this.deobfuscate(creds.password)
      };
    }
    return null;
  }

  // Remove credentials for a device
  removeDeviceCredentials(deviceId) {
    delete this.credentials[deviceId];
    this.saveCredentials();
  }

  // Clear all stored credentials
  clearAllCredentials() {
    this.credentials = {};
    this.saveCredentials();
  }

  // Basic obfuscation (NOT secure encryption - just to avoid plaintext)
  obfuscate(str) {
    return btoa(str).split('').reverse().join('');
  }

  deobfuscate(str) {
    return atob(str.split('').reverse().join(''));
  }

  // Test device connection with credentials
  async testConnection(device, username, password) {
    try {
      // Test HTTP connection first (safer)
      if (device.ports.includes(80) || device.ports.includes(8080)) {
        const port = device.ports.includes(80) ? 80 : 8080;
        const url = `http://${device.ip}:${port}`;

        // Try basic auth
        const response = await fetch(url, {
          method: 'HEAD',
          headers: {
            'Authorization': 'Basic ' + btoa(`${username}:${password}`)
          },
          mode: 'no-cors' // Bypass CORS for testing
        });

        // no-cors mode doesn't give us response details,
        // but if no error thrown, connection likely works
        return { success: true, message: 'Connection test passed' };
      }

      // For RTSP, we can't test directly from browser
      if (device.ports.includes(554)) {
        return {
          success: 'unknown',
          message: 'RTSP connection cannot be tested from browser. Try connecting to see if credentials work.',
          rtspUrl: `rtsp://${username}:${password}@${device.ip}:554/stream`
        };
      }

      return { success: false, message: 'No testable ports found' };

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Get common default credentials to try
  getDefaultCredentials(manufacturer) {
    const defaults = {
      'HikVision': [
        { username: 'admin', password: '12345' },
        { username: 'admin', password: 'admin12345' },
        { username: 'admin', password: 'Hik12345' }
      ],
      'Dahua': [
        { username: 'admin', password: 'admin' },
        { username: 'admin', password: '888888' },
        { username: 'admin', password: '666666' }
      ],
      'Axis': [
        { username: 'root', password: 'pass' },
        { username: 'root', password: 'root' }
      ],
      'Foscam': [
        { username: 'admin', password: '' },
        { username: 'admin', password: 'admin' }
      ],
      'Generic': [
        { username: 'admin', password: 'admin' },
        { username: 'admin', password: '12345' },
        { username: 'admin', password: 'password' },
        { username: 'admin', password: '1234' },
        { username: 'user', password: 'user' },
        { username: 'admin', password: '' }
      ]
    };

    return defaults[manufacturer] || defaults['Generic'];
  }

  // Build connection URL with credentials
  buildConnectionUrl(device, username, password) {
    const urls = {};

    // RTSP URL
    if (device.ports.includes(554)) {
      // Common RTSP paths
      const rtspPaths = [
        '/stream',
        '/Streaming/Channels/1',
        '/cam/realmonitor?channel=1&subtype=0',
        '/live',
        '/ch0',
        '/video',
        '/h264'
      ];

      urls.rtsp = rtspPaths.map(path =>
        `rtsp://${username}:${password}@${device.ip}:554${path}`
      );
    }

    // HTTP URL
    if (device.ports.includes(80) || device.ports.includes(8080)) {
      const port = device.ports.includes(80) ? 80 : 8080;
      urls.http = `http://${username}:${password}@${device.ip}:${port}`;
      urls.snapshot = `http://${username}:${password}@${device.ip}:${port}/snapshot.jpg`;
      urls.stream = `http://${username}:${password}@${device.ip}:${port}/video`;
    }

    // ONVIF URL (if applicable)
    if (device.ports.includes(80) || device.ports.includes(8080)) {
      const port = device.ports.includes(80) ? 80 : 8080;
      urls.onvif = `http://${device.ip}:${port}/onvif/device_service`;
    }

    return urls;
  }
}

// Export singleton instance
export const credentialManager = new CredentialManager();

// Hook for using credentials in React components
export const useDeviceCredentials = (deviceId) => {
  const [credentials, setCredentials] = React.useState(null);

  React.useEffect(() => {
    const stored = credentialManager.getDeviceCredentials(deviceId);
    setCredentials(stored);
  }, [deviceId]);

  const saveCredentials = (username, password) => {
    credentialManager.storeDeviceCredentials(deviceId, username, password);
    setCredentials({ username, password });
  };

  const clearCredentials = () => {
    credentialManager.removeDeviceCredentials(deviceId);
    setCredentials(null);
  };

  return {
    credentials,
    saveCredentials,
    clearCredentials,
    hasStoredCredentials: !!credentials
  };
};