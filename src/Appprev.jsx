import React from 'react';
import LeftSidebar from './components/LeftSidebar';
import VideoWall from './components/VideoWall';
import TableMonitor from './components/TableMonitor';
import DisplayHeader from './components/DisplayHeader';
import RightSidebar from './components/RightSidebar';
import { useDragAndDrop } from './hooks/useDragAndDrop';
import { CornerHandle, SideHandle } from './components/ResizeHandles';
import chartImage from './assets/chart2.png';
import linechartImage from './assets/chart3.png';

function App() {
  const {
    draggedImage,
    droppedImages,
    selectedId,
    canvasRef,
    setDroppedImages,
    setSelectedId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    startMove,
    startResizeCorner,
    startResizeSide,
  } = useDragAndDrop();

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
          <VideoWall 
            canvasRef={canvasRef}
            droppedImages={droppedImages}
            selectedId={selectedId}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onPointerDown={() => setSelectedId(null)}
            startMove={startMove}
            startResizeCorner={startResizeCorner}
            startResizeSide={startResizeSide}
            setDroppedImages={setDroppedImages}
            setSelectedId={setSelectedId}
          />

          {/* Table Monitors */}
          <div className="space-y-4">
            <TableMonitor chartImage={chartImage} />
            <TableMonitor chartImage={linechartImage} />
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}

export default App;