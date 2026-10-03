import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Send,
  X,
  Play,
  Pause,
  MessageSquare,
  Bot,
  Zap,
  RotateCw,
  HelpCircle,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { Workflow, WorkflowNodeData, Execution } from '../../types/workflow';
import { WorkflowIssue, autoRepairWorkflow } from '../../utils/workflowDoctor';

interface MiniAiFixerRobotProps {
  workflow: Workflow;
  canvasTransform: { x: number; y: number; zoom: number };
  latestExecution: Execution | null;
  issues: WorkflowIssue[];
  onOpenFixerDrawer: () => void;
  onAutoRepair: () => void;
  onApplyWorkflow: (wf: Workflow, reason: string) => void;
  onTestWorkflow?: () => void;
}

export const MiniAiFixerRobot: React.FC<MiniAiFixerRobotProps> = ({
  workflow,
  canvasTransform,
  latestExecution,
  issues,
  onOpenFixerDrawer,
  onAutoRepair,
  onApplyWorkflow,
  onTestWorkflow,
}) => {
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [robotMode, setRobotMode] = useState<'patrol' | 'scan' | 'fix' | 'build' | 'idle'>('patrol');
  const [isPatrolPaused, setIsPatrolPaused] = useState(false);
  const [facingRight, setFacingRight] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [showQuickPrompt, setShowQuickPrompt] = useState(false);
  const [quickInput, setQuickInput] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [isFixingSequence, setIsFixingSequence] = useState(false);
  const [activeSpeechText, setActiveSpeechText] = useState('AI Fixer online');
  const [speechSubtext, setSpeechSubtext] = useState('');
  const [victoryAnimation, setVictoryAnimation] = useState(false);
  const [laserTarget, setLaserTarget] = useState<{ x: number; y: number } | null>(null);

  const prevNodePosRef = useRef<{ x: number; y: number }>({ x: 200, y: 200 });

  const nodes = workflow.nodes || [];
  const issueCount = issues.length;

  // Determine current focus node
  const activeNode: WorkflowNodeData | undefined = nodes[currentNodeIndex] || nodes[0];

  // Calculate Screen Coordinates for Robot based on target node and canvas pan/zoom
  const robotCoords = useMemo(() => {
    if (!activeNode) {
      // Default center-left when no nodes
      return {
        x: Math.max(80, 220 * canvasTransform.zoom + canvasTransform.x),
        y: Math.max(120, 240 * canvasTransform.zoom + canvasTransform.y),
      };
    }

    // Position robot slightly to the top-right of the active node
    const canvasNodeX = activeNode.position?.x ?? 200;
    const canvasNodeY = activeNode.position?.y ?? 200;

    const screenX = (canvasNodeX + 220) * canvasTransform.zoom + canvasTransform.x;
    const screenY = (canvasNodeY - 40) * canvasTransform.zoom + canvasTransform.y;

    // Keep on screen safely
    const clampedX = Math.max(60, Math.min(window.innerWidth - 120, screenX));
    const clampedY = Math.max(80, Math.min(window.innerHeight - 140, screenY));

    return { x: clampedX, y: clampedY };
  }, [activeNode, canvasTransform]);

  // Track movement direction to tilt/face the robot
  useEffect(() => {
    if (robotCoords.x > prevNodePosRef.current.x + 10) {
      setFacingRight(true);
    } else if (robotCoords.x < prevNodePosRef.current.x - 10) {
      setFacingRight(false);
    }
    prevNodePosRef.current = robotCoords;
  }, [robotCoords]);

  // Autonomous Patrol & Scan Loop
  useEffect(() => {
    if (isPatrolPaused || isFixingSequence || isBuilding || nodes.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      // Cycle to next node
      setCurrentNodeIndex((prev) => {
        const nextIdx = (prev + 1) % nodes.length;
        const nextNode = nodes[nextIdx];
        if (nextNode) {
          setRobotMode('patrol');
          setActiveSpeechText(`Patrolling to ${nextNode.name}...`);
          setSpeechSubtext('');
          setLaserTarget(null);

          // Once reached, enter scan mode
          setTimeout(() => {
            setRobotMode('scan');
            const hasError = issues.some((iss) => iss.nodeId === nextNode.id);
            if (hasError) {
              setActiveSpeechText(`⚠️ Issue detected on ${nextNode.name}!`);
              setSpeechSubtext('Click me or "Fix All" to repair');
            } else {
              setActiveSpeechText(`🔍 Inspected ${nextNode.name}`);
              setSpeechSubtext('Status: Healthy & Active');
            }
          }, 1100);
        }
        return nextIdx;
      });
    }, 5500);

    return () => clearInterval(interval);
  }, [isPatrolPaused, isFixingSequence, isBuilding, nodes.length, issues]);

  // Update speech bubble when issue count changes
  useEffect(() => {
    if (isFixingSequence || isBuilding) return;

    if (issueCount > 0) {
      setActiveSpeechText(`⚠️ ${issueCount} issue(s) detected!`);
      setSpeechSubtext('I can auto-repair all nodes now');
    } else if (nodes.length > 0) {
      if (robotMode === 'patrol') {
        setActiveSpeechText(`Patrolling workflow nodes...`);
      }
    } else {
      setActiveSpeechText('Canvas empty. Give me an instruction to build!');
      setSpeechSubtext('e.g. "Create telegram bot workflow"');
    }
  }, [issueCount, nodes.length, isFixingSequence, isBuilding]);

  // Execute sequential issue fixing across nodes
  const executeSequentialAutoFix = async () => {
    if (isFixingSequence) return;
    setIsFixingSequence(true);
    setRobotMode('fix');
    setActiveSpeechText('⚡ Initiating Auto-Repair Sequence...');
    setSpeechSubtext('Traversing faulty nodes');

    // Find nodes with issues
    const errorNodeIds = Array.from(
      new Set(
        issues
          .map((i) => i.nodeId)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (errorNodeIds.length === 0 && nodes.length > 0) {
      // Default to repairing first node
      errorNodeIds.push(nodes[0].id);
    }

    // Sequentially travel to each error node and play welding/repair beam
    for (let i = 0; i < errorNodeIds.length; i++) {
      const errNodeId = errorNodeIds[i];
      const targetIdx = nodes.findIndex((n) => n.id === errNodeId);
      if (targetIdx !== -1) {
        setCurrentNodeIndex(targetIdx);
        const targetNode = nodes[targetIdx];
        setActiveSpeechText(`🔧 Repairing "${targetNode.name}"...`);
        setSpeechSubtext('Configuring ports & clearing errors');

        // Aim laser beam from robot to node center
        const nodeScreenX = (targetNode.position.x + 100) * canvasTransform.zoom + canvasTransform.x;
        const nodeScreenY = (targetNode.position.y + 40) * canvasTransform.zoom + canvasTransform.y;
        setLaserTarget({ x: nodeScreenX, y: nodeScreenY });

        // Wait for repair beam
        await new Promise((r) => setTimeout(r, 1200));
      }
    }

    // Finish repair
    setLaserTarget(null);
    onAutoRepair();

    // Victory spin!
    setVictoryAnimation(true);
    setActiveSpeechText('🎉 All issues resolved & cleared!');
    setSpeechSubtext('Workflow is 100% healthy and ready');
    setRobotMode('idle');

    setTimeout(() => {
      setVictoryAnimation(false);
      setIsFixingSequence(false);
      setRobotMode('patrol');
    }, 2800);
  };

  // Build workflow from natural language instruction
  const handleQuickBuildInstruction = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim() || isBuilding) return;

    const promptText = quickInput.trim();
    setQuickInput('');
    setShowQuickPrompt(false);
    setIsBuilding(true);
    setRobotMode('build');
    setActiveSpeechText('🤖 AI Fixer synthesizing workflow...');
    setSpeechSubtext(`Prompt: "${promptText.slice(0, 30)}..."`);

    try {
      const res = await fetch('/api/fixer/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          workflow,
          latestExecution,
          language: /[\u0900-\u097F]|karo|banao|karein|hai/i.test(promptText) ? 'hi' : 'en',
        }),
      });

      const data = await res.json();

      if (data.action === 'build_workflow' && data.builtWorkflow?.nodes?.length) {
        const built = data.builtWorkflow;
        setActiveSpeechText(`🏗️ Constructing ${built.nodes.length} nodes on canvas...`);

        // Animate robot jumping to each node position in sequence
        for (let i = 0; i < built.nodes.length; i++) {
          const n = built.nodes[i];
          setActiveSpeechText(`⚡ Placing step ${i + 1}/${built.nodes.length}: ${n.name}`);
          await new Promise((r) => setTimeout(r, 450));
        }

        const newWf: Workflow = {
          ...workflow,
          name: built.name || workflow.name,
          description: built.description || workflow.description,
          nodes: built.nodes,
          connections: built.connections || [],
        };

        onApplyWorkflow(newWf, 'Constructed by AI Fixer Robot');
        setVictoryAnimation(true);
        setActiveSpeechText('🚀 Workflow constructed successfully!');
        setSpeechSubtext(data.reply?.slice(0, 80) || 'Ready on canvas');

        setTimeout(() => {
          setVictoryAnimation(false);
          setIsBuilding(false);
          setRobotMode('patrol');
          setCurrentNodeIndex(0);
        }, 2500);
      } else if (data.action === 'auto_repair' && data.builtWorkflow) {
        onApplyWorkflow(
          {
            ...workflow,
            nodes: data.builtWorkflow.nodes,
            connections: data.builtWorkflow.connections,
          },
          'Repaired by AI Fixer Robot'
        );
        onAutoRepair();
        setActiveSpeechText('✅ Repaired workflow successfully!');
        setIsBuilding(false);
        setRobotMode('patrol');
      } else {
        // Chat reply received
        setActiveSpeechText('💡 AI Fixer:');
        setSpeechSubtext(data.reply?.slice(0, 70) || 'Instruction acknowledged');
        setIsBuilding(false);
        setRobotMode('patrol');
      }
    } catch (err) {
      console.error('[AI Fixer Robot Quick Build Error]', err);
      setActiveSpeechText('⚠️ Could not complete request');
      setSpeechSubtext('Please try again or use the full drawer');
      setIsBuilding(false);
      setRobotMode('patrol');
    }
  };

  return (
    <>
      {/* Laser Repair Beam Overlay (Active during repair welding) */}
      {laserTarget && (
        <svg
          className="fixed inset-0 pointer-events-none z-50 overflow-visible"
          style={{ width: '100vw', height: '100vh' }}
        >
          <defs>
            <linearGradient id="robotBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="1" />
            </linearGradient>
            <filter id="beamGlow">
              <feGaussianBlur stdDeviation="3" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <line
            x1={robotCoords.x + 22}
            y1={robotCoords.y + 24}
            x2={laserTarget.x}
            y2={laserTarget.y}
            stroke="url(#robotBeamGrad)"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            filter="url(#beamGlow)"
            className="animate-pulse"
          />
          {/* Target spark ring */}
          <circle
            cx={laserTarget.x}
            cy={laserTarget.y}
            r="16"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
            className="animate-ping"
          />
        </svg>
      )}

      {/* Floating Miniature Humanoid Robot Container */}
      <div
        className="fixed z-40 select-none"
        style={{
          left: `${robotCoords.x}px`,
          top: `${robotCoords.y}px`,
          transition: 'left 1.1s cubic-bezier(0.25, 1, 0.5, 1), top 1.1s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Floating Speech / Status Bubble */}
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-2.5 py-1 rounded-xl bg-slate-950/90 border ${
            issueCount > 0
              ? 'border-amber-500/60 shadow-amber-500/20'
              : 'border-cyan-500/50 shadow-cyan-500/20'
          } shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-auto flex flex-col items-center cursor-pointer`}
          onClick={() => setShowQuickPrompt(!showQuickPrompt)}
        >
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-white tracking-wide">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                robotMode === 'fix'
                  ? 'bg-amber-400 animate-ping'
                  : robotMode === 'build'
                  ? 'bg-purple-400 animate-ping'
                  : 'bg-cyan-400 animate-pulse'
              }`}
            />
            <span>{activeSpeechText}</span>
          </div>
          {speechSubtext && (
            <span className="text-[9px] text-cyan-300/80 font-mono -mt-0.5">{speechSubtext}</span>
          )}
          {/* Triangle bubble pointer */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-cyan-500/50 rotate-45" />
        </div>

        {/* Humanoid Robot Body */}
        <div
          onClick={() => setShowQuickPrompt(!showQuickPrompt)}
          className={`relative w-12 h-14 cursor-pointer transition-transform duration-300 ${
            facingRight ? 'scale-x-100' : '-scale-x-100'
          } ${victoryAnimation ? 'rotate-[360deg] transition-transform duration-700' : ''}`}
          title="AI Fixer - Humanoid Robot Assistant. Click for quick actions!"
        >
          {/* Gentle vertical floating animation wrapper */}
          <div className="w-full h-full flex flex-col items-center animate-robot-float">
            {/* Robot Head with Visor & Antenna */}
            <div className="relative w-8 h-7 rounded-t-xl rounded-b-lg bg-gradient-to-b from-slate-200 via-slate-100 to-slate-300 border border-slate-400 shadow-md flex items-center justify-center">
              {/* Antenna on top */}
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex flex-col items-center">
                <span
                  className={`w-2 h-2 rounded-full ${
                    robotMode === 'fix'
                      ? 'bg-amber-400 shadow-amber-400/80 animate-ping'
                      : robotMode === 'build'
                      ? 'bg-purple-400 shadow-purple-400/80 animate-ping'
                      : 'bg-cyan-400 shadow-cyan-400/80 animate-pulse'
                  } shadow-sm`}
                />
                <span className="w-0.5 h-1.5 bg-slate-400" />
              </div>

              {/* Side ear muff pods */}
              <div className="absolute -left-1 top-2 w-1.5 h-3 rounded-full bg-cyan-600 border border-cyan-400" />
              <div className="absolute -right-1 top-2 w-1.5 h-3 rounded-full bg-cyan-600 border border-cyan-400" />

              {/* Digital LED Visor Face */}
              <div className="w-6 h-4 rounded-md bg-slate-950 border border-cyan-500/60 flex items-center justify-around px-0.5 shadow-inner">
                {robotMode === 'fix' ? (
                  // Focused welding eyes [ > < ]
                  <span className="text-[10px] font-bold text-amber-300 tracking-widest font-mono">
                    &gt; &lt;
                  </span>
                ) : robotMode === 'build' ? (
                  // Construct star eyes [ ★ ★ ]
                  <span className="text-[9px] font-bold text-purple-300 tracking-wider">★ ★</span>
                ) : robotMode === 'scan' ? (
                  // Scanner radar sweep
                  <div className="w-full h-0.5 bg-cyan-400 shadow-cyan-300 shadow-sm animate-pulse" />
                ) : (
                  // Normal cute expressive eyes [ ^ ^ ]
                  <div className="flex items-center justify-between w-full px-1 text-cyan-300 text-[10px] font-bold">
                    <span>^</span>
                    <span>^</span>
                  </div>
                )}
              </div>
            </div>

            {/* Humanoid Robot Torso / Armor */}
            <div className="relative -mt-0.5 w-7 h-5 rounded-md bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border border-cyan-500/40 shadow-sm flex items-center justify-center">
              {/* Glowing Chest Arc Reactor Core */}
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  robotMode === 'fix'
                    ? 'bg-amber-400 shadow-amber-400/90 animate-ping'
                    : robotMode === 'build'
                    ? 'bg-purple-400 shadow-purple-400/90 animate-ping'
                    : 'bg-cyan-400 shadow-cyan-400/80 animate-pulse'
                } border border-white/60 shadow-md`}
              />

              {/* Left Arm with Handheld Multi-Tool / Laser Welder */}
              <div className="absolute -left-2 top-0.5 flex items-center">
                <div className="w-1.5 h-3 bg-slate-300 rounded-sm border border-slate-500" />
                <div
                  className={`w-2.5 h-1.5 rounded-xs ${
                    robotMode === 'fix' ? 'bg-amber-400 animate-pulse' : 'bg-cyan-500'
                  } border border-slate-700`}
                />
              </div>

              {/* Right Arm */}
              <div className="absolute -right-1.5 top-0.5 w-1.5 h-3 bg-slate-300 rounded-sm border border-slate-500" />
            </div>

            {/* Hover Jetpack Thrusters with Plasma Flames */}
            <div className="flex items-center gap-1.5 -mt-0.5">
              <div className="w-1.5 h-1 rounded-b bg-slate-600 flex flex-col items-center">
                <span className="w-1 h-2 rounded-b-full bg-cyan-400/90 shadow-cyan-400 shadow-xs animate-pulse" />
              </div>
              <div className="w-1.5 h-1 rounded-b bg-slate-600 flex flex-col items-center">
                <span className="w-1 h-2 rounded-b-full bg-cyan-400/90 shadow-cyan-400 shadow-xs animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Robot Interactive Menu Bar (Visible on Hover or when prompted) */}
        {(isHovered || showQuickPrompt) && (
          <div
            className="absolute top-16 left-1/2 -translate-x-1/2 w-64 p-2.5 rounded-2xl bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-xl flex flex-col gap-2 z-50 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-bold text-cyan-300">AI Fixer Robot</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                  v2.0
                </span>
              </div>
              <button
                onClick={() => setShowQuickPrompt(false)}
                className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              {issueCount > 0 ? (
                <button
                  onClick={executeSequentialAutoFix}
                  disabled={isFixingSequence}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold shadow-md cursor-pointer active:scale-95 transition"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Fix All ({issueCount})</span>
                </button>
              ) : (
                <button
                  onClick={executeSequentialAutoFix}
                  disabled={isFixingSequence}
                  className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-cyan-500/30 cursor-pointer active:scale-95 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Health Check</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowQuickPrompt(false);
                  onOpenFixerDrawer();
                }}
                className="flex items-center justify-center gap-1 px-2 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Open Chat</span>
              </button>
            </div>

            {/* Quick Natural Language Instruction Input ("Workflow banane ka instruction du to bana bhi de") */}
            <form onSubmit={handleQuickBuildInstruction} className="flex flex-col gap-1.5 mt-0.5">
              <label className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Give AI Fixer an Instruction:</span>
                <span className="text-[9px] text-cyan-400">Hindi / English</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="e.g. Telegram alert workflow banao..."
                  disabled={isBuilding}
                  className="w-full pl-2.5 pr-8 py-1.5 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition"
                />
                <button
                  type="submit"
                  disabled={!quickInput.trim() || isBuilding}
                  className="absolute right-1 p-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-30 text-slate-950 cursor-pointer transition"
                  title="Send instruction to AI Fixer"
                >
                  <Send className="w-3 h-3 stroke-[2.5]" />
                </button>
              </div>
            </form>

            {/* Patrol Toggle Control */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400">
              <span>Auto Patrol Mode</span>
              <button
                onClick={() => setIsPatrolPaused(!isPatrolPaused)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg border text-[10px] font-mono cursor-pointer transition ${
                  isPatrolPaused
                    ? 'border-slate-700 bg-slate-800 text-slate-400'
                    : 'border-cyan-500/40 bg-cyan-950/60 text-cyan-300'
                }`}
              >
                {isPatrolPaused ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                <span>{isPatrolPaused ? 'Resume' : 'Active'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
