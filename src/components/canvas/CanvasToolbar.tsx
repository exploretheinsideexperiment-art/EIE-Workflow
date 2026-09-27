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
  TerminalSquare,
  PanelLeftOpen,
  MousePointer,
  Hand,
  Sparkles,
  LayoutGrid
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
  canvasMode: 'select' | 'pan';
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onChangeCanvasMode: (mode: 'select' | 'pan') => void;
  onSeparateNodes: () => void;
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
  canvasMode,
  isSidebarOpen = true,
  onToggleSidebar,
  onChangeCanvasMode,
  onSeparateNodes,
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
      {/* Top Dedicated Workflow Action Bar - Clean, Non-overlapping, Above Canvas */}
      <div className="h-13 border-b border-slate-800 bg-[#090d16] px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-20 select-none overflow-x-auto no-scrollbar">
        {/* Left Section: Menu Toggle + Add Node + Move/Select Mode + Test + Logs */}
        <div className="flex items-center gap-2 shrink-0">
          {onToggleSidebar && !isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 shadow-xs text-xs font-medium transition cursor-pointer shrink-0"
              title="Open Navigation Menu"
            >
              <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] font-mono hidden xs:inline">Menu</span>
            </button>
          )}

          {/* Primary "+ Add Node" Button - n8n style */}
          <button
            onClick={onOpenAddNode}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Add nodes, applications, triggers, and AI models"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Node</span>
          </button>

          {/* Mode Switcher: Select Tool vs Pan / Hand Tool */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-800 shrink-0">
            <button
              onClick={() => onChangeCanvasMode('select')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                canvasMode === 'select'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Select / Edit Mode (V)"
            >
              <MousePointer className="w-3 h-3" />
              <span className="hidden md:inline text-[11px]">Select</span>
            </button>

            <button
              onClick={() => onChangeCanvasMode('pan')}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                canvasMode === 'pan'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Move Canvas Mode (H / Spacebar+Drag)"
            >
              <Hand className="w-3 h-3" />
              <span className="hidden md:inline text-[11px]">Move</span>
            </button>
          </div>

          {/* Run / Test Workflow */}
          <button
            onClick={onRunWorkflow}
            disabled={isExecuting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap shrink-0 ${
              isExecuting
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 active:scale-95'
            }`}
            title="Execute workflow with live stream results"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Running...' : 'Test'}</span>
          </button>

          {/* Execution Drawer / Logs */}
          <button
            onClick={onToggleExecutionDrawer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
              executionDrawerOpen
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="Toggle execution results and logs"
          >
            <TerminalSquare className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Logs</span>
          </button>
        </div>

        {/* Center Section: Auto-Arrange / Separate Overlapping Nodes & Fit View */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onSeparateNodes}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-500/50 hover:bg-slate-800/80 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Separate overlapping nodes automatically into clean rows and columns"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline text-[11px] font-medium">Separate Nodes</span>
            <span className="lg:hidden text-[11px] font-medium">Arrange</span>
          </button>

          <button
            onClick={onFitView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer whitespace-nowrap shrink-0"
            title="Fit and center all workflow nodes in view"
          >
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden xl:inline text-[11px]">Fit View</span>
          </button>
        </div>

        {/* Right Section: Active Toggle & Save Workflow */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Active Status Switch */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs shrink-0">
            <Radio className={`w-3 h-3 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[11px] font-medium text-slate-300 hidden md:inline">
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              onClick={onToggleActive}
              className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                isActive ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title={isActive ? 'Active - click to pause workflow' : 'Inactive - click to activate workflow'}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                  isActive ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Save Workflow Button */}
          <button
            onClick={onSaveWorkflow}
            disabled={isSaving}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer border whitespace-nowrap shrink-0 ${
              hasUnsavedChanges
                ? 'bg-cyan-600 text-white border-cyan-400 hover:bg-cyan-500 animate-pulse shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
            title="Save workflow changes"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Floating Canvas Toolbar (Dock) */}
      <div className="absolute bottom-5 left-4 sm:left-1/2 sm:-translate-x-1/2 z-20 flex items-center gap-1 bg-slate-950/90 backdrop-blur-md border border-slate-800/90 p-1.5 rounded-2xl shadow-2xl select-none">
        <button
          onClick={onZoomOut}
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={onResetZoom}
          className="px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition font-mono text-xs font-medium min-w-[50px] text-center cursor-pointer"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          onClick={onZoomIn}
          className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          onClick={onToggleGrid}
          className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
            gridEnabled ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Background Grid"
        >
          <Grid className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSnap}
          className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer ${
            snapEnabled ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Snap to Grid (20px)"
        >
          Snap
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          onClick={onUndo}
          disabled={!canUndo}
          className={`p-1.5 sm:p-2 rounded-lg transition ${
            canUndo ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={onRedo}
          disabled={!canRedo}
          className={`p-1.5 sm:p-2 rounded-lg transition ${
            canRedo ? 'text-slate-300 hover:text-white hover:bg-slate-800/80 cursor-pointer' : 'text-slate-600 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-slate-800 mx-0.5" />

        <button
          onClick={onToggleMiniMap}
          className={`p-1.5 sm:p-2 rounded-lg transition cursor-pointer ${
            miniMapOpen ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
          }`}
          title="Toggle Mini Map"
        >
          <Map className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};
