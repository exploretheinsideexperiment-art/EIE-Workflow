import React, { useRef } from 'react';
import * as Icons from 'lucide-react';
import { WorkflowNodeData, ExecutionNodeResult, NodePort } from '../../types/workflow';

interface CanvasNodeProps {
  node: WorkflowNodeData;
  isSelected?: boolean;
  executionResult?: ExecutionNodeResult;
  isConnecting?: boolean;
  onSelect: (nodeId: string, multi: boolean) => void;
  onStartDrag?: (nodeId: string, clientX: number, clientY: number, multi: boolean) => void;
  onStartPortDrag: (nodeId: string, portId: string, isOutput: boolean, pos: { x: number; y: number }) => void;
  onPortMouseUp: (nodeId: string, portId: string, isOutput: boolean) => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onOpenConfig: (nodeId: string) => void;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  isSelected,
  executionResult,
  isConnecting,
  onSelect,
  onStartDrag,
  onStartPortDrag,
  onPortMouseUp,
  onDeleteNode,
  onDuplicateNode,
  onOpenConfig,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  // Dynamic Lucide icon lookup with safe fallback
  const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;

  // Category badge colors
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    Triggers: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    HTTP: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    AI: { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' },
    Logic: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    Data: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    Communication: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    Database: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    Files: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    Developer: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    Applications: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    Utilities: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  };

  const catStyle = categoryColors[node.category] || categoryColors.Utilities;

  // Execution state styling
  let borderGlowClass = isSelected
    ? 'ring-2 ring-cyan-400 shadow-lg shadow-cyan-500/20 border-cyan-400/80'
    : 'border-slate-800 hover:border-slate-700 shadow-xl';

  if (executionResult?.status === 'running') {
    borderGlowClass = 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/40 border-cyan-400 animate-pulse';
  } else if (executionResult?.status === 'success') {
    borderGlowClass = 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/20 border-emerald-500/80';
  } else if (executionResult?.status === 'failed') {
    borderGlowClass = 'ring-2 ring-rose-500/80 shadow-lg shadow-rose-500/20 border-rose-500/80';
  } else if (executionResult?.status === 'skipped') {
    borderGlowClass = 'opacity-40 border-dashed border-slate-700';
  }

  // Subtitle snippet based on node config
  let subtitle = node.type;
  if (node.type === 'http_request') {
    subtitle = `${node.config?.method || 'GET'} ${node.config?.url || ''}`.slice(0, 32);
  } else if (node.type === 'trigger_webhook') {
    subtitle = `/api/webhook/${node.config?.webhookPath || 'id'}`;
  } else if (node.type === 'ai_agent') {
    subtitle = node.config?.model || 'gemini-3.8-flash';
  } else if (node.type === 'logic_if') {
    subtitle = `${node.config?.fieldPath || 'data'} ${node.config?.operator || '=='} ${node.config?.value || ''}`;
  } else if (node.type === 'comm_email') {
    subtitle = node.config?.to || 'recipient@domain';
  }

