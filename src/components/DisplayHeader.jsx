import React from 'react';

const DisplayHeader = () => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-gray-800 text-lg font-medium">Displays</h2>
      <div className="flex items-center space-x-2 p-3">
        <div className="w-3 h-3 border-2 border-red-500 rounded-full flex items-center justify-center">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
        </div>
        <span className="text-red-600 text-sm font-medium">Rec</span>
        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        <span className="text-gray-800 text-sm font-medium">32:55</span>
      </div>
    </div>
  );
};

export default DisplayHeader;
