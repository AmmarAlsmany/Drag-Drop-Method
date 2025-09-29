import LeftSidebar from './components/LeftSidebar';
import VideoWall from './components/VideoWall';
import TableMonitor from './components/TableMonitor';
import DisplayHeader from './components/DisplayHeader';
import RightSidebar from './components/RightSidebar';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { useState } from 'react';

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