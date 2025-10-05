import React from 'react';

// Touch-friendly resize handles for iPad
// Smaller but still touch-friendly (32x32px corners, reduced edges)
export const CornerHandle = ({ pos, onPointerDown }) => {
  // Smaller corner handles (32x32px) - still touch-friendly
  const base = 'absolute w-8 h-8 bg-blue-500/70 border-2 border-white rounded-full shadow-md touch-none transition-transform hover:scale-125 active:scale-90';
  const map = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  };
  return (
    <div
      role="button"
      aria-label={`Resize ${pos}`}
      onPointerDown={onPointerDown}
      className={`${base} ${map[pos]}`}
    />
  );
};

export const SideHandle = ({ pos, onPointerDown }) => {
  // Smaller edge handles (64x32px or 32x64px)
  const base = 'absolute bg-blue-500/70 border-2 border-white rounded-full shadow-md touch-none transition-transform hover:scale-125 active:scale-90';
  const map = {
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize w-16 h-8',
    s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize w-16 h-8',
    e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize w-8 h-16',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize w-8 h-16',
  };
  return (
    <div
      role="button"
      aria-label={`Resize ${pos}`}
      onPointerDown={onPointerDown}
      className={`${base} ${map[pos]}`}
    />
  );
};
