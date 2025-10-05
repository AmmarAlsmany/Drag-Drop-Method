import React, { useState, useEffect } from 'react';

// iPad-optimized modal for precise window control
const WindowPropertiesModal = ({ window, onClose, onApply, canvasRect }) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: 100, h: 100 });

  useEffect(() => {
    if (window && canvasRect) {
      // Convert pixel values to percentages
      const xPercent = Math.round((window.position.x / canvasRect.width) * 100);
      const yPercent = Math.round((window.position.y / canvasRect.height) * 100);
      const wPercent = Math.round((window.size.w / canvasRect.width) * 100);
      const hPercent = Math.round((window.size.h / canvasRect.height) * 100);

      setPosition({ x: xPercent, y: yPercent });
      setSize({ w: wPercent, h: hPercent });
    }
  }, [window, canvasRect]);

  const handleApply = () => {
    if (!canvasRect) return;

    // Convert percentages back to pixels
    const newPosition = {
      x: (position.x / 100) * canvasRect.width,
      y: (position.y / 100) * canvasRect.height,
    };
    const newSize = {
      w: (size.w / 100) * canvasRect.width,
      h: (size.h / 100) * canvasRect.height,
    };

    onApply(window.id, newPosition, newSize);
    onClose();
  };

  if (!window) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Window Properties</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Window Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="font-semibold text-gray-900">{window.name || 'Window'}</span>
          </div>
          <p className="text-sm text-gray-600">Adjust position and size with precision</p>
        </div>

        {/* Position Controls */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Position (%)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-2">X (Horizontal)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={position.x}
                onChange={(e) => setPosition({ ...position, x: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Y (Vertical)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={position.y}
                onChange={(e) => setPosition({ ...position, y: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Size Controls */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Size (%)
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-2">Width</label>
              <input
                type="number"
                min="10"
                max="100"
                value={size.w}
                onChange={(e) => setSize({ ...size, w: Math.max(10, Math.min(100, parseInt(e.target.value) || 10)) })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-2">Height</label>
              <input
                type="number"
                min="10"
                max="100"
                value={size.h}
                onChange={(e) => setSize({ ...size, h: Math.max(10, Math.min(100, parseInt(e.target.value) || 10)) })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Quick Presets
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setPosition({ x: 50, y: 50 });
                setSize({ w: 100, h: 100 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Fullscreen
            </button>
            <button
              onClick={() => {
                setPosition({ x: 25, y: 50 });
                setSize({ w: 50, h: 100 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Left Half
            </button>
            <button
              onClick={() => {
                setPosition({ x: 75, y: 50 });
                setSize({ w: 50, h: 100 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Right Half
            </button>
            <button
              onClick={() => {
                setPosition({ x: 25, y: 25 });
                setSize({ w: 50, h: 50 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Top-Left
            </button>
            <button
              onClick={() => {
                setPosition({ x: 75, y: 25 });
                setSize({ w: 50, h: 50 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Top-Right
            </button>
            <button
              onClick={() => {
                setPosition({ x: 80, y: 80 });
                setSize({ w: 25, h: 25 });
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              PiP
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default WindowPropertiesModal;
