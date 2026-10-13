import React, { useState, useEffect } from 'react';
import {
  Send,
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Loader2,
  ExternalLink,
  Smartphone,
  Copy,
  Check,
  Zap,
  Info
} from 'lucide-react';
import { Workflow, WorkflowNodeData } from '../../types/workflow';

interface TelegramMobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
  onUpdateWorkflowNode?: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  onSaveWorkflow?: () => Promise<void>;
}

export const TelegramMobileModal: React.FC<TelegramMobileModalProps> = ({
  isOpen,
  onClose,
  workflow,
  onUpdateWorkflowNode,
  onSaveWorkflow,
}) => {
  // Find Telegram node in current workflow if any
  const tgNode = workflow.nodes.find(
    (n) =>
      n.type === 'app_telegram' ||
      n.type === 'comm_telegram' ||
      n.type === 'eie-nodes-base.telegram' ||
      n.type === 'telegram' ||
      n.name.toLowerCase().includes('telegram')
  );

  const [botToken, setBotToken] = useState<string>('');
  const [chatId, setChatId] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>(
    '🔔 <b>Workflow Live Test Alert</b>\n━━━━━━━━━━━━━━━━━━━━\n✅ <b>Connection verified:</b> Test message received successfully from EIE Cloud Automation.\n⚡ <i>Workflow Pipeline Active</i>'
  );

  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifiedBot, setVerifiedBot] = useState<{ name: string; username: string } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<{ messageId: number; time: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [autoDetectNotice, setAutoDetectNotice] = useState<string | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (tgNode?.config) {
      const cfgToken = tgNode.config.botToken || tgNode.config.token || '';
      const cfgChatId = tgNode.config.chatId || tgNode.config.chat_id || '';
      setBotToken(String(cfgToken).replace(/^bot/i, '').replace(/^=+/, '').trim());
      setChatId(String(cfgChatId).replace(/^=+/, '').trim());
    }
  }, [tgNode]);

  if (!isOpen) return null;

  const handleVerifyToken = async () => {
    const cleanToken = botToken.replace(/^bot/i, '').replace(/^=+/, '').trim();
    if (!cleanToken || !cleanToken.includes(':')) {
      setVerifyError('कृपया मान्य Bot Token डालें (प्रारूप: 123456789:ABCdefGHI...)');
      return;
    }

    setIsVerifying(true);
    setVerifyError(null);
    setVerifiedBot(null);

    try {
      // 1. Direct browser call to Telegram API (native CORS)
      let botData: any = null;
      try {
        const directRes = await fetch(`https://api.telegram.org/bot${cleanToken}/getMe`);
        const json = await directRes.json();
        if (json.ok && json.result) {
          botData = json.result;
        }
      } catch (err) {
        // Fallback to server route
      }

      if (!botData) {
        const res = await fetch('/api/integrations/telegram/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ botToken: cleanToken }),
        });
        const data = await res.json();
        if (data.ok && data.bot) {
          botData = data.bot;
        } else {
          setVerifyError(data.error || 'Token अमान्य है। कृपया @BotFather से प्राप्त टोकन की जाँच करें।');
        }
      }

      if (botData) {
        setVerifiedBot({
          name: botData.first_name || 'Telegram Bot',
          username: botData.username || 'bot',
        });
        setVerifyError(null);
      }
    } catch (e: any) {
      setVerifyError(`सत्यापन विफल: ${e.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAutoDetectChatId = async () => {
    const cleanToken = botToken.replace(/^bot/i, '').replace(/^=+/, '').trim();
    if (!cleanToken) {
      setAutoDetectNotice('पहले Bot Token डालें, फिर Telegram में अपने बॉट को /start भेजें!');
      return;
    }

    setIsAutoDetecting(true);
    setAutoDetectNotice(null);

    try {
      const res = await fetch('/api/integrations/telegram/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: cleanToken, limit: 10 }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.updates) && data.updates.length > 0) {
        const latest = data.updates[data.updates.length - 1];
        if (latest?.chatId) {
          setChatId(String(latest.chatId));
          setAutoDetectNotice(`✓ Chat ID मिली: ${latest.chatId} (${latest.senderName})!`);
        } else {
          setAutoDetectNotice('कोई नया संदेश नहीं मिला। Telegram ऐप में अपने बॉट को /start भेजें और पुनः प्रयास करें।');
        }
      } else {
        setAutoDetectNotice('कोई संदेश नहीं मिला। Telegram में अपने बॉट को खोलें और START दबाएं!');
      }
    } catch (e: any) {
      setAutoDetectNotice(`त्रुटि: ${e.message}`);
    } finally {
      setIsAutoDetecting(false);
    }
  };

  const handleSendTestMessage = async () => {
    const cleanToken = botToken.replace(/^bot/i, '').replace(/^=+/, '').trim();
    const cleanChatId = chatId.replace(/^=+/, '').trim();

    if (!cleanToken) {
      setSendError('Bot Token आवश्यक है! ऊपर टोकन दर्ज करें।');
      return;
    }
    if (!cleanChatId) {
      setSendError('Chat ID आवश्यक है! मोबाइल Chat ID दर्ज करें।');
      return;
    }

    setIsSending(true);
    setSendError(null);
    setSendSuccess(null);

    try {
      const res = await fetch('/api/integrations/telegram/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: cleanToken,
          chatId: cleanChatId,
          text: testMessage,
        }),
      });
      const data = await res.json();

      if (data.ok && data.delivered) {
        setSendSuccess({
          messageId: data.messageId,
          time: new Date().toLocaleTimeString('hi-IN'),
        });
        setSendError(null);
      } else {
        const err = data.error || 'डिलीवरी विफल';
        if (err.toLowerCase().includes('chat not found')) {
          setSendError('त्रुटि: Chat not found. कृपया अपने Telegram ऐप में इस बॉट को खोलकर START (या /start) भेजें!');
        } else {
          setSendError(`टेलीग्राम API त्रुटि: ${err}`);
        }
      }
    } catch (e: any) {
      setSendError(`नेटवर्क त्रुटि: ${e.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleSaveToWorkflow = async () => {
    const cleanToken = botToken.replace(/^bot/i, '').replace(/^=+/, '').trim();
    const cleanChatId = chatId.replace(/^=+/, '').trim();

    if (tgNode && onUpdateWorkflowNode) {
      setIsSaving(true);
      onUpdateWorkflowNode(tgNode.id, {
        config: {
          ...(tgNode.config || {}),
          botToken: cleanToken,
          token: cleanToken,
          chatId: cleanChatId,
          chat_id: cleanChatId,
        },
      });

      if (onSaveWorkflow) {
        await onSaveWorkflow().catch(() => {});
      }
      setIsSaving(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#090d16] border border-blue-500/40 shadow-2xl shadow-blue-950/80 p-5 sm:p-6 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Telegram Mobile Delivery
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Live Internet
                </span>
              </div>
              <p className="text-xs text-slate-400">
                मोबाइल ऐप पर सीधे संदेश पहुँचाने के लिए Bot Token व Chat ID कॉन्फ़िगर करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step-by-Step Instructions Banner */}
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-300 font-bold">
            <Info className="w-4 h-4 shrink-0 text-cyan-400" />
            <span>30 सेकंड में फ्री बॉट बनाकर मोबाइल से जोड़ें:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 text-[11.5px] leading-relaxed">
            <li>
              Telegram में{' '}
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 font-bold underline inline-flex items-center gap-1 hover:text-cyan-300"
              >
                @BotFather खोलें <ExternalLink className="w-3 h-3 inline" />
              </a>
            </li>
            <li>
              <code className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]">
                /newbot
              </code>{' '}
              भेजें और अपने बॉट का नाम व username सेट करें।
            </li>
            <li>मिला हुआ <strong className="text-cyan-300 font-mono">HTTP API Token</strong> नीचे बॉक्स में पेस्ट करें।</li>
            <li>अपने बॉट को Telegram में खोलकर <strong className="text-emerald-400 font-bold">START</strong> दबाएं ताकि वह आपको मैसेज भेज सके!</li>
          </ol>
        </div>

        {/* Bot Token Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              Telegram Bot Token (टोकन)
            </label>
            <span className="text-[10px] text-slate-400 font-mono">From @BotFather</span>
          </div>
          <div className="flex items-stretch gap-1.5">
            <input
              type="text"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value.trim())}
              placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleVerifyToken}
              disabled={isVerifying || !botToken}
              className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-600/20"
            >
              {isVerifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verify</span>
            </button>
          </div>
          {verifiedBot && (
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-[11px] text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>सत्यापित बॉट: <strong>@{verifiedBot.username}</strong> ({verifiedBot.name})</span>
            </div>
          )}
          {verifyError && (
            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/50 text-[11px] text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{verifyError}</span>
            </div>
          )}
        </div>

        {/* Chat ID Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-blue-400" />
              Recipient Chat ID (प्राप्तकर्ता मोबाइल Chat ID)
            </label>
            <button
              type="button"
              onClick={handleAutoDetectChatId}
              disabled={isAutoDetecting}
              className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 hover:bg-blue-900 border border-blue-500/50 text-blue-300 flex items-center gap-1 cursor-pointer transition"
            >
              {isAutoDetecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Radio className="w-3 h-3 text-cyan-400" />}
              <span>Auto-Detect My Chat ID</span>
            </button>
          </div>
          <input
            type="text"
            value={chatId}
            onChange={(e) => setChatId(e.target.value.replace(/^=+/, '').trim())}
            placeholder="5102553052"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono text-xs focus:border-blue-500 focus:outline-none"
          />
          {autoDetectNotice && (
            <div className="text-[11px] text-cyan-300 bg-slate-900/80 p-2 rounded border border-slate-800 font-mono">
              {autoDetectNotice}
            </div>
          )}
        </div>

        {/* Live Test Send Section */}
        <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              मोबाइल पर तुरंत लाइव टेस्ट संदेश भेजें
            </span>
            <span className="text-[10px] font-mono text-emerald-400">Live Delivery</span>
          </div>

          <button
            type="button"
            onClick={handleSendTestMessage}
            disabled={isSending}
            className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/30 cursor-pointer active:scale-98"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSending ? 'संदेश भेजा जा रहा है...' : 'Send Real Test Message to Mobile Phone'}</span>
          </button>

          {sendSuccess && (
            <div className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500 text-xs text-emerald-200 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>🚀 संदेश मोबाइल पर सफलतापूर्वक डिलीवर हो गया!</span>
              </div>
              <div className="text-[11px] font-mono text-emerald-400/90">
                Telegram Message ID: #{sendSuccess.messageId} (समय: {sendSuccess.time})
              </div>
            </div>
          )}

          {sendError && (
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500 text-xs text-rose-200 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>डिलीवरी विफल रही:</span>
              </div>
              <p className="text-[11px] text-rose-200">{sendError}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition border border-slate-800"
          >
            रद्द करें
          </button>
          <button
            type="button"
            onClick={handleSaveToWorkflow}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Save to Workflow</span>
          </button>
        </div>
      </div>
    </div>
  );
};
