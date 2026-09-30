import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  X,
  Send,
  Wrench,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { Workflow, Execution } from '../../types/workflow';
import { diagnoseWorkflow, autoRepairWorkflow, DiagnosticReport } from '../../utils/workflowDoctor';

interface EieBuddyDrawerProps {
  isOpen: boolean;
  workflow: Workflow;
  latestExecution?: Execution | null;
  onClose: () => void;
  onUpdateWorkflow: (updated: Workflow, reason?: string) => void;
  onTestWorkflow?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'buddy';
  text: string;
  timestamp: string;
  actions?: {
    label: string;
    actionType: 'auto_fix' | 'test_run' | 'inspect';
  }[];
}

export const EieBuddyDrawer: React.FC<EieBuddyDrawerProps> = ({
  isOpen,
  workflow,
  latestExecution,
  onClose,
  onUpdateWorkflow,
  onTestWorkflow,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<DiagnosticReport>(() => diagnoseWorkflow(workflow, latestExecution));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recalculate diagnostics whenever workflow or latest execution changes
  useEffect(() => {
    const diag = diagnoseWorkflow(workflow, latestExecution);
    setReport(diag);
  }, [workflow, latestExecution]);

  // Initial welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const diag = diagnoseWorkflow(workflow, latestExecution);
      const issueCount = diag.issues.length;

      let welcomeText = `Namaste! Main hoon **EIE Buddy**, aapka AI Workflow Engineer 🤖.\n\n`;
      if (issueCount === 0) {
        welcomeText += `Aapka workflow **"${workflow.name}"** bilkul sahi aur healthy hai! Koi error ya missing connection nahi mila.`;
      } else {
        welcomeText += `Maine aapke workflow **"${workflow.name}"** ko scan kiya hai aur **${issueCount} issue(s)** paye hain:\n`;
        diag.issues.slice(0, 3).forEach((iss, idx) => {
          welcomeText += `\n${idx + 1}. **${iss.title}**: ${iss.description}`;
        });
        if (issueCount > 3) {
          welcomeText += `\n...aur ${issueCount - 3} anya issues.`;
        }
        welcomeText += `\n\nKya aap chahte hain ki main in sabhi galtiyo ko **internally automatically thik** kar doon?`;
      }

      setMessages([
        {
          id: 'msg_welcome',
          sender: 'buddy',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions:
            issueCount > 0
              ? [
                  { label: '⚡ Auto-Fix All Issues', actionType: 'auto_fix' },
                  { label: '🧪 Test Run Workflow', actionType: 'test_run' },
                ]
              : [{ label: '🧪 Test Run Workflow', actionType: 'test_run' }],
        },
      ]);
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  // Handle Auto-Repair
  const handleAutoRepair = () => {
    const { fixedWorkflow, fixesApplied } = autoRepairWorkflow(workflow, latestExecution);

    onUpdateWorkflow(fixedWorkflow, 'EIE Buddy Auto-Repair');

    let replyText = `🎉 **Workflow Repair Completed!**\nMaine workflow ko internally examine karke ye fixes apply kiye hain:\n\n`;
    if (fixesApplied.length === 0) {
      replyText += `Sabhi connections aur configurations pehle se theek the.`;
    } else {
      fixesApplied.forEach((fix, i) => {
        replyText += `• ${fix}\n`;
      });
      replyText += `\nAb aapka workflow bilkul ready hai! Aap "Test Run" karke ise verify kar sakte hain.`;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'buddy',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: [{ label: '🧪 Test Run Workflow', actionType: 'test_run' }],
      },
    ]);
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // If user says "thik karo", "fix", etc., trigger auto-repair right away
    const lower = text.toLowerCase();
    if (
      lower.includes('thik kar') ||
      lower.includes('fix') ||
      lower.includes('solve') ||
      lower.includes('repair') ||
      lower.includes('galti sudhar')
    ) {
      setTimeout(() => {
        handleAutoRepair();
        setIsLoading(false);
      }, 600);
      return;
    }

    try {
      const res = await fetch('/api/buddy/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          workflow,
          latestExecution,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'Maine aapke workflow ko analyze kar liya hai. Sabhi options available hain.';

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_b`,
          sender: 'buddy',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions:
            report.issues.length > 0
              ? [{ label: '⚡ Auto-Fix All Issues', actionType: 'auto_fix' }]
              : undefined,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_b`,
          sender: 'buddy',
          text: `Aapka sawal mil gaya! Main aapke workflow ke ${workflow.nodes.length} nodes aur connections ko dekh raha hoon. Koi galti ho to aap "Auto-Fix" daba kar turant thik kar sakte hain.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [{ label: '⚡ Auto-Fix All Issues', actionType: 'auto_fix' }],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Slide-in EIE Buddy Chat Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] max-w-full bg-[#0a0f1d] border-l border-cyan-500/30 shadow-2xl z-55 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/30">
                <Bot className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">EIE Buddy</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  AI Repair Bot
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Intelligent Workflow Diagnostician</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Health Badge */}
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                report.healthScore >= 85
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : report.healthScore >= 50
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
            >
              <span>{report.healthScore}%</span>
              <span className="text-[10px] opacity-80 uppercase font-sans">Health</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close EIE Buddy"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Diagnostics Strip */}
        <div className="bg-slate-900/80 px-4 py-2.5 border-b border-slate-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            {report.issues.length === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            )}
            <span className="truncate text-slate-300">
              {report.issues.length === 0
                ? 'All nodes & wires optimal'
                : `${report.issues.length} workflow issue(s) detected`}
            </span>
          </div>

          {report.issues.length > 0 && (
            <button
              onClick={handleAutoRepair}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition cursor-pointer shrink-0"
              title="Fix all workflow mistakes automatically"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Auto-Fix All</span>
            </button>
          )}
        </div>

        {/* Chat History Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  {!isUser && (
                    <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px]">
                      🤖
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isUser ? 'Aap (User)' : 'EIE Buddy'} • {msg.timestamp}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[88%] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-900/30 font-medium'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg'
                  }`}
                >
                  {msg.text}

                  {/* Action Buttons if provided */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-2">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (act.actionType === 'auto_fix') {
                              handleAutoRepair();
                            } else if (act.actionType === 'test_run') {
                              onTestWorkflow?.();
                              setMessages((prev) => [
                                ...prev,
                                {
                                  id: `msg_${Date.now()}`,
                                  sender: 'buddy',
                                  text: 'Workflow execution test trigger kar diya gaya hai! Niche Execution Drawer me live outputs dekhein.',
                                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                },
                              ]);
                            }
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition cursor-pointer"
                        >
                          {act.actionType === 'auto_fix' && <Wrench className="w-3 h-3" />}
                          {act.actionType === 'test_run' && <Play className="w-3 h-3 fill-current" />}
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs italic p-2 bg-slate-900/50 rounded-xl w-fit">
              <Bot className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>EIE Buddy workflow analyze kar raha hai...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSendMessage('Workflow me kya problem hai?')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            🔍 Problem scan karo
          </button>
          <button
            onClick={() => handleSendMessage('Sabhi galti internally thik kar do')}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 text-[11px] border border-cyan-800/60 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            ⚡ Sabhi galti thik karo
          </button>
          <button
            onClick={() => handleSendMessage('AI Agent ko Google Gemini model se connect karo')}
            className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-[11px] border border-purple-800/60 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            🤖 AI Agent setup karo
          </button>
          <button
            onClick={() => handleSendMessage('Workflow test run chalao')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            🧪 Test run
          </button>
        </div>

        {/* Message Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="EIE Buddy se poochein ya 'thik kar do' likhein..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-500/20"
            title="Send to EIE Buddy"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};
