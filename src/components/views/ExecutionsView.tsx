import React, { useState } from 'react';
import { History, CheckCircle2, XCircle, Loader2, Clock, Search, ChevronRight, Eye, X } from 'lucide-react';
import { Execution } from '../../types/workflow';

interface ExecutionsViewProps {
  executions: Execution[];
  onOpenWorkflow: (wfId: string) => void;
}

export const ExecutionsView: React.FC<ExecutionsViewProps> = ({ executions, onOpenWorkflow }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed' | 'running'>('all');
  const [search, setSearch] = useState('');
  const [inspectExecution, setInspectExecution] = useState<Execution | null>(null);

  const filtered = executions.filter((e) => {
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchesSearch =
      e.workflowName.toLowerCase().includes(search.toLowerCase()) ||
      e.id.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <History className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Execution Audit History</h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time execution telemetry, duration benchmarks, and payload diagnostics
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterStatus === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Runs ({executions.length})
          </button>
          <button
            onClick={() => setFilterStatus('success')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Success ({executions.filter((e) => e.status === 'success').length})
          </button>
          <button
            onClick={() => setFilterStatus('failed')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              filterStatus === 'failed' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Failed ({executions.filter((e) => e.status === 'failed').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Workflow</th>
              <th className="px-5 py-3">Trigger</th>
              <th className="px-5 py-3">Duration</th>
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No execution logs recorded matching current criteria.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setInspectExecution(e)}
                  className="hover:bg-slate-800/40 transition cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    {e.status === 'success' && (
                      <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Success</span>
                      </span>
                    )}
                    {e.status === 'failed' && (
                      <span className="flex items-center gap-1.5 text-rose-400 font-mono text-[11px] font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}
                    {e.status === 'running' && (
                      <span className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px] font-semibold animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Running</span>
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-white">
                    {e.workflowName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {e.triggerType}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                    {e.durationMs !== undefined ? `${(e.durationMs / 1000).toFixed(2)}s` : '...'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {new Date(e.startedAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button className="p-1 hover:text-cyan-400 text-slate-400">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect Modal */}
      {inspectExecution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-3xl h-[560px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100">
            <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">
                  Execution Diagnostic: {inspectExecution.workflowName}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  ID: {inspectExecution.id} • Trigger: {inspectExecution.triggerType.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setInspectExecution(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
              <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                Executed Steps Output
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(inspectExecution.nodeResults, null, 2)}
              </pre>

              <span className="text-[10px] uppercase font-bold text-cyan-400 block pt-2">
                Execution Logs
              </span>
              <div className="space-y-1">
                {inspectExecution.logs.map((log, i) => (
                  <div key={i} className="text-[11px] text-slate-300">
                    <span className="text-slate-500 mr-2">[{log.timestamp}]</span>
                    <span className={log.level === 'error' ? 'text-rose-400' : 'text-slate-200'}>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
