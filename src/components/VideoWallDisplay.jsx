import React, { useState, useEffect, useRef } from 'react';
import { CornerHandle, SideHandle } from './ResizeHandles';

const VideoWallDisplay = () => {
  const canvasRef = useRef(null);
  const [droppedImages, setDroppedImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [quadMode, setQuadMode] = useState(false);
  const [didoStatus, setDidoStatus] = useState('disconnected');
  const [routingStatus, setRoutingStatus] = useState('idle');

  // Real-time sync with main dashboard via WebSocket or localStorage
  useEffect(() => {
    const syncFromStorage = () => {
      try {
        const savedImages = localStorage.getItem('videoWallImages');
        const savedQuadMode = localStorage.getItem('videoWallQuadMode');

        if (savedImages) {
          setDroppedImages(JSON.parse(savedImages));
        }
        if (savedQuadMode) {
          setQuadMode(JSON.parse(savedQuadMode));
        }
      } catch (error) {
        console.error('Error syncing from storage:', error);
      }
    };

    // Initial sync
    syncFromStorage();

    // Listen for storage changes from main dashboard
    const handleStorageChange = (e) => {
      if (e.key === 'videoWallImages' && e.newValue) {
        setDroppedImages(JSON.parse(e.newValue));
      }
      if (e.key === 'videoWallQuadMode' && e.newValue) {
        setQuadMode(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Poll for changes every 500ms as backup
    const interval = setInterval(syncFromStorage, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // DIDO Routing Functions
  const routeInputsToOutput = async (inputList, outputNum) => {
    try {
      setRoutingStatus('routing');
      const response = await fetch('http://localhost:5000/api/dido/route-multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: inputList,
          output: outputNum
        })
      });

      const result = await response.json();

      if (result.status === 'success' || result.status === 'partial') {
        setDidoStatus('connected');
        setRoutingStatus('success');
        console.log('✅ DIDO Routing successful:', result.message);
      } else {
        setDidoStatus('error');
        setRoutingStatus('error');
        console.error('❌ DIDO Routing failed:', result.message);
      }

      return result;
    } catch (error) {
      setDidoStatus('error');
      setRoutingStatus('error');
      console.error('❌ DIDO API Error:', error);
      return { status: 'error', message: error.message };
    }
  };

  const checkDidoStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/dido/status');
      const result = await response.json();

      if (result.status === 'success') {
        setDidoStatus('connected');
      } else {
        setDidoStatus('error');
      }
    } catch (error) {
      setDidoStatus('disconnected');
    }
  };

  // Auto-route when streams change
  useEffect(() => {
    if (droppedImages.length > 0) {
      // Route input 1 and input 2 to output 1 for your use case
      const inputs = [1, 2]; // Always route inputs 1 and 2
      routeInputsToOutput(inputs, 1);
    }
  }, [droppedImages.length]); // Trigger when number of streams changes

  // Check DIDO status on component mount
  useEffect(() => {
    checkDidoStatus();
    const interval = setInterval(checkDidoStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Drag and drop handlers (minimal - mainly for visual feedback)
  const onDragOver = (e) => {
    e.preventDefault();
  };

  const onDrop = (e) => {
    e.preventDefault();
    // Display view is read-only, ignore drops
  };

  const onPointerDown = (e) => {
    // Display view is read-only, ignore interactions
  };

  const startMove = (e, id) => {
    // Display view is read-only, ignore move
  };

  const startResizeCorner = (e, id, corner) => {
    // Display view is read-only, ignore resize
  };

  const startResizeSide = (e, id, side) => {
    // Display view is read-only, ignore resize
  };

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      {/* Full-screen Video Wall Canvas */}
      <div
        ref={canvasRef}
        className="w-full h-full relative overflow-hidden bg-black"
        style={{
          isolation: 'isolate',
          contain: 'layout style paint'
        }}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPointerDown={onPointerDown}
      >
        {droppedImages.map((image, idx) => (
          <div
            key={image.id}
            className="absolute rounded-lg overflow-hidden"
            style={{
              left: `${image.position.x - image.size.w / 2}px`,
              top: `${image.position.y - image.size.h / 2}px`,
              width: `${image.size.w}px`,
              height: `${image.size.h}px`,
              touchAction: "none",
              zIndex: idx + 1,
            }}
          >
            {/* Image - no controls in display mode */}
            <img
              src={image.src}
              alt={image.name}
              className="w-full h-full select-none pointer-events-none"
              style={{ objectFit: "cover" }}
              draggable={false}
            />
          </div>
        ))}

        {/* Status indicators */}
        <div className="absolute top-4 right-4 space-y-2">
          {/* Display Status */}
          <div className="bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
            Display Mode - {droppedImages.length} sources
          </div>

          {/* DIDO Status */}
          <div className={`px-3 py-1 rounded-lg text-sm flex items-center space-x-2 ${
            didoStatus === 'connected' ? 'bg-green-600/80 text-white' :
            didoStatus === 'error' ? 'bg-red-600/80 text-white' :
            'bg-gray-600/80 text-gray-300'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              didoStatus === 'connected' ? 'bg-green-400' :
              didoStatus === 'error' ? 'bg-red-400' :
              'bg-gray-400'
            }`}></div>
            <span>DIDO {didoStatus.toUpperCase()}</span>
          </div>

          {/* Routing Status */}
          {routingStatus !== 'idle' && (
            <div className={`px-3 py-1 rounded-lg text-sm ${
              routingStatus === 'routing' ? 'bg-yellow-600/80 text-white' :
              routingStatus === 'success' ? 'bg-green-600/80 text-white' :
              routingStatus === 'error' ? 'bg-red-600/80 text-white' :
              'bg-gray-600/80 text-gray-300'
            }`}>
              {routingStatus === 'routing' ? 'Routing IN1,2→OUT1...' :
               routingStatus === 'success' ? 'Routed IN1,2→OUT1 ✓' :
               routingStatus === 'error' ? 'Routing Failed ✗' : 'Ready'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoWallDisplay;