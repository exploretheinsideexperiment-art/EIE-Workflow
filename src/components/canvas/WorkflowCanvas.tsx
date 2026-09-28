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
import { NODE_LIBRARY } from '../../constants/nodeLibrary';

interface WorkflowCanvasProps {
  workflow: Workflow;
  credentials: Credential[];
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onSave: (wf: Workflow) => Promise<void>;
  onToggleActive: () => Promise<void>;
}

export const WorkflowCanvas: React.FC<WorkflowCanvasProps> = ({
  workflow: initialWorkflow,
  credentials,
  isSidebarOpen = true,
  onToggleSidebar,
  onSave,
  onToggleActive,
}) => {
  const [workflow, setWorkflow] = useState<Workflow>(initialWorkflow);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // Canvas Settings & Modes
  const [canvasMode, setCanvasMode] = useState<'select' | 'pan'>('select');
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [miniMapOpen, setMiniMapOpen] = useState(false);
  const [addNodeModalOpen, setAddNodeModalOpen] = useState(false);
  const [executionDrawerOpen, setExecutionDrawerOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Quick Connection State (Click-to-connect & Quick Add '+')
  const [pendingSourcePort, setPendingSourcePort] = useState<{
    nodeId: string;
    portId: string;
    isOutput: boolean;
  } | null>(null);

  const [autoConnectState, setAutoConnectState] = useState<{
    fromNodeId?: string;
    fromPortId?: string;
    fromNodeName?: string;
    toNodeId?: string;
    toPortId?: string;
    targetPos?: { x: number; y: number };
  } | null>(null);

  // Pan & Zoom
  const [viewport, setViewport] = useState(initialWorkflow.viewport || { x: 120, y: 120, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const touchInitialZoomRef = useRef<number>(1);

  // Node Dragging State
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const initialDragPositionsRef = useRef<Record<string, { x: number; y: number }>>({});

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

  // Spacebar pan mode detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- PANNING HANDLERS ---
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    const isPanMode = canvasMode === 'pan' || isSpacePressed || e.button === 1;
    if (e.button === 0 || e.button === 1) {
      if (isPanMode || (e.target as HTMLElement) === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
        setIsPanning(true);
        panStartRef.current = { x: e.clientX - viewport.x, y: e.clientY - viewport.y };
        if (!isPanMode) {
          setSelectedNodeIds([]);
          setSelectedConnectionId(null);
          setPendingSourcePort(null);
        }
      }
    }
  };

  // --- GLOBAL WINDOW-LEVEL DRAG & PAN LISTENERS ---
  useEffect(() => {
    const handleWindowMouseMove = (e: MouseEvent) => {
      // 1. Panning Canvas
      if (isPanning) {
        setViewport((prev) => ({
          ...prev,
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        }));
        return;
      }

      // 2. Dragging Node(s)
      if (draggingNodeId) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (!containerRect) return;

        const rawWorldX = (e.clientX - containerRect.left - viewport.x) / viewport.zoom;
        const rawWorldY = (e.clientY - containerRect.top - viewport.y) / viewport.zoom;

        const targetX = snapVal(rawWorldX - dragOffsetRef.current.x);
        const targetY = snapVal(rawWorldY - dragOffsetRef.current.y);

        const primaryInitial = initialDragPositionsRef.current[draggingNodeId];
        const deltaX = primaryInitial ? targetX - primaryInitial.x : 0;
        const deltaY = primaryInitial ? targetY - primaryInitial.y : 0;

        setWorkflow((prev) => ({
          ...prev,
          nodes: prev.nodes.map((n) => {
            if (n.id === draggingNodeId) {
              return { ...n, position: { x: targetX, y: targetY } };
            }
            if (selectedNodeIds.includes(n.id) && initialDragPositionsRef.current[n.id]) {
              const init = initialDragPositionsRef.current[n.id];
              return {
                ...n,
                position: { x: snapVal(init.x + deltaX), y: snapVal(init.y + deltaY) },
              };
            }
            return n;
          }),
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

    const handleWindowMouseUp = (e: MouseEvent) => {
      if (isPanning) {
        setIsPanning(false);
      }
      if (draggingNodeId) {
        setDraggingNodeId(null);
        pushHistory(workflow);
      }
      // If connectingState and released on empty canvas, open Add Node modal right at drop point!
      if (connectingState) {
        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const dropWorldX = snapVal((e.clientX - containerRect.left - viewport.x) / viewport.zoom);
          const dropWorldY = snapVal((e.clientY - containerRect.top - viewport.y) / viewport.zoom);
          const fromNode = workflow.nodes.find((n) => n.id === connectingState.fromNodeId);

          setAutoConnectState({
            fromNodeId: connectingState.fromNodeId,
            fromPortId: connectingState.fromPortId,
            fromNodeName: fromNode?.name,
            targetPos: { x: dropWorldX, y: dropWorldY },
          });
          setAddNodeModalOpen(true);
        }
        setConnectingState(null);
      }
    };

    if (isPanning || draggingNodeId || connectingState) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleWindowMouseMove);
        window.removeEventListener('mouseup', handleWindowMouseUp);
      };
    }
  }, [isPanning, draggingNodeId, connectingState, viewport, workflow, pushHistory, snapEnabled, selectedNodeIds]);

  // --- TOUCH HANDLERS FOR MOBILE FIREFOX & PHONES ---
  const handleTouchStartCanvas = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      touchStartRef.current = {
        x: e.touches[0].clientX - viewport.x,
        y: e.touches[0].clientY - viewport.y,
      };
      if (canvasMode !== 'pan') {
        setSelectedNodeIds([]);
        setSelectedConnectionId(null);
        setPendingSourcePort(null);
      }
    } else if (e.touches.length === 2) {
      setIsPanning(false);
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.hypot(dx, dy);
      touchInitialZoomRef.current = viewport.zoom;
    }
  };

  useEffect(() => {
    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isPanning) {
        setViewport((prev) => ({
          ...prev,
          x: e.touches[0].clientX - touchStartRef.current.x,
          y: e.touches[0].clientY - touchStartRef.current.y,
        }));
      } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const factor = currentDist / touchDistanceRef.current;
        const newZoom = Math.min(Math.max(touchInitialZoomRef.current * factor, 0.25), 2.5);

        const containerRect = containerRef.current?.getBoundingClientRect();
        if (containerRect) {
          const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2 - containerRect.left;
          const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2 - containerRect.top;
          const newX = midX - (midX - viewport.x) * (newZoom / viewport.zoom);
          const newY = midY - (midY - viewport.y) * (newZoom / viewport.zoom);
          setViewport({ x: newX, y: newY, zoom: newZoom });
        }
      }
    };

    const handleWindowTouchEnd = () => {
      if (isPanning) setIsPanning(false);
      touchDistanceRef.current = null;
    };

    if (isPanning || touchDistanceRef.current !== null) {
      window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
      window.addEventListener('touchend', handleWindowTouchEnd);
      window.addEventListener('touchcancel', handleWindowTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleWindowTouchMove);
        window.removeEventListener('touchend', handleWindowTouchEnd);
        window.removeEventListener('touchcancel', handleWindowTouchEnd);
      };
    }
  }, [isPanning, viewport]);

  // Zoom Handler with Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(viewport.zoom * zoomFactor, 0.25), 2.5);

    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

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
  };

  const handleStartNodeDrag = (
    nodeId: string,
    clientX: number,
    clientY: number,
    multi: boolean
  ) => {
    if (canvasMode === 'pan' || isSpacePressed) {
      setIsPanning(true);
      panStartRef.current = { x: clientX - viewport.x, y: clientY - viewport.y };
      return;
    }

    if (!selectedNodeIds.includes(nodeId)) {
      handleNodeSelect(nodeId, multi);
    }

    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (node && containerRef.current) {
      setDraggingNodeId(nodeId);
      const containerRect = containerRef.current.getBoundingClientRect();
      const rawWorldX = (clientX - containerRect.left - viewport.x) / viewport.zoom;
      const rawWorldY = (clientY - containerRect.top - viewport.y) / viewport.zoom;
      dragOffsetRef.current = {
        x: rawWorldX - node.position.x,
        y: rawWorldY - node.position.y,
      };

      const initialPos: Record<string, { x: number; y: number }> = {};
      workflow.nodes.forEach((n) => {
        initialPos[n.id] = { ...n.position };
      });
      initialDragPositionsRef.current = initialPos;
    }
  };

  // --- AUTO-SEPARATE OVERLAPPING NODES ---
  const handleSeparateNodes = () => {
    if (workflow.nodes.length <= 1) return;

    const incomingCount: Record<string, number> = {};
    const outgoingMap: Record<string, string[]> = {};

    workflow.nodes.forEach((n) => {
      incomingCount[n.id] = 0;
      outgoingMap[n.id] = [];
    });

    workflow.connections.forEach((c) => {
      if (incomingCount[c.toNodeId] !== undefined) {
        incomingCount[c.toNodeId] = (incomingCount[c.toNodeId] || 0) + 1;
      }
      if (outgoingMap[c.fromNodeId]) {
        outgoingMap[c.fromNodeId].push(c.toNodeId);
      }
    });

    const levels: Record<string, number> = {};
    const queue: string[] = [];

    workflow.nodes.forEach((n) => {
      if (incomingCount[n.id] === 0 || n.category === 'Triggers') {
        levels[n.id] = 0;
        queue.push(n.id);
      }
    });

    if (queue.length === 0 && workflow.nodes.length > 0) {
      queue.push(workflow.nodes[0].id);
      levels[workflow.nodes[0].id] = 0;
    }

    const visited = new Set<string>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const currentLevel = levels[current] || 0;
      const targets = outgoingMap[current] || [];
      targets.forEach((targetId) => {
        levels[targetId] = Math.max(levels[targetId] || 0, currentLevel + 1);
        if (!visited.has(targetId)) {
          queue.push(targetId);
        }
      });
    }

    let maxLevel = 0;
    Object.values(levels).forEach((l) => { if (l > maxLevel) maxLevel = l; });
    workflow.nodes.forEach((n) => {
      if (levels[n.id] === undefined) {
        maxLevel += 1;
        levels[n.id] = maxLevel;
      }
    });

    const levelColumns: Record<number, WorkflowNodeData[]> = {};
    workflow.nodes.forEach((n) => {
      const col = levels[n.id] || 0;
      if (!levelColumns[col]) levelColumns[col] = [];
      levelColumns[col].push(n);
    });

    const startX = 100;
    const startY = 120;
    const updatedNodes: WorkflowNodeData[] = [];

    const sortedCols = Object.keys(levelColumns).map(Number).sort((a, b) => a - b);
    sortedCols.forEach((colIdx) => {
      const columnNodes = levelColumns[colIdx];
      const colX = startX + colIdx * 350;
      columnNodes.forEach((node, rowIdx) => {
        const rowY = startY + rowIdx * 180;
        updatedNodes.push({
          ...node,
          position: { x: colX, y: rowY }
        });
      });
    });

    const updatedWorkflow = {
      ...workflow,
      nodes: updatedNodes
    };
    pushHistory(updatedWorkflow);
  };

  // --- CONNECTING NODES (DRAG & 2-CLICK) ---
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

    if (!isOutput && connectingState.fromNodeId !== targetNodeId) {
      connectTwoPorts(connectingState.fromNodeId, connectingState.fromPortId, targetNodeId, targetPortId);
    }

    setConnectingState(null);
  };

  // Click-to-Connect implementation (2-click connection without dragging)
  const handlePortClick = (nodeId: string, portId: string, isOutput: boolean) => {
    if (isOutput) {
      // Set as pending output source
      setPendingSourcePort({ nodeId, portId, isOutput: true });
    } else {
      // Clicked an input port! If we have a pending output source, complete the connection!
      if (pendingSourcePort && pendingSourcePort.isOutput && pendingSourcePort.nodeId !== nodeId) {
        connectTwoPorts(pendingSourcePort.nodeId, pendingSourcePort.portId, nodeId, portId);
        setPendingSourcePort(null);
      }
    }
  };

  const connectTwoPorts = (fromNodeId: string, fromPortId: string, toNodeId: string, toPortId: string) => {
    const exists = workflow.connections.some(
      (c) =>
        c.fromNodeId === fromNodeId &&
        c.fromPortId === fromPortId &&
        c.toNodeId === toNodeId &&
        c.toPortId === toPortId
    );

    if (!exists) {
      const newConnection: WorkflowConnection = {
        id: `c_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        fromNodeId,
        fromPortId,
        toNodeId,
        toPortId,
      };

      const updated = {
        ...workflow,
        connections: [...workflow.connections, newConnection],
      };
      pushHistory(updated);
    }
  };

  // Quick Connect '+' Button on Output Port (n8n Style)
  const handleQuickConnect = (nodeId: string, portId: string) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setAutoConnectState({
      fromNodeId: nodeId,
      fromPortId: portId,
      fromNodeName: node.name,
      targetPos: {
        x: node.position.x + 350,
        y: node.position.y,
      },
    });
    setAddNodeModalOpen(true);
  };

  // AI Agent Sub-node Quick Connection ('+ Model', '+ Memory', '+ Tool')
  const handleQuickAddSubNode = (nodeId: string, subType: 'model' | 'memory' | 'tool') => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    if (subType === 'model') {
      const modelDef = NODE_LIBRARY.find((n) => n.type === 'ai_model_gemini') || NODE_LIBRARY.find((n) => n.category === 'AI');
      if (modelDef) {
        const newNode: WorkflowNodeData = {
          id: `node_${Date.now()}_model`,
          type: modelDef.type,
          name: modelDef.name,
          category: modelDef.category,
          icon: modelDef.icon,
          position: { x: node.position.x - 320, y: node.position.y - 40 },
          inputs: modelDef.inputs,
          outputs: modelDef.outputs,
          config: JSON.parse(JSON.stringify(modelDef.defaultConfig)),
        };
        const newConn: WorkflowConnection = {
          id: `c_${Date.now()}`,
          fromNodeId: newNode.id,
          fromPortId: newNode.outputs[0]?.id || 'out_model',
          toNodeId: node.id,
          toPortId: 'in_model',
        };
        const updated = {
          ...workflow,
          nodes: [...workflow.nodes, newNode],
          connections: [...workflow.connections, newConn],
        };
        pushHistory(updated);
      }
    } else if (subType === 'memory') {
      const memDef = NODE_LIBRARY.find((n) => n.type === 'ai_memory_window');
      if (memDef) {
        const newNode: WorkflowNodeData = {
          id: `node_${Date.now()}_mem`,
          type: memDef.type,
          name: memDef.name,
          category: memDef.category,
          icon: memDef.icon,
          position: { x: node.position.x - 320, y: node.position.y + 110 },
          inputs: memDef.inputs,
          outputs: memDef.outputs,
          config: JSON.parse(JSON.stringify(memDef.defaultConfig)),
        };
        const newConn: WorkflowConnection = {
          id: `c_${Date.now()}`,
          fromNodeId: newNode.id,
          fromPortId: newNode.outputs[0]?.id || 'out_memory',
          toNodeId: node.id,
          toPortId: 'in_memory',
        };
        const updated = {
          ...workflow,
          nodes: [...workflow.nodes, newNode],
          connections: [...workflow.connections, newConn],
        };
        pushHistory(updated);
      }
    } else if (subType === 'tool') {
      // Open modal targeting the AI Agent's in_tools port
      const toolsConnected = workflow.connections.filter((c) => c.toNodeId === node.id && c.toPortId === 'in_tools').length;
      setAutoConnectState({
        toNodeId: node.id,
        toPortId: 'in_tools',
        targetPos: {
          x: node.position.x - 320,
          y: node.position.y + 240 + toolsConnected * 100,
        },
      });
      setAddNodeModalOpen(true);
    }
  };

  // --- ADD NODE FROM MODAL (WITH OPTIONAL AUTO-CONNECT) ---
  const handleAddNodeFromModal = (nodeDef: NodeDefinition) => {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const defaultX = containerRect ? (containerRect.width / 2 - viewport.x) / viewport.zoom - 128 : 200;
    const defaultY = containerRect ? (containerRect.height / 2 - viewport.y) / viewport.zoom - 40 : 200;

    const targetX = autoConnectState?.targetPos ? autoConnectState.targetPos.x : snapVal(defaultX);
    const targetY = autoConnectState?.targetPos ? autoConnectState.targetPos.y : snapVal(defaultY);

    const newNode: WorkflowNodeData = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: nodeDef.type,
      name: nodeDef.name,
      category: nodeDef.category,
      icon: nodeDef.icon,
      position: { x: targetX, y: targetY },
      inputs: nodeDef.inputs,
      outputs: nodeDef.outputs,
      config: JSON.parse(JSON.stringify(nodeDef.defaultConfig)),
      executionSettings: { continueOnError: false, timeoutMs: 15000 },
    };

    let newConnections = [...workflow.connections];

    // If auto-connecting from an existing node output:
    if (autoConnectState?.fromNodeId && autoConnectState.fromPortId) {
      const targetInputPort = newNode.inputs[0]?.id || 'in_main';
      newConnections.push({
        id: `c_${Date.now()}_auto`,
        fromNodeId: autoConnectState.fromNodeId,
        fromPortId: autoConnectState.fromPortId,
        toNodeId: newNode.id,
        toPortId: targetInputPort,
      });
    }

    // If auto-connecting as an inbound tool or model to an existing node:
    if (autoConnectState?.toNodeId && autoConnectState.toPortId) {
      const sourceOutputPort = newNode.outputs[0]?.id || 'out_main';
      newConnections.push({
        id: `c_${Date.now()}_auto_in`,
        fromNodeId: newNode.id,
        fromPortId: sourceOutputPort,
        toNodeId: autoConnectState.toNodeId,
        toPortId: autoConnectState.toPortId,
      });
    }

    const updated = {
      ...workflow,
      nodes: [...workflow.nodes, newNode],
      connections: newConnections,
    };

    pushHistory(updated);
    setSelectedNodeIds([newNode.id]);
    setAutoConnectState(null);
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
        x: target.position.x + 50,
        y: target.position.y + 50,
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
      if (n.position.x + 280 > maxX) maxX = n.position.x + 280;
      if (n.position.y < minY) minY = n.position.y;
      if (n.position.y + 120 > maxY) maxY = n.position.y + 120;
    }

    const padding = 100;
    const w = maxX - minX + padding * 2;
    const h = maxY - minY + padding * 2;

    const zoom = Math.min(
      Math.max(Math.min(containerRect.width / w, containerRect.height / h), 0.35),
      1.4
    );

    const x = containerRect.width / 2 - ((minX + maxX) / 2) * zoom;
    const y = containerRect.height / 2 - ((minY + maxY) / 2) * zoom;

    setViewport({ x, y, zoom });
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (e.key.toLowerCase() === 'h') {
        setCanvasMode('pan');
      } else if (e.key.toLowerCase() === 'v') {
        setCanvasMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, selectedConnectionId, historyIndex, history, workflow]);

  // Exact wire port position calculator
  const getNodePortPos = (nodeId: string, portId: string, isOutput: boolean) => {
    const node = workflow.nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const nodeWidth = node.type === 'ai_agent' ? 280 : 264;
    const ports = isOutput ? node.outputs : node.inputs;
    const portIndex = ports.findIndex((p) => p.id === portId);
    const totalPorts = ports.length || 1;

    // Center single ports or distribute multiple ports evenly
    const topOffset = 44;
    const spanHeight = Math.max(30, (totalPorts - 1) * 22);
    const step = totalPorts > 1 ? spanHeight / (totalPorts - 1) : 0;
    const portY = node.position.y + topOffset + (portIndex >= 0 ? portIndex * step : 15);

    if (isOutput) {
      return {
        x: node.position.x + nodeWidth,
        y: portY,
      };
    } else {
      return {
        x: node.position.x,
        y: portY,
      };
    }
  };

  const editingNode = workflow.nodes.find((n) => n.id === editingNodeId) || null;
  const isPanActive = canvasMode === 'pan' || isSpacePressed;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#070b14] overflow-hidden select-none">
      {/* Top Dedicated Action Subheader Strip - Completely Non-Overlapping */}
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
        canvasMode={canvasMode}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        onChangeCanvasMode={(mode) => setCanvasMode(mode)}
        onSeparateNodes={handleSeparateNodes}
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
        onOpenAddNode={() => {
          setAutoConnectState(null);
          setAddNodeModalOpen(true);
        }}
        onRunWorkflow={handleTestWorkflow}
        onSaveWorkflow={handleSave}
        onToggleActive={async () => {
          await onToggleActive();
          setWorkflow((w) => ({ ...w, active: !w.active }));
        }}
      />

      {/* Interactive Workflow Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDownCanvas}
        onTouchStart={handleTouchStartCanvas}
        onWheel={handleWheel}
        className={`relative flex-1 w-full h-full overflow-hidden bg-[#070b14] select-none touch-none ${
          isPanActive
            ? isPanning
              ? 'cursor-grabbing'
              : 'cursor-grab'
            : 'cursor-default'
        }`}
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

        {/* Pending Connection Banner (Click-to-Connect Helper) */}
        {pendingSourcePort && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-400 text-cyan-300 text-xs font-medium shadow-lg animate-pulse">
            <span>⚡ Click any input port on another node to connect</span>
            <button
              onClick={() => setPendingSourcePort(null)}
              className="text-slate-400 hover:text-white ml-1 text-xs"
            >
              ✕
            </button>
          </div>
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
                      setPendingSourcePort(null);
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
                isPendingSource={pendingSourcePort?.nodeId === node.id}
                executionResult={latestExecution?.nodeResults[node.id]}
                isConnecting={Boolean(connectingState)}
                onSelect={handleNodeSelect}
                onStartDrag={handleStartNodeDrag}
                onStartPortDrag={handleStartPortDrag}
                onPortMouseUp={handlePortMouseUp}
                onPortClick={handlePortClick}
                onQuickConnect={handleQuickConnect}
                onQuickAddSubNode={handleQuickAddSubNode}
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

        {/* Mini Map HUD (Bottom Right, Tucked Away) */}
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
      </div>

      {/* Add Node Search Modal (with Auto-Connect Context support) */}
      <AddNodeModal
        isOpen={addNodeModalOpen}
        onClose={() => {
          setAddNodeModalOpen(false);
          setAutoConnectState(null);
        }}
        onSelectNode={handleAddNodeFromModal}
        autoConnectContext={
          autoConnectState?.fromNodeName
            ? { fromNodeName: autoConnectState.fromNodeName }
            : null
        }
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
