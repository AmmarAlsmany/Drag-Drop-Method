import { useState, useRef, useEffect } from 'react';

export const useDragAndDrop = () => {
  const [draggedImage, setDraggedImage] = useState(null);
  const [droppedImages, setDroppedImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
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
  const handleDragStart = (e, imageData) => {
    setDraggedImage(imageData);
    e.dataTransfer.effectAllowed = 'move';
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

  const handleDrop = async (e) => {
    e.preventDefault();
    if (!draggedImage) return;
    
    // Check if maximum 4 images limit is reached
    if (droppedImages.length >= 4) {
      alert("Maximum 4 images allowed on the video wall. Please remove an image before adding a new one.");
      setDraggedImage(null);
      return;
    }
    
    const rect = getCanvasRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const nat = await readNaturalSize(draggedImage.src);
    const aspect = nat.w / nat.h;

    let initW = Math.min(160, nat.w);
    let initH = Math.round(initW / aspect);
    if (initH > nat.h) {
      initH = Math.min(100, nat.h);
      initW = Math.round(initH * aspect);
    }

    const center = clampCenter({ x, y }, { w: initW, h: initH });
    const newImage = {
      ...draggedImage,
      id: Date.now(),
      position: center,
      size: { w: initW, h: initH },
      aspect,
      nat,
      name: draggedImage.name,
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
        const clampedCenter = clampCenter(center, img.size);
        return { ...img, position: clampedCenter };
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
    resizingRef.current = {
      id,
      type: 'corner',
      corner, // 'nw'|'ne'|'sw'|'se'
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect,
      nat: img.nat,
    };
    window.addEventListener('pointermove', onResizeMove);
    window.addEventListener('pointerup', endResize);
  };

  const startResizeSide = (e, id, edge) => {
    e.preventDefault(); e.stopPropagation();
    const img = droppedImages.find((d) => d.id === id);
    if (!img) return;
    resizingRef.current = {
      id,
      type: 'side',
      edge, // 'n'|'s'|'e'|'w'
      center: { ...img.position },
      startSize: { ...img.size },
      aspect: img.aspect,
      nat: img.nat,
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
          const halfW = Math.abs(px - center.x);
          let next = keepAspectFromWidth(Math.max(MIN_W, Math.round(halfW * 2)), s.aspect);
          next = clampSizeWithAspect(center, next, s.nat);
          w = next.w; h = next.h;
        } else {
          if (s.edge === 'e' || s.edge === 'w') {
            const halfW = Math.abs(px - center.x);
            let next = keepAspectFromWidth(Math.max(MIN_W, Math.round(halfW * 2)), s.aspect);
            next = clampSizeWithAspect(center, next, s.nat);
            w = next.w; h = next.h;
          } else {
            const halfH = Math.abs(py - center.y);
            let next = keepAspectFromHeight(Math.max(MIN_H, Math.round(halfH * 2)), s.aspect);
            next = clampSizeWithAspect(center, next, s.nat);
            w = next.w; h = next.h;
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
    canvasRef,
    setDroppedImages,
    setSelectedId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    startMove,
    startResizeCorner,
    startResizeSide,
  };
};
