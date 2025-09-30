import React, { useState, useEffect } from 'react';
import { useDragAndDrop } from '../hooks/useDragAndDrop';
import { CornerHandle, SideHandle } from './ResizeHandles';

// Monitor to DIDO Output mapping
const MONITOR_OUTPUT_MAP = {
  'videowall': 1,    // Video Wall → Output 1
  'monitor-a': 2,    // Table Monitor A → Output 2
  'monitor-b': 3,    // Table Monitor B → Output 3
  'monitor-c': 4     // Table Monitor C → Output 4
};

const TableMonitor = ({
  title = "Table Monitors",
  height = 350,
  maxTiles = 4,
  monitorId = "default",
  isHovered = false,
  isDimmed = false,
  onSaveChanges
}) => {
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

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get DIDO output number for this monitor
  const outputNumber = MONITOR_OUTPUT_MAP[monitorId] || 1;

  // Track changes
  useEffect(() => {
    if (droppedImages.length > 0) {
      setHasChanges(true);
    }
  }, [droppedImages]);

  const handleSaveChanges = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      if (onSaveChanges) {
        await onSaveChanges(droppedImages, outputNumber);
      }
      setHasChanges(false);
      console.log(`✅ Saved changes to DIDO Output ${outputNumber} (${monitorId})`);
    } catch (error) {
      console.error(`❌ Failed to save changes to Output ${outputNumber}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`rounded-xl p-4 transition-colors duration-300 ${
        isDimmed ? 'bg-gray-300' : 'bg-white'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2 items-center">
          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              hasChanges && !isSaving
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={hasChanges ? 'Save changes to Q-SYS' : 'No changes to save'}
          >
            {isSaving ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              'Save Changes'
            )}
          </button>

          {hasChanges && !isSaving && (
            <span className="text-xs text-orange-600 font-medium">
              Unsaved changes
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
