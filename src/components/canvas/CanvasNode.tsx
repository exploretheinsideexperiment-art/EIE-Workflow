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
import { WorkflowNodeData, ExecutionNodeResult, NodePort } from '../../types/workflow';
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

  return (
    <div
      ref={nodeRef}
      id={`node-${node.id}`}
      style={{
        transform: `translate(${node.position.x}px, ${node.position.y}px)`,
        width: isExpanded ? (isAiAgent ? '420px' : '390px') : isAiAgent ? '280px' : '264px',
        touchAction: 'none',
      }}
      className={`absolute select-none rounded-2xl bg-slate-900/98 backdrop-blur-xl border transition-all duration-150 group cursor-move ${
        isConnectTargetCandidate
          ? 'border-emerald-400 ring-4 ring-emerald-500/50 shadow-2xl shadow-emerald-500/30 scale-[1.03] cursor-pointer z-30'
          : borderGlowClass
      }`}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        if (isConnectTargetCandidate && onConnectToThisNode) {
          e.stopPropagation();
          onConnectToThisNode(node.id);
          return;
        }
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('[data-port="true"]') || target.closest('input')) {
          e.stopPropagation();
          return;
        }
        e.stopPropagation();
        onStartDrag?.(node.id, e.clientX, e.clientY, e.shiftKey || e.metaKey || e.ctrlKey);
      }}
      onTouchStart={(e) => {
        if (isConnectTargetCandidate && onConnectToThisNode) {
          e.stopPropagation();
          onConnectToThisNode(node.id);
          return;
        }
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
        if (isConnectTargetCandidate && onConnectToThisNode) {
          onConnectToThisNode(node.id);
          return;
        }
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
      {/* Target Candidate Floating Badge (for effortless click-to-connect) */}
      {isConnectTargetCandidate && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onConnectToThisNode?.(node.id);
          }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-slate-950 font-black text-[11px] shadow-2xl flex items-center gap-1.5 z-40 cursor-pointer animate-bounce hover:scale-110 active:scale-95 transition whitespace-nowrap"
        >
          <Zap className="w-3.5 h-3.5 fill-current text-slate-950" />
          <span>Click to Connect</span>
        </div>
      )}

      {/* n8n Floating Hover Action Bar */}
      <div className="absolute -top-9 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-between pointer-events-none z-30">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-xl pointer-events-auto">
          {onStartConnectFromNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStartConnectFromNode(node.id);
              }}
              className="p-1 rounded-lg hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 transition cursor-pointer"
              title="Click to Connect this node to another step"
            >
              <Link2 className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          )}

          {onTestSingleNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTestSingleNode(node);
              }}
              className="p-1 rounded-lg hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
              title="Execute / Test Step (n8n)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          {onToggleDisableNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleDisableNode(node.id);
              }}
              className={`p-1 rounded-lg transition cursor-pointer ${
                node.disabled ? 'text-amber-400 hover:bg-amber-500/20' : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800'
              }`}
              title={node.disabled ? 'Enable Node' : 'Disable / Mute Node (Bypass)'}
            >
              <Power className="w-3.5 h-3.5" />
            </button>
          )}

          {onPinDataNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPinDataNode(node.id);
              }}
              className={`p-1 rounded-lg transition cursor-pointer ${
                node.pinnedData ? 'text-purple-400 bg-purple-500/20' : 'text-slate-300 hover:text-purple-300 hover:bg-slate-800'
              }`}
              title={node.pinnedData ? 'Unpin Data' : 'Pin Test Data (n8n)'}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleExpandNode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpandNode(node.id);
              }}
              className={`p-1 rounded-lg transition cursor-pointer ${
                isExpanded ? 'text-cyan-400 bg-cyan-500/20' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800'
              }`}
              title={isExpanded ? 'Collapse Node Card' : 'Expand Node Card Details'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/95 border border-slate-700/90 shadow-xl pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicateNode(node.id);
            }}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Duplicate Node"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition cursor-pointer"
            title="Delete Node"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-center justify-between border-b border-slate-800/80">
        <div
          className="flex items-center gap-2.5 min-w-0 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onOpenConfig(node.id);
          }}
          title="Click to open full settings"
        >
          <div className={`p-1.5 rounded-xl ${catStyle.bg} ${catStyle.text} border ${catStyle.border} shrink-0`}>
            <IconComponent className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-100 truncate tracking-tight flex items-center gap-1.5">
              <span>{node.name}</span>
            </h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[9px] font-mono uppercase tracking-wider ${catStyle.text}`}>
                {isAiAgent ? 'Autonomous Agent' : isAiTool ? 'Agent Tool' : node.category}
              </span>
              {node.disabled && (
                <span className="text-[9px] font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">
                  Disabled
                </span>
              )}
              {node.pinnedData && (
                <span className="text-[9px] font-bold text-purple-300 bg-purple-950/80 px-1.5 py-0.2 rounded border border-purple-600/40">
                  📌 Pinned
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1 shrink-0">
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
                  <span>{executionResult.durationMs !== undefined ? `${executionResult.durationMs}ms` : 'Done'}</span>
                </span>
              )}
              {executionResult.status === 'failed' && (
                <span className="flex items-center gap-1 text-[9px] text-rose-400 font-mono bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                  <X className="w-2.5 h-2.5" />
                  <span>Error</span>
                </span>
              )}
              {executionResult.status === 'skipped' && (
                <span className="text-[9px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                  Skipped
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
              className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition cursor-pointer"
              title={isExpanded ? 'Collapse' : 'Expand Node Details'}
            >
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                className={`p-1 rounded-lg transition cursor-pointer flex items-center gap-0.5 ${
                  showConnectPopover
                    ? 'bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800'
                }`}
                title="Connect this node to another step"
                aria-label="Connect"
              >
                <Link2 className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              {/* Connect Popover Menu */}
              {showConnectPopover && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-full mt-2 w-56 p-2 rounded-xl bg-slate-950/98 border border-slate-700 shadow-2xl z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 text-left"
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
                    <MousePointer className="w-3.5 h-3.5 text-cyan-400" />
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
                          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
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
            className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 active:scale-95 transition cursor-pointer"
            title="Configure parameters & settings"
            aria-label="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Node Body & Subtitle */}
      <div className="px-3.5 py-2 text-[11px] text-slate-400 font-mono truncate flex items-center justify-between">
        <span className="truncate" title={subtitle}>{subtitle}</span>
        {node.credentialId && (
          <span title="Credential Connected">
            <KeyRound className="w-3 h-3 text-cyan-400 shrink-0 ml-1.5" />
          </span>
        )}
      </div>

      {/* Note Pill (n8n feature) */}
      {node.notes && (
        <div className="mx-3 mb-2 p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5">
          <FileText className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
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
                <span>Test Step</span>
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
                    title="Fix this error with AI Fixer"
                  >
                    <Bot className="w-2.5 h-2.5 text-cyan-400" />
                    <span>AI Fixer</span>
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
            {onQuickAddSubNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddSubNode(node.id, 'model');
                }}
                className="text-[9px] bg-purple-800/60 hover:bg-purple-700 text-purple-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Attach Chat Model"
              >
                + Model
              </button>
            )}
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
            {onQuickAddSubNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddSubNode(node.id, 'memory');
                }}
                className="text-[9px] bg-amber-800/60 hover:bg-amber-700 text-amber-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Attach Buffer Memory"
              >
                + Memory
              </button>
            )}
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
            {onQuickAddSubNode && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickAddSubNode(node.id, 'tool');
                }}
                className="text-[9px] bg-emerald-800/60 hover:bg-emerald-700 text-emerald-200 px-1.5 py-0.5 rounded cursor-pointer transition"
                title="Attach Agent Tool"
              >
                + Tool
              </button>
            )}
          </div>
        </div>
      )}

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
      <div className="absolute top-1/2 -right-3 -translate-y-1/2 flex flex-col gap-2.5 z-20">
        {node.outputs.map((port) => {
          const colors = getPortColorDef(port.type);
          const isDraggingThis = isConnecting && activeConnectingNodeId === node.id;
          const isConnectingActive = Boolean(activeConnectingPortType);

          return (
            <div key={port.id} className="relative flex items-center">
              {/* Output Port Dot - Large comfortable hit target */}
              <div
                id={`port-${node.id}-${port.id}`}
                data-port="true"
                title={`Output: ${port.label || port.name} (${colors.name}) - Click or drag to connect`}
                className={`w-6 h-6 rounded-full bg-slate-900 border-2 ${colors.border} transition-all flex items-center justify-center shadow-lg shadow-black group/port relative cursor-pointer ${
                  isDraggingThis
                    ? `ring-4 ring-offset-2 ring-offset-slate-950 ${colors.ring} scale-125 z-20`
                    : isConnectingActive
                    ? 'opacity-40 cursor-default'
                    : `${colors.hover} hover:scale-125 hover:border-white hover:shadow-cyan-500/50`
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
                <div className={`w-2 h-2 rounded-full ${colors.bg} group-hover/port:bg-white transition-colors`} />
                <span className="absolute left-7 text-[10px] font-mono tracking-tight text-cyan-200 bg-slate-950/95 px-2 py-0.5 rounded-lg border border-cyan-800 opacity-0 group-hover/port:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30 shadow-xl">
                  {port.label || 'Click to Connect'}
                </span>
              </div>

              {/* Quick Connect '+' Button (n8n style) */}
              <button
                type="button"
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
