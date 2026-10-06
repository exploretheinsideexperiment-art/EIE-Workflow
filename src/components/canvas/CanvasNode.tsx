import React, { useRef, useState } from 'react';
import * as Icons from 'lucide-react';
import {
  Plus,
  Bot,
  Sparkles,
  BrainCircuit,
  History,
  Wrench,
  Shield,
  Check,
  Loader2,
  X,
  Settings,
  Copy,
  Trash2,
  KeyRound,
  Stethoscope,
  AlertCircle,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Power,
  Pin,
  Play,
  FileText,
  Table,
  Code2,
  Link2,
  Zap,
  MousePointer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { WorkflowNodeData, ExecutionNodeResult, NodePort, WorkflowConnection } from '../../types/workflow';
import { getPortColorDef, isPortCompatible } from '../../utils/portValidation';

interface CanvasNodeProps {
  node: WorkflowNodeData;
  isSelected?: boolean;
  isPendingSource?: boolean;
  executionResult?: ExecutionNodeResult;
  isConnecting?: boolean;
  isConnectTargetCandidate?: boolean;
  activeConnectingPortType?: string | null;
  activeConnectingNodeId?: string | null;
  sourceNodeName?: string;
  otherNodes?: WorkflowNodeData[];
  connections?: WorkflowConnection[];
  allNodes?: WorkflowNodeData[];
  onDirectConnectNodes?: (fromNodeId: string, toNodeId: string) => void;
  onSelect: (nodeId: string, multi: boolean) => void;
  onStartDrag?: (nodeId: string, clientX: number, clientY: number, multi: boolean) => void;
  onStartPortDrag: (nodeId: string, portId: string, isOutput: boolean, pos: { x: number; y: number }) => void;
  onPortMouseUp: (nodeId: string, portId: string, isOutput: boolean) => void;
  onPortClick?: (nodeId: string, portId: string, isOutput: boolean) => void;
  onStartConnectFromNode?: (nodeId: string, portId?: string) => void;
  onConnectToThisNode?: (nodeId: string, portId?: string) => void;
  onQuickConnect?: (nodeId: string, portId: string) => void;
  onQuickAddSubNode?: (nodeId: string, subType: 'model' | 'memory' | 'tool') => void;
  onDeleteNode: (nodeId: string) => void;
  onDuplicateNode: (nodeId: string) => void;
  onOpenConfig: (nodeId: string) => void;
  onOpenDoctorForNode?: (nodeId: string) => void;
  onToggleExpandNode?: (nodeId: string) => void;
  onToggleDisableNode?: (nodeId: string) => void;
  onTestSingleNode?: (node: WorkflowNodeData) => void;
  onPinDataNode?: (nodeId: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
}

export const CanvasNode: React.FC<CanvasNodeProps> = ({
  node,
  isSelected,
  isPendingSource,
  executionResult,
  isConnecting,
  isConnectTargetCandidate,
  activeConnectingPortType,
  activeConnectingNodeId,
  sourceNodeName,
  otherNodes,
  connections = [],
  allNodes = [],
  onDirectConnectNodes,
  onSelect,
  onStartDrag,
  onStartPortDrag,
  onPortMouseUp,
  onPortClick,
  onStartConnectFromNode,
  onConnectToThisNode,
  onQuickConnect,
  onQuickAddSubNode,
  onDeleteNode,
  onDuplicateNode,
  onOpenConfig,
  onOpenDoctorForNode,
  onToggleExpandNode,
  onToggleDisableNode,
  onTestSingleNode,
  onPinDataNode,
  onDeleteConnection,
}) => {
  const nodeRef = useRef<HTMLDivElement>(null);
  const [dataTab, setDataTab] = useState<'table' | 'json'>('table');
  const [showConnectPopover, setShowConnectPopover] = useState(false);

  // Dynamic Lucide icon lookup with safe fallback
  const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;

  const isAiAgent = node.type === 'ai_agent';
  const isAiTool = node.category === 'AI Tools';
  const isExpanded = Boolean(node.isExpanded);

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

  if (node.disabled) {
    borderGlowClass = 'opacity-60 border-dashed border-amber-500/60 shadow-none';
  } else if (isPendingSource) {
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
  } else if (node.type === 'trigger_schedule') {
    subtitle = `Cron: ${node.config?.cron || '0 9 * * 1-5'}`;
  } else if (node.type === 'logic_if') {
    subtitle = `${node.config?.fieldPath || 'data'} ${node.config?.operator || '=='} ${node.config?.value || ''}`;
  } else if (node.type === 'comm_email') {
    subtitle = node.config?.to || 'recipient@domain';
  } else if (node.type === 'app_google_sheets') {
    subtitle = `Sheet: ${node.config?.sheetName || 'Sheet1'} (${node.config?.operation || 'Read Rows'})`;
  } else if (node.type === 'app_telegram' || node.type === 'comm_telegram') {
    subtitle = `Chat: ${node.config?.chatId || '@alerts_channel'}`;
  }

  const outputPayload = node.pinnedData || executionResult?.output;

  // Port connection mapping for high-transparency I/O visualization
  const getPortConnections = (portId: string, isOutput: boolean) => {
    if (!connections || connections.length === 0) return [];
    if (isOutput) {
      return connections
        .filter((c) => c.fromNodeId === node.id && c.fromPortId === portId)
        .map((c) => allNodes?.find((n) => n.id === c.toNodeId))
        .filter(Boolean) as WorkflowNodeData[];
    } else {
      return connections
        .filter((c) => c.toNodeId === node.id && c.toPortId === portId)
        .map((c) => allNodes?.find((n) => n.id === c.fromNodeId))
        .filter(Boolean) as WorkflowNodeData[];
    }
  };

  const mainInputSources = getPortConnections('in_main', false);
  const modelSources = getPortConnections('in_model', false);
  const memorySources = getPortConnections('in_memory', false);
  const toolSources = getPortConnections('in_tools', false);
  const toolConns = connections.filter(
    (c) => c.toNodeId === node.id && (c.toPortId === 'in_tools' || c.toPortId.startsWith('in_tools'))
  );
  const toolCount = toolConns.length;
  const mainOutputTargets = getPortConnections('out_main', true);

  return (
    <div
      ref={nodeRef}
      id={`node-${node.id}`}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: isExpanded
          ? isAiAgent
            ? toolCount > 1
              ? '320px'
              : '290px'
            : '290px'
          : isAiAgent
          ? toolCount > 1
            ? '280px'
            : toolCount === 1
            ? '250px'
            : '230px'
          : '200px',
        touchAction: 'none',
      }}
      className={`absolute select-none rounded-xl bg-slate-900/98 backdrop-blur-xl border transition-all duration-150 group cursor-move shadow-md shadow-black/30 ${
        isConnectTargetCandidate
          ? 'border-cyan-400/80 ring-2 ring-cyan-500/40 shadow-xl shadow-cyan-950/50'
          : borderGlowClass
      }`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]') || target.closest('input')) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        onStartDrag?.(node.id, e.clientX, e.clientY, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onTouchStart={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]') || target.closest('input')) {
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

      {/* Standard Floating Hover Action Bar */}
      <div className="absolute -top-7.5 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/95 border border-slate-700/90 shadow-lg pointer-events-auto">
          {onStartConnectFromNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartConnectFromNode(node.id);
              }}
              className="p-1 rounded-md hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
              title="Click to Connect this node to another step"
            >
              <Link2 className="w-3 h-3 text-cyan-400" />
            </button>
          )}

          {onTestSingleNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTestSingleNode(node);
              }}
              className="p-1 rounded-md hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
              title="Execute Step (n8n)"
            >
              <Play className="w-3 h-3 fill-current" />
            </button>
          )}

          {onToggleDisableNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisableNode(node.id);
              }}
              className={`p-1 rounded-md transition cursor-pointer ${
                node.disabled ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
              }`}
              title={node.disabled ? 'Enable Node' : 'Disable / Mute Node (Bypass)'}
            >
              <Power className="w-3 h-3" />
            </button>
          )}

          {onPinDataNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinDataNode(node.id);
              }}
              className={`p-1 rounded-md transition cursor-pointer ${
                node.pinnedData ? 'text-purple-400 bg-purple-500/20' : 'text-slate-300 hover:text-purple-300 hover:bg-slate-800'
              }`}
              title={node.pinnedData ? 'Unpin Data' : 'Pin Test Data (n8n)'}
            >
              <Pin className="w-3 h-3" />
            </button>
          )}

          {onToggleExpandNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpandNode(node.id);
              }}
              className={`p-1 rounded-md transition cursor-pointer ${
                isExpanded ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title={isExpanded ? 'Collapse Node Card' : 'Expand Node Card Details'}
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-950/95 border border-slate-700/90 shadow-lg pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateNode(node.id);
            }}
            className="p-1 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Duplicate Node"
          >
            <Copy className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            className="p-1 rounded-md hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition cursor-pointer"
            title="Delete Node"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Header - Compact Standard Layout */}
      <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-slate-800/80">
        <div
          className="flex items-center gap-2 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig(node.id);
          }}
          title="Click to open settings"
        >
          <div className={`w-6 h-6 p-1 rounded-lg ${catStyle.bg} ${catStyle.text} border ${catStyle.border} shrink-0 flex items-center justify-center shadow-xs`}>
            <IconComponent className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-100 truncate tracking-tight flex items-center gap-1">
              <span className="truncate">{node.name}</span>
            </h4>
            <div className="flex items-center gap-1 flex-wrap">
              <span className={`text-[8.5px] font-mono uppercase tracking-wider ${catStyle.text}`}>
                {isAiAgent ? 'Autonomous Agent' : isAiTool ? 'Tool' : node.category}
              </span>
              {node.disabled && (
                <span className="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-600/40">
                  Off
                </span>
              )}
              {node.pinnedData && (
                <span className="text-[8px] font-bold text-purple-300 bg-purple-950/80 px-1 py-0.2 rounded border border-purple-600/40">
                  📌
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-0.5 shrink-0">
          {executionResult && (
            <div className="flex items-center">
              {executionResult.status === 'running' && (
                <span className="flex items-center gap-1 text-[8px] text-cyan-400 font-mono bg-cyan-950/80 px-1.5 py-0.2 rounded-full border border-cyan-800 animate-pulse">
                  <Loader2 className="w-2 h-2 animate-spin" />
                  <span>Run</span>
                </span>
              )}
              {executionResult.status === 'success' && (
                <span className="flex items-center gap-0.5 text-[8px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-800">
                  <Check className="w-2 h-2" />
                  <span>{executionResult.durationMs !== undefined ? `${executionResult.durationMs}ms` : 'OK'}</span>
                </span>
              )}
              {executionResult.status === 'failed' && (
                <span className="flex items-center gap-0.5 text-[8px] text-rose-400 font-mono bg-rose-950/80 px-1.5 py-0.2 rounded-full border border-rose-800">
                  <X className="w-2 h-2" />
                  <span>Err</span>
                </span>
              )}
              {executionResult.status === 'skipped' && (
                <span className="text-[8px] text-slate-400 font-mono bg-slate-950 px-1.5 py-0.2 rounded-full border border-slate-800">
                  Skip
                </span>
              )}
            </div>
          )}

          {/* Expand/Collapse Toggle on Header */}
          {onToggleExpandNode && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpandNode(node.id);
              }}
              className="p-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand Node Details'}
            >
              {isExpanded ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Quick Connect Button with Dropdown Menu */}
          {onStartConnectFromNode && node.outputs.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowConnectPopover((prev) => !prev);
                }}
                className={`p-0.5 rounded transition cursor-pointer flex items-center gap-0.5 ${
                  showConnectPopover
                    ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                }`}
                title="Connect this node to another step"
                aria-label="Connect"
              >
                <Link2 className="w-3 h-3 text-cyan-400" />
              </button>

              {/* Connect Popover Menu */}
              {showConnectPopover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-52 p-2 rounded-xl bg-slate-950/98 border border-slate-700 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 text-left"
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 flex items-center justify-between">
                    <span>Connect to...</span>
                    <button
                      onClick={() => setShowConnectPopover(false)}
                      className="text-slate-500 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Option 1: Click any node on canvas */}
                  <button
                    onClick={() => {
                      setShowConnectPopover(false);
                      onStartConnectFromNode(node.id);
                    }}
                    className="w-full mt-1.5 px-2 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
                  >
                    <MousePointer className="w-3 h-3 text-cyan-400" />
                    <span>Click node on canvas</span>
                  </button>

                  {/* Option 2: Direct list of other nodes on canvas */}
                  {otherNodes && otherNodes.length > 0 && (
                    <div className="mt-2 space-y-1 max-h-36 overflow-y-auto">
                      <div className="text-[9px] font-mono text-slate-500 px-1">Or choose target node:</div>
                      {otherNodes.map((target) => (
                        <button
                          key={target.id}
                          onClick={() => {
                            setShowConnectPopover(false);
                            onDirectConnectNodes?.(node.id, target.id);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-2 transition cursor-pointer text-left truncate"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span className="truncate">{target.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Settings Gear */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenConfig(node.id);
            }}
            className="p-0.5 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            title="Configure parameters & settings"
            aria-label="Settings"
          >
            <Settings className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Node Body & Subtitle - Compact */}
      <div className="px-2.5 py-1 text-[10px] text-slate-400 font-mono truncate flex items-center justify-between">
        <span className="truncate" title={subtitle}>{subtitle}</span>
        {node.credentialId && (
          <span title="Credential Connected">
            <KeyRound className="w-2.5 h-2.5 text-cyan-400 shrink-0 ml-1" />
          </span>
        )}
      </div>

      {/* Note Pill (n8n feature) */}
      {node.notes && (
        <div className="mx-2 mb-1.5 p-1 rounded bg-amber-950/40 border border-amber-500/30 text-[9px] text-amber-300 flex items-start gap-1">
          <FileText className="w-2.5 h-2.5 text-amber-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2 leading-tight">{node.notes}</span>
        </div>
      )}

      {/* EXPANDED IN-CANVAS VIEW (n8n Style) */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2 bg-slate-950/60 rounded-b-2xl">
          {/* Quick Parameters & Operations Summary */}
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 space-y-1">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800 pb-1">
              <span>Configuration Parameters</span>
              <span className="text-cyan-400 lowercase">{node.type}</span>
            </div>
            {Object.keys(node.config || {}).slice(0, 4).map((k) => (
              <div key={k} className="flex items-center justify-between gap-2 truncate">
                <span className="text-slate-500 truncate">{k}:</span>
                <span className="text-slate-200 truncate font-semibold">
                  {typeof node.config[k] === 'object' ? JSON.stringify(node.config[k]) : String(node.config[k])}
                </span>
              </div>
            ))}
          </div>

          {/* In-Node Live Data / Table Inspector */}
          {outputPayload && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Output Data
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-md border border-slate-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDataTab('table');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      dataTab === 'table' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Table
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDataTab('json');
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      dataTab === 'json' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JSON
                  </button>
                </div>
              </div>

              {dataTab === 'table' ? (
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[10px] font-mono max-h-36 overflow-y-auto space-y-1">
                  {Array.isArray(outputPayload.rows || outputPayload) ? (
                    (outputPayload.rows || outputPayload).slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="p-1.5 rounded bg-slate-950 border border-slate-800/80 text-[10px] text-slate-300">
                        {Object.entries(item).slice(0, 3).map(([key, val]) => (
                          <div key={key} className="flex justify-between gap-1 truncate">
                            <span className="text-slate-500">{key}:</span>
                            <span className="text-slate-200 truncate">{String(val)}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : typeof outputPayload === 'object' ? (
                    Object.entries(outputPayload).slice(0, 5).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-0.5">
                        <span className="text-slate-500 truncate">{key}:</span>
                        <span className="text-slate-200 truncate font-semibold">
                          {typeof val === 'object' ? JSON.stringify(val).slice(0, 40) : String(val)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-300">{String(outputPayload)}</div>
                  )}
                </div>
              ) : (
                <pre className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-200 overflow-x-auto max-h-36 whitespace-pre-wrap">
                  {JSON.stringify(outputPayload, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Quick Node Actions */}
          <div className="flex items-center gap-1.5 pt-1">
            {onTestSingleNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTestSingleNode(node);
                }}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold transition cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                <span>Execute Step</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenConfig(node.id);
              }}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold transition cursor-pointer"
            >
              Full Config
            </button>
          </div>
        </div>
      )}

      {/* Visual Live Output or Error Pill on Node (when collapsed) */}
      {!isExpanded && executionResult && (
        <div className="px-3 pb-2.5">
          {executionResult.status === 'failed' ? (
            <div className="p-2 rounded-xl bg-rose-950/70 border border-rose-500/50 text-[10px] text-rose-200">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1 font-bold text-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>Error Detected</span>
                </div>
                {onOpenDoctorForNode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDoctorForNode(node.id);
                    }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[9px] font-bold cursor-pointer transition"
                    title="Fix this error with Build-Ai"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                    <span>Build-Ai</span>
                  </button>
                )}
              </div>
              <p className="line-clamp-2 text-[10px] text-rose-300/90 leading-tight">
                {executionResult.error || 'Execution failed'}
              </p>
            </div>
          ) : executionResult.status === 'success' && executionResult.output ? (
            <div
              className="p-1.5 px-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center justify-between gap-1.5 cursor-pointer hover:bg-emerald-950/60 transition"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpandNode ? onToggleExpandNode(node.id) : onOpenConfig(node.id);
              }}
              title="Click to expand full output data"
            >
              <span className="truncate">
                ✓ {typeof executionResult.output === 'object'
                  ? (executionResult.output.summary || executionResult.output.text || executionResult.output.result || (executionResult.output.data ? JSON.stringify(executionResult.output.data).slice(0, 30) : 'Output ready'))
                  : String(executionResult.output)}
              </span>
              <span className="text-[9px] text-emerald-400 shrink-0 font-sans font-semibold underline">Expand</span>
            </div>
          ) : null}
        </div>
      )}

      {/* SPECIAL AI AGENT INTERIOR (n8n Style: Model, Memory, Tools Overview) */}
      {isAiAgent && (
        <div className="px-3 pb-5 pt-2 border-t border-purple-500/20 flex flex-col gap-2 bg-slate-950/50 rounded-b-2xl">
          {/* Agent Header Banner */}
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="flex items-center gap-1.5 text-purple-300 font-bold">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Agent (Tools & Reasoning)</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
              Autonomous
            </span>
          </div>

          {/* System Prompt Snippet */}
          <div className="text-[10px] text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 line-clamp-2 leading-relaxed">
            {node.config?.systemPrompt || 'Autonomous reasoning agent equipped with LLM model, conversational memory, and external tools.'}
          </div>

          {/* Connected Sub-Components Overview Strip */}
          <div className="grid grid-cols-3 gap-1.5 text-[9px] font-mono">
            {/* Model status */}
            <div
              className={`p-1.5 rounded-lg border text-center truncate ${
                modelSources.length > 0
                  ? 'bg-purple-950/40 border-purple-700/60 text-purple-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
              title={modelSources.length > 0 ? `Attached Model: ${modelSources.map((n) => n.name).join(', ')}` : 'Chat Model required'}
            >
              <div className="text-[8px] text-purple-400/80 font-bold uppercase tracking-wider">Model</div>
              <div className="font-bold truncate mt-0.5">
                {modelSources.length > 0 ? (
                  <span className="text-purple-300">✓ {modelSources[0].name.split(' ')[0]}</span>
                ) : onQuickAddSubNode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAddSubNode(node.id, 'model');
                    }}
                    className="text-purple-400 hover:text-purple-300 underline font-semibold cursor-pointer"
                  >
                    + Model
                  </button>
                ) : (
                  <span className="text-rose-400/80">Required</span>
                )}
              </div>
            </div>

            {/* Memory status */}
            <div
              className={`p-1.5 rounded-lg border text-center truncate ${
                memorySources.length > 0
                  ? 'bg-amber-950/40 border-amber-700/60 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
              title={memorySources.length > 0 ? `Attached Memory: ${memorySources.map((n) => n.name).join(', ')}` : 'Optional Conversation Memory'}
            >
              <div className="text-[8px] text-amber-400/80 font-bold uppercase tracking-wider">Memory</div>
              <div className="font-bold truncate mt-0.5">
                {memorySources.length > 0 ? (
                  <span className="text-amber-300">✓ Active</span>
                ) : onQuickAddSubNode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAddSubNode(node.id, 'memory');
                    }}
                    className="text-amber-400 hover:text-amber-300 underline font-semibold cursor-pointer"
                  >
                    + Memory
                  </button>
                ) : (
                  <span>Optional</span>
                )}
              </div>
            </div>

            {/* Tools status */}
            <div
              className={`p-1.5 rounded-lg border text-center truncate ${
                toolSources.length > 0
                  ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
              title={toolSources.length > 0 ? `Attached Tools: ${toolSources.map((n) => n.name).join(', ')}` : 'Optional External Tools'}
            >
              <div className="text-[8px] text-emerald-400/80 font-bold uppercase tracking-wider">Tools</div>
              <div className="font-bold truncate mt-0.5">
                {toolSources.length > 0 ? (
                  <span className="text-emerald-300">✓ {toolSources.length} Tool{toolSources.length > 1 ? 's' : ''}</span>
                ) : onQuickAddSubNode ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickAddSubNode(node.id, 'tool');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 underline font-semibold cursor-pointer"
                  >
                    + Tool
                  </button>
                ) : (
                  <span>Optional</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Ports (Left) - Compact Standard Layout */}
      <div className="absolute top-1/2 -left-2.5 -translate-y-1/2 flex flex-col gap-2.5 z-30">
        {(isAiAgent ? node.inputs.filter((p) => p.id === 'in_main') : node.inputs).map((port) => {
          const colors = getPortColorDef(port.type);
          const isConnectingActive = Boolean(activeConnectingPortType);
          const isSelfNode = activeConnectingNodeId === node.id;
          const isCompatible =
            isConnectingActive &&
            !isSelfNode &&
            isPortCompatible(activeConnectingPortType!, port.type, false);
          const isIncompatible = isConnectingActive && (!isCompatible || isSelfNode);
          const isConnected = getPortConnections(port.id, false).length > 0;

          // Clear short label for port
          let shortBadge = '';
          if (isAiAgent) {
            shortBadge = 'IN: Query';
          } else {
            shortBadge = port.label ? `IN: ${port.label}` : 'IN';
          }

          return (
            <div key={port.id} className="relative flex items-center">
              {/* Outer Port Dot matching exact point color */}
              <div
                id={`port-${node.id}-${port.id}`}
                data-port="true"
                data-node-id={node.id}
                data-port-id={port.id}
                data-is-output="false"
                data-is-compatible={isCompatible ? 'true' : 'false'}
                title={
                  isIncompatible
                    ? `❌ Incompatible: Requires ${colors.name}`
                    : isCompatible
                    ? `✓ Connect to ${port.label || port.name} (${colors.name})`
                    : `Input: ${port.label || port.name} (${colors.name}) - ${isConnected ? 'Connected' : 'Available'}`
                }
                className={`w-5 h-5 rounded-full bg-slate-900 border-2 transition-all flex items-center justify-center relative shadow-md shadow-black group/port cursor-pointer ${
                  isCompatible
                    ? `${colors.border} ring-3 ring-offset-1 ring-offset-slate-950 ${colors.ring} scale-110 z-40 animate-pulse`
                    : isIncompatible
                    ? 'opacity-30 border-slate-700 cursor-not-allowed scale-90'
                    : isConnected
                    ? `${colors.border} ring-1 ${colors.ring} hover:scale-110`
                    : `${colors.border} ${colors.hover} hover:scale-110`
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isIncompatible) return;
                  if (onConnectToThisNode) {
                    onConnectToThisNode(node.id, port.id);
                  } else {
                    onPortClick?.(node.id, port.id, false);
                  }
                }}
                onMouseUp={(e) => {
                  e.stopPropagation();
                  if (isIncompatible) return;
                  onPortMouseUp(node.id, port.id, false);
                }}
              >
                {/* Center dot in exact port point color */}
                <div
                  className={`w-2 h-2 rounded-full ${colors.bg} ${
                    isCompatible ? 'scale-110 bg-white' : ''
                  } group-hover/port:bg-white transition-colors shadow-xs`}
                />

                {/* Permanent or hover badge */}
                <span
                  className={`absolute right-7 text-[10px] font-mono tracking-tight px-2 py-0.5 rounded-lg border transition-all whitespace-nowrap pointer-events-none z-40 shadow-xl ${
                    isCompatible
                      ? 'opacity-100 bg-slate-950 border-cyan-400 text-white font-bold scale-105 shadow-cyan-500/30'
                      : isAiAgent || isSelected
                      ? 'opacity-100 bg-slate-950/95 border-slate-800 text-slate-300'
                      : 'opacity-0 group-hover/port:opacity-100 bg-slate-950/95 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold" style={{ color: colors.hex }}>{shortBadge}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* SPECIAL AI AGENT BOTTOM PORTS (n8n Style: Model, Memory, and Multi-Tool Sockets with Persistent '+' Terminal) */}
      {isAiAgent && (
        <div className="absolute -bottom-3 left-0 right-0 flex items-start justify-around px-2 z-30 pointer-events-auto">
          {/* 1. CHAT MODEL SUB-NODE (Single slot: Only 1 connection allowed) */}
          {(() => {
            const port = node.inputs.find((p) => p.id === 'in_model');
            if (!port) return null;
            const colors = getPortColorDef(port.type);
            const isConnectingActive = Boolean(activeConnectingPortType);
            const isSelfNode = activeConnectingNodeId === node.id;
            const connectedSources = getPortConnections(port.id, false);
            const isConnected = connectedSources.length > 0;
            // Sirf ek hi baar connection ban sakta hai: agar already connected hai to incompatible
            const isCompatible =
              isConnectingActive &&
              !isSelfNode &&
              !isConnected &&
              isPortCompatible(activeConnectingPortType!, port.type, false);
            const isIncompatible = isConnectingActive && (!isCompatible || isSelfNode || isConnected);
            const modelConn = connections.find((c) => c.toNodeId === node.id && c.toPortId === 'in_model');

            return (
              <div key="in_model" className="relative flex flex-col items-center group/bottomport">
                {/* Diamond Port Socket */}
                <div
                  id={`port-${node.id}-${port.id}`}
                  data-port="true"
                  data-node-id={node.id}
                  data-port-id={port.id}
                  data-is-output="false"
                  data-is-compatible={isCompatible ? 'true' : 'false'}
                  title={
                    isConnected
                      ? `Chat Model: 1/1 Connected (${connectedSources[0]?.name}) - Click 'x' to disconnect`
                      : isIncompatible
                      ? `❌ Incompatible: Requires Chat Model`
                      : isCompatible
                      ? `✓ Connect Chat Model (${colors.name})`
                      : `Chat Model (Available: 1 connection only)`
                  }
                  className={`w-5 h-5 rotate-45 rounded-xs bg-slate-900 border-2 transition-all flex items-center justify-center relative shadow-md shadow-black group/port cursor-pointer ${
                    isCompatible
                      ? `${colors.border} ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-125 z-40 animate-pulse`
                      : isIncompatible
                      ? 'opacity-30 border-slate-700 cursor-not-allowed scale-90'
                      : isConnected
                      ? `${colors.border} ring-1 ${colors.ring} hover:scale-125`
                      : `${colors.border} ${colors.hover} hover:scale-125`
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isIncompatible || isConnected) return;
                    if (onConnectToThisNode) {
                      onConnectToThisNode(node.id, port.id);
                    } else {
                      onPortClick?.(node.id, port.id, false);
                    }
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    if (isIncompatible || isConnected) return;
                    onPortMouseUp(node.id, port.id, false);
                  }}
                >
                  <div
                    className={`w-2 h-2 rounded-xs ${colors.bg} ${
                      isCompatible ? 'scale-125 bg-white' : ''
                    } group-hover/port:bg-white transition-colors shadow-sm`}
                  />
                </div>

                <div className="mt-1 flex items-center gap-0.5 text-[10px] font-sans font-medium tracking-tight text-slate-300 whitespace-nowrap">
                  <span>Chat Model</span>
                  <span className="text-rose-500 font-bold ml-0.5">*</span>
                  {isConnected && <span className="text-[9px] text-purple-400 font-mono ml-0.5">(1/1)</span>}
                </div>

                {isConnected && (
                  <div
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-800 text-purple-200 truncate max-w-[85px] mt-0.5 shadow-sm"
                    title={connectedSources[0]?.name}
                  >
                    <span className="truncate">{connectedSources[0]?.name.split(' ')[0]}</span>
                    {modelConn && onDeleteConnection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConnection(modelConn.id);
                        }}
                        className="text-purple-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
                        title="Disconnect Model"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Single connection indicator: when connected, show active dot; ONLY when empty, show '+' button */}
                {isConnected ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-purple-400 shadow-sm shadow-purple-500/70 ring-2 ring-purple-500/30 mt-1.5"
                    title="Chat Model: 1/1 Connected (Single connection only)"
                  />
                ) : (
                  <>
                    <div className="w-[1.5px] h-3 bg-slate-500/80 my-0.5" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnecting) {
                          if (onConnectToThisNode) {
                            onConnectToThisNode(node.id, port.id);
                          } else {
                            onPortClick?.(node.id, port.id, false);
                          }
                        } else {
                          onQuickAddSubNode?.(node.id, 'model');
                        }
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        if (isIncompatible) return;
                        onPortMouseUp(node.id, port.id, false);
                      }}
                      data-port="true"
                      data-node-id={node.id}
                      data-port-id={port.id}
                      data-is-output="false"
                      className="w-5 h-5 rounded-md bg-slate-800/95 hover:bg-slate-700 border border-slate-600/90 hover:border-purple-400 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 group/btn"
                      title="Add / Connect Chat Model (+)"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5] text-slate-300 group-hover/btn:text-purple-300" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* 2. MEMORY SUB-NODE (Single slot: Only 1 connection allowed) */}
          {(() => {
            const port = node.inputs.find((p) => p.id === 'in_memory');
            if (!port) return null;
            const colors = getPortColorDef(port.type);
            const isConnectingActive = Boolean(activeConnectingPortType);
            const isSelfNode = activeConnectingNodeId === node.id;
            const connectedSources = getPortConnections(port.id, false);
            const isConnected = connectedSources.length > 0;
            // Sirf ek hi baar connection ban sakta hai: agar already connected hai to incompatible
            const isCompatible =
              isConnectingActive &&
              !isSelfNode &&
              !isConnected &&
              isPortCompatible(activeConnectingPortType!, port.type, false);
            const isIncompatible = isConnectingActive && (!isCompatible || isSelfNode || isConnected);
            const memConn = connections.find((c) => c.toNodeId === node.id && c.toPortId === 'in_memory');

            return (
              <div key="in_memory" className="relative flex flex-col items-center group/bottomport">
                {/* Diamond Port Socket */}
                <div
                  id={`port-${node.id}-${port.id}`}
                  data-port="true"
                  data-node-id={node.id}
                  data-port-id={port.id}
                  data-is-output="false"
                  data-is-compatible={isCompatible ? 'true' : 'false'}
                  title={
                    isConnected
                      ? `Memory: 1/1 Connected (${connectedSources[0]?.name}) - Click 'x' to disconnect`
                      : isIncompatible
                      ? `❌ Incompatible: Requires Memory node`
                      : isCompatible
                      ? `✓ Connect Memory (${colors.name})`
                      : `Memory (Available: 1 connection only)`
                  }
                  className={`w-5 h-5 rotate-45 rounded-xs bg-slate-900 border-2 transition-all flex items-center justify-center relative shadow-md shadow-black group/port cursor-pointer ${
                    isCompatible
                      ? `${colors.border} ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-125 z-40 animate-pulse`
                      : isIncompatible
                      ? 'opacity-30 border-slate-700 cursor-not-allowed scale-90'
                      : isConnected
                      ? `${colors.border} ring-1 ${colors.ring} hover:scale-125`
                      : `${colors.border} ${colors.hover} hover:scale-125`
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isIncompatible || isConnected) return;
                    if (onConnectToThisNode) {
                      onConnectToThisNode(node.id, port.id);
                    } else {
                      onPortClick?.(node.id, port.id, false);
                    }
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    if (isIncompatible || isConnected) return;
                    onPortMouseUp(node.id, port.id, false);
                  }}
                >
                  <div
                    className={`w-2 h-2 rounded-xs ${colors.bg} ${
                      isCompatible ? 'scale-125 bg-white' : ''
                    } group-hover/port:bg-white transition-colors shadow-sm`}
                  />
                </div>

                <div className="mt-1 flex items-center gap-0.5 text-[10px] font-sans font-medium tracking-tight text-slate-300 whitespace-nowrap">
                  <span>Memory</span>
                  {isConnected && <span className="text-[9px] text-amber-400 font-mono ml-0.5">(1/1)</span>}
                </div>

                {isConnected && (
                  <div
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-800 text-amber-200 truncate max-w-[85px] mt-0.5 shadow-sm"
                    title={connectedSources[0]?.name}
                  >
                    <span className="truncate">{connectedSources[0]?.name.split(' ')[0]}</span>
                    {memConn && onDeleteConnection && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConnection(memConn.id);
                        }}
                        className="text-amber-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
                        title="Disconnect Memory"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                )}

                {/* Single connection indicator: when connected, show active dot; ONLY when empty, show '+' button */}
                {isConnected ? (
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-500/70 ring-2 ring-amber-500/30 mt-1.5"
                    title="Memory: 1/1 Connected (Single connection only)"
                  />
                ) : (
                  <>
                    <div className="w-[1.5px] h-3 bg-slate-500/80 my-0.5" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isConnecting) {
                          if (onConnectToThisNode) {
                            onConnectToThisNode(node.id, port.id);
                          } else {
                            onPortClick?.(node.id, port.id, false);
                          }
                        } else {
                          onQuickAddSubNode?.(node.id, 'memory');
                        }
                      }}
                      onMouseUp={(e) => {
                        e.stopPropagation();
                        if (isIncompatible) return;
                        onPortMouseUp(node.id, port.id, false);
                      }}
                      data-port="true"
                      data-node-id={node.id}
                      data-port-id={port.id}
                      data-is-output="false"
                      className="w-5 h-5 rounded-md bg-slate-800/95 hover:bg-slate-700 border border-slate-600/90 hover:border-amber-400 text-slate-300 hover:text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 group/btn"
                      title="Add / Connect Memory (+)"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5] text-slate-300 group-hover/btn:text-amber-300" />
                    </button>
                  </>
                )}
              </div>
            );
          })()}

          {/* 3. TOOLS SUB-NODES (Multiple tools connectable + Persistent empty '+' Terminal!) */}
          {(() => {
            const port = node.inputs.find((p) => p.id === 'in_tools');
            if (!port) return null;
            const colors = getPortColorDef('tool');
            const isConnectingActive = Boolean(activeConnectingPortType);
            const isSelfNode = activeConnectingNodeId === node.id;
            const isCompatible =
              isConnectingActive &&
              !isSelfNode &&
              isPortCompatible(activeConnectingPortType!, 'tool', false);
            const isIncompatible = isConnectingActive && (!isCompatible || isSelfNode);

            // All tool connections into this agent
            const currentToolConns = connections.filter(
              (c) => c.toNodeId === node.id && (c.toPortId === 'in_tools' || c.toPortId.startsWith('in_tools'))
            );

            return (
              <div key="in_tools_section" className="relative flex items-start gap-2.5 group/toolsection">
                {/* Render each connected tool in its own distinct socket with disconnect 'x' button */}
                {currentToolConns.map((tConn, idx) => {
                  const sourceNode = allNodes.find((n) => n.id === tConn.fromNodeId);
                  const toolName = sourceNode?.name || `Tool ${idx + 1}`;

                  return (
                    <div key={tConn.id} className="relative flex flex-col items-center group/toolsocket">
                      {/* Tool Socket Diamond (Wire from this tool lands right here!) */}
                      <div
                        id={`port-${node.id}-in_tools-${tConn.id}`}
                        data-port="true"
                        data-node-id={node.id}
                        data-port-id="in_tools"
                        data-conn-id={tConn.id}
                        data-is-output="false"
                        title={`Connected: ${toolName} - Click 'x' to disconnect`}
                        className={`w-5 h-5 rotate-45 rounded-xs bg-slate-900 border-2 ${colors.border} ring-1 ${colors.ring} flex items-center justify-center relative shadow-md shadow-black transition-all hover:scale-125 cursor-pointer`}
                      >
                        <div className={`w-2 h-2 rounded-xs ${colors.bg} shadow-sm`} />
                      </div>

                      <div className="mt-1 flex items-center gap-0.5 text-[10px] font-sans font-medium tracking-tight text-emerald-300 whitespace-nowrap">
                        <span>Tool {idx + 1}</span>
                      </div>

                      {/* Tool Name Pill with Disconnect 'x' */}
                      <div
                        className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-800 text-emerald-200 truncate max-w-[85px] mt-0.5 shadow-sm"
                        title={toolName}
                      >
                        <span className="truncate">{toolName.split(' ')[0]}</span>
                        {onDeleteConnection && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConnection(tConn.id);
                            }}
                            className="text-emerald-400 hover:text-white p-0.5 rounded cursor-pointer shrink-0"
                            title={`Disconnect ${toolName}`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>

                      <div className="w-[1.5px] h-3 bg-emerald-500/60 my-0.5" />

                      {/* Active indicator dot */}
                      <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-500/50" />
                    </div>
                  );
                })}

                {/* THE PERSISTENT EMPTY '+' TERMINAL (Always stays empty so multiple nodes can connect!) */}
                <div className="relative flex flex-col items-center group/emptyplus">
                  {/* Empty Port Diamond Socket (Accepts wire drops & clicks) */}
                  <div
                    id={`port-${node.id}-in_tools`}
                    data-port="true"
                    data-node-id={node.id}
                    data-port-id="in_tools"
                    data-is-output="false"
                    data-is-compatible={isCompatible ? 'true' : 'false'}
                    title={
                      isIncompatible
                        ? `❌ Incompatible: Requires a tool node or action`
                        : isCompatible
                        ? `✓ Connect Tool (${colors.name})`
                        : `Tools Terminal (+ Available) - Connect any node as tool`
                    }
                    className={`w-5 h-5 rotate-45 rounded-xs bg-slate-900 border-2 transition-all flex items-center justify-center relative shadow-md shadow-black group/port cursor-pointer ${
                      isCompatible
                        ? `${colors.border} ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-125 z-40 animate-pulse`
                        : isIncompatible
                        ? 'opacity-30 border-slate-700 cursor-not-allowed scale-90'
                        : `${colors.border} ${colors.hover} hover:scale-125 border-dashed`
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isIncompatible) return;
                      if (onConnectToThisNode) {
                        onConnectToThisNode(node.id, 'in_tools');
                      } else {
                        onPortClick?.(node.id, 'in_tools', false);
                      }
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      if (isIncompatible) return;
                      onPortMouseUp(node.id, 'in_tools', false);
                    }}
                  >
                    <div
                      className={`w-2 h-2 rounded-xs ${colors.bg} ${
                        isCompatible ? 'scale-125 bg-white' : ''
                      } group-hover/port:bg-white transition-colors shadow-sm`}
                    />
                  </div>

                  <div className="mt-1 flex items-center gap-0.5 text-[10px] font-sans font-medium tracking-tight text-slate-300 whitespace-nowrap">
                    <span>{currentToolConns.length > 0 ? '+ Tool' : 'Tools'}</span>
                  </div>

                  {currentToolConns.length === 0 && (
                    <div className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-950/90 border border-slate-800 text-slate-400 mt-0.5">
                      Empty
                    </div>
                  )}

                  <div className="w-[1.5px] h-3 bg-slate-500/80 my-0.5" />

                  {/* Square '+' Terminal Button (Always stays available & empty so multiple nodes can connect) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isConnecting) {
                        if (onConnectToThisNode) {
                          onConnectToThisNode(node.id, 'in_tools');
                        } else {
                          onPortClick?.(node.id, 'in_tools', false);
                        }
                      } else {
                        onQuickAddSubNode?.(node.id, 'tool');
                      }
                    }}
                    onMouseUp={(e) => {
                      e.stopPropagation();
                      if (isIncompatible) return;
                      onPortMouseUp(node.id, 'in_tools', false);
                    }}
                    data-port="true"
                    data-node-id={node.id}
                    data-port-id="in_tools"
                    data-is-output="false"
                    className="w-5.5 h-5.5 rounded-md bg-slate-800/95 hover:bg-slate-700 border border-dashed border-emerald-500/80 hover:border-emerald-400 text-emerald-300 hover:text-white flex items-center justify-center text-xs font-bold shadow-md cursor-pointer transition-all hover:scale-110 active:scale-95 group/btn"
                    title="Add / Connect another Tool (+) - Drops here"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5] text-emerald-300 group-hover/btn:text-white" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Output Ports (Right) with Protruding Outward '+' Terminal (Compact Standard) */}
      <div className="absolute top-1/2 -right-5 -translate-y-1/2 flex flex-col gap-2.5 z-20 pointer-events-auto">
        {node.outputs.map((port) => {
          const colors = getPortColorDef(port.type);
          const isDraggingThis = isConnecting && activeConnectingNodeId === node.id;
          const isConnectingActive = Boolean(activeConnectingPortType);
          const isConnected = getPortConnections(port.id, true).length > 0;

          let shortBadge = '';
          if (isAiAgent) {
            shortBadge = 'OUT: Response →';
          } else if (node.type.startsWith('ai_model_')) {
            shortBadge = 'OUT: Model →';
          } else if (node.type.startsWith('ai_memory_')) {
            shortBadge = 'OUT: Memory →';
          } else if (node.type.startsWith('ai_tool_')) {
            shortBadge = 'OUT: Tool →';
          } else if (node.type === 'logic_if') {
            shortBadge = port.id === 'out_true' ? 'TRUE ✓' : 'FALSE ✗';
          } else {
            shortBadge = port.label ? `OUT: ${port.label} →` : 'OUT →';
          }

          return (
            <div key={port.id} className="relative flex items-center group/outport">
              {/* Horizontal Stem / Arm bridging from node body to protruding terminal */}
              <div className="w-2 h-[1.5px] bg-slate-600/90 group-hover/outport:bg-cyan-400/80 transition-colors shadow-xs" />

              {/* Protruding '+' Terminal Button (Extended outward from node) */}
              <button
                type="button"
                id={`port-${node.id}-${port.id}`}
                data-port="true"
                data-node-id={node.id}
                data-port-id={port.id}
                data-is-output="true"
                title={`Output: ${port.label || port.name} (${colors.name}) - Click or drag to connect wire to another node (IN)`}
                className={`w-5 h-5 rounded-full bg-slate-900 border-2 ${colors.border} transition-all flex items-center justify-center shadow-md shadow-black relative cursor-pointer z-10 group/btn ${
                  isDraggingThis
                    ? `ring-3 ring-offset-1 ring-offset-slate-950 ${colors.ring} scale-110 z-40 animate-pulse`
                    : isConnectingActive
                    ? 'opacity-40 cursor-default'
                    : isConnected
                    ? `ring-1 ${colors.ring} hover:scale-110 hover:border-white shadow-cyan-500/40`
                    : `${colors.hover} hover:scale-110 hover:border-white hover:shadow-cyan-500/50`
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
                {/* Bold Plus Icon inside protruding terminal */}
                <Plus
                  className={`w-3 h-3 stroke-[2.5] text-slate-300 group-hover/btn:text-white group-hover/btn:scale-105 transition-transform ${
                    isConnected ? 'text-cyan-300' : ''
                  }`}
                  style={{ color: isConnected ? colors.hex : undefined }}
                />

                {/* Permanent or hover badge */}
                <span
                  className={`absolute left-8 text-[10px] font-mono tracking-tight px-2 py-0.5 rounded-lg border transition-all whitespace-nowrap pointer-events-none z-40 shadow-xl ${
                    isAiAgent || isSelected || node.type === 'logic_if' || node.type.startsWith('ai_')
                      ? 'opacity-100 bg-slate-950/95 border-slate-800 text-slate-300'
                      : 'opacity-0 group-hover/outport:opacity-100 bg-slate-950/95 border-slate-800 text-slate-300'
                  }`}
                >
                  <span className="font-bold" style={{ color: colors.hex }}>{shortBadge}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
