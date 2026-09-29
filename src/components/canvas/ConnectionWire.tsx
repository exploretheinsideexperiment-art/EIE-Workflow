import React from 'react';
import { WorkflowConnection } from '../../types/workflow';
import { getPortColorDef } from '../../utils/portValidation';

interface ConnectionWireProps {
  connection: WorkflowConnection;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  fromPortType?: string;
  isSelected?: boolean;
  isExecuting?: boolean;
  executionStatus?: 'waiting' | 'running' | 'success' | 'failed' | 'skipped';
  onDelete?: (connectionId: string) => void;
  onSelect?: (connectionId: string) => void;
}

export const ConnectionWire: React.FC<ConnectionWireProps> = ({
  connection,
  startPos,
  endPos,
  fromPortType,
  isSelected,
  isExecuting,
  executionStatus,
  onDelete,
  onSelect,
}) => {
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;

  // Adaptive control points for smooth bezier curvature
  const curvature = Math.max(Math.abs(dx) * 0.5, 50);
  const cp1x = startPos.x + curvature;
  const cp1y = startPos.y;
  const cp2x = endPos.x - curvature;
  const cp2y = endPos.y;

  const pathData = `M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`;
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;

  // Determine stroke color by port type & execution status
  const colorDef = getPortColorDef(fromPortType);
  let strokeColor = colorDef.hex;
  let strokeGlow = isSelected ? colorDef.glow : 'none';

  if (executionStatus === 'running' || isExecuting) {
    strokeColor = '#06b6d4'; // cyan
    strokeGlow = 'drop-shadow(0 0 8px rgba(6, 182, 212, 0.8))';
  } else if (executionStatus === 'success') {
    strokeColor = '#10b981';
    strokeGlow = 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))';
  } else if (executionStatus === 'failed') {
    strokeColor = '#ef4444';
  }

  return (
    <g
      className="group cursor-pointer select-none"
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(connection.id);
      }}
    >
      {/* Invisible wider hit area for easy hover/clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth="20"
        strokeLinecap="round"
      />

      {/* Background shadow path */}
      <path
        d={pathData}
        fill="none"
        stroke="#030712"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Main wire path */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 3.5 : 2.5}
        strokeLinecap="round"
        style={{ filter: strokeGlow }}
        className="transition-colors duration-300"
      />

      {/* Port type indicator pill along wire when hovered or selected */}
      {isSelected && (
        <g transform={`translate(${midX}, ${midY - 14})`}>
          <rect
            x="-28"
            y="-10"
            width="56"
            height="20"
            rx="10"
            fill="#0f172a"
            stroke={colorDef.hex}
            strokeWidth="1.5"
          />
          <text
            x="0"
            y="3"
            textAnchor="middle"
            fill={colorDef.hex}
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {colorDef.shortLabel}
          </text>
        </g>
      )}

      {/* Flowing animated pulse particle during execution */}
      {(isExecuting || executionStatus === 'running' || executionStatus === 'success') && (
        <circle r="4" fill={strokeColor} filter="url(#particle-glow)">
          <animateMotion path={pathData} dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hover delete handle */}
      <g
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        transform={`translate(${midX}, ${midY})`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(connection.id);
        }}
      >
        <circle r="12" fill="#0f172a" stroke="#ef4444" strokeWidth="1.5" />
        <line x1="-4" y1="-4" x2="4" y2="4" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="-4" x2="-4" y2="4" stroke="#f87171" strokeWidth="2" strokeLinecap="round" />
      </g>
    </g>
  );
};
