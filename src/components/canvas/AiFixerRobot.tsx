import React, { useState, useEffect, useRef } from 'react';
import {
  Wrench,
  Sparkles,
  Zap,
  Send,
  X,
  Play,
  Pause,
  Bot,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Flame,
  Layers,
  ArrowRight
} from 'lucide-react';
import { WorkflowNodeData, WorkflowConnection } from '../../types/workflow';

interface AiFixerRobotProps {
  nodes: WorkflowNodeData[];
  connections: WorkflowConnection[];
  issuesCount: number;
  viewport: { x: number; y: number; zoom: number };
  onOpenAiFixer: () => void;
  onAutoFix: () => void;
  onBuildWorkflowPrompt: (prompt: string) => Promise<void>;
  isExecuting?: boolean;
}

export const AiFixerRobot: React.FC<AiFixerRobotProps> = ({
  nodes,
  connections,
  issuesCount,
  viewport,
  onOpenAiFixer,
  onAutoFix,
  onBuildWorkflowPrompt,
  isExecuting = false,
}) => {
  // Robot position in canvas coordinates
  const [robotPos, setRobotPos] = useState<{ x: number; y: number }>({ x: 180, y: 140 });
  const [targetNodeIndex, setTargetNodeIndex] = useState(0);
  const [isRoaming, setIsRoaming] = useState(true);
  const [facingLeft, setFacingLeft] = useState(false);
  const [robotState, setRobotState] = useState<'patrolling' | 'inspecting' | 'repairing' | 'building' | 'idle'>('patrolling');
  const [speechBubble, setSpeechBubble] = useState<string | null>('Hi! I am AI Fixer 🤖');
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [promptText, setPromptText] = useState('');
  const [isBuildingPrompt, setIsBuildingPrompt] = useState(false);
  const [repairSpark, setRepairSpark] = useState(false);

  // Dragging support
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; startX: number; startY: number } | null>(null);

  // Roaming Loop: Move between nodes every few seconds
  useEffect(() => {
    if (!isRoaming || isDragging || nodes.length === 0) return;

    const timer = setInterval(() => {
      setTargetNodeIndex((prevIdx) => {
        const nextIdx = (prevIdx + 1) % nodes.length;
        const targetNode = nodes[nextIdx];

        if (targetNode?.position) {
          // Calculate target offset: hover slightly above and right of node
          const targetX = targetNode.position.x + 190;
          const targetY = targetNode.position.y - 35;

          setFacingLeft((targetNode.position.x + 190) < robotPos.x);
          setRobotPos({ x: targetX, y: targetY });
          setRobotState('inspecting');

          // Dynamic speech bubble based on node health
          const hasConnection = connections.some(
            (c) => c.fromNodeId === targetNode.id || c.toNodeId === targetNode.id
          );

          if (!hasConnection && nodes.length > 1) {
            setSpeechBubble(`⚠️ "${targetNode.name}" needs connection!`);
          } else if (targetNode.type === 'ai_agent') {
            const hasModel = connections.some((c) => c.toNodeId === targetNode.id && c.toPortId === 'in_model');
            setSpeechBubble(hasModel ? `🤖 AI Agent calibrated!` : `⚠️ Model needed for Agent`);
          } else {
            const msgs = [
              `Inspecting ${targetNode.name}...`,
              `Node "${targetNode.name}" OK ✓`,
              `Checking parameters...`,
              `Step health: 100% ✨`,
            ];
            setSpeechBubble(msgs[Math.floor(Math.random() * msgs.length)]);
          }

          // Clear speech bubble after 2.8 seconds
          setTimeout(() => {
            setSpeechBubble(null);
            setRobotState('patrolling');
          }, 2800);
        }

        return nextIdx;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isRoaming, isDragging, nodes, connections, robotPos.x]);

  // Initial placement near first node
  useEffect(() => {
    if (nodes.length > 0 && nodes[0]?.position) {
      setRobotPos({
        x: nodes[0].position.x + 180,
        y: nodes[0].position.y - 40,
      });
    }
  }, []);

  // Trigger quick repair animation
  const handleQuickRepair = () => {
    setRobotState('repairing');
    setRepairSpark(true);
    setSpeechBubble('⚡ Repairing all issues...');
    onAutoFix();

    setTimeout(() => {
      setRepairSpark(false);
      setRobotState('patrolling');
      setSpeechBubble('✨ All issues fixed!');
      setTimeout(() => setSpeechBubble(null), 2500);
    }, 1200);
  };

  // Trigger prompt build
  const handleBuildFromInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText.trim() || isBuildingPrompt) return;

    setIsBuildingPrompt(true);
    setRobotState('building');
    setSpeechBubble(`🚀 Building: "${promptText.slice(0, 25)}..."`);

    try {
      await onBuildWorkflowPrompt(promptText.trim());
      setSpeechBubble('🎉 Workflow generated & connected!');
      setPromptText('');
      setQuickMenuOpen(false);
    } catch {
      setSpeechBubble('Tried building! Check AI Fixer drawer.');
    } finally {
      setIsBuildingPrompt(false);
      setTimeout(() => {
        setRobotState('patrolling');
        setSpeechBubble(null);
      }, 3000);
    }
  };

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      startX: robotPos.x,
      startY: robotPos.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragStartRef.current) return;
      const dx = (e.clientX - dragStartRef.current.mouseX) / viewport.zoom;
      const dy = (e.clientY - dragStartRef.current.mouseY) / viewport.zoom;
      setRobotPos({
        x: dragStartRef.current.startX + dx,
        y: dragStartRef.current.startY + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, viewport.zoom]);

  // Compute screen coordinates from canvas viewport
  const screenX = robotPos.x * viewport.zoom + viewport.x;
  const screenY = robotPos.y * viewport.zoom + viewport.y;

  return (
    <>
      {/* Floating Animated Humanoid Robot on Canvas */}
      <div
        style={{
          transform: `translate(${screenX}px, ${screenY}px) scale(${Math.max(0.75, Math.min(1.1, viewport.zoom))})`,
          transition: isDragging ? 'none' : 'transform 1.1s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
        className="fixed top-0 left-0 z-40 select-none pointer-events-auto cursor-grab active:cursor-grabbing group"
        onMouseDown={handleMouseDown}
      >
        {/* Speech Bubble / Mini Status Notification */}
        {speechBubble && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 border border-cyan-500/50 text-cyan-200 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-cyan-950/80 backdrop-blur-md animate-in fade-in zoom-in-90 duration-200 flex items-center gap-1.5 z-20">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{speechBubble}</span>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-solid border-t-slate-950 border-t-6 border-x-transparent border-x-4 border-b-0" />
          </div>
        )}

        {/* Repair Sparks Animation */}
        {repairSpark && (
          <div className="absolute -top-4 -right-4 w-12 h-12 flex items-center justify-center animate-spin z-30">
            <Sparkles className="w-6 h-6 text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
          </div>
        )}

        {/* Humanoid Robot Avatar (Compact Size ~46px) */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            setQuickMenuOpen(!quickMenuOpen);
          }}
          className={`relative w-12 h-14 flex flex-col items-center justify-center transition-transform hover:scale-110 active:scale-95 ${
            facingLeft ? '-scale-x-100' : 'scale-x-100'
          }`}
          title="AI Fixer - Humanoid Workflow Assistant (Click for Quick Menu)"
        >
          {/* Antenna with Pulsing Glow */}
          <div className="relative flex flex-col items-center -mb-0.5">
            <div
              className={`w-2 h-2 rounded-full border border-slate-950 shadow-sm transition-colors ${
                issuesCount > 0
                  ? 'bg-amber-400 animate-bounce shadow-amber-400/80'
                  : robotState === 'inspecting'
                  ? 'bg-cyan-400 animate-pulse shadow-cyan-400/80'
                  : 'bg-emerald-400 shadow-emerald-400/80'
              }`}
            />
            <div className="w-0.5 h-2 bg-gradient-to-t from-slate-400 to-slate-200" />
          </div>

          {/* Robot Head */}
          <div className="relative w-8 h-6 bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 border border-slate-700 rounded-t-lg rounded-b-md shadow-md flex items-center justify-center px-1">
            {/* Visor / LED Eye Display */}
            <div className="w-6 h-3 bg-slate-950 rounded-sm flex items-center justify-around px-0.5 border border-cyan-500/60 shadow-inner">
              {/* Left Eye */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  issuesCount > 0
                    ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]'
                    : robotState === 'repairing'
                    ? 'bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                    : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
                }`}
              />
              {/* Right Eye */}
              <div
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  issuesCount > 0
                    ? 'bg-amber-400 shadow-[0_0_4px_#fbbf24]'
                    : robotState === 'repairing'
                    ? 'bg-rose-400 shadow-[0_0_4px_#f43f5e]'
                    : 'bg-cyan-400 shadow-[0_0_4px_#22d3ee]'
                }`}
              />
            </div>

            {/* Left & Right Ear Bolt / Audio Receivers */}
            <div className="absolute -left-1 top-2 w-1 h-2 bg-cyan-500 rounded-l-sm" />
            <div className="absolute -right-1 top-2 w-1 h-2 bg-cyan-500 rounded-r-sm" />
          </div>

          {/* Robot Torso & Arms */}
          <div className="relative w-7 h-5 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 border border-slate-600 rounded-md flex items-center justify-center -mt-0.5 shadow-sm">
            {/* Chest Glowing Power Reactor */}
            <div
              className={`w-2.5 h-2.5 rounded-full border border-slate-950 flex items-center justify-center ${
                issuesCount > 0
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-cyan-400 shadow-[0_0_6px_#38bdf8] animate-pulse'
              }`}
            >
              <div className="w-1 h-1 bg-white rounded-full" />
            </div>

            {/* Left Arm (Holding Mini Wrench / Scanner) */}
            <div className="absolute -left-2 top-0.5 w-1.5 h-4 bg-slate-400 rounded-full flex flex-col items-center justify-end">
              <Wrench className="w-2.5 h-2.5 text-amber-400 -ml-1 -mb-1 rotate-45" />
            </div>

            {/* Right Arm */}
            <div className="absolute -right-2 top-0.5 w-1.5 h-4 bg-slate-400 rounded-full" />
          </div>

          {/* Lower Body / Twin Mini Thruster Boosters */}
          <div className="flex items-center gap-1.5 -mt-0.5">
            {/* Left Booster */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2.5 bg-slate-700 rounded-b-sm border border-slate-800" />
              {/* Flame Jet */}
              <div className="w-1.5 h-2 bg-gradient-to-b from-cyan-400 via-sky-500 to-transparent rounded-b-full animate-pulse shadow-[0_0_4px_#38bdf8]" />
            </div>

            {/* Right Booster */}
            <div className="flex flex-col items-center">
              <div className="w-2 h-2.5 bg-slate-700 rounded-b-sm border border-slate-800" />
              {/* Flame Jet */}
              <div className="w-1.5 h-2 bg-gradient-to-b from-cyan-400 via-sky-500 to-transparent rounded-b-full animate-pulse shadow-[0_0_4px_#38bdf8]" />
            </div>
          </div>

          {/* Ground Hover Shadow */}
          <div className="w-6 h-1 rounded-full bg-cyan-500/25 blur-xs mt-0.5" />
        </div>

        {/* QUICK MENU POPUP (Toggled on Robot Click) */}
        {quickMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute top-16 left-1/2 -translate-x-1/2 w-72 bg-slate-950/98 border border-slate-800 rounded-2xl shadow-2xl p-3.5 space-y-3 z-50 backdrop-blur-xl animate-in zoom-in-95 duration-150 text-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">AI Fixer</span>
                  <span className="text-[9px] text-cyan-400 font-mono block -mt-0.5">
                    {issuesCount > 0 ? `${issuesCount} Issue(s) Detected` : 'All Healthy ✨'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Pause / Resume Roaming Button */}
                <button
                  type="button"
                  onClick={() => setIsRoaming(!isRoaming)}
                  className={`p-1 rounded-md text-[10px] transition cursor-pointer ${
                    isRoaming ? 'text-slate-400 hover:text-white' : 'text-amber-400 bg-amber-500/10'
                  }`}
                  title={isRoaming ? 'Pause node roaming' : 'Resume node roaming'}
                >
                  {isRoaming ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                </button>

                <button
                  type="button"
                  onClick={() => setQuickMenuOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-white transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {/* 1. Quick Auto-Fix */}
              <button
                type="button"
                onClick={() => {
                  handleQuickRepair();
                  setQuickMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 font-bold transition cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Fix All Issues</span>
              </button>

              {/* 2. Open Full Assistant */}
              <button
                type="button"
                onClick={() => {
                  setQuickMenuOpen(false);
                  onOpenAiFixer();
                }}
                className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 font-bold transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat Assistant</span>
              </button>
            </div>

            {/* Instruction Input Form: "Build workflow instructions du to bana bhi de" */}
            <form onSubmit={handleBuildFromInstruction} className="space-y-1.5 pt-1 border-t border-slate-800/80">
              <label className="text-[10px] font-semibold text-slate-400 block flex items-center justify-between">
                <span>Instruct Robot to Build Workflow:</span>
                <span className="text-[9px] text-cyan-400 font-normal">Hindi or English</span>
              </label>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="e.g. Google Sheets padho aur Telegram bhejo..."
                  disabled={isBuildingPrompt}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
                />
                <button
                  type="submit"
                  disabled={!promptText.trim() || isBuildingPrompt}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition cursor-pointer disabled:opacity-40"
                  title="Generate & build workflow"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
};
