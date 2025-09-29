import React from 'react';
import powerButtonIcon from '../assets/powerbutton.png';
import largeScreenIcon from '../assets/largescreen.png';
import downArrowIcon from '../assets/downarrow.png';
import upArrowIcon from '../assets/uparrow.png';

import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { CornerHandle, SideHandle } from './ResizeHandles';

const TableMonitor = ({ title = "Table Monitors", height = 350, maxTiles = 4, monitorId = "default", isHovered = false, isDimmed = false }) => {
  const {
    canvasRef,
    droppedImages,
    selectedId,
    quadMode,
    setDroppedImages,
    setSelectedId,
    setQuadMode,
    handleDragOver,
    handleDrop,
    startMove,
    startResizeCorner,
    startResizeSide,
  } = useDragAndDrop();

  return (
    <div
      className={`rounded-xl p-4 transition-colors duration-300 ${
        isDimmed ? 'bg-gray-300' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2 items-center">
          <img src={powerButtonIcon} alt="Power" className="img-fluid cursor-pointer" />
          <img src={largeScreenIcon} alt="Large Screen" className="img-fluid cursor-pointer" />
          <img src={downArrowIcon} alt="Down Arrow" className="img-fluid cursor-pointer" />
          <img src={upArrowIcon} alt="Up Arrow" className="img-fluid cursor-pointer" />

          {/* Quad Mode Toggle */}
          <button
            onClick={() => {
              console.log(`🎛️ Toggling quad mode for ${title}:`, !quadMode);
              setQuadMode(!quadMode);
            }}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              quadMode
                ? 'bg-green-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Toggle quad split mode"
          >
            {quadMode ? '4-Split ON' : '4-Split OFF'}
          </button>

          {quadMode && (
            <span className="text-xs text-gray-500">
              Auto 1/4 positioning
            </span>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-[#A3A5A7] text-lg font-bold">{title}</h3>
          <p className="text-[#A3A5A7] text-sm">Drag from sources</p>
        </div>
      </div>

      {/* Canvas with same behavior as VideoWall */}
      <div
        ref={canvasRef}
        className="border border-gray-300 rounded-xl p-4 relative overflow-hidden"
        style={{
          aspectRatio: '16/9',
          isolation: 'isolate',
          contain: 'layout style paint'
        }}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          // optional per-canvas limit
          if (droppedImages.length >= maxTiles) {
            alert(`Max ${maxTiles} images allowed on this monitor.`);
            return;
          }
          handleDrop(e);
        }}
        onPointerDown={() => setSelectedId(null)}
      >
        {droppedImages.map((image, idx) => (
          <div
            key={image.id}
            onPointerDown={(e) => {
              // bring to front
              setDroppedImages((prev) => {
                const i = prev.findIndex((p) => p.id === image.id);
                if (i === -1) return prev;
                const copy = [...prev];
                const [it] = copy.splice(i, 1);
                copy.push(it);
                return copy;
              });
              setSelectedId(image.id);
              startMove(e, image.id);
            }}
            className="absolute rounded-lg overflow-hidden group"
            style={{
              left: `${image.position.x}px`,
              top: `${image.position.y}px`,
              width: `${image.size.w}px`,
              height: `${image.size.h}px`,
              transform: 'translate(-50%, -50%)',
              touchAction: 'none',
              zIndex: idx + 1,
            }}
          >
            {/* Remove (X) */}
            <button
              type="button"
              aria-label="Remove"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDroppedImages((prev) => prev.filter((img) => img.id !== image.id));
                if (selectedId === image.id) setSelectedId(null);
              }}
              className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 inline-flex items-center justify-center rounded-full 
                         bg-red-600 hover:bg-red-700 text-white w-6 h-6 sm:w-7 sm:h-7 shadow-md opacity-0 group-hover:opacity-100"
              title="Remove tile"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {/* Image */}
            <img
              src={image.src}
              alt={image.name}
              className="w-full h-full select-none pointer-events-none"
              style={{ objectFit: 'cover' }}
              draggable={false}
            />

            {/* Resize handles */}
            <CornerHandle pos="nw" onPointerDown={(e) => startResizeCorner(e, image.id, 'nw')} />
            <CornerHandle pos="ne" onPointerDown={(e) => startResizeCorner(e, image.id, 'ne')} />
            <CornerHandle pos="sw" onPointerDown={(e) => startResizeCorner(e, image.id, 'sw')} />
            <CornerHandle pos="se" onPointerDown={(e) => startResizeCorner(e, image.id, 'se')} />

            <SideHandle pos="n" onPointerDown={(e) => startResizeSide(e, image.id, 'n')} />
            <SideHandle pos="s" onPointerDown={(e) => startResizeSide(e, image.id, 's')} />
            <SideHandle pos="e" onPointerDown={(e) => startResizeSide(e, image.id, 'e')} />
            <SideHandle pos="w" onPointerDown={(e) => startResizeSide(e, image.id, 'w')} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableMonitor;
