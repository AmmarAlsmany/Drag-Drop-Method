import React from 'react';

export const CornerHandle = ({ pos, onPointerDown }) => {
  const base = 'absolute w-3 h-3 bg-white border border-gray-500 rounded-sm opacity-0 group-hover:opacity-100';
  const map = {
    nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
    sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  };
  return <div role="button" onPointerDown={onPointerDown} className={`${base} ${map[pos]}`} />;
};

export const SideHandle = ({ pos, onPointerDown }) => {
  const base = 'absolute w-2 h-2 bg-white border border-gray-500 rounded-sm opacity-0 group-hover:opacity-100';
  const map = {
    n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-n-resize',
    s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-s-resize',
    e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-e-resize',
    w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-w-resize',
  };
  return <div role="button" onPointerDown={onPointerDown} className={`${base} ${map[pos]}`} />;
};
