import React from 'react';
import { WorkflowNodeData } from '../../types/workflow';

interface MiniMapProps {
  nodes: WorkflowNodeData[];
  viewport: { x: number; y: number; zoom: number };
  containerWidth: number;
  containerHeight: number;
  onPanTo: (x: number, y: number) => void;
  onClose: () => void;
}

export const MiniMap: React.FC<MiniMapProps> = ({
  nodes,
  viewport,
  containerWidth,
  containerHeight,
  onPanTo,
  onClose,
}) => {
  const mapWidth = 200;
  const mapHeight = 130;

  if (nodes.length === 0) return null;

  // Compute world bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const n of nodes) {
    if (n.position.x < minX) minX = n.position.x;
    if (n.position.x + 256 > maxX) maxX = n.position.x + 256;
    if (n.position.y < minY) minY = n.position.y;
    if (n.position.y + 100 > maxY) maxY = n.position.y + 100;
  }

  // Add padding
  const pad = 200;
  minX -= pad;
  maxX += pad;
  minY -= pad;
  maxY += pad;

  const worldWidth = Math.max(maxX - minX, 1000);
  const worldHeight = Math.max(maxY - minY, 700);

  const scaleX = mapWidth / worldWidth;
  const scaleY = mapHeight / worldHeight;
  const scale = Math.min(scaleX, scaleY);

  const toMapX = (wx: number) => (wx - minX) * scale;
  const toMapY = (wy: number) => (wy - minY) * scale;

  // Viewport box in world coords
  const viewWorldX = -viewport.x / viewport.zoom;
  const viewWorldY = -viewport.y / viewport.zoom;
  const viewWorldW = containerWidth / viewport.zoom;
  const viewWorldH = containerHeight / viewport.zoom;

  const vpBoxX = toMapX(viewWorldX);
  const vpBoxY = toMapY(viewWorldY);
  const vpBoxW = viewWorldW * scale;
  const vpBoxH = viewWorldH * scale;

  return (
    <div className="absolute bottom-18 sm:bottom-6 right-4 sm:right-6 w-[180px] sm:w-[200px] h-[120px] sm:h-[130px] rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 shadow-2xl p-2 select-none z-20 overflow-hidden">
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 mb-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">Mini Map</span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white text-xs px-1 hover:bg-slate-800 rounded"
        >
          ✕
        </button>
      </div>

      <div
        className="relative w-full h-[95px] bg-slate-900/60 rounded border border-slate-800/50 cursor-pointer overflow-hidden"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          const worldTargetX = minX + clickX / scale;
          const worldTargetY = minY + clickY / scale;
          onPanTo(
            -(worldTargetX - containerWidth / (2 * viewport.zoom)) * viewport.zoom,
            -(worldTargetY - containerHeight / (2 * viewport.zoom)) * viewport.zoom
          );
        }}
      >
        {/* Render node miniatures */}
        {nodes.map((n) => {
          const nx = toMapX(n.position.x);
          const ny = toMapY(n.position.y);
          const nw = 256 * scale;
          const nh = 90 * scale;

          return (
            <div
              key={n.id}
              style={{
                left: `${nx}px`,
                top: `${ny}px`,
                width: `${Math.max(nw, 8)}px`,
                height: `${Math.max(nh, 5)}px`,
              }}
              className="absolute bg-cyan-500/60 rounded-xs border border-cyan-400"
            />
          );
        })}

        {/* Viewport Box */}
        <div
          style={{
            left: `${vpBoxX}px`,
            top: `${vpBoxY}px`,
            width: `${Math.max(vpBoxW, 12)}px`,
            height: `${Math.max(vpBoxH, 10)}px`,
          }}
          className="absolute border border-cyan-400 bg-cyan-400/10 pointer-events-none rounded-xs shadow-sm"
        />
      </div>
    </div>
  );
};
