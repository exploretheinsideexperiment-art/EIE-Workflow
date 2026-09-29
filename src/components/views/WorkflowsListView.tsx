import React, { useState } from 'react';
import {
  Workflow as WorkflowIcon,
  Plus,
  Play,
  Copy,
  Trash2,
  Radio,
  Search,
  ArrowUpRight,
  Clock,
  CheckCircle,
  FileCode,
  Download,
  Upload,
  LayoutTemplate
} from 'lucide-react';
import { Workflow } from '../../types/workflow';

interface WorkflowsListViewProps {
  workflows: Workflow[];
  onOpenWorkflow: (wfId: string) => void;
  onCreateWorkflow: () => void;
  onOpenTemplates: () => void;
  onToggleActive: (wfId: string) => void;
  onDuplicateWorkflow: (wfId: string) => void;
  onDeleteWorkflow: (wfId: string) => void;
  onImportWorkflow: (importedWf: any) => void;
}

export const WorkflowsListView: React.FC<WorkflowsListViewProps> = ({
  workflows,
  onOpenWorkflow,
  onCreateWorkflow,
  onOpenTemplates,
  onToggleActive,
  onDuplicateWorkflow,
  onDeleteWorkflow,
  onImportWorkflow,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filtered = workflows.filter((wf) => {
    const matchesSearch =
      wf.name.toLowerCase().includes(search.toLowerCase()) ||
      wf.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && wf.active) ||
      (statusFilter === 'inactive' && !wf.active);
    return matchesSearch && matchesStatus;
  });

  const handleExportJSON = (wf: Workflow) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(wf, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${wf.name.toLowerCase().replace(/\s+/g, '_')}.eie.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        onImportWorkflow(parsed);
      } catch (err) {
        console.error('Invalid workflow JSON file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Workflows</h1>
          <p className="text-xs text-slate-400">Manage and automate event triggers, AI agents, and integrations</p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>

          <button
            onClick={onOpenTemplates}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Templates</span>
          </button>

          <button
            onClick={onCreateWorkflow}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Create Workflow</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search workflows by name or description..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({workflows.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'active' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active ({workflows.filter((w) => w.active).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'inactive' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Workflows Grid / Cards */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
            <WorkflowIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Start building your first workflow.</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Automate tasks with triggers, HTTP APIs, Gemini AI models, and communication channels on a blank infinite canvas.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onCreateWorkflow}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 transition"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>+ Create Workflow</span>
            </button>
            <button
              onClick={onOpenTemplates}
              className="px-4 py-2 rounded-xl border border-slate-700 bg-slate-900 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
            >
              Browse Templates
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((wf) => (
            <div
              key={wf.id}
              onClick={() => onOpenWorkflow(wf.id)}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/60 hover:bg-slate-900 transition flex flex-col justify-between group cursor-pointer shadow-lg hover:shadow-cyan-950/20"
            >
              <div>
                {/* Header Status & Nodes Count */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleActive(wf.id);
                      }}
                      className={`flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full border cursor-pointer ${
                        wf.active
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                      title="Click to toggle active/inactive"
                    >
                      <Radio className={`w-2.5 h-2.5 ${wf.active ? 'animate-pulse' : ''}`} />
                      <span>{wf.active ? 'Active' : 'Inactive'}</span>
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500">
                    {wf.nodes.length} nodes
                  </span>
                </div>

                {/* Workflow Title & Description */}
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition tracking-tight line-clamp-1">
                  {wf.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {wf.description || 'No description provided.'}
                </p>
              </div>

              {/* Stats Footer & Actions */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span>{wf.executionCount || 0} runs</span>
                  <span>•</span>
                  <span>{wf.lastExecutedAt ? new Date(wf.lastExecutedAt).toLocaleDateString() : 'Never run'}</span>
                </div>

                <div className="flex items-center gap-1 opacity-100 sm:opacity-80 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportJSON(wf);
                    }}
                    className="p-1.5 hover:text-cyan-300 text-slate-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Export JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateWorkflow(wf.id);
                    }}
                    className="p-1.5 hover:text-cyan-300 text-slate-400 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    title="Duplicate Workflow"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteWorkflow(wf.id);
                    }}
                    className="p-1.5 hover:text-rose-400 text-slate-400 hover:bg-rose-500/15 rounded-lg transition cursor-pointer"
                    title="Delete Workflow"
                    aria-label="Delete Workflow"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