  return (
    <div
      ref={nodeRef}
      id={`node-${node.id}`}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
      }}
      className={`absolute w-64 select-none rounded-2xl bg-slate-900/95 backdrop-blur-xl border transition-all duration-150 group cursor-move ${borderGlowClass}`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]')) return;
        e.stopPropagation();
        onStartDrag?.(node.id, e.clientX, e.clientY, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onTouchStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]')) return;
        e.stopPropagation();
        if (e.touches.length === 1) {
          onStartDrag?.(node.id, e.touches[0].clientX, e.touches[0].clientY, false);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenConfig(node.id);
      }}
    >
      {/* Node Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className={`p-1.5 rounded-lg ${catStyle.bg} ${catStyle.text} border ${catStyle.border}`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-100 truncate tracking-tight">{node.name}</h4>
            <span className={`text-[10px] font-medium uppercase tracking-wider ${catStyle.text}`}>
              {node.category}
            </span>
          </div>
        </div>

        {/* Execution Status Badge */}
        {executionResult && (
          <div className="flex items-center">
            {executionResult.status === 'running' && (
              <span className="flex items-center gap-1 text-[10px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800 animate-pulse">
                <Icons.Loader2 className="w-2.5 h-2.5 animate-spin" />
                <span>Running</span>
              </span>
            )}
            {executionResult.status === 'success' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                <Icons.Check className="w-2.5 h-2.5" />
                <span>{executionResult.durationMs ? `${executionResult.durationMs}ms` : 'Done'}</span>
              </span>
            )}
            {executionResult.status === 'failed' && (
              <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                <Icons.X className="w-2.5 h-2.5" />
                <span>Error</span>
              </span>
            )}
            {executionResult.status === 'skipped' && (
              <span className="text-[10px] text-slate-500 font-mono bg-slate-800/50 px-2 py-0.5 rounded-full">
                Skipped
              </span>
            )}
          </div>
        )}
      </div>

      {/* Node Body */}
      <div className="px-3.5 py-2.5 text-[11px] text-slate-400 font-mono truncate flex items-center justify-between">
        <span className="truncate" title={subtitle}>{subtitle}</span>
        {node.credentialId && (
          <span title="Credential Connected">
            <Icons.KeyRound className="w-3 h-3 text-cyan-400 shrink-0 ml-1.5" />
          </span>
        )}
      </div>

      {/* Floating Action Menu on Node Hover */}
      <div className="absolute -top-3.5 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-lg p-0.5 shadow-lg backdrop-blur-md">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig(node.id);
          }}
          className="p-1 hover:text-cyan-300 text-slate-400 rounded hover:bg-slate-700/60"
          title="Configure Node"
        >
          <Icons.Settings className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateNode(node.id);
          }}
          className="p-1 hover:text-cyan-300 text-slate-400 rounded hover:bg-slate-700/60"
          title="Duplicate Node"
        >
          <Icons.Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.id);
          }}
          className="p-1 hover:text-rose-400 text-slate-400 rounded hover:bg-slate-700/60"
          title="Delete Node"
        >
          <Icons.Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Input Ports (Left) */}
      <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 flex flex-col gap-3">
        {node.inputs.map((port) => (
          <div
            key={port.id}
            id={`port-${node.id}-${port.id}`}
            title={`Input: ${port.label || port.name}`}
            className="w-5 h-5 rounded-full bg-slate-900 border-2 border-cyan-400 hover:border-cyan-300 hover:scale-125 transition-all flex items-center justify-center cursor-crosshair shadow-md shadow-cyan-950 group/port"
            onMouseUp={(e) => {
              e.stopPropagation();
              onPortMouseUp(node.id, port.id, false);
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 group-hover/port:bg-white" />
          </div>
        ))}
      </div>

      {/* Output Ports (Right) */}
      <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 flex flex-col gap-3">
        {node.outputs.map((port) => {
          let portBorder = 'border-cyan-400';
          let portDot = 'bg-cyan-400';
          if (port.type === 'true') {
            portBorder = 'border-emerald-400';
            portDot = 'bg-emerald-400';
          } else if (port.type === 'false') {
            portBorder = 'border-rose-400';
            portDot = 'bg-rose-400';
          }

          return (
            <div
              key={port.id}
              id={`port-${node.id}-${port.id}`}
              title={`Output: ${port.label || port.name}`}
              className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${portBorder} hover:scale-125 transition-all flex items-center justify-center cursor-crosshair shadow-md shadow-cyan-950 group/port relative`}
              onMouseDown={(e) => {
                e.stopPropagation();
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                onStartPortDrag(node.id, port.id, true, {
                  x: rect.x + rect.width / 2,
                  y: rect.y + rect.height / 2,
                });
              }}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${portDot} group-hover/port:bg-white`} />
              {port.label && (
                <span className="absolute left-6 text-[9px] font-mono tracking-tight text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {port.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
