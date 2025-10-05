import React from 'react';

// iPad-optimized preset layout buttons
const LayoutPresetsBar = ({ onApplyLayout, droppedImages }) => {
  const hasImages = droppedImages && droppedImages.length > 0;
  const hasMultipleImages = droppedImages && droppedImages.length > 1;

  const presets = [
    {
      id: 'fullscreen',
      name: 'Fullscreen',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" strokeWidth="2" rx="2" />
        </svg>
      ),
      disabled: !hasImages,
      description: 'Fill entire screen'
    },
    {
      id: 'pip',
      name: 'Picture-in-Picture',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" strokeWidth="2" rx="2" />
          <rect x="13" y="13" width="6" height="6" strokeWidth="2" rx="1" fill="currentColor" />
        </svg>
      ),
      disabled: !hasMultipleImages,
      description: 'Main + small overlay'
    },
    {
      id: 'side-by-side',
      name: 'Side by Side',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="18" strokeWidth="2" rx="2" />
          <rect x="13" y="3" width="8" height="18" strokeWidth="2" rx="2" />
        </svg>
      ),
      disabled: !hasMultipleImages,
      description: 'Split screen 50/50'
    },
    {
      id: 'quad',
      name: 'Quad View',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="8" height="8" strokeWidth="2" rx="1" />
          <rect x="13" y="3" width="8" height="8" strokeWidth="2" rx="1" />
          <rect x="3" y="13" width="8" height="8" strokeWidth="2" rx="1" />
          <rect x="13" y="13" width="8" height="8" strokeWidth="2" rx="1" />
        </svg>
      ),
      disabled: droppedImages.length < 3,
      description: '2×2 grid layout'
    },
    {
      id: 'thirds',
      name: '2/3 Split',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="12" height="18" strokeWidth="2" rx="2" />
          <rect x="17" y="3" width="4" height="18" strokeWidth="2" rx="2" />
        </svg>
      ),
      disabled: !hasMultipleImages,
      description: 'Large + small split'
    },
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
          </svg>
          Quick Layouts
        </h3>
        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full">
          {droppedImages.length}
        </span>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => !preset.disabled && onApplyLayout(preset.id)}
            disabled={preset.disabled}
            className={`
              flex flex-col items-center justify-center p-2 rounded-lg transition-all
              ${preset.disabled
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                : 'bg-white text-blue-600 hover:bg-blue-600 hover:text-white active:scale-95 shadow-sm hover:shadow-md cursor-pointer'
              }
            `}
            title={preset.description}
          >
            <div className="mb-1">{preset.icon}</div>
            <span className="text-xs font-medium text-center leading-tight">
              {preset.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LayoutPresetsBar;
