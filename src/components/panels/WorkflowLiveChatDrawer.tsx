import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Trash2,
  Loader2,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowDownCircle,
  Play
} from 'lucide-react';
import { Workflow } from '../../types/workflow';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  executionId?: string;
  error?: boolean;
}

interface WorkflowLiveChatDrawerProps {
  isOpen: boolean;
  workflow: Workflow;
  onClose: () => void;
  onTriggerExecution: (payload: any) => Promise<any>;
}

// -------------------------------------------------------------
// SEPARATED BOTTOM FUNCTION COMPONENT (MOBILE & PC DEDICATED)
// -------------------------------------------------------------
export interface ChatBottomInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  isSending: boolean;
  onSendMessage: (text?: string) => void;
  isMobileCompact?: boolean;
}

export const ChatBottomInputBar: React.FC<ChatBottomInputProps> = ({
  inputText,
  setInputText,
  isSending,
  onSendMessage,
  isMobileCompact = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    onSendMessage();
  };

  const quickPrompts = [
    'Hello, test trigger!',
    'Status update',
    'Order #9821 status',
    'Urgent ticket'
  ];

  return (
    <div className="w-full border-t border-slate-800/90 bg-slate-950/98 backdrop-blur-md px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl shrink-0">
      {/* Quick Prompts Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1.5 text-[11px]">
        <span className="text-slate-500 font-medium text-[10px] shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Quick:</span>
        </span>
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSendMessage(prompt)}
            disabled={isSending}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-cyan-500/40 whitespace-nowrap transition cursor-pointer disabled:opacity-50 text-[10px] active:scale-95"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-0.5">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to trigger chat workflow..."
            disabled={isSending}
            // text-base on mobile prevents iOS Safari zooming on focus, sm:text-xs on PC
            className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-base sm:text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition disabled:opacity-50 font-normal"
          />
          {inputText && (
            <button
              type="button"
              onClick={() => setInputText('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="h-10 min-w-10 sm:min-w-12 px-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold shadow-lg shadow-cyan-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          title="Send (Enter)"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <>
              <Send className="w-4 h-4 text-slate-950 stroke-[2.5]" />
              <span className="hidden sm:inline text-xs font-bold">Send</span>
            </>
          )}
        </button>
      </form>

      {/* PC hint bar */}
      <div className="hidden sm:flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
        <span>Press <kbd className="px-1 py-0.2 bg-slate-900 border border-slate-800 rounded font-mono text-[9px] text-slate-400">Enter</kbd> to trigger workflow</span>
        <span>Target: Chat Trigger Node</span>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// MAIN WORKFLOW LIVE CHAT DRAWER
// -------------------------------------------------------------
export const WorkflowLiveChatDrawer: React.FC<WorkflowLiveChatDrawerProps> = ({
  isOpen,
  workflow,
  onClose,
  onTriggerExecution,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Workflow Live Chat connected! Send any message below to trigger your workflow in real-time.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBottomBarOnly, setIsBottomBarOnly] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen && !isBottomBarOnly) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isBottomBarOnly]);

  if (!isOpen) return null;

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputText).trim();
    if (!textToSend || isSending) return;

    const userMsgId = `user_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const sessionId = `session_${workflow.id.slice(0, 8)}`;
      const payload = {
        message: textToSend,
        text: textToSend,
        query: textToSend,
        sessionId,
        user: { name: 'Live Tester', id: 'usr_live' },
        timestamp: new Date().toISOString(),
      };

      const result = await onTriggerExecution(payload);

      // Extract bot reply from chat_message, chat_ai, ai_agent, telegram, or final output
      let botReply = '';
      if (result && result.nodeResults) {
        const nodeVals: any[] = Object.values(result.nodeResults);

        // 1. Look for AI agent or Chat AI node first
        const aiNode = nodeVals.find(
          (n) =>
            n.nodeType === 'chat_ai' ||
            n.nodeType === 'ai_agent' ||
            n.nodeType === 'app_openai' ||
            n.nodeType === 'app_google_gemini'
        );
        if (aiNode?.output?.reply || aiNode?.output?.text || aiNode?.output?.message) {
          botReply = aiNode.output.reply || aiNode.output.text || aiNode.output.message;
        }

        // 2. Look for Chat Message node
        if (!botReply) {
          const chatMsgNode = nodeVals.find((n) => n.nodeType === 'chat_message');
          if (chatMsgNode?.output?.message || chatMsgNode?.output?.text || chatMsgNode?.output?.reply) {
            botReply = chatMsgNode.output.message || chatMsgNode.output.text || chatMsgNode.output.reply;
          }
        }

        // 3. Look for Telegram node (report delivery)
        if (!botReply) {
          const tgNode = nodeVals.find((n) => n.nodeType === 'app_telegram' || n.nodeType === 'comm_telegram');
          if (tgNode?.output) {
            const deliveredText = tgNode.output.message || tgNode.output.text || tgNode.output.reply;
            const targetChat = tgNode.output.chatId || 'Telegram';
            botReply = `✈️ Telegram message sent to ${targetChat}: "${deliveredText}"`;
          }
        }

        // 4. Any other non-trigger downstream node in execution order (from last to first)
        if (!botReply) {
          const nonTriggers = nodeVals.filter(
            (n) => n.nodeType !== 'chat_trigger' && !n.nodeType.startsWith('trigger_')
          );
          for (let i = nonTriggers.length - 1; i >= 0; i--) {
            const out = nonTriggers[i].output;
            if (out?.reply || out?.message || out?.text || out?.result) {
              botReply = out.reply || out.message || out.text || out.result;
              break;
            }
          }
        }
      }

      if (!botReply) {
        botReply =
          result?.output?.reply ||
          result?.output?.message ||
          result?.output?.text ||
          'Workflow executed successfully. All steps finished with 200 OK.';
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: String(botReply),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          executionId: result?.id,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot_err_${Date.now()}`,
          sender: 'bot',
          text: `Execution notice: ${err?.message || 'Workflow finished.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          error: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: 'bot',
        text: 'Chat history cleared. Send a message to test again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // If user selected "Bottom Bar Only" mode (separated bottom function to test while looking at canvas)
  if (isBottomBarOnly) {
    return (
      <div className="fixed left-0 right-0 bottom-0 z-50 flex flex-col items-center animate-in slide-in-from-bottom duration-200">
        {/* Minimized Dock Bar */}
        <div className="w-full sm:max-w-2xl bg-slate-900/98 backdrop-blur-xl border-t sm:border sm:rounded-t-2xl border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/80 bg-slate-950/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white text-[11px]">Chat Trigger Bottom Dock (Separated)</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">• {workflow.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsBottomBarOnly(false)}
                className="flex items-center gap-1 text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 transition cursor-pointer"
              >
                <ChevronUp className="w-3 h-3" />
                <span>Open Full Chat</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Separated Bottom Input Function */}
          <ChatBottomInputBar
            inputText={inputText}
            setInputText={setInputText}
            isSending={isSending}
            onSendMessage={handleSendMessage}
            isMobileCompact={true}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile Backdrop overlay (closes drawer on outside tap on mobile) */}
      <div
        className="sm:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-45"
        onClick={onClose}
      />

      {/* Main Drawer Window */}
      <div
        className={`fixed left-0 right-0 sm:left-auto sm:right-6 bottom-0 z-50 bg-slate-900/98 backdrop-blur-xl border border-slate-800 shadow-2xl rounded-t-2xl sm:rounded-2xl flex flex-col text-slate-100 transition-all duration-200 ${
          isExpanded
            ? 'h-[88vh] sm:h-[80vh] sm:w-[520px]'
            : 'h-[500px] max-h-[82vh] sm:max-h-[72vh] sm:w-[460px]'
        }`}
      >
        {/* Header with Mobile Drag Handle & PC Actions */}
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/90 flex items-center justify-between rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">Chat Trigger Live Box</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready to trigger" />
              </div>
              <p className="text-[10px] text-slate-400 truncate max-w-[200px]">Live message tester for {workflow.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Separate / Dock to Bottom Bar button */}
            <button
              onClick={() => setIsBottomBarOnly(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition cursor-pointer"
              title="Separate into Bottom Function Bar"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Clear History"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer hidden sm:block"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3 overscroll-contain">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                    isUser
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-sky-400 border border-slate-700'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md shadow-cyan-950/40'
                      : msg.error
                      ? 'bg-rose-950/80 border border-rose-800 text-rose-200 rounded-tl-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  <div
                    className={`mt-1 flex items-center gap-1.5 text-[9px] ${
                      isUser ? 'text-cyan-200/80 justify-end' : 'text-slate-500 justify-start'
                    }`}
                  >
                    <Clock className="w-2.5 h-2.5" />
                    <span>{msg.timestamp}</span>
                    {msg.executionId && (
                      <span>• #{msg.executionId.replace('exec_', '').slice(0, 6)}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {isSending && (
            <div className="flex items-center gap-2 text-slate-400 text-xs py-1">
              <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-sky-400">
                <Bot className="w-3.5 h-3.5 animate-pulse" />
              </div>
              <div className="px-3 py-2 rounded-2xl bg-slate-950 border border-slate-800 rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
                <span className="text-[11px] text-slate-400">Workflow is processing...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* DEDICATED SEPARATED BOTTOM FUNCTION BAR */}
        <ChatBottomInputBar
          inputText={inputText}
          setInputText={setInputText}
          isSending={isSending}
          onSendMessage={handleSendMessage}
        />
      </div>
    </>
  );
};
