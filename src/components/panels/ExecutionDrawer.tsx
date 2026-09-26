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
  ArrowRight
} from 'lucide-react';
import { Execution, ExecutionNodeResult } from '../../types/workflow';

interface ExecutionDrawerProps {
  isOpen: boolean;
  execution: Execution | null;
  onClose: () => void;
  onReRun?: () => void;
}

export const ExecutionDrawer: React.FC<ExecutionDrawerProps> = ({
  isOpen,
  execution,
  onClose,
  onReRun,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'output' | 'input' | 'logs'>('output');

  if (!isOpen || !execution) return null;

  const nodeResultsList = Object.values(execution.nodeResults || {});
  const activeNodeResult: ExecutionNodeResult | undefined =
    selectedNodeId
      ? execution.nodeResults[selectedNodeId]
      : nodeResultsList[0];

  return (
    <div className="absolute bottom-0 left-0 right-0 h-80 bg-slate-900/98 backdrop-blur-xl border-t border-slate-800 shadow-2xl z-25 flex flex-col text-slate-100 animate-in slide-in-from-bottom duration-200">
      {/* Drawer Header */}
      <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <span className="text-xs font-bold text-white font-mono tracking-tight mr-2">
                Execution #{execution.id.replace('exec_', '').slice(0, 8)}
              </span>
              <span className="text-[11px] text-slate-400">
                Trigger: <strong className="text-slate-200 uppercase">{execution.triggerType}</strong>
              </span>
            </div>
          </div>

          <div className="h-4 w-[1px] bg-slate-800" />

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            {execution.status === 'running' && (
              <span className="flex items-center gap-1 text-xs text-cyan-400 font-medium bg-cyan-950/80 px-2.5 py-1 rounded-full border border-cyan-800 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Running Workflow...</span>
              </span>
            )}
            {execution.status === 'success' && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Success</span>
              </span>
            )}
            {execution.status === 'failed' && (
              <span className="flex items-center gap-1 text-xs text-rose-400 font-medium bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-800">
                <XCircle className="w-3.5 h-3.5" />
                <span>Failed</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Total Time: </span>
            <strong className="text-cyan-400">
              {execution.durationMs !== undefined ? `${(execution.durationMs / 1000).toFixed(2)}s` : '...'}
            </strong>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReRun && (
            <button
              onClick={onReRun}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Re-run
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Body: Left Step Timeline, Right Payload Inspector */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Step Nodes Timeline */}
        <div className="w-80 border-r border-slate-800/80 p-3 overflow-y-auto space-y-1.5 bg-slate-950/40">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 px-2 block mb-1">
            Executed Steps ({nodeResultsList.length})
          </span>

          {nodeResultsList.map((step) => {
            const isSelected = activeNodeResult?.nodeId === step.nodeId;

            return (
              <div
                key={step.nodeId}
                onClick={() => setSelectedNodeId(step.nodeId)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200'
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

        {/* Right: Step Deep-Dive Inspector */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-900/40">
          {/* Sub-Tabs: Output, Input, Logs */}
          <div className="flex items-center border-b border-slate-800 px-4 bg-slate-950/60 text-xs gap-3">
            <button
              onClick={() => setActiveTab('output')}
              className={`py-2 font-medium border-b-2 transition ${
                activeTab === 'output' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Output JSON
            </button>
            <button
              onClick={() => setActiveTab('input')}
              className={`py-2 font-medium border-b-2 transition ${
                activeTab === 'input' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Input JSON
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-2 font-medium border-b-2 transition ${
                activeTab === 'logs' ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Console Logs ({execution.logs?.length || 0})
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'output' && (
              <div>
                {activeNodeResult?.error && (
                  <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs mb-3 font-mono">
                    <strong>Error: </strong> {activeNodeResult.error}
                  </div>
                )}
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                  {JSON.stringify(activeNodeResult?.output || { status: activeNodeResult?.status || 'waiting' }, null, 2)}
                </pre>
              </div>
            )}

            {activeTab === 'input' && (
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] font-mono text-slate-200 overflow-x-auto leading-relaxed select-text">
                {JSON.stringify(activeNodeResult?.input || {}, null, 2)}
              </pre>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-1.5 font-mono text-[11px]">
                {execution.logs?.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 text-slate-300">
                    <span className="text-slate-500 shrink-0">[{l.timestamp.split('T')[1].slice(0, 8)}]</span>
                    <span
                      className={`shrink-0 font-bold uppercase text-[10px] px-1 rounded ${
                        l.level === 'error' ? 'bg-rose-950 text-rose-400' : 'bg-cyan-950 text-cyan-400'
                      }`}
                    >
                      {l.level}
                    </span>
                    <span className="break-all">{l.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
