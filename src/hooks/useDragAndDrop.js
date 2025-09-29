import { useState, useRef, useEffect } from 'react';

export const useDragAndDrop = () => {
  const [draggedImage, setDraggedImage] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [quadMode, setQuadMode] = useState(true);
  const canvasRef = useRef(null);

  // session refs to avoid stale closures
  const movingRef = useRef(null);   // { id, grabOffset:{dx,dy} }
  const resizingRef = useRef(null); // { id, type:'corner'|'side', edge|corner, center, startSize:{w,h}, aspect, nat:{w,h} }

  /** ===== Utils ===== **/
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();
  const MIN_W = 40, MIN_H = 30;

  const clampCenter = (center, size) => {
    const rect = getCanvasRect();
    if (!rect) return center;
    const halfW = size.w / 2, halfH = size.h / 2;
    const minX = halfW, maxX = rect.width - halfW;
    const minY = halfH, maxY = rect.height - halfH;
    return {
      x: Math.min(Math.max(center.x, minX), Math.max(minX, maxX)),
      y: Math.min(Math.max(center.y, minY), Math.max(minY, maxY)),
    };
  };

  // Collision detection helper
  const checkCollision = (rect1, rect2) => {
    return !(rect1.right < rect2.left ||
             rect1.left > rect2.right ||
             rect1.bottom < rect2.top ||
             rect1.top > rect2.bottom);
  };

  // Get image bounds
  const getImageBounds = (img) => {
    const halfW = img.size.w / 2;
    const halfH = img.size.h / 2;
    return {
      left: img.position.x - halfW,
      right: img.position.x + halfW,
      top: img.position.y - halfH,
      bottom: img.position.y + halfH,
    };
  };

  // Find non-overlapping position
  const findNonOverlappingPosition = (center, size, existingImages, excludeId = null) => {
    const rect = getCanvasRect();
    if (!rect) return center;

    const halfW = size.w / 2;
    const halfH = size.h / 2;

    // Test the original position first
    let testPosition = clampCenter(center, size);
    let testBounds = {
      left: testPosition.x - halfW,
      right: testPosition.x + halfW,
      top: testPosition.y - halfH,
      bottom: testPosition.y + halfH,
    };

    // Check if original position has no collisions
    let hasCollision = false;
    for (const img of existingImages) {
      if (excludeId && img.id === excludeId) continue;
      const imgBounds = getImageBounds(img);
      if (checkCollision(testBounds, imgBounds)) {
        hasCollision = true;
        break;
      }
    }

    if (!hasCollision) {
      return testPosition;
    }

    // Try to find a better position using grid search
    const gridSize = 20; // Search in 20px increments
    const maxAttempts = 100;
    let attempts = 0;

    // Start from a slight offset from original position
    for (let offsetY = 0; offsetY < rect.height && attempts < maxAttempts; offsetY += gridSize) {
      for (let offsetX = 0; offsetX < rect.width && attempts < maxAttempts; offsetX += gridSize) {
        attempts++;

        // Try multiple positions around the original drop point
        const positions = [
          { x: center.x + offsetX, y: center.y + offsetY },
          { x: center.x - offsetX, y: center.y + offsetY },
          { x: center.x + offsetX, y: center.y - offsetY },
          { x: center.x - offsetX, y: center.y - offsetY },
        ];

        for (const pos of positions) {
          testPosition = clampCenter(pos, size);
          testBounds = {
            left: testPosition.x - halfW,
            right: testPosition.x + halfW,
            top: testPosition.y - halfH,
            bottom: testPosition.y + halfH,
          };

          // Check if this position has no collisions
          hasCollision = false;
          for (const img of existingImages) {
            if (excludeId && img.id === excludeId) continue;
            const imgBounds = getImageBounds(img);
            if (checkCollision(testBounds, imgBounds)) {
              hasCollision = true;
              break;
            }
          }

          if (!hasCollision) {
            return testPosition;
          }
        }
      }
    }

    // If no collision-free position found, return original clamped position
    return clampCenter(center, size);
  };

  // Quad mode helpers
  const getQuadPosition = (quadIndex) => {
    // Returns center position and size for each quad
    const positions = [
      { x: 25, y: 25, w: 50, h: 50 }, // Top-left
      { x: 75, y: 25, w: 50, h: 50 }, // Top-right
      { x: 25, y: 75, w: 50, h: 50 }, // Bottom-left
      { x: 75, y: 75, w: 50, h: 50 }, // Bottom-right
    ];
    return positions[quadIndex] || positions[0];
  };

  const findNextAvailableQuad = () => {
    // Find which quad positions are occupied
    const occupiedQuads = new Set();

    droppedImages.forEach(img => {
      // Check which quad this image is closest to
      const rect = getCanvasRect();
      if (!rect) return;

      // Convert image position to percentage
      const imgPercent = {
        x: (img.position.x / rect.width) * 100,
        y: (img.position.y / rect.height) * 100
      };

      const quads = [
        { x: 25, y: 25 }, // Top-left
        { x: 75, y: 25 }, // Top-right
        { x: 25, y: 75 }, // Bottom-left
        { x: 75, y: 75 }, // Bottom-right
      ];

      let closestQuad = 0;
      let minDistance = Infinity;

      quads.forEach((quad, index) => {
        const distance = Math.sqrt(
          Math.pow(imgPercent.x - quad.x, 2) +
          Math.pow(imgPercent.y - quad.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestQuad = index;
        }
      });

      occupiedQuads.add(closestQuad);
    });

    // Find first available quad
    for (let i = 0; i < 4; i++) {
      if (!occupiedQuads.has(i)) {
        return i;
      }
    }

    // If all quads occupied, return 0 (will stack)
    return 0;
  };

  const snapToQuadGrid = (center) => {
    if (!quadMode) return center;

    // Find closest quad center
    const quads = [
      { x: 25, y: 25 },
      { x: 75, y: 25 },
      { x: 25, y: 75 },
      { x: 75, y: 75 },
    ];

    let closestQuad = quads[0];
    let minDistance = Infinity;

    const rect = getCanvasRect();
    if (!rect) return center;

    // Convert center to percentage
    const centerPercent = {
      x: (center.x / rect.width) * 100,
      y: (center.y / rect.height) * 100
    };

    quads.forEach(quad => {
      const distance = Math.sqrt(
        Math.pow(centerPercent.x - quad.x, 2) +
        Math.pow(centerPercent.y - quad.y, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestQuad = quad;
      }
    });

    // Convert back to pixels
    return {
      x: (closestQuad.x / 100) * rect.width,
      y: (closestQuad.y / 100) * rect.height
    };
  };

  const clampSizeWithAspect = (center, size, nat) => {
    let w = Math.min(size.w, nat.w);
    let h = Math.min(size.h, nat.h);
    w = Math.max(w, MIN_W);
    h = Math.max(h, MIN_H);
    const rect = getCanvasRect();
    if (rect) {
      const maxW = 2 * Math.min(center.x, rect.width - center.x);
      const maxH = 2 * Math.min(center.y, rect.height - center.y);
      w = Math.min(w, Math.floor(maxW));
      h = Math.min(h, Math.floor(maxH));
    }
    return { w, h };
  };

  const keepAspectFromWidth = (w, aspect) => ({ w, h: Math.round(w / aspect) });
  const keepAspectFromHeight = (h, aspect) => ({ w: Math.round(h * aspect), h });

  /** ===== Drag from sources ===== **/
  // const handleDragStart = (e, imageData) => {
  //   setDraggedImage(imageData);
  //   e.dataTransfer.effectAllowed = 'move';
  // };
  // Standard drag start for all devices
  const handleDragStart = (e, imageData) => {
    setDraggedImage(imageData);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/x-drag-image', JSON.stringify(imageData));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const readNaturalSize = (src) =>
    new Promise((resolve) => {
      const im = new Image();
      im.onload = () => resolve({ w: im.naturalWidth || 1, h: im.naturalHeight || 1 });
      im.onerror = () => resolve({ w: 640, h: 360 }); // fallback
      im.src = src;
    });

  // const handleDrop = async (e) => {
  //   e.preventDefault();
  //   if (!draggedImage) return;
    
  //   // Check if maximum 4 images limit is reached
  //   if (droppedImages.length >= 4) {
  //     alert("Maximum 4 images allowed on the video wall. Please remove an image before adding a new one.");
  //     setDraggedImage(null);
  //     return;
  //   }
    
  //   const rect = getCanvasRect();
  //   if (!rect) return;

  //   const x = e.clientX - rect.left;
  //   const y = e.clientY - rect.top;

  //   const nat = await readNaturalSize(draggedImage.src);
  //   const aspect = nat.w / nat.h;

  //   let initW = Math.min(160, nat.w);
  //   let initH = Math.round(initW / aspect);
  //   if (initH > nat.h) {
  //     initH = Math.min(100, nat.h);
  //     initW = Math.round(initH * aspect);
  //   }

  //   const center = clampCenter({ x, y }, { w: initW, h: initH });
  //   const newImage = {
  //     ...draggedImage,
  //     id: Date.now(),
  //     position: center,
  //     size: { w: initW, h: initH },
  //     aspect,
  //     nat,
  //     name: draggedImage.name,
  //   };

  //   setDroppedImages((prev) => [...prev, newImage]);
  //   setDraggedImage(null);
  //   setSelectedId(newImage.id);
  // };
  const handleDrop = async (e) => {
    e.preventDefault();
  
    // NEW: try to read payload from dataTransfer (works across components)
    let payload = draggedImage;
    if (!payload) {
      try {
        const raw = e.dataTransfer.getData('application/x-drag-image');
        if (raw) payload = JSON.parse(raw);
      } catch (error) {
        console.error('Error parsing drag data:', error);
      }
    }
    if (!payload) return;
  
    // OPTIONAL: per-canvas limit (leave your alert text as-is or customize)
    if (droppedImages.length >= 4) {
      alert("Maximum 4 images allowed on the video wall. Please remove an image before adding a new one.");
      setDraggedImage(null);
      return;
    }
  
    const rect = getCanvasRect();
    if (!rect) return;
  
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nat = await readNaturalSize(payload.src);
    const aspect = nat.w / nat.h;

    let initW, initH, center;

    // Always size to 1/4 of the display area
    initW = rect.width / 2;
    initH = rect.height / 2;

    if (quadMode) {
      // Quad mode: auto-position in next available quad
      console.log('🔄 Quad mode active - positioning source');
      const quadIndex = findNextAvailableQuad();
      const quadPos = getQuadPosition(quadIndex);
      console.log(`📍 Using quad ${quadIndex + 1}:`, quadPos);

      center = {
        x: (quadPos.x / 100) * rect.width,
        y: (quadPos.y / 100) * rect.height
      };
      console.log(`🎯 Final position: ${center.x}x${center.y}, size: ${initW}x${initH}`);
    } else {
      // Free mode: find non-overlapping position at drop location
      center = findNonOverlappingPosition({ x, y }, { w: initW, h: initH }, droppedImages);
    }
    const newImage = {
      ...payload,
      id: Date.now(),
      position: center,
      size: { w: initW, h: initH },
      aspect,
      nat,
      name: payload.name,
    };
  
    setDroppedImages((prev) => [...prev, newImage]);
    setDraggedImage(null);
    setSelectedId(newImage.id);
  };

  


  
  /** ===== Move ===== **/
  const startMove = (e, id) => {
    e.stopPropagation();
    const rect = getCanvasRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    movingRef.current = { id, grabOffset: { dx: px - img.position.x, dy: py - img.position.y } };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', endMove);
  };

  const onMove = (e) => {
    const moving = movingRef.current;
    if (!moving) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    setDroppedImages((prev) =>
      prev.map((img) => {
        if (img.id !== moving.id) return img;
        const center = { x: px - moving.grabOffset.dx, y: py - moving.grabOffset.dy };

        // Apply quad snapping if in quad mode
        let finalCenter = center;
        if (quadMode) {
          finalCenter = snapToQuadGrid(center);
        } else {
          // Find non-overlapping position for the moving image
          finalCenter = findNonOverlappingPosition(center, img.size, prev, moving.id);
        }

        return { ...img, position: finalCenter };
      })
    );
  };

  const endMove = () => {
    movingRef.current = null;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', endMove);
  };

  /** ===== Resize (corners + sides, aspect always kept) ===== **/
  const startResizeCorner = (e, id, corner) => {
    e.preventDefault(); e.stopPropagation();
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    const rect = getCanvasRect();
    if (!rect) return;

    resizingRef.current = {
      id,
      type: 'corner',
      corner, // 'nw'|'ne'|'sw'|'se'
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect,
      nat: img.nat,
      startMouseX: e.clientX - rect.left,
      startMouseY: e.clientY - rect.top,
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', endResize);
  };

  const startResizeSide = (e, id, edge) => {
    e.preventDefault(); e.stopPropagation();
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    const rect = getCanvasRect();
    if (!rect) return;

    resizingRef.current = {
      id,
      type: 'side',
      edge, // 'n'|'s'|'e'|'w'
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect,
      nat: img.nat,
      startMouseX: e.clientX - rect.left,
      startMouseY: e.clientY - rect.top,
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', endResize);
  };

  const onResizeMove = (e) => {
    const s = resizingRef.current;
    if (!s) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    setDroppedImages((prev) =>
      prev.map((img) => {
        if (img.id !== s.id) return img;

        let center = { ...s.center };
        let w = img.size.w;
        let h = img.size.h;

        if (s.type === 'corner') {
          // Calculate mouse movement delta
          const deltaX = px - s.startMouseX;
          const deltaY = py - s.startMouseY;

          // Apply delta based on corner
          let newW = s.startSize.w;
          let newH = s.startSize.h;

          if (s.corner === 'se') {
            newW = Math.max(MIN_W, s.startSize.w + deltaX);
            newH = Math.max(MIN_H, s.startSize.h + deltaY);
          } else if (s.corner === 'sw') {
            newW = Math.max(MIN_W, s.startSize.w - deltaX);
            newH = Math.max(MIN_H, s.startSize.h + deltaY);
          } else if (s.corner === 'ne') {
            newW = Math.max(MIN_W, s.startSize.w + deltaX);
            newH = Math.max(MIN_H, s.startSize.h - deltaY);
          } else if (s.corner === 'nw') {
            newW = Math.max(MIN_W, s.startSize.w - deltaX);
            newH = Math.max(MIN_H, s.startSize.h - deltaY);
          }

          // Keep within canvas bounds
          const rect = getCanvasRect();
          if (rect) {
            const maxW = 2 * Math.min(s.center.x, rect.width - s.center.x);
            const maxH = 2 * Math.min(s.center.y, rect.height - s.center.y);
            newW = Math.min(newW, maxW);
            newH = Math.min(newH, maxH);
          }

          w = newW;
          h = newH;
        } else {
          // Edge resize using delta movement
          const deltaX = px - s.startMouseX;
          const deltaY = py - s.startMouseY;

          if (s.edge === 'e') {
            // East edge: increase width
            w = Math.max(MIN_W, s.startSize.w + deltaX);
            h = s.startSize.h;
          } else if (s.edge === 'w') {
            // West edge: increase width in opposite direction
            w = Math.max(MIN_W, s.startSize.w - deltaX);
            h = s.startSize.h;
          } else if (s.edge === 's') {
            // South edge: increase height
            w = s.startSize.w;
            h = Math.max(MIN_H, s.startSize.h + deltaY);
          } else if (s.edge === 'n') {
            // North edge: increase height in opposite direction
            w = s.startSize.w;
            h = Math.max(MIN_H, s.startSize.h - deltaY);
          }

          // Keep within canvas bounds
          const rect = getCanvasRect();
          if (rect) {
            const maxW = 2 * Math.min(center.x, rect.width - center.x);
            const maxH = 2 * Math.min(center.y, rect.height - center.y);
            w = Math.min(w, maxW);
            h = Math.min(h, maxH);
          }
        }

        return { ...img, position: center, size: { w, h } };
      })
    );
  };

  const endResize = () => {
    resizingRef.current = null;
    window.removeEventListener('pointermove', onResizeMove);
    window.removeEventListener('pointerup', endResize);
  };

  /** ===== Selection + Delete (keyboard) ===== **/
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setDroppedImages((prev) => prev.filter((img) => img.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedId]);

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', endMove);
      window.removeEventListener('pointermove', onResizeMove);
      window.removeEventListener('pointerup', endResize);
    };
  }, []);

  return {
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
  };
};
