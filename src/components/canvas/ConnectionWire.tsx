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
  isActivelyTransferring?: boolean;
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
  isActivelyTransferring = false,
  executionStatus,
  onDelete,
  onSelect,
}) => {
  const [isLongPressing, setIsLongPressing] = React.useState(false);
  const pressTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleWirePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setIsLongPressing(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let didHold = false;

    // Holding for ~250ms activates delete option mode
    pressTimerRef.current = setTimeout(() => {
      didHold = true;
      setIsLongPressing(false);
      onSelect?.(connection.id);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(40); } catch {}
      }
    }, 240);

    const onMove = (moveEv: MouseEvent | TouchEvent) => {
      const curX = 'touches' in moveEv ? moveEv.touches[0].clientX : moveEv.clientX;
      const curY = 'touches' in moveEv ? moveEv.touches[0].clientY : moveEv.clientY;
      if (Math.hypot(curX - clientX, curY - clientY) > 8) {
        if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
        setIsLongPressing(false);
        cleanup();
      }
    };

    const onUp = () => {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
      setIsLongPressing(false);
      cleanup();
      // If clicked without holding, immediately select the wire to activate delete option
      onSelect?.(connection.id);
    };

    const cleanup = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };
  const dx = endPos.x - startPos.x;
  const dy = endPos.y - startPos.y;

  // Check if target is a bottom-entering port (subnode ports: Chat Model, Memory, Tool)
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
  if (isActivelyTransferring) {
    strokeGlow = `drop-shadow(0 0 12px ${colorDef.hex})`;
  } else if (executionStatus === 'running') {
    strokeGlow = `drop-shadow(0 0 8px ${colorDef.hex})`;
  } else if (executionStatus === 'success') {
    strokeGlow = `drop-shadow(0 0 5px ${colorDef.hex}80)`;
  } else if (executionStatus === 'failed') {
    strokeGlow = 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))';
  }

  return (
    <g
      className="group cursor-pointer select-none"
      style={{ pointerEvents: 'all' }}
      onMouseDown={handleWirePointerDown}
      onTouchStart={handleWirePointerDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(connection.id);
      }}
    >
      {/* Invisible wider hit area for easy hover/clicking (46px width) */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0, 0, 0, 0.001)"
        strokeWidth="46"
        strokeLinecap="round"
        style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
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
        <g transform={`translate(${midX}, ${midY - 18})`}>
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

      {/* Flowing animated pulse packet ONLY when data is actively transferring between nodes */}
      {isActivelyTransferring && (
        <circle r="4.5" fill={strokeColor} filter={`drop-shadow(0 0 8px ${strokeColor})`}>
          <animateMotion path={pathData} dur="0.9s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Hover, Click, and Long-press Delete Handle */}
      <g
        className={`${
          isSelected ? 'opacity-100 scale-105' : 'opacity-0 group-hover:opacity-100'
        } transition-all duration-150 cursor-pointer`}
        transform={`translate(${midX}, ${midY})`}
        style={{ pointerEvents: 'all' }}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onDelete?.(connection.id);
        }}
      >
        <title>Delete Wire (Click or press Delete / Backspace)</title>
        {/* Invisible wider hit area for easy clicking */}
        <rect x="-56" y="-22" width="112" height="44" fill="rgba(0,0,0,0.001)" />
        {/* Visual Pill Badge */}
        <rect
          x="-50"
          y="-16"
          width="100"
          height="32"
          rx="16"
          fill="#20070b"
          stroke="#ef4444"
          strokeWidth="2.5"
          filter="drop-shadow(0 0 12px rgba(239, 68, 68, 0.9))"
        />
        {/* Trash/X Icon */}
        <g transform="translate(-30, 0)">
          <circle r="9" fill="#ef4444" />
          <line x1="-4" y1="-4" x2="4" y2="4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="4" y1="-4" x2="-4" y2="4" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
        </g>
        <text
          x="10"
          y="4.5"
          textAnchor="middle"
          fill="#fecaca"
          fontSize="11.5"
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
          letterSpacing="0.4"
        >
          Delete
        </text>
      </g>
    </g>
  );
};
