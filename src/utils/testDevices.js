// Test streaming devices with your MJPEG URLs
export const TEST_STREAMING_DEVICES = [
  {
    id: 'test-stream-1',
    name: 'Security Camera 1',
    ip: '77.222.181.11',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    model: 'Public Camera',
    ports: [8080],
    confidence: 100,
    streamUrl: 'http://77.222.181.11:8080/mjpg/video.mjpg',
    protocol: 'mjpeg',
    isTestDevice: true,
    online: true
  },
  {
    id: 'test-stream-2',
    name: 'Japan Camera - Honjin',
    ip: 'honjin1.miemasu.net',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    model: 'Public Camera',
    ports: [80],
    confidence: 100,
    streamUrl: 'http://honjin1.miemasu.net/nphMotionJpeg?Resolution=640x480&Quality=Standard',
    protocol: 'mjpeg',
    isTestDevice: true,
    online: true
  },
  {
    id: 'test-stream-3',
    name: 'Asia Pacific Camera',
    ip: '61.211.241.239',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    model: 'Public Camera',
    ports: [80],
    confidence: 100,
    streamUrl: 'http://61.211.241.239/nphMotionJpeg?Resolution=320x240&Quality=Standard',
    protocol: 'mjpeg',
    isTestDevice: true,
    online: true
  },
  {
    id: 'test-stream-4',
    name: 'European Camera',
    ip: '195.196.36.242',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    model: 'Public Camera',
    ports: [443],
    confidence: 100,
    streamUrl: 'https://195.196.36.242/mjpg/video.mjpg',
    protocol: 'mjpeg',
    isTestDevice: true,
    online: true
  },
  {
    id: 'test-stream-5',
    name: 'Public Camera 5',
    ip: '158.58.130.148',
    type: 'IP Camera',
    manufacturer: 'MJPEG Stream',
    model: 'Public Camera',
    ports: [80],
    confidence: 100,
    streamUrl: 'http://158.58.130.148/mjpg/video.mjpg',
    protocol: 'mjpeg',
    isTestDevice: true,
    online: true
  }
];