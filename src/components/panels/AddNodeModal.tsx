import React, { useState, useMemo } from 'react';
import { Search, X, ArrowRight, Layers, Sparkles } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredNodes = useMemo(() => {
    return NODE_LIBRARY.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'All' || node.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl h-[640px] rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Add Node to Workflow</h3>
              <p className="text-xs text-slate-400">Select triggers, integrations, AI models, or data operations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-900/90">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search applications, triggers, actions, AI services..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/40"
            />
          </div>
        </div>

        {/* Modal Content: Categories Sidebar & Nodes Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Category Tabs Sidebar */}
          <div className="w-48 border-r border-slate-800/80 p-3 overflow-y-auto space-y-1 bg-slate-950/30">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                selectedCategory === 'All'
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>All Categories</span>
              <span className="text-[10px] font-mono text-slate-500">{NODE_LIBRARY.length}</span>
            </button>

            {CATEGORIES.map((cat) => {
              const count = NODE_LIBRARY.filter((n) => n.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span>{cat}</span>
                  <span className="text-[10px] font-mono text-slate-500">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Node Cards Grid */}
          <div className="flex-1 p-4 overflow-y-auto grid grid-cols-2 gap-3 content-start">
            {filteredNodes.length === 0 ? (
              <div className="col-span-2 py-16 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No nodes found matching "{searchQuery}"</p>
                <p className="text-xs text-slate-600 mt-1">Try searching for "Webhook", "AI", "Email", or "HTTP"</p>
              </div>
            ) : (
              filteredNodes.map((node) => {
                const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;

                return (
                  <div
                    key={node.type}
                    onClick={() => {
                      onSelectNode(node);
                      onClose();
                    }}
                    className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-800/50 transition cursor-pointer flex flex-col justify-between group shadow-sm hover:shadow-cyan-950/40"
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: `${node.accentColor}18`, color: node.accentColor }}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition">
                              {node.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              {node.category}
                            </span>
                          </div>
                        </div>

                        <span className="p-1 rounded-md text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {node.description}
                      </p>
                    </div>

                    {/* Ports preview badges */}
                    <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>{node.inputs.length} in</span>
                      <span>{node.outputs.length} out</span>
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
