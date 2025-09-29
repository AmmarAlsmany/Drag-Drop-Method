// Test streaming sources for development and testing
// These are publicly available streaming URLs for testing purposes

export const testStreamingSources = [
  {
    id: 'test-stream-1',
    name: 'Test Stream 1 - Live News',
    ip: 'stream1.example.com',
    type: 'IP Camera',
    manufacturer: 'Test Stream',
    model: 'HTTP Stream',
    ports: [80],
    confidence: 100,
    src: '', // Will be generated
    streamUrl: '', // Add your URL here
    protocol: 'http',
    isTestDevice: true,
    description: 'Test HTTP streaming source'
  },
  {
    id: 'test-stream-2',
    name: 'Test Stream 2 - Weather Cam',
    ip: 'stream2.example.com',
    type: 'IP Camera',
    manufacturer: 'Test Stream',
    model: 'RTSP Stream',
    ports: [554],
    confidence: 100,
    src: '',
    streamUrl: '', // Add your URL here
    protocol: 'rtsp',
    isTestDevice: true,
    description: 'Test RTSP streaming source'
  },
  {
    id: 'test-stream-3',
    name: 'Test Stream 3 - Traffic Cam',
    ip: 'stream3.example.com',
    type: 'IP Camera',
    manufacturer: 'Test Stream',
    model: 'HLS Stream',
    ports: [8080],
    confidence: 100,
    src: '',
    streamUrl: '', // Add your URL here
    protocol: 'hls',
    isTestDevice: true,
    description: 'Test HLS streaming source'
  },
  {
    id: 'test-stream-4',
    name: 'Test Stream 4 - Nature Cam',
    ip: 'stream4.example.com',
    type: 'IP Camera',
    manufacturer: 'Test Stream',
    model: 'MJPEG Stream',
    ports: [8080],
    confidence: 100,
    src: '',
    streamUrl: '', // Add your URL here
    protocol: 'mjpeg',
    isTestDevice: true,
    description: 'Test MJPEG streaming source'
  },
  {
    id: 'test-stream-5',
    name: 'Test Stream 5 - City View',
    ip: 'stream5.example.com',
    type: 'IP Camera',
    manufacturer: 'Test Stream',
    model: 'WebRTC Stream',
    ports: [8080],
    confidence: 100,
    src: '',
    streamUrl: '', // Add your URL here
    protocol: 'webrtc',
    isTestDevice: true,
    description: 'Test WebRTC streaming source'
  }
];

// Some known working public test streams (for reference)
export const publicTestStreams = {
  // Big Buck Bunny (commonly used for testing)
  bigBuckBunny: {
    hls: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    dash: 'https://dash.akamaized.net/akamai/bbb_30fps/bbb_30fps.mpd'
  },

  // Sample MJPEG streams (if available)
  mjpeg: {
    // Note: Most public MJPEG streams require no CORS or proxy
    sample: 'http://your-mjpeg-url-here/video.mjpg'
  },

  // Sample RTSP (usually needs conversion for browser)
  rtsp: {
    // RTSP URLs typically need a media server to convert to browser-compatible format
    sample: 'rtsp://your-rtsp-url-here/stream'
  },

  // Sample HTTP streams
  http: {
    // Direct MP4 or other video files
    sample: 'https://your-http-video-url-here/video.mp4'
  }
};

// Function to generate a preview thumbnail for test devices
export const generateTestDeviceThumbnail = (device) => {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');

  // Background gradient based on protocol
  const gradients = {
    http: ['#10b981', '#059669'],
    rtsp: ['#3b82f6', '#1e40af'],
    hls: ['#8b5cf6', '#6d28d9'],
    mjpeg: ['#f59e0b', '#d97706'],
    webrtc: ['#ef4444', '#dc2626']
  };

  const [color1, color2] = gradients[device.protocol] || ['#6b7280', '#4b5563'];

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 160, 90);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 160, 90);

  // Add protocol label
  ctx.fillStyle = 'white';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(device.protocol.toUpperCase(), 80, 30);

  // Add "TEST" label
  ctx.font = '10px Arial';
  ctx.fillText('TEST STREAM', 80, 50);

  // Add device name
  ctx.font = '9px Arial';
  ctx.fillText(device.name, 80, 70);

  return canvas.toDataURL();
};