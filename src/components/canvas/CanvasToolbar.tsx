import React from 'react';
import {
  Plus,
  Minus,
  Maximize2,
  Grid,
  Undo2,
  Redo2,
  Map,
  Play,
  Save,
  Radio,
  FileCode2,
  TerminalSquare
} from 'lucide-react';

interface CanvasToolbarProps {
  zoom: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  canUndo: boolean;
  canRedo: boolean;
  miniMapOpen: boolean;
  isExecuting: boolean;
  isSaving: boolean;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  executionDrawerOpen: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitView: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleMiniMap: () => void;
  onToggleExecutionDrawer: () => void;
  onOpenAddNode: () => void;
  onRunWorkflow: () => void;
  onSaveWorkflow: () => void;
  onToggleActive: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  zoom,
  gridEnabled,
  snapEnabled,
  canUndo,
  canRedo,
  miniMapOpen,
  isExecuting,
  isSaving,
  isActive,
  hasUnsavedChanges,
  executionDrawerOpen,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitView,
  onToggleGrid,
  onToggleSnap,
  onUndo,
  onRedo,
  onToggleMiniMap,
  onToggleExecutionDrawer,
  onOpenAddNode,
  onRunWorkflow,
  onSaveWorkflow,
  onToggleActive,
}) => {
  return (
    <>
      {/* Top Left Floating Quick Actions: Add Node & Test */}
      <div className="absolute top-4 left-6 z-20 flex items-center gap-2.5">
        <button
          onClick={onOpenAddNode}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 hover:scale-102 active:scale-98 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Node</span>
        </button>

        <button
          onClick={onRunWorkflow}
          disabled={isExecuting}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition cursor-pointer ${
            isExecuting
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500 hover:scale-102 active:scale-98'
          }`}
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
          <span>{isExecuting ? 'Executing...' : 'Test Workflow'}</span>
        </button>

        <button
          onClick={onToggleExecutionDrawer}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition backdrop-blur-md cursor-pointer ${
            executionDrawerOpen
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
          title="Toggle Execution Logs"
        >
          <TerminalSquare className="w-3.5 h-3.5" />
          <span>Logs</span>
        </button>
      </div>

      {/* Top Right Actions: Active Toggle & Save */}
      <div className="absolute top-4 right-6 z-20 flex items-center gap-3">
        {/* Active Toggle Switch */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-slate-800 shadow-xl">
          <Radio className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
          <span className="text-xs font-medium text-slate-300">
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={onToggleActive}
            className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out cursor-pointer ${
              isActive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${
                isActive ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Save Workflow Button */}
        <button
          onClick={onSaveWorkflow}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition cursor-pointer border ${
            hasUnsavedChanges
              ? 'bg-cyan-600 text-white border-cyan-400 hover:bg-cyan-500 animate-pulse'
              : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
        </button>
      </div>

      {/* Bottom Center Floating Canvas Toolbar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl shadow-2xl">
        <button
          onClick={onZoomOut}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition font-mono text-xs font-medium min-w-[52px] text-center"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={onFitView}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition"
          title="Fit Canvas to View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleGrid}
          className={`p-2 rounded-lg transition ${
            gridEnabled ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Grid Background"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSnap}
          className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition ${
            snapEnabled ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Snap to Grid (20px)"
        >
          Snap
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-2 rounded-lg transition ${
            canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-2 rounded-lg transition ${
            canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800/80' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={onToggleMiniMap}
          className={`p-2 rounded-lg transition ${
            miniMapOpen ? 'text-cyan-400 bg-cyan-950/50' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Mini Map"
        >
          <Map className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
