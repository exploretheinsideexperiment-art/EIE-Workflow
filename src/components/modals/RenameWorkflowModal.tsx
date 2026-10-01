import React, { useState, useEffect } from 'react';
import { X, Edit3, Check } from 'lucide-react';

interface RenameWorkflowModalProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export const RenameWorkflowModal: React.FC<RenameWorkflowModalProps> = ({
  isOpen,
  currentName,
  onClose,
  onRename,
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      onRename(trimmed);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl p-5 text-slate-100 space-y-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Rename Workflow</h3>
              <p className="text-[11px] text-slate-400">Change the title of this automation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Workflow Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white font-medium"
              placeholder="Workflow name..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
