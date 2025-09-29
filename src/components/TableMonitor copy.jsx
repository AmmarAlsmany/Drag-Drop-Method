import React from 'react';
import powerButtonIcon from '../assets/powerbutton.png';
import largeScreenIcon from '../assets/largescreen.png';
import downArrowIcon from '../assets/downarrow.png';
import upArrowIcon from '../assets/uparrow.png';

const TableMonitor = ({ chartImage, title = "Table Monitors" }) => {
  return (
    <div className="bg-white rounded-xl p-4">
      <div className="flex justify-between items-center mb-2">   
        <div className="flex space-x-2">
          <img src={powerButtonIcon} alt="Power" className="img-fluid cursor-pointer" />
          <img src={largeScreenIcon} alt="Large Screen" className="img-fluid cursor-pointer" />
          <img src={downArrowIcon} alt="Down Arrow" className="img-fluid cursor-pointer" />
          <img src={upArrowIcon} alt="Up Arrow" className="img-fluid cursor-pointer" />
        </div>
        <div className="text-right">
          <h3 className="text-[#A3A5A7] text-lg font-bold">{title}</h3>
          <p className="text-[#A3A5A7] text-sm">Drag from sources</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl p-4">
          <img src={chartImage} alt="Chart" className="w-full h-auto object-contain rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default TableMonitor;
