import LeftSidebar from "./components/LeftSidebar";
import VideoWall from "./components/VideoWall";
import TableMonitor from "./components/TableMonitor";
import DisplayHeader from "./components/DisplayHeader";
import RightSidebar from "./components/RightSidebar";
import { useDragAndDrop } from "./hooks/useDragAndDrop";
import { useState, useEffect } from "react";
import bucontrolWS from "./services/bucontrolWebSocket";

// Use the same host as the dashboard, but with port 5000
// This allows access from network devices (e.g., http://192.168.100.65:5173 → http://192.168.100.65:5000)
const API_BASE = `http://${window.location.hostname}:5000`;

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
    applyPresetLayout,
  } = useDragAndDrop();

  const [hoveredDisplay, setHoveredDisplay] = useState(null);

  // Handle reverse drag - remove window when dragged to sidebar
  const handleRemoveWindow = (windowId) => {
    setDroppedImages((prev) => prev.filter((img) => img.id !== parseInt(windowId)));
    if (selectedId === parseInt(windowId)) {
      setSelectedId(null);
    }
  };

  // Initialize BUControl WebSocket connection
  useEffect(() => {
    bucontrolWS
      .connect()
      .then(() => {
        console.log("✅ Connected to BUControl WebSocket");
      })
      .catch((err) => {
      });

    return () => {
      bucontrolWS.disconnect();
    };
  }, []);

  // Save changes to Q-SYS Aurora DIDO via BUControl WebSocket
  const handleSaveChanges = async (droppedImages, outputNumber) => {
    try {
      console.log(`Saving changes to Output ${outputNumber}:`, droppedImages);

      if (!droppedImages || droppedImages.length === 0) {
        console.log("⚠️ No images to save");
        return;
      }

      // Convert droppedImages to Q-SYS sources format with custom coordinates
      const sources = droppedImages.map((img, index) => {
        const canvas = document.querySelector("[data-canvas]") || {
          offsetWidth: 1920,
          offsetHeight: 1080,
        };
        const canvasWidth = canvas.offsetWidth || 1920;
        const canvasHeight = canvas.offsetHeight || 1080;

        // Convert center position to top-left position
        const topLeftX = img.position.x - img.size.w / 2;
        const topLeftY = img.position.y - img.size.h / 2;

        // Calculate percentages (0-100 range as per Aurora DIDO spec)
        const xPercent = Math.round((topLeftX / canvasWidth) * 100);
        const yPercent = Math.round((topLeftY / canvasHeight) * 100);
        const wPercent = Math.round((img.size.w / canvasWidth) * 100);
        const hPercent = Math.round((img.size.h / canvasHeight) * 100);

        // Clamp values to 0-100 range
        const xClamped = Math.max(0, Math.min(100, xPercent));
        const yClamped = Math.max(0, Math.min(100, yPercent));
        const wClamped = Math.max(0, Math.min(100, wPercent));
        const hClamped = Math.max(0, Math.min(100, hPercent));

        // Subtract 1 from each coordinate before sending to Q-SYS (ensure minimum 0)
        const xFinal = Math.max(0, xClamped - 1);
        const yFinal = Math.max(0, yClamped - 1);
        const wFinal = Math.max(0, wClamped - 1);
        const hFinal = Math.max(0, hClamped - 1);

        const inputNumber =
          img.inputNumber || img.input || img.device?.inputNumber || index + 1;

        console.log(
          `📦 Source ${index + 1}: Input ${inputNumber}`,
          `\n   Canvas: ${canvasWidth}x${canvasHeight}`,
          `\n   Position (center): x=${img.position.x}, y=${img.position.y}`,
          `\n   Position (top-left): x=${topLeftX}, y=${topLeftY}`,
          `\n   Size: w=${img.size.w}, h=${img.size.h}`,
          `\n   Before adjustment: x=${xClamped}%, y=${yClamped}%, w=${wClamped}%, h=${hClamped}%`,
          `\n   Sent to Q-SYS: x=${xFinal}%, y=${yFinal}%, w=${wFinal}%, h=${hFinal}%`
        );

        return {
          input: inputNumber,
          coordinates: {
            x: xFinal,
            y: yFinal,
            w: wFinal,
            h: hFinal,
          },
        };
      });

      console.log("📤 Sending to BUControl WebSocket:", {
        output: outputNumber,
        sources,
      });

      // Use route-with-coordinates endpoint
      const response = await fetch(
        `${API_BASE}/api/dido/route-with-coordinates`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            output: outputNumber,
            sources: sources,
          }),
        }
      );

      const result = await response.json();
      if (result.status === "success") {
        console.log("✅ Changes saved successfully");
      } else {
        throw new Error(result.message);
      }
      console.log("✅ Changes saved successfully via BUControl");
    } catch (error) {
      console.error("Failed to save changes:", error);
      throw error;
    }
  };

  // Toggle window enable/disable
  const handleToggleWindow = async (outputNumber, enable) => {
    try {
      console.log(
        `${enable ? "Enabling" : "Disabling"} Output ${outputNumber}`
      );

      const response = await fetch(`${API_BASE}/api/dido/toggle-window`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          output: outputNumber,
          enable: enable,
        }),
      });

      const result = await response.json();
      if (result.status === "success") {
        console.log(
          `✅ Output ${outputNumber} ${enable ? "enabled" : "disabled"}`
        );
      } else {
        console.error("❌ Failed to toggle window:", result.message);
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Failed to toggle window:", error);
      throw error;
    }
  };

  return (
    <div className="h-screen py-1 pl-1 bg-[#E4E4E4] flex">
      {/* Left Sidebar */}
      <LeftSidebar onDragStart={handleDragStart} onRemoveWindow={handleRemoveWindow} />

      {/* Right column: Displays */}
      <div
        className="w-[78%] h-full p-4 flex flex-col rounded-xl overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#888 transparent" }}
      >
        <DisplayHeader />

        <div className="flex-1 rounded-lg flex flex-col">
          {/* Video Wall */}
          <div
            onMouseEnter={() => setHoveredDisplay("video-wall")}
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
              isHovered={hoveredDisplay === "video-wall"}
              isDimmed={hoveredDisplay && hoveredDisplay !== "video-wall"}
              monitorId="videowall"
              onSaveChanges={handleSaveChanges}
              onToggleWindow={handleToggleWindow}
              applyPresetLayout={applyPresetLayout}
            />
          </div>

          {/* Table Monitors */}
          <div className="space-y-4">
            <div
              onMouseEnter={() => setHoveredDisplay("monitor-a")}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors A"
                maxTiles={4}
                monitorId="monitor-a"
                isHovered={hoveredDisplay === "monitor-a"}
                isDimmed={hoveredDisplay && hoveredDisplay !== "monitor-a"}
                onSaveChanges={handleSaveChanges}
              />
            </div>
            <div
              onMouseEnter={() => setHoveredDisplay("monitor-b")}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors B"
                maxTiles={4}
                monitorId="monitor-b"
                isHovered={hoveredDisplay === "monitor-b"}
                isDimmed={hoveredDisplay && hoveredDisplay !== "monitor-b"}
                onSaveChanges={handleSaveChanges}
              />
            </div>
            <div
              onMouseEnter={() => setHoveredDisplay("monitor-c")}
              onMouseLeave={() => setHoveredDisplay(null)}
            >
              <TableMonitor
                title="Table Monitors C"
                maxTiles={4}
                monitorId="monitor-c"
                isHovered={hoveredDisplay === "monitor-c"}
                isDimmed={hoveredDisplay && hoveredDisplay !== "monitor-c"}
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
