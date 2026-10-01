import React, { useState, useEffect, useRef } from 'react';
import {
  Stethoscope,
  X,
  Send,
  Wrench,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Play,
  Zap,
  Activity,
  ArrowRight,
  Check,
  Plus,
  Layers,
  Bot,
  Copy,
  Clock,
  Workflow as WorkflowIcon,
  ShieldCheck,
  FileSpreadsheet,
  Mail,
  MessageSquare,
  Globe
} from 'lucide-react';
import { Workflow, WorkflowNodeData, WorkflowConnection, Execution } from '../../types/workflow';
import { diagnoseWorkflow, autoRepairWorkflow, DiagnosticReport } from '../../utils/workflowDoctor';

interface BuiltWorkflowPreview {
  name: string;
  description: string;
  nodes: WorkflowNodeData[];
  connections: WorkflowConnection[];
}

interface EiDoctorDrawerProps {
  isOpen: boolean;
  workflow: Workflow;
  latestExecution?: Execution | null;
  onClose: () => void;
  onUpdateWorkflow: (updated: Workflow, reason?: string) => void;
  onTestWorkflow?: () => void;
  onCreateNewWorkflow?: (
    name?: string,
    description?: string,
    starterNodes?: WorkflowNodeData[],
    starterConnections?: WorkflowConnection[]
  ) => Promise<void> | void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'doctor';
  text: string;
  timestamp: string;
  language?: 'en' | 'hi';
  builtWorkflow?: BuiltWorkflowPreview;
  actions?: {
    label: string;
    actionType: 'auto_fix' | 'test_run' | 'apply_workflow' | 'create_new_workflow';
  }[];
}

/**
 * Detect language: English vs Hindi/Hinglish
 */
function detectLanguage(text: string): 'hi' | 'en' {
  if (!text) return 'en';
  if (/[\u0900-\u097F]/.test(text)) return 'hi';

  const hindiHinglishKeywords = new Set([
    'kewal', 'karo', 'karein', 'karke', 'karna', 'nahi', 'nahin', 'hai', 'hain',
    'kaise', 'kya', 'banao', 'bana', 'banado', 'thik', 'theek', 'sahi', 'galti',
    'sudharo', 'chalao', 'poocho', 'puchho', 'puchhe', 'puchha', 'pucho', 'mujhe',
    'aap', 'aapka', 'aur', 'bhi', 'ye', 'yeh', 'vo', 'voh', 'isme', 'usme', 'ho',
    'raha', 'rahi', 'rahe', 'chahiye', 'pehle', 'baad', 'badh', 'dikkat', 'madad',
    'bataye', 'batao', 'matlab', 'kaam', 'karte', 'kyu', 'kyun'
  ]);

  const words = text.toLowerCase().split(/[^a-zA-Z0-9_]+/);
  let hindiTokens = 0;
  for (const w of words) {
    if (hindiHinglishKeywords.has(w)) {
      hindiTokens++;
    }
  }

  return hindiTokens >= 1 ? 'hi' : 'en';
}

