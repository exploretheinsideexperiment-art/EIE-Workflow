import React from 'react';
import { WorkflowConnection } from '../../types/workflow';
import { getPortColorDef } from '../../utils/portValidation';

interface ConnectionWireProps {
  connection: WorkflowConnection;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
  fromPortType?: string;
  toPortType?: string;
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
  toPortType,
  isSelected,
  isExecuting,
  executionStatus,
  onDelete,
  onSelect,
}) => {
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;

  // Check if target is a bottom-entering port (n8n subnode ports: Chat Model, Memory, Tool)
  const isBottomTarget =
    ['in_model', 'in_memory', 'in_tools'].includes(connection.toPortId) ||
    connection.toPortId.startsWith('in_tools');

  let cp1x: number;
  let cp1y: number;
  let cp2x: number;
  let cp2y: number;

  if (isBottomTarget) {
    // Smooth curve from source node entering vertically UP into the bottom diamond port
    const vertDist = Math.max(Math.abs(dy) * 0.45, 45);
    const horizDist = Math.max(Math.abs(dx) * 0.35, 30);
    cp1x = startPos.x + horizDist;
    cp1y = startPos.y;
    cp2x = endPos.x;
    cp2y = endPos.y + vertDist;
  } else {
    // Standard horizontal bezier curvature
    const curvature = Math.max(Math.abs(dx) * 0.5, 50);
    cp1x = startPos.x + curvature;
    cp1y = startPos.y;
    cp2x = endPos.x - curvature;
    cp2y = endPos.y;
  }

  const pathData = `M ${startPos.x} ${startPos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPos.x} ${endPos.y}`;
  const midX = (startPos.x + endPos.x) / 2;
  const midY = (startPos.y + endPos.y) / 2;

  // Wire color matches the port point color 100%:
  // If either side is specialized (model, memory, tool, true, false, branch, outputParser), use that type!
  const effectiveType =
    fromPortType && fromPortType !== 'main'
      ? fromPortType
      : toPortType && toPortType !== 'main'
      ? toPortType
      : fromPortType || toPortType || 'main';

  const colorDef = getPortColorDef(effectiveType);
  const strokeColor = colorDef.hex;
  let strokeGlow = isSelected ? colorDef.glow : `drop-shadow(0 0 4px ${colorDef.hex}60)`;

  // Keep authentic port color at all times; enhance with brightness during execution
  if (executionStatus === 'running' || isExecuting) {
    strokeGlow = `drop-shadow(0 0 10px ${colorDef.hex})`;
  } else if (executionStatus === 'success') {
    strokeGlow = `drop-shadow(0 0 7px ${colorDef.hex}b3)`;
  } else if (executionStatus === 'failed') {
    strokeGlow = 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))';
  }

  return (
    <g
      className="group cursor-pointer select-none pointer-events-auto"
      style={{ pointerEvents: 'all' }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(connection.id);
      }}
    >
      {/* Invisible wider hit area for easy hover/clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0, 0, 0, 0.001)"
        strokeWidth="32"
        strokeLinecap="round"
        style={{ pointerEvents: 'stroke' }}
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

      {/* Ambient glow matching exact port point color */}
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={isSelected ? 6 : 4}
        strokeLinecap="round"
        opacity={isSelected ? 0.45 : 0.22}
      />

      {/* Main wire path in authentic port color */}
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
        <g transform={`translate(${midX}, ${midY - 16})`}>
          <rect
            x="-32"
            y="-10"
            width="64"
            height="20"
            rx="10"
            fill="#090d16"
            stroke={colorDef.hex}
            strokeWidth="1.5"
            filter={`drop-shadow(0 0 6px ${colorDef.hex}80)`}
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

      {/* Flowing animated pulse particle during execution in exact port point color */}
      {(isExecuting || executionStatus === 'running' || executionStatus === 'success') && (
        <circle r="4" fill={strokeColor} filter={`drop-shadow(0 0 6px ${strokeColor})`}>
          <animateMotion path={pathData} dur="1.2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hover and Selected delete handle */}
      <g
        className={`${
          isSelected ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'
        } transition-all duration-150 cursor-pointer`}
        transform={`translate(${midX}, ${midY})`}
        style={{ pointerEvents: 'all' }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete?.(connection.id);
        }}
      >
        <title>Delete Wire</title>
        {/* Invisible wider hit circle */}
        <circle r="20" fill="rgba(0, 0, 0, 0.001)" />
        {/* High contrast visual delete badge */}
        <circle
          r="14"
          fill="#1c0a0e"
          stroke="#ef4444"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 8px rgba(239, 68, 68, 0.9))"
        />
        <line x1="-5" y1="-5" x2="5" y2="5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="5" y1="-5" x2="-5" y2="5" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
      </g>
    </g>
  );
};
