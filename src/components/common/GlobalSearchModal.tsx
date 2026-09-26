import React, { useState, useMemo, useEffect } from 'react';
import { Search, X, Workflow, Blocks, KeyRound, History, LayoutTemplate, Layers } from 'lucide-react';
import { Workflow as WorkflowType, Credential, Execution } from '../../types/workflow';
import { NODE_LIBRARY } from '../../constants/nodeLibrary';
import { WORKFLOW_TEMPLATES } from '../../constants/templates';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflows: WorkflowType[];
  credentials: Credential[];
  executions: Execution[];
  onSelectWorkflow: (id: string) => void;
  onNavigate: (view: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  workflows,
  credentials,
  executions,
  onSelectWorkflow,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();

    const items: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: string;
      icon: any;
      action: () => void;
    }> = [];

    // 1. Workflows
    for (const wf of workflows) {
      if (wf.name.toLowerCase().includes(q) || wf.description?.toLowerCase().includes(q)) {
        items.push({
          id: `wf_${wf.id}`,
          title: wf.name,
          subtitle: wf.description || 'Workflow',
          category: 'Workflows',
          icon: Workflow,
          action: () => {
            onSelectWorkflow(wf.id);
            onClose();
          },
        });
      }
    }

    // 2. Nodes Library
    for (const node of NODE_LIBRARY) {
      if (node.name.toLowerCase().includes(q) || node.description.toLowerCase().includes(q)) {
        items.push({
          id: `node_${node.type}`,
          title: node.name,
          subtitle: node.description,
          category: `Node: ${node.category}`,
          icon: Layers,
          action: () => {
            onNavigate('workflows');
            onClose();
          },
        });
      }
    }

    // 3. Templates
    for (const tpl of WORKFLOW_TEMPLATES) {
      if (tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q)) {
        items.push({
          id: `tpl_${tpl.id}`,
          title: tpl.name,
          subtitle: tpl.description,
          category: 'Templates',
          icon: LayoutTemplate,
          action: () => {
            onNavigate('templates');
            onClose();
          },
        });
      }
    }

    // 4. Credentials
    for (const cred of credentials) {
      if (cred.name.toLowerCase().includes(q) || cred.type.toLowerCase().includes(q)) {
        items.push({
          id: `cred_${cred.id}`,
          title: cred.name,
          subtitle: `Type: ${cred.type.toUpperCase()}`,
          category: 'Credentials',
          icon: KeyRound,
          action: () => {
            onNavigate('credentials');
            onClose();
          },
        });
      }
    }

    // 5. Executions
    for (const exec of executions) {
      if (exec.id.toLowerCase().includes(q) || exec.workflowName.toLowerCase().includes(q)) {
        items.push({
          id: `exec_${exec.id}`,
          title: `Execution #${exec.id.replace('exec_', '').slice(0, 8)}`,
          subtitle: `${exec.workflowName} • ${exec.status.toUpperCase()}`,
          category: 'Executions',
          icon: History,
          action: () => {
            onNavigate('executions');
            onClose();
          },
        });
      }
    }

    return items.slice(0, 12);
  }, [query, workflows, credentials, executions, onSelectWorkflow, onNavigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-100">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden text-slate-100">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950">
          <Search className="w-5 h-5 text-cyan-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search workflows, nodes, templates, executions, credentials..."
            className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {query.trim() === '' ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              Search by typing any keyword (e.g. "Webhook", "AI", "Email", "Postgres", "Lead")
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-xs">
              No matching items found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {results.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={item.action}
                    className="p-3 rounded-xl hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-800 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white group-hover:text-cyan-300 transition truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 shrink-0 ml-2">
                      {item.category}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