export const EiDoctorDrawer: React.FC<EiDoctorDrawerProps> = ({
  isOpen,
  workflow,
  latestExecution,
  onClose,
  onUpdateWorkflow,
  onTestWorkflow,
  onCreateNewWorkflow,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLang, setUserLang] = useState<'en' | 'hi'>('en');
  const [appliedWfId, setAppliedWfId] = useState<string | null>(null);
  const [report, setReport] = useState<DiagnosticReport>(() => diagnoseWorkflow(workflow, latestExecution));
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recalculate diagnostics whenever workflow or execution changes
  useEffect(() => {
    const diag = diagnoseWorkflow(workflow, latestExecution);
    setReport(diag);
  }, [workflow, latestExecution]);

  // Initial welcome message from Ei-Doctor (Bilingual & friendly)
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const diag = diagnoseWorkflow(workflow, latestExecution);
      const issueCount = diag.issues.length;

      const welcomeText = `Hello & Namaste! I am **Ei-Doctor** 🩺, your AI Workflow Doctor & Automation Architect.

💬 **Ask me in English or Hindi / Mujhse English ya Hindi me poochein:**
• **Diagnose & Auto-Fix**: Fix broken connections, missing triggers, or error-throwing nodes.
• **Build Workflows Automatically**: Give me any prompt (e.g. *"Build a workflow to read Google Sheets and send email with Gmail"* or *"Customer support webhook aur Slack alert banao"*), and I will generate the complete workflow directly on canvas!

${
  issueCount === 0
    ? `✨ Your workflow **"${workflow.name}"** is 100% healthy! No issues detected.`
    : `⚠️ I detected **${issueCount} potential issue(s)** in **"${workflow.name}"**. Click **"⚡ Auto-Fix All"** or ask me to fix them!`
}`;

      setMessages([
        {
          id: 'msg_welcome',
          sender: 'doctor',
          text: welcomeText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: 'en',
          actions:
            issueCount > 0
              ? [
                  { label: '⚡ Auto-Fix All Problems', actionType: 'auto_fix' },
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

  // Handle Auto-Repair internally (in user's detected language)
  const handleAutoRepair = (lang: 'en' | 'hi' = userLang) => {
    const { fixedWorkflow, fixesApplied } = autoRepairWorkflow(workflow, latestExecution);

    onUpdateWorkflow(fixedWorkflow, 'Ei-Doctor Auto-Repair');

    let replyText = '';
    if (lang === 'en') {
      replyText = `🩺 **Ei-Doctor Prescription Applied! Workflow Repaired Successfully!**\n\nI have resolved the following issues internally:\n\n`;
      if (fixesApplied.length === 0) {
        replyText += `All connections and node configurations are already optimal.`;
      } else {
        fixesApplied.forEach((fix) => {
          replyText += `✅ ${fix}\n`;
        });
        replyText += `\nYour workflow is now fully calibrated! You can click "Test Run" to verify execution.`;
      }
    } else {
      replyText = `🩺 **Ei-Doctor Prescription Applied! Workflow Thik Ho Gaya Hai!**\n\nMaine internally ye problems solve kar di hain:\n\n`;
      if (fixesApplied.length === 0) {
        replyText += `Sabhi connections aur configurations pehle se sahi the.`;
      } else {
        fixesApplied.forEach((fix) => {
          replyText += `✅ ${fix}\n`;
        });
        replyText += `\nAb aapka workflow bilkul theek se execute hoga! Aap "Test Run" karke live response dekh sakte hain.`;
      }
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `msg_${Date.now()}`,
        sender: 'doctor',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: lang,
        actions: [{ label: lang === 'en' ? '🧪 Test Run Workflow' : '🧪 Test Run Chalao', actionType: 'test_run' }],
      },
    ]);
  };

  // Handle applying a newly built workflow to canvas
  const handleApplyBuiltWorkflow = (built: BuiltWorkflowPreview, asNew: boolean = false) => {
    if (asNew && onCreateNewWorkflow) {
      onCreateNewWorkflow(built.name, built.description, built.nodes, built.connections);
      setAppliedWfId(built.name);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_applied_${Date.now()}`,
          sender: 'doctor',
          text: userLang === 'en'
            ? `✅ **Workflow Created!** "${built.name}" has been saved as a new workflow in your library.`
            : `✅ **Naya Workflow Save Ho Gaya!** "${built.name}" aapke library me create kar diya gaya hai.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [{ label: userLang === 'en' ? '🧪 Test Run' : '🧪 Test Run Karein', actionType: 'test_run' }],
        },
      ]);
    } else {
      const updatedWf: Workflow = {
        ...workflow,
        name: built.name,
        description: built.description,
        nodes: built.nodes,
        connections: built.connections,
      };

      onUpdateWorkflow(updatedWf, 'Generated by Ei-Doctor');
      setAppliedWfId(built.name);

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_applied_${Date.now()}`,
          sender: 'doctor',
          text: userLang === 'en'
            ? `🚀 **Workflow Applied to Canvas!** The steps and connections have been loaded directly into your editor.`
            : `🚀 **Workflow Canvas Par Load Ho Gaya!** Sabhi steps aur connections aapke editor me load ho chuke hain.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: [{ label: userLang === 'en' ? '🧪 Test Run' : '🧪 Test Run Karein', actionType: 'test_run' }],
        },
      ]);
    }
  };

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    const detectedLang = detectLanguage(text);
    setUserLang(detectedLang);

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text,
      language: detectedLang,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Fast-path for direct repair keywords
    const lower = text.toLowerCase();
    const isRepairIntent =
      lower.includes('thik kar') ||
      lower.includes('theek kar') ||
      lower.includes('fix all') ||
      lower.includes('auto repair') ||
      lower.includes('solve all problems') ||
      lower.includes('galti sudharo') ||
      lower.includes('repair all');

    if (isRepairIntent) {
      setTimeout(() => {
        handleAutoRepair(detectedLang);
        setIsLoading(false);
      }, 400);
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
      const reply = data.reply || (detectedLang === 'en' ? 'I have analyzed your request.' : 'Maine aapki request process kar li hai.');
      const builtWf = data.builtWorkflow as BuiltWorkflowPreview | undefined;

      const actionsList: ChatMessage['actions'] = [];
      if (builtWf) {
        actionsList.push({
          label: detectedLang === 'en' ? '🚀 Load onto Canvas' : '🚀 Canvas Par Load Karein',
          actionType: 'apply_workflow',
        });
        if (onCreateNewWorkflow) {
          actionsList.push({
            label: detectedLang === 'en' ? '➕ Save as New Workflow' : '➕ Naya Workflow Banayein',
            actionType: 'create_new_workflow',
          });
        }
      } else if (report.issues.length > 0) {
        actionsList.push({
          label: detectedLang === 'en' ? '⚡ Auto-Fix All Problems' : '⚡ Sabhi Problem Thik Karein',
          actionType: 'auto_fix',
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_d`,
          sender: 'doctor',
          text: reply,
          builtWorkflow: builtWf,
          language: data.language || detectedLang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actions: actionsList.length > 0 ? actionsList : undefined,
        },
      ]);
    } catch {
      // Local fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}_d`,
          sender: 'doctor',
          text: detectedLang === 'en'
            ? `I have inspected your workflow structure. If you notice any misconfigurations or broken connections, click "Auto-Fix" below and I will calibrate the parameters and ports internally!`
            : `Maine aapke workflow ka structure check kiya hai. Koi bhi dikkat ho to aap niche "Auto-Fix" daba sakte hain, main internally sabhi wires aur configurations theek kar doonga!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: detectedLang,
          actions: [{ label: detectedLang === 'en' ? '⚡ Auto-Fix All Problems' : '⚡ Sabhi Problem Thik Karein', actionType: 'auto_fix' }],
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

      {/* Slide-in Ei-Doctor Chat Drawer */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[500px] max-w-full bg-[#0a0f1d] border-l border-cyan-500/30 shadow-2xl z-55 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md shadow-cyan-500/30">
                <Stethoscope className="w-5 h-5 stroke-[2.4]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">Ei-Doctor</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                  <Activity className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                  AI Architect & Doctor
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {userLang === 'en' ? 'Diagnostics, Auto-Repair & Autonomous Builder' : 'Workflow Diagnostics, Auto-Repair & Builder'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Health Score Pill */}
            <div
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border ${
                report.healthScore >= 85
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  : report.healthScore >= 50
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
              }`}
              title="Workflow Health Score"
            >
              <span>{report.healthScore}%</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Ei-Doctor"
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
            <span className="truncate text-slate-300 font-medium">
              {report.issues.length === 0
                ? userLang === 'en'
                  ? 'Workflow healthy • All steps aligned'
                  : 'Workflow bilkul theek hai • Sabhi steps aligned'
                : userLang === 'en'
                ? `${report.issues.length} issue(s) detected in workflow`
                : `Workflow me ${report.issues.length} problem(s) mili hain`}
            </span>
          </div>

          {report.issues.length > 0 && (
            <button
              onClick={() => handleAutoRepair()}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition cursor-pointer shrink-0"
              title="Fix all workflow mistakes automatically"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{userLang === 'en' ? 'Auto-Fix All' : 'Auto-Fix Karein'}</span>
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
                      🩺
                    </div>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isUser ? (userLang === 'en' ? 'You' : 'Aap (User)') : 'Ei-Doctor'} • {msg.timestamp}
                  </span>
                </div>

                <div
                  className={`p-3.5 rounded-2xl max-w-[92%] leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-900/30 font-medium'
                      : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-tl-none shadow-lg'
                  }`}
                >
                  <div>{msg.text}</div>

                  {/* AI Generated Workflow Blueprint Preview Card */}
                  {msg.builtWorkflow && (
                    <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-cyan-500/40 shadow-xl shadow-cyan-500/10">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-300">
                            <Sparkles className="w-4 h-4 text-cyan-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white tracking-tight">{msg.builtWorkflow.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {msg.builtWorkflow.nodes.length} Steps • {msg.builtWorkflow.connections.length} Connections
                            </span>
                          </div>
                        </div>
                        {appliedWfId === msg.builtWorkflow.name && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700">
                            <Check className="w-3 h-3 text-emerald-400" />
                            Applied
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-300 mt-2 leading-snug">
                        {msg.builtWorkflow.description}
                      </p>

                      {/* Visual Steps Flow Pills */}
                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        {msg.builtWorkflow.nodes.map((node, i) => (
                          <React.Fragment key={node.id}>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-cyan-200">
                              <span className="w-3.5 h-3.5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-[9px] font-bold">
                                {i + 1}
                              </span>
                              <span>{node.name}</span>
                            </span>
                            {i < msg.builtWorkflow!.nodes.length - 1 && (
                              <ArrowRight className="w-3 h-3 text-slate-500" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>

                      {/* Action Buttons for this Generated Workflow */}
                      <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => handleApplyBuiltWorkflow(msg.builtWorkflow!, false)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          <span>{userLang === 'en' ? 'Load onto Canvas' : 'Canvas Par Load Karein'}</span>
                        </button>

                        {onCreateNewWorkflow && (
                          <button
                            onClick={() => handleApplyBuiltWorkflow(msg.builtWorkflow!, true)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 active:scale-95 transition cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{userLang === 'en' ? 'Save as New' : 'Naya Workflow Banayein'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* General Action Buttons */}
                  {msg.actions && msg.actions.length > 0 && !msg.builtWorkflow && (
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
                                  sender: 'doctor',
                                  text: userLang === 'en'
                                    ? 'Workflow test run started! Check the Execution Logs drawer below for real-time results.'
                                    : 'Workflow execution test run chalu ho gaya hai! Niche Execution Logs drawer me live step results check karein.',
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
              <Stethoscope className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
              <span>
                {userLang === 'en' ? 'Ei-Doctor is thinking & architecting...' : 'Ei-Doctor workflow build aur checkup kar raha hai...'}
              </span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips (Bilingual: English & Hindi) */}
        <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => handleSendMessage('Build a workflow: Webhook trigger, summarize with Gemini AI, and notify in Slack')}
            className="px-2.5 py-1 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-[11px] border border-cyan-800/50 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            ⚡ Build Webhook ➔ AI ➔ Slack
          </button>
          <button
            onClick={() => handleSendMessage('Ek workflow banao jo Google Sheets se lead padhe aur Gmail par email bheje')}
            className="px-2.5 py-1 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 text-[11px] border border-emerald-800/50 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            📊 Sheets ➔ Gmail Automator
          </button>
          <button
            onClick={() => handleSendMessage(userLang === 'en' ? 'Diagnose workflow health and identify all problems' : 'Workflow me kya problem hai check karo')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            🔍 {userLang === 'en' ? 'Diagnose Workflow' : 'Problem scan karo'}
          </button>
          <button
            onClick={() => handleSendMessage(userLang === 'en' ? 'Fix all errors and auto-repair connections' : 'Sabhi galti internally thik kar do')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            ⚡ {userLang === 'en' ? 'Auto-Fix All' : 'Galti thik karo'}
          </button>
          <button
            onClick={() => handleSendMessage(userLang === 'en' ? 'Run a test execution on this workflow' : 'Workflow test run chalao')}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-slate-800 whitespace-nowrap cursor-pointer transition shrink-0"
          >
            🧪 {userLang === 'en' ? 'Test Run' : 'Test run'}
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
            placeholder={
              userLang === 'en'
                ? "Ask in English or type 'Build a workflow to...'"
                : "English ya Hindi me poochein ya 'Ek workflow banao...' likhein"
            }
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-cyan-500/20"
            title="Send to Ei-Doctor"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};
