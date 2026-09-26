import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Workflow,
  WorkflowNodeData,
  WorkflowConnection,
  Credential,
  Execution,
  NodeDefinition
} from '../../types/workflow';
import { CanvasNode } from './CanvasNode';
import { ConnectionWire } from './ConnectionWire';
import { CanvasToolbar } from './CanvasToolbar';
import { MiniMap } from './MiniMap';
import { AddNodeModal } from '../panels/AddNodeModal';
import { NodeConfigPanel } from '../panels/NodeConfigPanel';
import { ExecutionDrawer } from '../panels/ExecutionDrawer';

interface WorkflowCanvasProps {
  workflow: Workflow;
  credentials: Credential[];
  onSave: (wf: Workflow) => Promise<void>;
  onToggleActive: () => Promise<void>;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow: initialWorkflow,
  credentials,
  onSave,
  onToggleActive,
}) => {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Canvas Settings
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [miniMapOpen, setMiniMapOpen] = useState(true);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Pan & Zoom
  const [viewport, setViewport] = useState(initialWorkflow.viewport || { x: 120, y: 120, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Connection Dragging State
  const [connectingState, setConnectingState] = useState<{
    fromNodeId: string;
    fromPortId: string;
    startPos: { x: number; y: number };
    currentPos: { x: number; y: number };
  } | null>(null);

  // Undo / Redo History
  const [history, setHistory] = useState<Workflow[]>([initialWorkflow]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Execution & Live Stream State
  const [latestExecution, setLatestExecution] = useState<Execution | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync when initialWorkflow changes from parent
  useEffect(() => {
    setWorkflow(initialWorkflow);
    setViewport(initialWorkflow.viewport || { x: 120, y: 120, zoom: 1 });
    setHistory([initialWorkflow]);
    setHistoryIndex(0);
    setHasUnsavedChanges(false);
  }, [initialWorkflow.id]);

  // History Push Helper
  const pushHistory = useCallback((newWf: Workflow) => {
    setWorkflow(newWf);
    setHasUnsavedChanges(true);
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newWf];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  // SSE Live Execution Listener
  useEffect(() => {
    const eventSource = new EventSource('/api/executions-stream');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'started' && data.execution) {
          if (data.execution.workflowId === workflow.id) {
            setLatestExecution(data.execution);
            setIsExecuting(true);
            setExecutionDrawerOpen(true);
          }
        } else if (data.type === 'node_update' && data.executionId) {
          setLatestExecution((prev) => {
            if (!prev || prev.id !== data.executionId) return prev;
            return {
              ...prev,
              nodeResults: {
                ...prev.nodeResults,
                [data.nodeId]: data.nodeResult,
              },
            };
          });
        } else if (data.type === 'finished' && data.execution) {
          if (data.execution.workflowId === workflow.id) {
            setLatestExecution(data.execution);
            setIsExecuting(false);
          }
        }
      } catch (err) {
        console.error('[SSE] Failed to parse event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [workflow.id]);

  // Snap to 20px grid
  const snapVal = (val: number) => (snapEnabled ? Math.round(val / 20) * 20 : val);

  // --- PANNING HANDLERS ---
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) { // Left or middle click on background
      setIsPanning(true);
      panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
      setSelectedNodeIds([]);
      setSelectedConnectionId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Canvas Panning
    if (isPanning) {
      setViewport((prev) => ({
        ...prev,
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y,
      }));
      return;
    }

    // 2. Node Dragging
    if (draggingNodeId) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const rawWorldX = (e.clientX - containerRect.left - viewport.x) / viewport.zoom;
      const rawWorldY = (e.clientY - containerRect.top - viewport.y) / viewport.zoom;

      const targetX = snapVal(rawWorldX - dragOffsetRef.current.x);
      const targetY = snapVal(rawWorldY - dragOffsetRef.current.y);

      setWorkflow((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) =>
          n.id === draggingNodeId ? { ...n, position: { x: targetX, y: targetY } } : n
        ),
      }));
      setHasUnsavedChanges(true);
      return;
    }

    // 3. Port Wire Dragging
    if (connectingState) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      setConnectingState((prev) =>
        prev
          ? {
              ...prev,
              currentPos: {
                x: (e.clientX - containerRect.left - viewport.x) / viewport.zoom,
                y: (e.clientY - containerRect.top - viewport.y) / viewport.zoom,
              },
            }
          : null
      );
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushHistory(workflow);
    }
    if (connectingState) {
      setConnectingState(null);
    }
  };

  // Zoom Handler with Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.25), 2.5);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Zoom centered around mouse pointer
    const newX = mouseX - (mouseX - viewport.x) * (newZoom / viewport.zoom);
    const newY = mouseY - (mouseY - viewport.y) * (newZoom / viewport.zoom);

    setViewport({ x: newX, y: newY, zoom: newZoom });
  };

  // --- NODE SELECTION & DRAGGING ---
  const handleNodeSelect = (nodeId: string, multi: boolean) => {
    if (multi) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId) ? prev.filter((id) => id !== nodeId) : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
    setSelectedConnectionId(null);

    // Initialize node dragging
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (node && containerRef.current) {
      setDraggingNodeId(nodeId);
      const containerRect = containerRef.current.getBoundingClientRect();
      // Record offset between click and node position
      dragOffsetRef.current = {
        x: 0,
        y: 0,
      };
    }
  };

  // --- PORT WIRE CONNECTION ---
  const handleStartPortDrag = (
    nodeId: string,
    portId: string,
    isOutput: boolean,
    screenPos: { x: number; y: number }
  ) => {
    if (!isOutput || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    const worldStart = {
      x: (screenPos.x - containerRect.left - viewport.x) / viewport.zoom,
      y: (screenPos.y - containerRect.top - viewport.y) / viewport.zoom,
    };

    setConnectingState({
      fromNodeId: nodeId,
      fromPortId: portId,
      startPos: worldStart,
      currentPos: worldStart,
    });
  };

  const handlePortMouseUp = (targetNodeId: string, targetPortId: string, isOutput: boolean) => {
    if (!connectingState) return;

    // Only connect if released on an INPUT port of a DIFFERENT node
    if (!isOutput && connectingState.fromNodeId !== targetNodeId) {
      // Prevent duplicate connection
      const exists = workflow.connections.some(
        (c) =>
          c.fromNodeId === connectingState.fromNodeId &&
          c.fromPortId === connectingState.fromPortId &&
          c.toNodeId === targetNodeId &&
          c.toPortId === targetPortId
      );

      if (!exists) {
        const newConnection: WorkflowConnection = {
          id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          fromNodeId: connectingState.fromNodeId,
          fromPortId: connectingState.fromPortId,
          toNodeId: targetNodeId,
          toPortId: targetPortId,
        };

        const updated = {
          ...workflow,
          connections: [...workflow.connections, newConnection],
        };
        pushHistory(updated);
      }
    }

    setConnectingState(null);
  };

  // --- NODE ACTIONS ---
  const handleAddNodeFromModal = (nodeDef: NodeDefinition) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const centerX = containerRect ? containerRect.width / 2 : 500;
    const centerY = containerRect ? containerRect.height / 2 : 350;

    const worldX = snapVal((centerX - viewport.x) / viewport.zoom - 128);
    const worldY = snapVal((centerY - viewport.y) / viewport.zoom - 40);

    const newNode: WorkflowNodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: nodeDef.type,
      name: nodeDef.name,
      category: nodeDef.category,
      icon: nodeDef.icon,
      position: { x: worldX, y: worldY },
      inputs: nodeDef.inputs,
      outputs: nodeDef.outputs,
      config: JSON.parse(JSON.stringify(nodeDef.defaultConfig)),
      executionSettings: { continueOnError: false, timeoutMs: 15000 },
    };

    const updated = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
    };
    pushHistory(updated);
    setSelectedNodeIds([newNode.id]);
    setEditingNodeId(newNode.id);
  };

  const handleDeleteNode = (nodeId: string) => {
    const updated = {
      ...workflow,
      nodes: workflow.nodes.filter((n) => n.id !== nodeId),
      connections: workflow.connections.filter(
        (c) => c.fromNodeId !== nodeId && c.toNodeId !== nodeId
      ),
    };
    pushHistory(updated);
    setSelectedNodeIds((prev) => prev.filter((id) => id !== nodeId));
    if (editingNodeId === nodeId) setEditingNodeId(null);
  };

  const handleDuplicateNode = (nodeId: string) => {
    const target = workflow.nodes.find((n) => n.id === nodeId);
    if (!target) return;

    const dup: WorkflowNodeData = {
      ...JSON.parse(JSON.stringify(target)),
      id: `node_${Date.now()}_dup`,
      name: `${target.name} (Copy)`,
      position: {
        x: target.position.x + 40,
        y: target.position.y + 40,
      },
    };

    const updated = {
      ...workflow,
      nodes: [...workflow.nodes, dup],
    };
    pushHistory(updated);
    setSelectedNodeIds([dup.id]);
  };

  const handleDeleteConnection = (connectionId: string) => {
    const updated = {
      ...workflow,
      connections: workflow.connections.filter((c) => c.id !== connectionId),
    };
    pushHistory(updated);
    setSelectedConnectionId(null);
  };

  const handleUpdateNodeConfig = (nodeId: string, updates: Partial<WorkflowNodeData>) => {
    const updated = {
      ...workflow,
      nodes: workflow.nodes.map((n) => (n.id === nodeId ? { ...n, ...updates } : n)),
    };
    setWorkflow(updated);
    setHasUnsavedChanges(true);
  };

  // --- WORKFLOW EXECUTION & SAVING ---
  const handleTestWorkflow = async () => {
    setIsExecuting(true);
    setExecutionDrawerOpen(true);
    try {
      // First save if unsaved
      if (hasUnsavedChanges) {
        await handleSave();
      }

      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerType: 'manual', payload: { testRun: true } }),
      });
      const data = await res.json();
      setLatestExecution(data);
    } catch (err) {
      console.error('[Execution Error]:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTestSingleNode = async (node: WorkflowNodeData) => {
    // Run an isolated node test through workflow run or simulated evaluation
    const res = await fetch(`/api/workflows/${workflow.id}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ triggerType: 'manual', payload: node.config }),
    });
    const data: Execution = await res.json();
    return data.nodeResults[node.id]?.output || data.nodeResults[node.id] || { simulated: true };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: Workflow = {
        ...workflow,
        viewport,
      };
      await onSave(payload);
      setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  // --- UNDO / REDO ---
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setWorkflow(history[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setWorkflow(history[newIndex]);
      setHasUnsavedChanges(true);
    }
  };

  // --- FIT VIEW ---
  const handleFitView = () => {
    if (workflow.nodes.length === 0 || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of workflow.nodes) {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.x + 256 > maxX) maxX = n.position.x + 256;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.y + 100 > maxY) maxY = n.position.y + 100;
    }

    const padding = 80;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    const zoom = Math.min(
      Math.max(Math.min(containerRect.width / w, containerRect.height / h), 0.3),
      1.5
    );

    const x = containerRect.width / 2 - ((minX + maxX) / 2) * zoom;
    const y = containerRect.height / 2 - ((minY + maxY) / 2) * zoom;

    setViewport({ x, y, zoom });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(handleDeleteNode);
        } else if (selectedConnectionId) {
          handleDeleteConnection(selectedConnectionId);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedNodeIds.length > 0) {
          selectedNodeIds.forEach(handleDuplicateNode);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, selectedConnectionId, historyIndex, history, workflow]);

  // Node position lookup helper for wire rendering
  const getNodePortPos = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = 256;
    const nodeHeight = 85;

    if (isOutput) {
      return {
        x: node.position.x + nodeWidth,
        y: node.position.y + nodeHeight / 2,
      };
    } else {
      return {
        x: node.position.x,
        y: node.position.y + nodeHeight / 2,
      };
    }
  };

  const editingNode = workflow.nodes.find((n) => n.id === editingNodeId) || null;

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDownCanvas}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-full overflow-hidden bg-[#070b14] select-none cursor-grab active:cursor-grabbing"
    >
      {/* Visual Dot Grid Background */}
      {gridEnabled && (
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
            backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
        />
      )}

      {/* SVG Canvas Layer for Wires */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        <defs>
          <filter id="particle-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g transform={`translate(${viewport.x}, ${viewport.y}) scale(${viewport.zoom})`}>
          {/* Static Existing Connections */}
          {workflow.connections.map((conn) => {
            const startPos = getNodePortPos(conn.fromNodeId, conn.fromPortId, true);
            const endPos = getNodePortPos(conn.toNodeId, conn.toPortId, false);

            const fromNode = workflow.nodes.find((n) => n.id === conn.fromNodeId);
            const fromPort = fromNode?.outputs.find((p) => p.id === conn.fromPortId);
            const stepResult = latestExecution?.nodeResults[conn.fromNodeId];

            return (
              <g key={conn.id} className="pointer-events-auto">
                <ConnectionWire
                  connection={conn}
                  startPos={startPos}
                  endPos={endPos}
                  fromPortType={fromPort?.type}
                  isSelected={selectedConnectionId === conn.id}
                  isExecuting={isExecuting}
                  executionStatus={stepResult?.status}
                  onDelete={handleDeleteConnection}
                  onSelect={(id) => {
                    setSelectedConnectionId(id);
                    setSelectedNodeIds([]);
                  }}
                />
              </g>
            );
          })}

          {/* Active Wire being dragged from port */}
          {connectingState && (
            <path
              d={`M ${connectingState.startPos.x} ${connectingState.startPos.y} C ${
                connectingState.startPos.x + 80
              } ${connectingState.startPos.y}, ${connectingState.currentPos.x - 80} ${
                connectingState.currentPos.y
              }, ${connectingState.currentPos.x} ${connectingState.currentPos.y}`}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              strokeLinecap="round"
              className="animate-pulse"
            />
          )}
        </g>
      </svg>

      {/* HTML Layer for Node Cards */}
      <div
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: '0 0',
        }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="relative w-full h-full pointer-events-auto">
          {workflow.nodes.map((node) => (
            <CanvasNode
              key={node.id}
              node={node}
              isSelected={selectedNodeIds.includes(node.id)}
              executionResult={latestExecution?.nodeResults[node.id]}
              isConnecting={Boolean(connectingState)}
              onSelect={handleNodeSelect}
              onStartPortDrag={handleStartPortDrag}
              onPortMouseUp={handlePortMouseUp}
              onDeleteNode={handleDeleteNode}
              onDuplicateNode={handleDuplicateNode}
              onOpenConfig={(id) => {
                setSelectedNodeIds([id]);
                setEditingNodeId(id);
              }}
            />
          ))}
        </div>
      </div>

      {/* Top and Bottom Floating Canvas Toolbars */}
      <CanvasToolbar
        zoom={viewport.zoom}
        gridEnabled={gridEnabled}
        snapEnabled={snapEnabled}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        miniMapOpen={miniMapOpen}
        isExecuting={isExecuting}
        isSaving={isSaving}
        isActive={workflow.active}
        hasUnsavedChanges={hasUnsavedChanges}
        executionDrawerOpen={executionDrawerOpen}
        onZoomIn={() => setViewport((v) => ({ ...v, zoom: Math.min(v.zoom * 1.15, 2.5) }))}
        onZoomOut={() => setViewport((v) => ({ ...v, zoom: Math.max(v.zoom * 0.85, 0.25) }))}
        onResetZoom={() => setViewport((v) => ({ ...v, zoom: 1 }))}
        onFitView={handleFitView}
        onToggleGrid={() => setGridEnabled(!gridEnabled)}
        onToggleSnap={() => setSnapEnabled(!snapEnabled)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleMiniMap={() => setMiniMapOpen(!miniMapOpen)}
        onToggleExecutionDrawer={() => setExecutionDrawerOpen(!executionDrawerOpen)}
        onOpenAddNode={() => setAddNodeModalOpen(true)}
        onRunWorkflow={handleTestWorkflow}
        onSaveWorkflow={handleSave}
        onToggleActive={async () => {
          await onToggleActive();
          setWorkflow((w) => ({ ...w, active: !w.active }));
        }}
      />

      {/* Mini Map HUD */}
      {miniMapOpen && (
        <MiniMap
          nodes={workflow.nodes}
          viewport={viewport}
          containerWidth={containerRef.current?.clientWidth || 1000}
          containerHeight={containerRef.current?.clientHeight || 600}
          onPanTo={(x, y) => setViewport((v) => ({ ...v, x, y }))}
          onClose={() => setMiniMapOpen(false)}
        />
      )}

      {/* Add Node Search Modal */}
      <AddNodeModal
        isOpen={addNodeModalOpen}
        onClose={() => setAddNodeModalOpen(false)}
        onSelectNode={handleAddNodeFromModal}
      />

      {/* Right-Side Node Inspector Drawer */}
      <NodeConfigPanel
        node={editingNode}
        credentials={credentials}
        executionResult={editingNode ? latestExecution?.nodeResults[editingNode.id] : undefined}
        onClose={() => setEditingNodeId(null)}
        onUpdateConfig={handleUpdateNodeConfig}
        onDeleteNode={handleDeleteNode}
        onTestNode={handleTestSingleNode}
      />

      {/* Bottom Live Execution Logs Drawer */}
      <ExecutionDrawer
        isOpen={executionDrawerOpen}
        execution={latestExecution}
        onClose={() => setExecutionDrawerOpen(false)}
        onReRun={handleTestWorkflow}
      />
    </div>
  );
};
