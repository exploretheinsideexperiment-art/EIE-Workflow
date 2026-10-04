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
  LayoutGrid,
  Trash2,
  Settings,
  Stethoscope,
  Bot,
  Link2,
  Edit3,
  Check,
  CloudLightning
} from 'lucide-react';

interface CanvasToolbarProps {
  workflowName: string;
  onUpdateWorkflowName: (name: string) => void;
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
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onOpenSettings?: () => void;
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
  onOpenCloudModal?: () => void;
  onOpenEiDoctor?: () => void;
  canConnectSelected?: boolean;
  onConnectSelectedNodes?: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  workflowName,
  onUpdateWorkflowName,
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
  selectedCount = 0,
  onDeleteSelected,
  onOpenSettings,
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
  onOpenCloudModal,
  onOpenEiDoctor,
  canConnectSelected,
  onConnectSelectedNodes,
}) => {
  const [isEditingName, setIsEditingName] = React.useState(false);
  const [nameValue, setNameValue] = React.useState(workflowName);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setNameValue(workflowName);
  }, [workflowName]);
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

          {/* Configure Selected Event Button */}
          {selectedCount === 1 && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap shrink-0 animate-in fade-in"
              title="Configure selected event settings"
            >
              <Settings className="w-3.5 h-3.5 text-cyan-400" />
              <span>Settings</span>
            </button>
          )}

          {/* Delete Selected Event(s) Button */}
          {selectedCount > 0 && onDeleteSelected && (
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold shadow-md shadow-rose-500/20 active:scale-95 transition cursor-pointer whitespace-nowrap shrink-0 animate-in fade-in"
              title="Delete selected event/node from workflow"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Delete {selectedCount === 1 ? 'Event' : `(${selectedCount})`}</span>
            </button>
          )}

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

          {/* Connect 2 Selected Nodes Quick Action */}
          {canConnectSelected && onConnectSelectedNodes && (
            <button
              onClick={onConnectSelectedNodes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer whitespace-nowrap animate-pulse"
              title="Connect the 2 selected nodes directly"
            >
              <Link2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Connect Selected</span>
            </button>
          )}

          {/* AI Fixer Quick Launch Button */}
          <button
            onClick={onOpenEiDoctor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold shadow-sm hover:border-cyan-400 transition cursor-pointer whitespace-nowrap shrink-0 group"
            title="Open AI Fixer (Autonomous AI Robot Troubleshooter & Auto-Repair)"
          >
            <Bot className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
            <span className="font-bold">AI Fixer</span>
          </button>
        </div>

        {/* Center: Editable Workflow Title & Rename Input (n8n Style) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-500/50 transition min-w-0 max-w-[200px] xs:max-w-[260px] sm:max-w-xs md:max-w-md shrink">
          {isEditingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const trimmed = nameValue.trim();
                if (trimmed) onUpdateWorkflowName(trimmed);
                setIsEditingName(false);
              }}
              className="flex items-center gap-1.5 w-full min-w-0"
            >
              <input
                ref={nameInputRef}
                type="text"
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setNameValue(workflowName);
                    setIsEditingName(false);
                  }
                }}
                onBlur={() => {
                  const trimmed = nameValue.trim();
                  if (trimmed) onUpdateWorkflowName(trimmed);
                  setIsEditingName(false);
                }}
                className="bg-slate-950 border border-cyan-500 rounded px-2 py-0.5 text-xs font-bold text-white focus:outline-none w-full"
                autoFocus
                placeholder="Workflow Name..."
              />
              <button
                type="submit"
                className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 cursor-pointer shrink-0"
                title="Save name"
              >
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div
              onClick={() => setIsEditingName(true)}
              className="flex items-center gap-2 cursor-pointer group min-w-0 w-full"
              title="Click to change or rename workflow name"
            >
              <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 truncate transition">
                {workflowName || 'Untitled Workflow'}
              </span>
              <button
                type="button"
                className="p-1 rounded-md bg-slate-800/80 text-slate-400 group-hover:text-cyan-300 group-hover:bg-cyan-500/15 transition shrink-0"
                title="Change workflow name"
              >
                <Edit3 className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          )}
        </div>

        {/* Center-Right Section: Auto-Arrange / Separate Overlapping Nodes & Fit View */}
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

        {/* Right Section: Cloud API & Active Toggle & Save Workflow */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Cloud API & Webhook details button for external apps */}
          {onOpenCloudModal && (
            <button
              onClick={onOpenCloudModal}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap shrink-0 group ${
                isActive
                  ? 'border-emerald-500/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 shadow-sm shadow-emerald-500/20'
                  : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300'
              }`}
              title="Open Cloud API & Webhook details to connect external applications"
            >
              <CloudLightning className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="font-bold hidden sm:inline">Cloud API</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
              }`}>
                {isActive ? 'LIVE' : 'OFF'}
              </span>
            </button>
          )}

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
              title={isActive ? 'Active on Cloud - click to pause workflow' : 'Inactive - click to activate workflow'}
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
