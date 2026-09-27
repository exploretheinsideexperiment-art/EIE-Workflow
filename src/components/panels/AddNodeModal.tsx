import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Layers, Sparkles, AppWindow, Cpu, ShieldCheck } from 'lucide-react';
import * as Icons from 'lucide-react';
import { NODE_LIBRARY, CATEGORIES } from '../../constants/nodeLibrary';
import { NodeDefinition, NodeCategory } from '../../types/workflow';

interface AddNodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNode: (nodeDef: NodeDefinition) => void;
}

export const AddNodeModal: React.FC<AddNodeModalProps> = ({
  isOpen,
  onClose,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Applications');

  const isAppCategory = (cat: string) => cat === 'All Applications' || cat === 'Applications';

  const filteredNodes = useMemo(() => {
    return NODE_LIBRARY.filter((node) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        node.name.toLowerCase().includes(q) ||
        node.description.toLowerCase().includes(q) ||
        node.category.toLowerCase().includes(q) ||
        node.type.toLowerCase().includes(q);

      const matchesCat =
        selectedCategory === 'All' ||
        (isAppCategory(selectedCategory) && isAppCategory(node.category)) ||
        node.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const appCount = useMemo(() => {
    return NODE_LIBRARY.filter((n) => isAppCategory(n.category)).length;
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[92vh] max-h-[680px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
              <AppWindow className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Add Node to Workflow</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {NODE_LIBRARY.length} Total Nodes
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden xs:block">
                All Applications, triggers, AI models, and automations (n8n compatible)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar with Quick Filters */}
        <div className="p-3 sm:p-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 40+ Applications (Google Sheets, Gmail, Slack, OpenAI, Stripe, Notion, Postgres)..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Modal Content: Categories Sidebar & Nodes Grid */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Category Tabs Sidebar */}
          <div className="w-full sm:w-52 border-b sm:border-b-0 sm:border-r border-slate-800/80 p-2 sm:p-3 overflow-x-auto sm:overflow-y-auto flex sm:flex-col gap-1 bg-slate-950/40 shrink-0 no-scrollbar">
            {/* All Applications - Primary Prominent Tab */}
            <button
              onClick={() => setSelectedCategory('All Applications')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                isAppCategory(selectedCategory)
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <AppWindow className="w-3.5 h-3.5 text-cyan-400" />
                <span>All Applications</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 ml-2">
                {appCount}
              </span>
            </button>

            {/* All Categories */}
            <button
              onClick={() => setSelectedCategory('All')}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>All Categories</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 ml-2">{NODE_LIBRARY.length}</span>
            </button>

            <div className="hidden sm:block my-1 border-t border-slate-800/60" />

            {CATEGORIES.filter((c) => c !== 'All Applications' && c !== 'Applications').map((cat) => {
              const count = NODE_LIBRARY.filter((n) => n.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-3 py-1.5 sm:py-2 rounded-xl text-xs font-medium transition cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono text-slate-500 ml-2">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Node Cards Grid */}
          <div className="flex-1 p-3 sm:p-4 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 content-start">
            {filteredNodes.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-slate-400">No nodes found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-600 mt-1">Try searching for "Google", "Slack", "Stripe", or "Postgres"</p>
              </div>
            ) : (
              filteredNodes.map((node) => {
                const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;
                const isApplication = isAppCategory(node.category);

                return (
                  <div
                    key={node.type}
                    onClick={() => {
                      onSelectNode(node);
                      onClose();
                    }}
                    className="p-3 sm:p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-800/50 transition cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-cyan-950/40 relative overflow-hidden"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="p-2 rounded-xl shrink-0 border"
                            style={{
                              backgroundColor: `${node.accentColor}18`,
                              borderColor: `${node.accentColor}40`,
                              color: node.accentColor,
                            }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition truncate">
                              {node.name}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wide">
                                {isApplication ? 'Application' : node.category}
                              </span>
                              {node.requiresCredentials && (
                                <span className="text-[9px] text-amber-400/90 font-mono bg-amber-950/50 px-1 py-0.2 rounded border border-amber-800/40">
                                  Auth
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="p-1 rounded-md text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition shrink-0 ml-1">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {node.description}
                      </p>
                    </div>

                    {/* Ports preview badges */}
                    <div className="mt-2.5 pt-2 border-t border-slate-900/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span className="text-slate-400">
                        {node.inputs.length === 0 ? 'Trigger' : `${node.inputs.length} in • ${node.outputs.length} out`}
                      </span>
                      <span className="text-cyan-400/80 group-hover:text-cyan-300 transition">
                        + Add to canvas
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
