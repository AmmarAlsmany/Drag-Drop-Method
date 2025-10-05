import React, { useState, useEffect } from 'react';
import { CornerHandle, SideHandle } from './ResizeHandles';
import WindowPropertiesModal from './WindowPropertiesModal';

// Monitor to DIDO Output mapping
const MONITOR_OUTPUT_MAP = {
  'videowall': 1,    // Video Wall → Output 1
  'monitor-a': 2,    // Table Monitor A → Output 2
  'monitor-b': 3,    // Table Monitor B → Output 3
  'monitor-c': 4     // Table Monitor C → Output 4
};

const VideoWall = ({
  canvasRef,
  droppedImages,
  selectedId,
  quadMode,
  setQuadMode,
  onDragOver,
  onDrop,
  onPointerDown,
  startMove,
  startResizeCorner,
  startResizeSide,
  setDroppedImages,
  setSelectedId,
  isHovered = false,
  isDimmed = false,
  onSaveChanges,
  onToggleWindow,
  monitorId = "videowall",
  applyPresetLayout
}) => {
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [editingWindow, setEditingWindow] = useState(null);
  const [lastSavedState, setLastSavedState] = useState(null);

  // Get DIDO output number for this monitor
  const outputNumber = MONITOR_OUTPUT_MAP[monitorId] || 1;

  // Track when changes are made by comparing with last saved state
  useEffect(() => {
    if (!lastSavedState) {
      // First load - no changes yet
      setLastSavedState(JSON.stringify(droppedImages));
      setHasChanges(false);
      return;
    }

    const currentState = JSON.stringify(droppedImages);
    const hasActualChanges = currentState !== lastSavedState;
    setHasChanges(hasActualChanges);
  }, [droppedImages]);

  // Handle touch drop events (for mobile/iPad)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleCustomDrop = (e) => {
      if (e.detail && onDrop) {
        // Create synthetic event with the touch data
        const syntheticEvent = {
          preventDefault: () => {},
          stopPropagation: () => {},
          clientX: e.clientX || 0,
          clientY: e.clientY || 0,
          detail: e.detail,
          dataTransfer: {
            getData: () => ''
          }
        };
        onDrop(syntheticEvent);
      }
    };

    canvas.addEventListener('drop', handleCustomDrop);
    return () => {
      canvas.removeEventListener('drop', handleCustomDrop);
    };
  }, [canvasRef, onDrop]);

  const handleSaveChanges = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);
    try {
      if (onSaveChanges) {
        await onSaveChanges(droppedImages, outputNumber);
      }
      // Update last saved state to current state
      setLastSavedState(JSON.stringify(droppedImages));
      setHasChanges(false);
      console.log(`✅ Saved changes to DIDO Output ${outputNumber} (${monitorId})`);
    } catch (error) {
      console.error(`❌ Failed to save changes to Output ${outputNumber}:`, error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnable = async () => {
    const newState = !isEnabled;
    setIsEnabled(newState);

    if (onToggleWindow) {
      try {
        await onToggleWindow(outputNumber, newState);
        console.log(`✅ ${newState ? 'Enabled' : 'Disabled'} DIDO Output ${outputNumber} (${monitorId})`);
      } catch (error) {
        console.error(`❌ Failed to toggle Output ${outputNumber}:`, error);
        setIsEnabled(!newState); // Revert on error
      }
    }
  };

  const handleApplyWindowProperties = (windowId, newPosition, newSize) => {
    setDroppedImages((prev) =>
      prev.map((img) =>
        img.id === windowId
          ? { ...img, position: newPosition, size: newSize }
          : img
      )
    );
    setHasChanges(true);
  };

  return (
    <div
      className={`rounded-xl mb-4 p-4 flex flex-col transition-colors duration-300 ${
        isDimmed ? 'bg-gray-300' : 'bg-white'
      }`}
      style={{ aspectRatio: '16/9' }}
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex space-x-2 items-center">
          {/* Enable/Disable Button */}
          <button
            onClick={handleToggleEnable}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
              isEnabled
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-400 hover:bg-gray-500 text-white'
            }`}
            title={isEnabled ? 'Disable window' : 'Enable window'}
          >
            {isEnabled ? 'Enabled' : 'Disabled'}
          </button>

          {/* Save Changes Button */}
          <button
            onClick={handleSaveChanges}
            disabled={!hasChanges || isSaving || !isEnabled}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              hasChanges && !isSaving && isEnabled
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

          {hasChanges && !isSaving && isEnabled && (
            <span className="text-xs text-orange-600 font-medium">
              Unsaved changes
            </span>
          )}
        </div>
        <div className="text-right">
          <h3 className="text-[#A3A5A7] text-lg font-bold">Video Wall</h3>
          <p className="text-[#A3A5A7] text-sm">Live Video Display</p>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        data-canvas
        className={`flex-1 border border-gray-300 rounded-xl relative overflow-hidden transition-colors duration-300 ${
          isDimmed ? 'bg-gray-300' : 'bg-white'
        }`}
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
            draggable
            onDragStart={(e) => {
              // Enable reverse drag - set window ID
              e.dataTransfer.setData('application/x-window-id', image.id);
              e.dataTransfer.effectAllowed = 'move';
            }}
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
            className="absolute rounded-lg overflow-hidden group cursor-move"
            style={{
              left: `${image.position.x - image.size.w / 2}px`,
              top: `${image.position.y - image.size.h / 2}px`,
              width: `${image.size.w}px`,
              height: `${image.size.h}px`,
              touchAction: "none",
              zIndex: idx + 1,
            }}
          >
            {/* Edit button — iPad-optimized size (always visible) */}
            <button
              type="button"
              aria-label="Edit properties"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setEditingWindow(image);
              }}
              className="absolute top-2 left-2 inline-flex items-center justify-center rounded-full
                         bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white w-11 h-11 shadow-lg transition-all"
              title="Edit window properties"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {/* Remove (X) button — iPad-optimized size (always visible) */}
            <button
              type="button"
              aria-label="Remove"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setDroppedImages((prev) => prev.filter((img) => img.id !== image.id));
                if (selectedId === image.id) setSelectedId(null);
              }}
              className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full
                         bg-red-600 hover:bg-red-700 active:bg-red-800 text-white w-11 h-11 shadow-lg transition-all"
              title="Remove window"
            >
              <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Image */}
            <img
              src={image.src}
              alt={image.name}
              className="w-full h-full select-none pointer-events-none"
              style={{ objectFit: "cover" }}
              draggable={false}
            />

            {/* Corners */}
            <CornerHandle pos="nw" onPointerDown={(e) => startResizeCorner(e, image.id, "nw")} />
            <CornerHandle pos="ne" onPointerDown={(e) => startResizeCorner(e, image.id, "ne")} />
            <CornerHandle pos="sw" onPointerDown={(e) => startResizeCorner(e, image.id, "sw")} />
            <CornerHandle pos="se" onPointerDown={(e) => startResizeCorner(e, image.id, "se")} />

            {/* Sides */}
            <SideHandle pos="n" onPointerDown={(e) => startResizeSide(e, image.id, "n")} />
            <SideHandle pos="s" onPointerDown={(e) => startResizeSide(e, image.id, "s")} />
            <SideHandle pos="e" onPointerDown={(e) => startResizeSide(e, image.id, "e")} />
            <SideHandle pos="w" onPointerDown={(e) => startResizeSide(e, image.id, "w")} />
          </div>
        ))}
      </div>

      {/* Window Properties Modal */}
      {editingWindow && (
        <WindowPropertiesModal
          window={editingWindow}
          onClose={() => setEditingWindow(null)}
          onApply={handleApplyWindowProperties}
          canvasRect={canvasRef.current?.getBoundingClientRect()}
        />
      )}
    </div>
  );
};

export default VideoWall;
