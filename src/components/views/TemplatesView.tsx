import React from 'react';
import { LayoutTemplate, Sparkles, ArrowRight, Tag, Zap } from 'lucide-react';
import { WORKFLOW_TEMPLATES, WorkflowTemplate } from '../../constants/templates';

interface TemplatesViewProps {
  onUseTemplate: (template: WorkflowTemplate) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onUseTemplate }) => {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/30">
              <LayoutTemplate className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Template Library</h1>
          </div>
          <p className="text-xs text-slate-400">
            Kickstart your automations with battle-tested architectural recipes
          </p>
        </div>
      </div>

      {/* Grid of Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {WORKFLOW_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-pink-500/50 hover:bg-slate-900 transition flex flex-col justify-between group shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-mono tracking-wider text-pink-400 font-semibold px-2 py-0.5 rounded bg-pink-950/60 border border-pink-800">
                  {tpl.category}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {tpl.workflow.nodes.length} nodes
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition tracking-tight">
                {tpl.name}
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {tpl.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mt-4">
                {tpl.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/80"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500">Instant Deploy</span>
              <button
                onClick={() => onUseTemplate(tpl)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 text-pink-300 border border-pink-500/40 text-xs font-semibold hover:bg-pink-500 hover:text-slate-950 transition cursor-pointer"
              >
                <span>Use Template</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
