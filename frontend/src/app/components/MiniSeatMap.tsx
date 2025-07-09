'use client';

import React, { useRef, useState, useEffect } from 'react';
import SeatSelection from './SeatSelection';

interface MiniSeatMapProps {
  venueId: string;
  onSectionSelect: (sectionId: string) => void;
}

const MiniSeatMap: React.FC<MiniSeatMapProps> = ({ venueId, onSectionSelect }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const isDragging = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !dragStart.current) return;

    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;

    setOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    dragStart.current = null;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const handleMouseLeave = () => {
    if (isDragging.current) handleMouseUp();
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleZoomIn = () => {
    const newZoom = Math.min(zoom + 0.5, 2.5);
    setZoom(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoom - 0.5, 1);
    setZoom(newZoom);
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      className="relative h-[180px] overflow-hidden rounded border bg-gray-100"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'grab' }}
    >
      {/* 확대/축소/초기화 버튼 */}
      <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white bg-opacity-90 p-1 rounded shadow">
        <button
          className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={handleZoomIn}
        >
          +
        </button>
        <button
          className="text-sm px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
          onClick={handleZoomOut}
        >
          −
        </button>
        <button
          className="text-sm px-2 py-1 bg-blue-200 rounded hover:bg-blue-300"
          onClick={handleReset}
        >
          ↺
        </button>
      </div>

      {/* 드래그 가능한 미니맵 */}
      <div
        ref={wrapperRef}
        id="minimap-wrapper"
        className="transition-transform origin-center cursor-move"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging.current ? 'none' : 'transform 0.1s ease-out',
        }}
        data-zoom={zoom}
      >
        <SeatSelection
          venueId={venueId}
          miniMapMode={true}
          onSectionSelect={onSectionSelect}
        />
      </div>
    </div>
  );
};

export default MiniSeatMap;
