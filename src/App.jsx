import LeftSidebar from './components/LeftSidebar';
import VideoWall from './components/VideoWall';
import TableMonitor from './components/TableMonitor';
import DisplayHeader from './components/DisplayHeader';
import RightSidebar from './components/RightSidebar';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useState } from 'react';

const API_BASE = 'http://localhost:5000';

function App() {
  const {
    draggedImage,
    droppedImages,
    selectedId,
    quadMode,
    canvasRef,
    setDroppedImages,
    setSelectedId,
    setQuadMode,
    handleDragStart,
    handleDragOver,
    handleDrop,
    startMove,
    startResizeCorner,
    startResizeSide,
  } = useDragAndDrop();

  const [hoveredDisplay, setHoveredDisplay] = useState(null);

  // Save changes to Q-SYS Aurora DIDO
  const handleSaveChanges = async (droppedImages, outputNumber) => {
    try {
      console.log(`Saving changes to Output ${outputNumber}:`, droppedImages);

      if (!droppedImages || droppedImages.length === 0) {
        console.log('⚠️ No images to save');
        return;
      }

      // Convert droppedImages to Q-SYS sources format with custom coordinates
      const sources = droppedImages.map((img, index) => {
        // Get canvas dimensions for percentage calculation
        const canvas = document.querySelector('[data-canvas]') || { offsetWidth: 1920, offsetHeight: 1080 };
        const canvasWidth = canvas.offsetWidth || 1920;
        const canvasHeight = canvas.offsetHeight || 1080;

        // Calculate percentage positions (0-100)
        const xPercent = Math.round((img.position.x / canvasWidth) * 100);
        const yPercent = Math.round((img.position.y / canvasHeight) * 100);
        const wPercent = Math.round((img.size.w / canvasWidth) * 100);
        const hPercent = Math.round((img.size.h / canvasHeight) * 100);

        // Extract input number from image data
        // Priority: img.inputNumber > img.input > img.device?.inputNumber > index + 1
        const inputNumber = img.inputNumber || img.input || img.device?.inputNumber || (index + 1);

        console.log(`📦 Source ${index + 1}: Using input ${inputNumber} for ${img.name || 'unnamed'}`);

        return {
          input: inputNumber,
          coordinates: {
            x: Math.max(0, Math.min(100, xPercent)),
            y: Math.max(0, Math.min(100, yPercent)),
            w: Math.max(0, Math.min(100, wPercent)),
            h: Math.max(0, Math.min(100, hPercent))
          }
        };
      });

      console.log('📤 Sending to Q-SYS:', { output: outputNumber, sources });

      const response = await fetch(`${API_BASE}/api/dido/route-with-coordinates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: outputNumber,
          sources: sources
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        console.log('✅ Changes saved successfully to Q-SYS');
      } else {
        console.error('❌ Failed to save changes:', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to save changes:', error);
      throw error;
    }
  };

  // Toggle window enable/disable
  const handleToggleWindow = async (outputNumber, enable) => {
    try {
      console.log(`${enable ? 'Enabling' : 'Disabling'} Output ${outputNumber}`);

      const response = await fetch(`${API_BASE}/api/dido/toggle-window`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          output: outputNumber,
          enable: enable
        })
      });

      const result = await response.json();
      if (result.status === 'success') {
        console.log(`✅ Output ${outputNumber} ${enable ? 'enabled' : 'disabled'}`);
      } else {
        console.error('❌ Failed to toggle window:', result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Failed to toggle window:', error);
      throw error;
    }
  };

  return (
    <div className="h-screen py-1 pl-1 bg-[#E4E4E4] flex">
      {/* Left Sidebar */}
      <LeftSidebar onDragStart={handleDragStart} />

      {/* Right column: Displays */}
      <div className="w-[78%] h-full p-4 flex flex-col rounded-xl overflow-y-auto"
           style={{ scrollbarWidth: "thin", scrollbarColor: "#888 transparent" }}>
        
        <DisplayHeader />

        <div className="flex-1 rounded-lg flex flex-col">
          {/* Video Wall */}
          <div
            onMouseEnter={() => setHoveredDisplay('video-wall')}
            onMouseLeave={() => setHoveredDisplay(null)}
          >
            <VideoWall
              canvasRef={canvasRef}
              droppedImages={droppedImages}
              selectedId={selectedId}
              quadMode={quadMode}
              setQuadMode={setQuadMode}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onPointerDown={() => setSelectedId(null)}
              startMove={startMove}
              startResizeCorner={startResizeCorner}
              startResizeSide={startResizeSide}
              setDroppedImages={setDroppedImages}
              setSelectedId={setSelectedId}
              isHovered={hoveredDisplay === 'video-wall'}
              isDimmed={hoveredDisplay && hoveredDisplay !== 'video-wall'}
              monitorId="videowall"
              onSaveChanges={handleSaveChanges}
              onToggleWindow={handleToggleWindow}
            />
          </div>

          {/* Table Monitors */}
          <div className="space-y-4">
            <div
              onMouseEnter={() => setHoveredDisplay('monitor-a')}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors A"
                maxTiles={4}
                monitorId="monitor-a"
                isHovered={hoveredDisplay === 'monitor-a'}
                isDimmed={hoveredDisplay && hoveredDisplay !== 'monitor-a'}
                onSaveChanges={handleSaveChanges}
              />
            </div>
            <div
              onMouseEnter={() => setHoveredDisplay('monitor-b')}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors B"
                maxTiles={4}
                monitorId="monitor-b"
                isHovered={hoveredDisplay === 'monitor-b'}
                isDimmed={hoveredDisplay && hoveredDisplay !== 'monitor-b'}
                onSaveChanges={handleSaveChanges}
              />
            </div>
            <div
              onMouseEnter={() => setHoveredDisplay('monitor-c')}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors C"
                maxTiles={4}
                monitorId="monitor-c"
                isHovered={hoveredDisplay === 'monitor-c'}
                isDimmed={hoveredDisplay && hoveredDisplay !== 'monitor-c'}
                onSaveChanges={handleSaveChanges}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar />

    </div>
  );
}

export default App;