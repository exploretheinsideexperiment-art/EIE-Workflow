import React, { useRef } from 'react';
import * as Icons from 'lucide-react';
import { Plus, Bot, Sparkles, BrainCircuit, History, Wrench, Shield, Check, Loader2, X, Settings, Copy, Trash2, KeyRound } from 'lucide-react';
import { WorkflowNodeData, ExecutionNodeResult, NodePort } from '../../types/workflow';
import { getPortColorDef, isPortCompatible } from '../../utils/portValidation';

interface CanvasNodeProps {
  node: WorkflowNodeData;
  isSelected?: boolean;
  isPendingSource?: boolean;
  executionResult?: ExecutionNodeResult;
  isConnecting?: boolean;
  activeConnectingPortType?: string | null;
  activeConnectingNodeId?: string | null;
  onSelect: (nodeId: string, multi: boolean) => void;
  onStartDrag?: (nodeId: string, clientX: number, clientY: number, multi: boolean) => void;
  onStartPortDrag: (nodeId: string, portId: string, isOutput: boolean, pos: { x: number; y: number }) => void;
  onPortMouseUp: (nodeId: string, portId: string, isOutput: boolean) => void;
  onPortClick?: (nodeId: string, portId: string, isOutput: boolean) => void;
  onQuickConnect?: (nodeId: string, portId: string) => void;
  onQuickAddSubNode?: (nodeId: string, subType: 'model' | 'memory' | 'tool') => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onOpenConfig: (nodeId: string) => void;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  isSelected,
  isPendingSource,
  executionResult,
  isConnecting,
  activeConnectingPortType,
  activeConnectingNodeId,
  onSelect,
  onStartDrag,
  onStartPortDrag,
  onPortMouseUp,
  onPortClick,
  onQuickConnect,
  onQuickAddSubNode,
  onDeleteNode,
  onDuplicateNode,
  onOpenConfig,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);

  // Dynamic Lucide icon lookup with safe fallback
  const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;

  const isAiAgent = node.type === 'ai_agent';
  const isAiTool = node.category === 'AI Tools';

  // Category badge colors
  const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    Triggers: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    HTTP: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
    AI: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
    'AI Tools': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Logic: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    Data: { bg: 'bg-teal-500/10', text: 'text-teal-400', border: 'border-teal-500/30' },
    Communication: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
    Database: { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    Files: { bg: 'bg-emerald-500/10', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    Developer: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'All Applications': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    Applications: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    Utilities: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
  };

  const catStyle = categoryColors[node.category] || categoryColors.Utilities;

  // Execution state styling
  let borderGlowClass = isSelected
    ? 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/25 border-cyan-400/80'
    : 'border-slate-800 hover:border-slate-700 shadow-lg';

  if (isPendingSource) {
    borderGlowClass = 'ring-2 ring-cyan-400 border-cyan-400 shadow-2xl shadow-cyan-500/40 animate-pulse';
  } else if (executionResult?.status === 'running') {
    borderGlowClass = 'ring-2 ring-cyan-400 shadow-xl shadow-cyan-500/40 border-cyan-400 animate-pulse';
  } else if (executionResult?.status === 'success') {
    borderGlowClass = 'ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/20 border-emerald-500/80';
  } else if (executionResult?.status === 'failed') {
    borderGlowClass = 'ring-2 ring-rose-500/80 shadow-lg shadow-rose-500/20 border-rose-500/80';
  } else if (executionResult?.status === 'skipped') {
    borderGlowClass = 'opacity-40 border-dashed border-slate-700';
  }

  // Subtitle snippet
  let subtitle = node.type;
  if (node.type === 'ai_agent') {
    subtitle = `Autonomous Agent (${node.config?.agentType || 'Tools Agent'})`;
  } else if (node.type === 'http_request') {
    subtitle = `${node.config?.method || 'GET'} ${node.config?.url || ''}`.slice(0, 30);
  } else if (node.type === 'trigger_webhook') {
    subtitle = `/api/webhook/${node.config?.webhookPath || 'inbound'}`;
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
        width: isAiAgent ? '280px' : '264px',
      }}
      className={`absolute select-none rounded-2xl bg-slate-900/95 backdrop-blur-xl border transition-all duration-150 group cursor-move ${borderGlowClass}`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]')) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        onStartDrag?.(node.id, e.clientX, e.clientY, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onTouchStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]')) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        if (e.touches.length === 1) {
          onStartDrag?.(node.id, e.touches[0].clientX, e.touches[0].clientY, false);
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (isSelected) {
          onOpenConfig(node.id);
        } else {
          onSelect(node.id, e.shiftKey || e.metaKey || e.ctrlKey);
        }
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpenConfig(node.id);
      }}
    >
      {/* Node Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/80">
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig(node.id);
          }}
          title="Click to open settings"
        >
          <div className={`p-1.5 rounded-xl ${catStyle.bg} ${catStyle.text} border ${catStyle.border} shrink-0`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate tracking-tight flex items-center gap-1.5">
              <span>{node.name}</span>
            </h4>
            <span className={`text-[9px] font-mono uppercase tracking-wider ${catStyle.text}`}>
              {isAiAgent ? 'Autonomous Agent' : isAiTool ? 'Agent Tool' : node.category}
            </span>
          </div>
        </div>

        {/* Header Right Actions: Status Badge & Settings Icon */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Execution Status Badge */}
          {executionResult && (
            <div className="flex items-center">
              {executionResult.status === 'running' && (
                <span className="flex items-center gap-1 text-[9px] text-cyan-400 font-mono bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800 animate-pulse">
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  <span>Running</span>
                </span>
              )}
              {executionResult.status === 'success' && (
                <span className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                  <Check className="w-2.5 h-2.5" />
                  <span>{executionResult.durationMs ? `${executionResult.durationMs}ms` : 'Done'}</span>
                </span>
              )}
              {executionResult.status === 'failed' && (
                <span className="flex items-center gap-1 text-[9px] text-rose-400 font-mono bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                  <X className="w-2.5 h-2.5" />
                  <span>Error</span>
                </span>
              )}
            </div>
          )}

          {/* Quick Settings Button on Node Header */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenConfig(node.id);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onOpenConfig(node.id);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            title="Configure settings"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Body & Subtitle */}
      <div className="px-3.5 py-2.5 text-[11px] text-slate-400 font-mono truncate flex items-center justify-between">
        <span className="truncate" title={subtitle}>{subtitle}</span>
        {node.credentialId && (
          <span title="Credential Connected">
            <KeyRound className="w-3 h-3 text-cyan-400 shrink-0 ml-1.5" />
          </span>
        )}
      </div>

      {/* SPECIAL AI AGENT SLOTS (n8n Style: Model, Memory, Tools) */}
      {isAiAgent && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 flex flex-col gap-1.5 bg-slate-950/40 rounded-b-2xl">
          <div
            className={`flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
              activeConnectingPortType === 'model' && activeConnectingNodeId !== node.id
                ? 'bg-purple-950/70 border-purple-400 ring-2 ring-purple-400/80 shadow-lg shadow-purple-500/30 text-purple-200 animate-pulse scale-[1.02]'
                : 'text-purple-300/90 bg-purple-950/30 border-purple-800/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Model (LLM Engine)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddSubNode?.(node.id, 'model');
              }}
              className="text-[10px] font-bold text-purple-300 hover:text-white bg-purple-900/60 hover:bg-purple-800 px-1.5 py-0.5 rounded transition cursor-pointer"
              title="Connect Gemini or OpenAI Model"
            >
              + Model
            </button>
          </div>

          <div
            className={`flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
              activeConnectingPortType === 'memory' && activeConnectingNodeId !== node.id
                ? 'bg-amber-950/70 border-amber-400 ring-2 ring-amber-400/80 shadow-lg shadow-amber-500/30 text-amber-200 animate-pulse scale-[1.02]'
                : 'text-amber-300/90 bg-amber-950/30 border-amber-800/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <History className="w-3 h-3 text-amber-400" />
              <span>Memory (Chat History)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddSubNode?.(node.id, 'memory');
              }}
              className="text-[10px] font-bold text-amber-300 hover:text-white bg-amber-900/60 hover:bg-amber-800 px-1.5 py-0.5 rounded transition cursor-pointer"
              title="Connect Window Buffer Memory"
            >
              + Memory
            </button>
          </div>

          <div
            className={`flex items-center justify-between text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
              activeConnectingPortType === 'tool' && activeConnectingNodeId !== node.id
                ? 'bg-emerald-950/70 border-emerald-400 ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-500/30 text-emerald-200 animate-pulse scale-[1.02]'
                : 'text-emerald-300/90 bg-emerald-950/30 border-emerald-800/40'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Wrench className="w-3 h-3 text-emerald-400" />
              <span>Tools (Calculator, Search, HTTP)</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddSubNode?.(node.id, 'tool');
              }}
              className="text-[10px] font-bold text-emerald-300 hover:text-white bg-emerald-900/60 hover:bg-emerald-800 px-1.5 py-0.5 rounded transition cursor-pointer"
              title="Connect Agent Tools"
            >
              + Tool
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Menu on Node Hover or when Selected */}
      <div className={`absolute -top-4 right-2 transition-all flex items-center gap-1 bg-slate-850/95 border border-slate-700/90 rounded-lg p-0.5 shadow-lg backdrop-blur-md z-15 ${
        isSelected
          ? 'opacity-100 ring-1 ring-cyan-500/60 shadow-cyan-500/20'
          : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
      }`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig(node.id);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onOpenConfig(node.id);
          }}
          className="p-1.5 hover:text-cyan-300 text-slate-300 rounded hover:bg-slate-700/60 cursor-pointer active:scale-90"
          title="Configure Event Settings"
        >
          <Settings className="w-3.5 h-3.5 text-cyan-400" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicateNode(node.id);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDuplicateNode(node.id);
          }}
          className="p-1.5 hover:text-cyan-300 text-slate-300 rounded hover:bg-slate-700/60 cursor-pointer active:scale-90"
          title="Duplicate Event"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteNode(node.id);
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDeleteNode(node.id);
          }}
          className="p-1.5 hover:text-rose-400 text-rose-400/90 rounded hover:bg-rose-500/20 cursor-pointer active:scale-90"
          title="Delete Event"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Input Ports (Left) */}
      <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 flex flex-col gap-2.5 z-10">
        {node.inputs.map((port) => {
          const colors = getPortColorDef(port.type);
          const isConnectingActive = Boolean(activeConnectingPortType);
          const isSelfNode = activeConnectingNodeId === node.id;
          const isCompatible =
            isConnectingActive &&
            !isSelfNode &&
            isPortCompatible(activeConnectingPortType!, port.type, false);
          const isIncompatible = isConnectingActive && (!isCompatible || isSelfNode);

          return (
            <div
              key={port.id}
              id={`port-${node.id}-${port.id}`}
              data-port="true"
              title={
                isIncompatible
                  ? `❌ Incompatible: Requires ${colors.name}`
                  : isCompatible
                  ? `✓ Compatible: Connect ${colors.name}`
                  : `Input: ${port.label || port.name} (${colors.name})`
              }
              className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition-all flex items-center justify-center relative shadow-md shadow-black group/port ${
                isCompatible
                  ? `${colors.border} ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-140 z-30 cursor-pointer animate-pulse`
                  : isIncompatible
                  ? 'opacity-20 border-slate-700 cursor-not-allowed scale-90'
                  : `${colors.border} ${colors.hover} hover:scale-125 cursor-pointer`
              }`}
              onClick={(e) => {
                e.stopPropagation();
                if (isIncompatible) return;
                onPortClick?.(node.id, port.id, false);
              }}
              onMouseUp={(e) => {
                e.stopPropagation();
                if (isIncompatible) return;
                onPortMouseUp(node.id, port.id, false);
              }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${colors.bg} ${
                  isCompatible ? 'scale-125 bg-white' : ''
                } group-hover/port:bg-white`}
              />
              {/* Port label badge */}
              <span
                className={`absolute right-6 text-[9px] font-mono tracking-tight px-2 py-0.5 rounded border transition-all whitespace-nowrap pointer-events-none z-30 shadow-lg ${
                  isCompatible
                    ? 'opacity-100 bg-slate-950 border-cyan-400 text-white font-bold scale-105 shadow-cyan-500/20'
                    : 'opacity-0 group-hover/port:opacity-100 bg-slate-950/90 border-slate-800 text-slate-300'
                }`}
              >
                {isCompatible ? `✓ ${port.label || port.name}` : port.label || port.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Output Ports (Right) with Quick-Add '+' Connector (n8n Style) */}
      <div className="absolute top-1/2 -right-2.5 -translate-y-1/2 flex flex-col gap-2.5 z-10">
        {node.outputs.map((port) => {
          const colors = getPortColorDef(port.type);
          const isDraggingThis = isConnecting && activeConnectingNodeId === node.id;
          const isConnectingActive = Boolean(activeConnectingPortType);

          return (
            <div key={port.id} className="relative flex items-center">
              {/* Output Port Dot */}
              <div
                id={`port-${node.id}-${port.id}`}
                data-port="true"
                title={`Output: ${port.label || port.name} (${colors.name}) - Click or drag to connect`}
                className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${colors.border} transition-all flex items-center justify-center shadow-md shadow-black group/port relative ${
                  isDraggingThis
                    ? `ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-125 z-20`
                    : isConnectingActive
                    ? 'opacity-40 cursor-default'
                    : `${colors.hover} hover:scale-125 cursor-crosshair`
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onPortClick?.(node.id, port.id, true);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onStartPortDrag(node.id, port.id, true, {
                    x: rect.x + rect.width / 2,
                    y: rect.y + rect.height / 2,
                  });
                }}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${colors.bg} group-hover/port:bg-white`} />
                {port.label && (
                  <span className="absolute left-6 text-[9px] font-mono tracking-tight text-slate-300 bg-slate-950/90 px-1.5 py-0.5 rounded border border-slate-800 opacity-0 group-hover/port:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30">
                    {port.label}
                  </span>
                )}
              </div>

              {/* Quick Connect '+' Button (n8n style) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickConnect?.(node.id, port.id);
                }}
                className="w-4 h-4 ml-1.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center text-[10px] shadow-sm hover:scale-125 transition cursor-pointer opacity-70 group-hover:opacity-100"
                title="Quick Add & Connect Next Step (+)"
              >
                +
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
