import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Terminal,
  Activity,
  Layers,
  ArrowRight,
  Stethoscope,
  Bot,
  Sparkles,
  Maximize2,
  Minimize2,
  MessageSquare
} from 'lucide-react';
import { Execution, ExecutionNodeResult } from '../../types/workflow';
import { NodeDataInspector } from '../common/NodeDataInspector';

interface ExecutionDrawerProps {
  isOpen: boolean;
  execution: Execution | null;
  onClose: () => void;
  onReRun?: () => void;
  onOpenEiDoctor?: () => void;
  onOpenChat?: () => void;
  hasChatTrigger?: boolean;
}

export const ExecutionDrawer: React.FC<ExecutionDrawerProps> = ({
  isOpen,
  execution,
  onClose,
  onReRun,
  onOpenEiDoctor,
  onOpenChat,
  hasChatTrigger = false,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'steps' | 'inspector' | 'logs'>('steps');
  const [drawerHeight, setDrawerHeight] = useState<'compact' | 'normal' | 'expanded'>('normal');

  if (!isOpen || !execution) return null;

  const nodeResultsList = Object.values(execution.nodeResults || {});
  const activeNodeResult: ExecutionNodeResult | undefined =
    selectedNodeId
      ? execution.nodeResults[selectedNodeId]
      : nodeResultsList[0];

  const heightClass =
    drawerHeight === 'compact'
      ? 'h-14'
      : drawerHeight === 'expanded'
      ? 'h-[85vh]'
      : 'h-96 sm:h-84';

  return (
    <div className={`fixed bottom-0 left-0 right-0 ${heightClass} bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 shadow-2xl z-30 flex flex-col text-slate-100 transition-all duration-200 animate-in slide-in-from-bottom`}>
      {/* Drawer Header */}
      <div className="px-3 sm:px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 shrink-0">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white font-mono tracking-tight mr-1.5">
                #{execution.id.replace('exec_', '').slice(0, 8)}
              </span>
              <span className="text-[10px] sm:text-[11px] text-slate-400">
                <strong className="text-slate-200 uppercase">{execution.triggerType}</strong>
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 shrink-0 hidden sm:block" />

          {/* Status Badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {execution.status === 'running' && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-cyan-400 font-medium bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-800 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden sm:inline">Running...</span>
              </span>
            )}
            {execution.status === 'success' && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-emerald-400 font-medium bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3 h-3" />
                <span>Success</span>
              </span>
            )}
            {execution.status === 'failed' && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs text-rose-400 font-medium bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                <XCircle className="w-3 h-3" />
                <span>Failed</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono shrink-0 hidden sm:flex">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Time: </span>
            <strong className="text-cyan-400">
              {execution.durationMs !== undefined ? `${(execution.durationMs / 1000).toFixed(2)}s` : '...'}
            </strong>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {hasChatTrigger && onOpenChat && (
            <button
              onClick={onOpenChat}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 font-semibold text-xs shadow-xs transition cursor-pointer"
              title="Open Live Chat Box to test Chat Trigger"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Test Chat Box</span>
            </button>
          )}

          {onOpenEiDoctor && (
            <button
              onClick={onOpenEiDoctor}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-semibold text-xs shadow-xs transition cursor-pointer"
              title="Inspect & Repair with Build-Ai"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Build-Ai</span>
            </button>
          )}

          {onReRun && (
            <button
              onClick={onReRun}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
            >
              Re-run
            </button>
          )}

          {/* Height Expand/Collapse */}
          <button
            onClick={() => {
              if (drawerHeight === 'compact') setDrawerHeight('normal');
              else if (drawerHeight === 'normal') setDrawerHeight('expanded');
              else setDrawerHeight('normal');
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title={drawerHeight === 'expanded' ? 'Restore height' : 'Expand drawer'}
          >
            {drawerHeight === 'expanded' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {drawerHeight !== 'compact' && (
        <>
          {/* Mobile Tab Switcher: Steps | Data Inspector | Console Logs */}
          <div className="flex sm:hidden items-center border-b border-slate-800 bg-slate-950/80 text-xs px-3 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab('steps')}
              className={`py-2 px-2 font-medium border-b-2 transition ${
                mobileTab === 'steps' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400'
              }`}
            >
              Steps ({nodeResultsList.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('inspector')}
              className={`py-2 px-2 font-medium border-b-2 transition ${
                mobileTab === 'inspector' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400'
              }`}
            >
              Data (Table / JSON / Schema)
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('logs')}
              className={`py-2 px-2 font-medium border-b-2 transition ${
                mobileTab === 'logs' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400'
              }`}
            >
              Logs ({execution.logs?.length || 0})
            </button>
          </div>

          {/* Drawer Body: Responsive for Mobile and PC */}
          <div className="flex-1 min-h-0 flex overflow-hidden">
            {/* Left: Step Nodes Timeline (Always visible on PC, toggled on mobile) */}
            <div
              className={`w-full sm:w-72 md:w-80 border-r border-slate-800/80 p-2 sm:p-3 overflow-y-auto space-y-1.5 bg-slate-950/40 shrink-0 ${
                mobileTab === 'steps' ? 'block' : 'hidden sm:block'
              }`}
            >
              <div className="flex items-center justify-between px-2 mb-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">
                  Executed Steps ({nodeResultsList.length})
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Click to inspect</span>
              </div>

              {nodeResultsList.map((step) => {
                const isSelected = activeNodeResult?.nodeId === step.nodeId;

                return (
                  <div
                    key={step.nodeId}
                    onClick={() => {
                      setSelectedNodeId(step.nodeId);
                      setMobileTab('inspector'); // On mobile, automatically show inspector when step clicked
                    }}
                    className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 shadow-xs'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {step.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      {step.status === 'running' && <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />}
                      {step.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                      {step.status === 'skipped' && <div className="w-2 h-2 rounded-full bg-slate-600 ml-1 mr-1 shrink-0" />}

                      <div className="min-w-0">
                        <span className="font-semibold block truncate">{step.nodeName}</span>
                        <span className="text-[10px] font-mono text-slate-500 block truncate">{step.nodeType}</span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {step.durationMs !== undefined ? `${step.durationMs}ms` : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Right: n8n-Style Node Data Inspector (Table / JSON / Schema) */}
            <div
              className={`flex-1 min-w-0 flex flex-col overflow-hidden bg-slate-900/40 p-2 sm:p-3 ${
                mobileTab === 'inspector' ? 'block' : 'hidden sm:block'
              }`}
            >
              {activeNodeResult ? (
                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{activeNodeResult.nodeName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {activeNodeResult.nodeType}
                      </span>
                    </div>
                    {activeNodeResult.durationMs !== undefined && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Execution: {activeNodeResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-h-0">
                    <NodeDataInspector
                      inputData={activeNodeResult.input}
                      outputData={activeNodeResult.output}
                      error={activeNodeResult.error}
                      initialDirection="output"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-slate-500">
                  <Layers className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="text-xs text-slate-400">Select a step on the left to inspect data.</p>
                </div>
              )}
            </div>

            {/* Mobile Tab 3: Console Logs */}
            <div
              className={`flex-1 min-w-0 overflow-y-auto p-3 font-mono text-xs bg-slate-950/80 ${
                mobileTab === 'logs' ? 'block' : 'hidden'
              }`}
            >
              <div className="space-y-1.5">
                {execution.logs?.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 shrink-0">[{l.timestamp.split('T')[1]?.slice(0, 8)}]</span>
                    <span
                      className={`shrink-0 font-bold uppercase text-[9px] px-1 rounded ${
                        l.level === 'error' ? 'bg-rose-950 text-rose-400' : 'bg-cyan-950 text-cyan-400'
                      }`}
                    >
                      {l.level}
                    </span>
                    <span className="break-all">{l.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
