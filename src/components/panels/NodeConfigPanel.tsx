import React, { useState } from 'react';
import {
  X,
  Play,
  KeyRound,
  Sliders,
  Settings,
  Terminal,
  Copy,
  Check,
  Code2,
  Trash2,
  HelpCircle,
  Sparkles,
  Layers,
  Table as TableIcon,
  FileCode,
  ArrowDownCircle,
  Eye,
  EyeOff,
  Send,
  MessageSquare,
  Globe,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { WorkflowNodeData, Credential, ExecutionNodeResult } from '../../types/workflow';
import { NodeDataInspector } from '../common/NodeDataInspector';

interface NodeConfigPanelProps {
  node: WorkflowNodeData | null;
  credentials: Credential[];
  executionResult?: ExecutionNodeResult;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onTestNode: (node: WorkflowNodeData) => Promise<any>;
  onOpenLiveChat?: () => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  credentials,
  executionResult,
  onClose,
  onUpdateConfig,
  onDeleteNode,
  onTestNode,
  onOpenLiveChat,
}) => {
  const [activeTab, setActiveTab] = useState<'table' | 'json' | 'schema' | 'params' | 'credentials' | 'settings' | 'output'>('params');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedTelegramWebhook, setCopiedTelegramWebhook] = useState(false);
  const [copiedWhatsAppWebhook, setCopiedWhatsAppWebhook] = useState(false);
  const [copiedWhatsAppVerifyToken, setCopiedWhatsAppVerifyToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Token ID / Outside connection states
  const [showSecretToken, setShowSecretToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);

  // Chat Trigger Inline Testing
  const [chatTestMsg, setChatTestMsg] = useState('');
  const [chatTestResponse, setChatTestResponse] = useState<string | null>(null);
  const [isChatTesting, setIsChatTesting] = useState(false);

  const IconComponent = (((Icons as any)[node?.icon || ''] || Icons.Box)) as React.ComponentType<{ className?: string }>;
  const config = node?.config || {};

  const handleConfigChange = (key: string, value: any) => {
    if (!node) return;
    onUpdateConfig(node.id, {
      config: {
        ...node.config,
        [key]: value,
      },
    });
  };

  const handleRunSingleTest = async () => {
    if (!node) return;
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await onTestNode(node);
      setTestResult(res);
      setActiveTab('output');
    } catch (err: any) {
      setTestError(err.message || 'Test execution failed');
      setActiveTab('output');
    } finally {
      setIsTesting(false);
    }
  };

  // Connection Test: Telegram Bot Token
  const handleTestTelegramToken = async () => {
    const token = config.botToken || config.tokenId;
    if (!token) {
      setConnectionStatus({ loading: false, success: false, message: 'Please enter a Telegram Bot Token ID first.' });
      return;
    }
    setConnectionStatus({ loading: true });
    try {
      const res = await fetch('/api/integrations/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token }),
      });
      const data = await res.json();
      setConnectionStatus({
        loading: false,
        success: data.ok,
        message: data.message || data.error || (data.ok ? 'Telegram Bot Connected successfully!' : 'Connection failed'),
      });
    } catch (err: any) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: err.message || 'Error testing Telegram connection',
      });
    }
  };

  // Register Telegram Webhook with Bot API
  const handleRegisterTelegramWebhook = async () => {
    const token = config.botToken || config.tokenId;
    const webhookUrl = `${window.location.origin}/api/webhooks/telegram`;
    if (!token) {
      setConnectionStatus({ loading: false, success: false, message: 'Bot Token is required to configure Telegram Webhook.' });
      return;
    }
    setConnectionStatus({ loading: true });
    try {
      const res = await fetch('/api/integrations/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: token, webhookUrl }),
      });
      const data = await res.json();
      setConnectionStatus({
        loading: false,
        success: data.ok,
        message: data.description || 'Webhook URL registered with Telegram Bot API!',
      });
    } catch (err: any) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: err.message || 'Error configuring Telegram webhook',
      });
    }
  };

  // Connection Test: WhatsApp Cloud API Access Token
  const handleTestWhatsAppToken = async () => {
    const token = config.tokenId || config.accessToken;
    const phoneId = config.phoneNumberId;
    if (!token || !phoneId) {
      setConnectionStatus({ loading: false, success: false, message: 'Please provide both Access Token ID and Phone Number ID.' });
      return;
    }
    setConnectionStatus({ loading: true });
    try {
      const res = await fetch('/api/integrations/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token, phoneNumberId: phoneId }),
      });
      const data = await res.json();
      setConnectionStatus({
        loading: false,
        success: data.ok,
        message: data.message || data.error || (data.ok ? 'WhatsApp Cloud API Connected!' : 'Connection failed'),
      });
    } catch (err: any) {
      setConnectionStatus({
        loading: false,
        success: false,
        message: err.message || 'Error testing WhatsApp connection',
      });
    }
  };

  // Inline Chat Trigger Test
  const handleRunInlineChatTest = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || chatTestMsg).trim();
    if (!node || !promptToSend || isChatTesting) return;
    setIsChatTesting(true);
    try {
      const res = await onTestNode({
        ...node,
        config: {
          ...node.config,
          message: promptToSend,
          text: promptToSend,
          query: promptToSend,
        }
      });
      const reply = res?.output?.reply || res?.output?.text || res?.output?.message || res?.text || JSON.stringify(res?.output || res);
      setChatTestResponse(String(reply));
      setChatTestMsg('');
    } catch (err: any) {
      setChatTestResponse(`Error: ${err.message || 'Failed to trigger chat node'}`);
    } finally {
      setIsChatTesting(false);
    }
  };

  // Full Webhook URL for current origin
  const fullWebhookUrl = node ? `${window.location.origin}/api/webhook/${config.webhookPath || node.id}` : '';
  const telegramWebhookUrl = `${window.location.origin}/api/webhooks/telegram`;
  const whatsappWebhookUrl = `${window.location.origin}/api/webhooks/whatsapp`;

  // Resolved Output data for Table/JSON/Schema inspector
  const resolveOutputData = () => {
    if (!node) return null;
    if (testResult) return testResult;
    if (executionResult?.output) return executionResult.output;
    // Sample output schema
    if (node.type === 'chat_trigger' || node.type === 'chat_message' || node.type === 'chat_ai') {
      return {
        reply: 'Workflow AI response: Your order #8849 has shipped via FedEx.',
        tokensUsed: 42,
        durationMs: 180,
        status: 'success'
      };
    }
    if (node.type === 'app_telegram' || node.type === 'comm_telegram') {
      return {
        delivered: true,
        platform: 'Telegram',
        messageId: 98124,
        chatId: config.chatId || '@devops_channel',
        messagePreview: config.text || config.message || 'Alert dispatched',
        status: 'sent',
        deliveredAt: new Date().toISOString()
      };
    }
    if (node.type === 'app_whatsapp') {
      return {
        status: 'delivered',
        messageId: 'wapp_msg_89124',
        recipient: config.phoneNumber || '+15550192834',
        platform: 'WhatsApp Cloud API',
        timestamp: new Date().toISOString()
      };
    }
    if (node.type === 'app_google_sheets') {
      return [
        { rowNumber: 1, customer: 'Alice Adams', email: 'alice@company.io', amount: 1250, status: 'Completed' },
        { rowNumber: 2, customer: 'Bob Baker', email: 'bob@enterprise.com', amount: 3400, status: 'Pending' }
      ];
    }
    return {
      status: 'success',
      nodeType: node.type,
      message: 'Step executed successfully with 200 OK',
      timestamp: new Date().toISOString()
    };
  };

  const resolvedOutputData = resolveOutputData();

  if (!node) return null;

  return (
    <>
      {/* Semi-transparent Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Slide-in Drawer Container */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-full bg-slate-900 border-l border-slate-800 shadow-2xl z-55 flex flex-col text-slate-100 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <input
                type="text"
                value={node.name}
                onChange={(e) => onUpdateConfig(node.id, { name: e.target.value })}
                className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-cyan-500 focus:outline-none w-full truncate"
              />
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block">
                {node.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onDeleteNode(node.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
              title="Delete this event from workflow"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Delete</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Execution Status Alert Banner */}
        {executionResult && (
          <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
            {executionResult.status === 'failed' ? (
              <div className="flex items-center gap-2 text-rose-400 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 animate-ping" />
                <span className="font-bold shrink-0">Step Error:</span>
                <span className="truncate text-rose-300 font-mono text-[11px]">{executionResult.error || 'Execution failed'}</span>
              </div>
            ) : executionResult.status === 'success' ? (
              <div className="flex items-center gap-2 text-emerald-400 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-bold">Step Completed ({executionResult.durationMs ? `${executionResult.durationMs}ms` : 'Ready'})</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0 animate-pulse" />
                <span>Running Step...</span>
              </div>
            )}

            <button
              onClick={() => setActiveTab('output')}
              className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition cursor-pointer shrink-0"
            >
              View Output
            </button>
          </div>
        )}

      {/* Tabs: 3 Functions (Table, JSON, Schema) placed BEFORE Parameters */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/60 px-2 text-xs overflow-x-auto no-scrollbar">
        {/* 1. TABLE */}
        <button
          type="button"
          onClick={() => setActiveTab('table')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'table'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="Table View"
        >
          <TableIcon className="w-3.5 h-3.5 text-cyan-400" />
          <span>Table</span>
        </button>

        {/* 2. JSON */}
        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'json'
              ? 'border-amber-400 text-amber-300 bg-amber-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="JSON View"
        >
          <FileCode className="w-3.5 h-3.5 text-amber-400" />
          <span>JSON</span>
        </button>

        {/* 3. SCHEMA */}
        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'schema'
              ? 'border-purple-400 text-purple-300 bg-purple-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="Schema View"
        >
          <Layers className="w-3.5 h-3.5 text-purple-400" />
          <span>Schema</span>
        </button>

        {/* 4. PARAMETERS */}
        <button
          type="button"
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'params'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parameters</span>
        </button>

        {/* 5. CREDENTIALS */}
        <button
          type="button"
          onClick={() => setActiveTab('credentials')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'credentials'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Credentials</span>
        </button>

        {/* 6. SETTINGS */}
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        {/* 7. OUTPUT (next to Settings) */}
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'output'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
          title="Output Data"
        >
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span>Output</span>
        </button>
      </div>

      {/* Body / Active Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: PARAMETERS */}
        {activeTab === 'params' && (
          <div className="space-y-4">
            {/* 1. HTTP Request Configuration */}
            {node.type === 'http_request' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Method</label>
                  <select
                    value={config.method || 'GET'}
                    onChange={(e) => handleConfigChange('method', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">URL Endpoint</label>
                  <input
                    type="text"
                    value={config.url || ''}
                    onChange={(e) => handleConfigChange('url', e.target.value)}
                    placeholder="https://api.example.com/data"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Use dynamic syntax: <code className="text-cyan-400 font-mono">&#123;&#123;$json.field&#125;&#125;</code>
                  </span>
                </div>

                {['POST', 'PUT', 'PATCH'].includes(config.method || 'GET') && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Request Body (JSON)</label>
                    <textarea
                      rows={5}
                      value={config.body || ''}
                      onChange={(e) => handleConfigChange('body', e.target.value)}
                      placeholder='{\n  "query": "{{$json.customer}}"\n}'
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </>
            )}

            {/* 2. Webhook Trigger Configuration */}
            {node.type === 'trigger_webhook' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Webhook Path</label>
                  <input
                    type="text"
                    value={config.webhookPath || ''}
                    onChange={(e) => handleConfigChange('webhookPath', e.target.value)}
                    placeholder="my-inbound-hook"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono text-cyan-400">Generated URL</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fullWebhookUrl);
                        setCopiedWebhook(true);
                        setTimeout(() => setCopiedWebhook(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copiedWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-slate-300 break-all select-all">
                    {fullWebhookUrl}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sample Inbound Payload</label>
                  <textarea
                    rows={4}
                    value={config.samplePayload || ''}
                    onChange={(e) => handleConfigChange('samplePayload', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* 3. AI Agent (Google Gemini) */}
            {node.type === 'ai_agent' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Model</label>
                  <select
                    value={config.model || 'gemini-2.5-flash'}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">System Instruction</label>
                  <textarea
                    rows={3}
                    value={config.systemPrompt || ''}
                    onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                    placeholder="You are an intelligent workflow automation AI agent."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-sans focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">User Prompt Template</label>
                  <textarea
                    rows={4}
                    value={config.userPromptTemplate || ''}
                    onChange={(e) => handleConfigChange('userPromptTemplate', e.target.value)}
                    placeholder="Analyze this record: {{$json}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Dynamic variables: <code className="text-cyan-400 font-mono">&#123;&#123;$json.name&#125;&#125;</code> or <code className="text-cyan-400 font-mono">&#123;&#123;$node["Node"].json&#125;&#125;</code>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Temperature ({config.temperature ?? 0.2})
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature ?? 0.2}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Response Format</label>
                    <select
                      value={config.responseFormat || 'json'}
                      onChange={(e) => handleConfigChange('responseFormat', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="json">Structured JSON</option>
                      <option value="text">Plain Text</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* 4. Logic IF */}
            {node.type === 'logic_if' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field Path</label>
                  <input
                    type="text"
                    value={config.fieldPath || ''}
                    onChange={(e) => handleConfigChange('fieldPath', e.target.value)}
                    placeholder="urgencyScore"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operator</label>
                    <select
                      value={config.operator || '=='}
                      onChange={(e) => handleConfigChange('operator', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="==">Equals (==)</option>
                      <option value="!=">Not Equals (!=)</option>
                      <option value=">">Greater (&gt;)</option>
                      <option value=">=">Greater or Equal (&gt;=)</option>
                      <option value="<">Less (&lt;)</option>
                      <option value="<=">Less or Equal (&lt;=)</option>
                      <option value="contains">Contains String</option>
                      <option value="is_empty">Is Empty</option>
                      <option value="not_empty">Not Empty</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Value</label>
                    <input
                      type="text"
                      value={config.value || ''}
                      onChange={(e) => handleConfigChange('value', e.target.value)}
                      placeholder="50"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            {/* 4b. Switch Case (n8n Style) */}
            {node.type === 'logic_switch' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field to Match</label>
                  <input
                    type="text"
                    value={config.switchField || 'type'}
                    onChange={(e) => handleConfigChange('switchField', e.target.value)}
                    placeholder="type or category"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Case 1 Value (out_case1)</label>
                    <input
                      type="text"
                      value={config.case1 || 'urgent'}
                      onChange={(e) => handleConfigChange('case1', e.target.value)}
                      placeholder="urgent"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Case 2 Value (out_case2)</label>
                    <input
                      type="text"
                      value={config.case2 || 'standard'}
                      onChange={(e) => handleConfigChange('case2', e.target.value)}
                      placeholder="standard"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500">
                  Unmatched values will automatically flow along the <strong>Default</strong> route port.
                </p>
              </div>
            )}

            {/* 4c. Filter Items */}
            {node.type === 'logic_filter' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Filter Condition (JavaScript)</label>
                  <input
                    type="text"
                    value={config.filterCondition || 'item.urgencyScore > 50'}
                    onChange={(e) => handleConfigChange('filterCondition', e.target.value)}
                    placeholder="item.score > 50 || item.status === 'active'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Evaluated for every incoming item. Items returning truthy pass through downstream.
                  </p>
                </div>
              </div>
            )}

            {/* 4d. Merge Node (n8n Style) */}
            {node.type === 'data_merge' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Merge Mode</label>
                  <select
                    value={config.mode || 'append'}
                    onChange={(e) => handleConfigChange('mode', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="append">Append (Concatenate Lists)</option>
                    <option value="combine">Combine (Merge Object Fields)</option>
                    <option value="merge_by_key">Merge by Key (Join on ID)</option>
                    <option value="choose_branch">Choose Branch</option>
                  </select>
                </div>
                {config.mode === 'merge_by_key' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Join Key</label>
                    <input
                      type="text"
                      value={config.joinKey || 'id'}
                      onChange={(e) => handleConfigChange('joinKey', e.target.value)}
                      placeholder="id or email"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4e. Loop / Split in Batches (n8n Style) */}
            {node.type === 'data_loop' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Batch Size (N items per loop)</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.batchSize || 10}
                    onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Outputs items in groups of {config.batchSize || 10} on port <strong>loop</strong>, then fires port <strong>done</strong> when finished.
                  </p>
                </div>
              </div>
            )}

            {/* 4f. Respond to Webhook (n8n Style) */}
            {node.type === 'respond_to_webhook' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">HTTP Response Code</label>
                  <select
                    value={config.responseCode || 200}
                    onChange={(e) => handleConfigChange('responseCode', parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="200">200 OK</option>
                    <option value="201">201 Created</option>
                    <option value="202">202 Accepted</option>
                    <option value="400">400 Bad Request</option>
                    <option value="404">404 Not Found</option>
                    <option value="500">500 Server Error</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Response Body (JSON / Template)</label>
                  <textarea
                    rows={4}
                    value={config.responseBody || ''}
                    onChange={(e) => handleConfigChange('responseBody', e.target.value)}
                    placeholder='{\n  "success": true,\n  "data": "{{$json}}"\n}'
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 4g. Aggregate Items */}
            {node.type === 'data_aggregate' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Aggregation Type</label>
                  <select
                    value={config.aggregateType || 'to_array'}
                    onChange={(e) => handleConfigChange('aggregateType', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="to_array">Combine into Array List</option>
                    <option value="count">Count Items</option>
                    <option value="sum">Sum Numeric Field</option>
                  </select>
                </div>
                {config.aggregateType === 'sum' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field to Sum</label>
                    <input
                      type="text"
                      value={config.field || 'revenue'}
                      onChange={(e) => handleConfigChange('field', e.target.value)}
                      placeholder="revenue or amount"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* 4h. Sort & Limit */}
            {node.type === 'data_sort_limit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sort Field</label>
                    <input
                      type="text"
                      value={config.sortField || 'id'}
                      onChange={(e) => handleConfigChange('sortField', e.target.value)}
                      placeholder="id, score, date"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sort Order</label>
                    <select
                      value={config.sortOrder || 'desc'}
                      onChange={(e) => handleConfigChange('sortOrder', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="desc">Descending (Z-A / High-Low)</option>
                      <option value="asc">Ascending (A-Z / Low-High)</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Limit (Top N)</label>
                    <input
                      type="number"
                      min="1"
                      value={config.limit || 10}
                      onChange={(e) => handleConfigChange('limit', parseInt(e.target.value) || 10)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Skip (Offset)</label>
                    <input
                      type="number"
                      min="0"
                      value={config.skip || 0}
                      onChange={(e) => handleConfigChange('skip', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4i. Schedule Trigger (Cron / Interval) */}
            {node.type === 'trigger_schedule' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Schedule Interval</label>
                  <select
                    value={config.intervalPreset || 'custom'}
                    onChange={(e) => {
                      const preset = e.target.value;
                      handleConfigChange('intervalPreset', preset);
                      if (preset === 'every_minute') handleConfigChange('cron', '* * * * *');
                      else if (preset === 'hourly') handleConfigChange('cron', '0 * * * *');
                      else if (preset === 'daily_9am') handleConfigChange('cron', '0 9 * * *');
                      else if (preset === 'weekday_9am') handleConfigChange('cron', '0 9 * * 1-5');
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="weekday_9am">Every weekday at 09:00 AM</option>
                    <option value="daily_9am">Daily at 09:00 AM</option>
                    <option value="hourly">Every Hour</option>
                    <option value="every_minute">Every Minute</option>
                    <option value="custom">Custom Cron Expression</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cron Expression</label>
                  <input
                    type="text"
                    value={config.cron || '0 9 * * 1-5'}
                    onChange={(e) => handleConfigChange('cron', e.target.value)}
                    placeholder="0 9 * * 1-5"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Format: minute hour day-of-month month day-of-week
                  </span>
                </div>
              </div>
            )}

            {/* 5. Code Sandbox */}
            {node.type === 'data_code' && (
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>JavaScript Transformation Function</span>
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                </label>
                <textarea
                  rows={8}
                  value={config.code || ''}
                  onChange={(e) => handleConfigChange('code', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-[11px] focus:border-cyan-500 focus:outline-none leading-relaxed"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Available in scope: <code className="text-cyan-400">$json</code>, <code className="text-cyan-400">$input</code>, <code className="text-cyan-400">$nodes</code>. Must return transformed object.
                </p>
              </div>
            )}

            {/* 6. Email Node */}
            {node.type === 'comm_email' && (
              <>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">To Email</label>
                  <input
                    type="text"
                    value={config.to || ''}
                    onChange={(e) => handleConfigChange('to', e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Subject</label>
                  <input
                    type="text"
                    value={config.subject || ''}
                    onChange={(e) => handleConfigChange('subject', e.target.value)}
                    placeholder="Lead Alert: {{$json.customer}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-sans focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">HTML Body</label>
                  <textarea
                    rows={4}
                    value={config.bodyHtml || ''}
                    onChange={(e) => handleConfigChange('bodyHtml', e.target.value)}
                    placeholder="<p>Summary: {{$json.summary}}</p>"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* 7. AI Models (Google Gemini, OpenAI, Claude) */}
            {['ai_model_gemini', 'ai_model_openai', 'ai_model_claude'].includes(node.type) && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    {node.type === 'ai_model_gemini' ? 'Google Gemini Model' : 'Model Identifier'}
                  </label>
                  {node.type === 'ai_model_gemini' ? (
                    <select
                      value={config.model || 'gemini-2.5-flash'}
                      onChange={(e) => handleConfigChange('model', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended, Fast & Intelligent)</option>
                      <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning & Complex Workflows)</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={config.model || ''}
                      onChange={(e) => handleConfigChange('model', e.target.value)}
                      placeholder="gpt-4o or claude-3-5-sonnet"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      Temperature ({config.temperature !== undefined ? config.temperature : 0.2})
                    </label>
                    <span className="text-[10px] text-cyan-400 font-mono">
                      {(config.temperature ?? 0.2) <= 0.3 ? 'Deterministic' : (config.temperature ?? 0.2) >= 0.7 ? 'Creative' : 'Balanced'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.temperature !== undefined ? config.temperature : 0.2}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                    <span>0.0 (Precise / Code)</span>
                    <span>1.0 (Creative / Exploratory)</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Max Output Tokens</label>
                  <select
                    value={config.maxOutputTokens || 2048}
                    onChange={(e) => handleConfigChange('maxOutputTokens', parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="512">512 tokens (~380 words)</option>
                    <option value="1024">1,024 tokens (~750 words)</option>
                    <option value="2048">2,048 tokens (Standard)</option>
                    <option value="4096">4,096 tokens (Long Context)</option>
                    <option value="8192">8,192 tokens (Full Generation)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">System Instructions / Persona</label>
                  <textarea
                    rows={3}
                    value={config.systemPrompt || ''}
                    onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                    placeholder="You are an autonomous AI Agent powered by Gemini. Solve workflow tasks with accuracy."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-sans focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 8. AI Memory (Window Buffer, Redis) */}
            {['ai_memory_window', 'ai_memory_redis'].includes(node.type) && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    Context Window Length (Turns)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={config.contextWindowLength ?? 10}
                    onChange={(e) => handleConfigChange('contextWindowLength', parseInt(e.target.value) || 10)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Number of recent conversation turns to retain in Agent context.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Session Key Expression</label>
                  <input
                    type="text"
                    value={config.sessionKey || 'user_session_default'}
                    onChange={(e) => handleConfigChange('sessionKey', e.target.value)}
                    placeholder="user_session_default or {{$json.userId}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 9. AI Agent Tools (Calculator, Web Search, HTTP Tool, Code Tool) */}
            {node.type.startsWith('ai_tool_') && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tool Name</label>
                  <input
                    type="text"
                    value={config.toolName || node.name.toLowerCase().replace(/\s+/g, '_')}
                    onChange={(e) => handleConfigChange('toolName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {node.type === 'ai_tool_search' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Search Query Expression</label>
                    <input
                      type="text"
                      value={config.query || '{{$json.query}}'}
                      onChange={(e) => handleConfigChange('query', e.target.value)}
                      placeholder="{{$json.query}}"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                {node.type === 'ai_tool_http' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target API URL</label>
                    <input
                      type="text"
                      value={config.endpointUrl || ''}
                      onChange={(e) => handleConfigChange('endpointUrl', e.target.value)}
                      placeholder="https://api.service.com/action"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Tool Description for Agent</label>
                  <textarea
                    rows={2}
                    value={config.description || ''}
                    onChange={(e) => handleConfigChange('description', e.target.value)}
                    placeholder="Explain when the AI agent should call this tool..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-sans focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* 10. Popular Applications (Slack, Google Sheets, etc.) */}
            {node.type === 'app_slack' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Channel Name</label>
                  <input
                    type="text"
                    value={config.channel || '#general'}
                    onChange={(e) => handleConfigChange('channel', e.target.value)}
                    placeholder="#general or #leads"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Message Text</label>
                  <textarea
                    rows={4}
                    value={config.messageText || config.text || ''}
                    onChange={(e) => handleConfigChange('messageText', e.target.value)}
                    placeholder="New alert: {{$json.customer}} from {{$json.company}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'app_google_sheets' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                  <select
                    value={config.operation || 'Append Row'}
                    onChange={(e) => handleConfigChange('operation', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Append Row">Append Row</option>
                    <option value="Read Rows">Read Rows</option>
                    <option value="Update Row">Update Row</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Spreadsheet ID</label>
                  <input
                    type="text"
                    value={config.spreadsheetId || ''}
                    onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sheet Tab Name</label>
                  <input
                    type="text"
                    value={config.sheetName || 'Sheet1'}
                    onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                    placeholder="Sheet1"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* TELEGRAM BOT & OUTSIDE CONNECTION */}
            {(node.type === 'app_telegram' || node.type === 'comm_telegram') && (
              <div className="space-y-4">
                {/* Token ID Section */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Telegram Bot Token ID</span>
                    </label>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      Required
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showSecretToken ? 'text' : 'password'}
                      value={config.botToken || config.tokenId || ''}
                      onChange={(e) => {
                        handleConfigChange('botToken', e.target.value);
                        handleConfigChange('tokenId', e.target.value);
                      }}
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pr-9 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretToken(!showSecretToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      title={showSecretToken ? 'Hide Token' : 'Show Token'}
                    >
                      {showSecretToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Create a bot via <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">@BotFather</a> on Telegram</span>
                    <button
                      type="button"
                      onClick={handleTestTelegramToken}
                      disabled={connectionStatus?.loading}
                      className="px-2 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/25 font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      {connectionStatus?.loading ? <Play className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                      <span>Test Token</span>
                    </button>
                  </div>

                  {connectionStatus && (
                    <div className={`p-2 rounded-lg text-[11px] font-mono flex items-start gap-1.5 ${
                      connectionStatus.success
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}>
                      {connectionStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      <span>{connectionStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Target Chat ID */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Chat ID / Channel</label>
                  <input
                    type="text"
                    value={config.chatId || '@devops_channel'}
                    onChange={(e) => handleConfigChange('chatId', e.target.value)}
                    placeholder="@channel_name or -100123456789"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Enter channel username (e.g. <code>@alerts_channel</code>) or numeric group ID.
                  </p>
                </div>

                {/* Message Content */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Message Content</label>
                  <textarea
                    rows={4}
                    value={config.text || config.message || ''}
                    onChange={(e) => {
                      handleConfigChange('text', e.target.value);
                      handleConfigChange('message', e.target.value);
                    }}
                    placeholder="🚨 Alert: {{$json.summary || 'Trigger fired'}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                {/* Parse Mode */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Formatting Parse Mode</label>
                  <select
                    value={config.parseMode || 'HTML'}
                    onChange={(e) => handleConfigChange('parseMode', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="HTML">HTML (bold, italic, code)</option>
                    <option value="MarkdownV2">MarkdownV2</option>
                    <option value="Markdown">Standard Markdown</option>
                    <option value="Plain">Plain Text</option>
                  </select>
                </div>

                {/* Outside Connection Setup (Bahar se connect karein) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-sky-950/40 to-slate-950 border border-sky-800/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>Outside Webhook Connection (Bahar Se Connect Karein)</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready to receive" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Connect your real external Telegram Bot to this workflow so incoming messages from users or groups automatically trigger this node.
                  </p>

                  <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      readOnly
                      value={telegramWebhookUrl}
                      className="bg-transparent text-[10px] font-mono text-slate-300 flex-1 outline-none select-all px-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(telegramWebhookUrl);
                        setCopiedTelegramWebhook(true);
                        setTimeout(() => setCopiedTelegramWebhook(false), 2000);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                    >
                      {copiedTelegramWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedTelegramWebhook ? 'Copied' : 'Copy URL'}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegisterTelegramWebhook}
                    disabled={connectionStatus?.loading || (!config.botToken && !config.tokenId)}
                    className="w-full py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Auto-Register Webhook with Telegram API</span>
                  </button>
                </div>
              </div>
            )}

            {/* WHATSAPP CLOUD API & OUTSIDE CONNECTION */}
            {node.type === 'app_whatsapp' && (
              <div className="space-y-4">
                {/* Access Token ID */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp System User Access Token ID</span>
                    </label>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Required
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showSecretToken ? 'text' : 'password'}
                      value={config.accessToken || config.tokenId || ''}
                      onChange={(e) => {
                        handleConfigChange('accessToken', e.target.value);
                        handleConfigChange('tokenId', e.target.value);
                      }}
                      placeholder="EAAG... (Meta Cloud API Permanent Access Token)"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 pr-9 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretToken(!showSecretToken)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                      title={showSecretToken ? 'Hide Token' : 'Show Token'}
                    >
                      {showSecretToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>From Meta for Developers -&gt; WhatsApp -&gt; API Setup</span>
                    <button
                      type="button"
                      onClick={handleTestWhatsAppToken}
                      disabled={connectionStatus?.loading}
                      className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-semibold transition cursor-pointer flex items-center gap-1"
                    >
                      {connectionStatus?.loading ? <Play className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                      <span>Test Token</span>
                    </button>
                  </div>

                  {connectionStatus && (
                    <div className={`p-2 rounded-lg text-[11px] font-mono flex items-start gap-1.5 ${
                      connectionStatus.success
                        ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                        : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                    }`}>
                      {connectionStatus.success ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                      <span>{connectionStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* Phone Number ID & Business Account ID */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Phone Number ID</label>
                    <input
                      type="text"
                      value={config.phoneNumberId || ''}
                      onChange={(e) => handleConfigChange('phoneNumberId', e.target.value)}
                      placeholder="10928374659201"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">WABA Account ID</label>
                    <input
                      type="text"
                      value={config.businessAccountId || ''}
                      onChange={(e) => handleConfigChange('businessAccountId', e.target.value)}
                      placeholder="9821039482710"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Recipient Phone Number */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Recipient Phone Number</label>
                  <input
                    type="text"
                    value={config.recipientPhone || config.phoneNumber || '+15550192834'}
                    onChange={(e) => {
                      handleConfigChange('recipientPhone', e.target.value);
                      handleConfigChange('phoneNumber', e.target.value);
                    }}
                    placeholder="+1 555 019 2834 (E.164 with country code)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Message Body */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Message Body</label>
                  <textarea
                    rows={3}
                    value={config.message || ''}
                    onChange={(e) => handleConfigChange('message', e.target.value)}
                    placeholder="Hello! Your workflow notification: {{$json.text || 'Order confirmed'}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Outside Webhook Connection (Bahar se connect karein) */}
                <div className="p-3.5 rounded-xl bg-gradient-to-b from-emerald-950/40 to-slate-950 border border-emerald-800/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Meta Webhook (Bahar Se Connect Karein)</span>
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Paste these two values into <strong>Meta Developers &gt; WhatsApp &gt; Configuration &gt; Webhook</strong>:
                  </p>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Callback URL</label>
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        readOnly
                        value={whatsappWebhookUrl}
                        className="bg-transparent text-[10px] font-mono text-slate-300 flex-1 outline-none select-all px-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(whatsappWebhookUrl);
                          setCopiedWhatsAppWebhook(true);
                          setTimeout(() => setCopiedWhatsAppWebhook(false), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        {copiedWhatsAppWebhook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedWhatsAppWebhook ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">Verify Token</label>
                    <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
                      <input
                        type="text"
                        value={config.verifyToken || 'eie_whatsapp_verify_token'}
                        onChange={(e) => handleConfigChange('verifyToken', e.target.value)}
                        className="bg-transparent text-[10px] font-mono text-emerald-300 flex-1 outline-none px-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(config.verifyToken || 'eie_whatsapp_verify_token');
                          setCopiedWhatsAppVerifyToken(true);
                          setTimeout(() => setCopiedWhatsAppVerifyToken(false), 2000);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-white flex items-center gap-1 transition cursor-pointer shrink-0"
                      >
                        {copiedWhatsAppVerifyToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedWhatsAppVerifyToken ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAT NODES CONFIGURATION */}
            {node.type === 'chat_trigger' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Welcome Message</label>
                  <input
                    type="text"
                    value={config.welcomeMessage || ''}
                    onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                    placeholder="Hello! How can I assist your workflow today?"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">Require Chat Session ID</span>
                  <input
                    type="checkbox"
                    checked={config.requireSession !== false}
                    onChange={(e) => handleConfigChange('requireSession', e.target.checked)}
                    className="rounded border-slate-700 text-sky-500 focus:ring-sky-500/20"
                  />
                </div>

                {/* SEPARATED BOTTOM FUNCTION / LIVE MESSAGE BOX (Mobile & PC) */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Chat Trigger Message Box (Separated)</span>
                    </span>
                    {onOpenLiveChat && (
                      <button
                        type="button"
                        onClick={onOpenLiveChat}
                        className="text-[10px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 transition cursor-pointer flex items-center gap-1"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        <span>Open Live Chat Box</span>
                      </button>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Send test prompt directly to trigger this chat flow:
                  </p>

                  {/* Quick Prompts */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 text-[10px]">
                    {['Hi, workflow status?', 'Order #1049', 'Urgent issue'].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handleRunInlineChatTest(p)}
                        disabled={isChatTesting}
                        className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-300 whitespace-nowrap transition cursor-pointer disabled:opacity-50 text-[10px]"
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  {/* Inline Message Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={chatTestMsg}
                      onChange={(e) => setChatTestMsg(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleRunInlineChatTest();
                        }
                      }}
                      placeholder="Type a test message..."
                      disabled={isChatTesting}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRunInlineChatTest()}
                      disabled={!chatTestMsg.trim() || isChatTesting}
                      className="px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs disabled:opacity-40 transition cursor-pointer flex items-center justify-center shrink-0"
                    >
                      {isChatTesting ? <Play className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {chatTestResponse && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200">
                      <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-0.5">Workflow Response:</span>
                      <p className="whitespace-pre-wrap">{chatTestResponse}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {node.type === 'chat_message' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Response Message</label>
                  <textarea
                    rows={4}
                    value={config.message || ''}
                    onChange={(e) => handleConfigChange('message', e.target.value)}
                    placeholder="{{$json.output || 'Thank you for reaching out!'}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Speaker Role</label>
                  <select
                    value={config.role || 'assistant'}
                    onChange={(e) => handleConfigChange('role', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-sky-500 focus:outline-none"
                  >
                    <option value="assistant">Assistant / Bot</option>
                    <option value="system">System Notice</option>
                    <option value="user">User Echo</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'chat_ai' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Persona & System Prompt</label>
                  <textarea
                    rows={3}
                    value={config.systemPrompt || ''}
                    onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                    placeholder="You are an intelligent, helpful AI workflow assistant."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={config.temperature ?? 0.3}
                      onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Max Tokens</label>
                    <input
                      type="number"
                      step="128"
                      value={config.maxTokens || 1024}
                      onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === 'chat_memory' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Memory Window Size (Turns)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={config.windowSize || 10}
                    onChange={(e) => handleConfigChange('windowSize', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Memory Storage Key</label>
                  <input
                    type="text"
                    value={config.memoryKey || 'chat_history'}
                    onChange={(e) => handleConfigChange('memoryKey', e.target.value)}
                    placeholder="chat_history"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'chat_sentiment' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Text Field to Analyze</label>
                  <input
                    type="text"
                    value={config.field || 'message'}
                    onChange={(e) => handleConfigChange('field', e.target.value)}
                    placeholder="message"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Urgency Threshold (0 - 1.0)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={config.sentimentThreshold ?? 0.5}
                    onChange={(e) => handleConfigChange('sentimentThreshold', parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'chat_webhook' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Widget Endpoint Path</label>
                  <input
                    type="text"
                    value={config.widgetPath || 'support-chat'}
                    onChange={(e) => handleConfigChange('widgetPath', e.target.value)}
                    placeholder="support-chat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Greeting Notice</label>
                  <input
                    type="text"
                    value={config.greetingText || 'Connected to live workflow assistant.'}
                    onChange={(e) => handleConfigChange('greetingText', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* CORE NODES CONFIGURATION */}
            {node.type === 'core_edit_fields' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs text-slate-300 font-medium">Keep Only Set Fields</span>
                  <input
                    type="checkbox"
                    checked={Boolean(config.keepOnlySet)}
                    onChange={(e) => handleConfigChange('keepOnlySet', e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field Assignments (JSON array)</label>
                  <textarea
                    rows={4}
                    value={typeof config.assignments === 'string' ? config.assignments : JSON.stringify(config.assignments || [], null, 2)}
                    onChange={(e) => {
                      try {
                        handleConfigChange('assignments', JSON.parse(e.target.value));
                      } catch {
                        handleConfigChange('assignments', e.target.value);
                      }
                    }}
                    placeholder='[{"name": "status", "value": "active"}]'
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'core_wait' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={config.amount || 2}
                    onChange={(e) => handleConfigChange('amount', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-pink-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Unit</label>
                  <select
                    value={config.unit || 'seconds'}
                    onChange={(e) => handleConfigChange('unit', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-pink-500 focus:outline-none"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'core_stop_error' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Error Message</label>
                  <input
                    type="text"
                    value={config.errorMessage || ''}
                    onChange={(e) => handleConfigChange('errorMessage', e.target.value)}
                    placeholder="Workflow halted: unauthorized action"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-red-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Status Code</label>
                  <input
                    type="number"
                    value={config.statusCode || 400}
                    onChange={(e) => handleConfigChange('statusCode', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-red-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'core_datetime' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                  <select
                    value={config.operation || 'format'}
                    onChange={(e) => handleConfigChange('operation', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="format">Format Current Date</option>
                    <option value="add">Add Time Interval</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Timezone</label>
                  <input
                    type="text"
                    value={config.timezone || 'UTC'}
                    onChange={(e) => handleConfigChange('timezone', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'core_crypto' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Crypto Operation</label>
                  <select
                    value={config.operation || 'sha256'}
                    onChange={(e) => handleConfigChange('operation', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-slate-400 focus:outline-none"
                  >
                    <option value="sha256">SHA-256 Hash</option>
                    <option value="md5">MD5 Hash</option>
                    <option value="base64_encode">Base64 Encode</option>
                    <option value="base64_decode">Base64 Decode</option>
                    <option value="uuid">Generate Random UUID</option>
                  </select>
                </div>
                {config.operation !== 'uuid' && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Input Value Expression</label>
                    <input
                      type="text"
                      value={config.value || '{{$json.id}}'}
                      onChange={(e) => handleConfigChange('value', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-slate-400 focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {node.type === 'core_code' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">JavaScript Code Script</label>
                  <textarea
                    rows={6}
                    value={config.code || '// Process item data\nitem.processedAt = new Date().toISOString();\nreturn item;'}
                    onChange={(e) => handleConfigChange('code', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-sky-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Variables available: <code>item</code>, <code>$json</code>, <code>$items</code></span>
                </div>
              </div>
            )}

            {node.type === 'core_variable' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Action</label>
                  <select
                    value={config.action || 'set'}
                    onChange={(e) => handleConfigChange('action', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-teal-500 focus:outline-none"
                  >
                    <option value="set">Set Variable</option>
                    <option value="increment">Increment Counter</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Variable Name</label>
                  <input
                    type="text"
                    value={config.variableName || 'counter'}
                    onChange={(e) => handleConfigChange('variableName', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Value</label>
                  <input
                    type="text"
                    value={config.value || '1'}
                    onChange={(e) => handleConfigChange('value', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-teal-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* FLOW NODES CONFIGURATION */}
            {node.type === 'flow_router' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Fallback Route</label>
                  <select
                    value={config.activeRoute || 'out_route_1'}
                    onChange={(e) => handleConfigChange('activeRoute', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="out_route_1">Route 1</option>
                    <option value="out_route_2">Route 2</option>
                    <option value="out_route_3">Route 3</option>
                    <option value="out_fallback">Fallback</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'flow_split_batches' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Batch Size</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={config.batchSize || 10}
                    onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'flow_filter' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field to Filter</label>
                  <input
                    type="text"
                    value={config.field || 'status'}
                    onChange={(e) => handleConfigChange('field', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operator</label>
                    <select
                      value={config.operator || '=='}
                      onChange={(e) => handleConfigChange('operator', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="==">Equals (==)</option>
                      <option value="!=">Not Equals (!=)</option>
                      <option value="contains">Contains</option>
                      <option value="not_empty">Is Not Empty</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Match Value</label>
                    <input
                      type="text"
                      value={config.value || 'active'}
                      onChange={(e) => handleConfigChange('value', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === 'flow_merge' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Merge Mode</label>
                  <select
                    value={config.mode || 'combine'}
                    onChange={(e) => handleConfigChange('mode', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="combine">Combine Objects ({'{...a, ...b}'})</option>
                    <option value="append">Append into Array</option>
                  </select>
                </div>
              </div>
            )}

            {/* CHAIN NODES CONFIGURATION */}
            {node.type === 'chain_llm' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Prompt Template</label>
                  <textarea
                    rows={5}
                    value={config.promptTemplate || ''}
                    onChange={(e) => handleConfigChange('promptTemplate', e.target.value)}
                    placeholder="Summarize the input: {{$json}}"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'chain_qa_retrieval' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Question / Query</label>
                  <input
                    type="text"
                    value={config.query || '{{$json.question}}'}
                    onChange={(e) => handleConfigChange('query', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'chain_summarize' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Summary Format</label>
                  <select
                    value={config.format || 'bullet_points'}
                    onChange={(e) => handleConfigChange('format', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="bullet_points">Bullet Points</option>
                    <option value="paragraph">Executive Paragraph</option>
                  </select>
                </div>
              </div>
            )}

            {node.type === 'chain_router' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Classification Prompt</label>
                  <input
                    type="text"
                    value={config.classificationPrompt || 'Classify the inquiry into: technical, sales, or general.'}
                    onChange={(e) => handleConfigChange('classificationPrompt', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-fuchsia-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'chain_transform' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target JSON Schema</label>
                  <textarea
                    rows={5}
                    value={config.targetSchema || '{\n  "name": "string",\n  "status": "string"\n}'}
                    onChange={(e) => handleConfigChange('targetSchema', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* CONDITION NODES CONFIGURATION */}
            {node.type === 'condition_if' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field Path</label>
                  <input
                    type="text"
                    value={config.fieldPath || config.field || 'status'}
                    onChange={(e) => handleConfigChange('fieldPath', e.target.value)}
                    placeholder="status"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Comparison Operator</label>
                    <select
                      value={config.operator || '=='}
                      onChange={(e) => handleConfigChange('operator', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="==">Equals (==)</option>
                      <option value="!=">Not Equals (!=)</option>
                      <option value=">">Greater Than (&gt;)</option>
                      <option value="<">Less Than (&lt;)</option>
                      <option value=">=">Greater or Equal (&gt;=)</option>
                      <option value="<=">Less or Equal (&lt;=)</option>
                      <option value="contains">Contains Substring</option>
                      <option value="is_empty">Is Empty</option>
                      <option value="not_empty">Is Not Empty</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Expected Value</label>
                    <input
                      type="text"
                      value={config.value || 'active'}
                      onChange={(e) => handleConfigChange('value', e.target.value)}
                      placeholder="active"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {node.type === 'condition_switch' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field to Inspect</label>
                  <input
                    type="text"
                    value={config.field || 'category'}
                    onChange={(e) => handleConfigChange('field', e.target.value)}
                    placeholder="category"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'condition_validator' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Required Fields (Comma Separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(config.requiredFields) ? config.requiredFields.join(', ') : (config.requiredFields || 'email, name')}
                    onChange={(e) => {
                      const list = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                      handleConfigChange('requiredFields', list);
                    }}
                    placeholder="email, name, id"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {node.type === 'condition_rate_limit' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Max Requests</label>
                    <input
                      type="number"
                      min="1"
                      value={config.maxRequests || 60}
                      onChange={(e) => handleConfigChange('maxRequests', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Window (Seconds)</label>
                    <input
                      type="number"
                      min="1"
                      value={config.windowSeconds || 60}
                      onChange={(e) => handleConfigChange('windowSeconds', parseInt(e.target.value, 10))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 11. Generic Fallback for other nodes */}
            {!['http_request', 'trigger_webhook', 'trigger_schedule', 'ai_agent', 'logic_if', 'logic_switch', 'logic_filter', 'data_merge', 'data_loop', 'respond_to_webhook', 'data_aggregate', 'data_sort_limit', 'data_code', 'comm_email', 'ai_model_gemini', 'ai_model_openai', 'ai_model_claude', 'ai_memory_window', 'ai_memory_redis', 'app_slack', 'app_google_sheets', 'app_telegram', 'comm_telegram', 'app_whatsapp', 'chat_trigger', 'chat_message', 'chat_ai', 'chat_memory', 'chat_sentiment', 'chat_webhook', 'core_edit_fields', 'core_wait', 'core_stop_error', 'core_datetime', 'core_crypto', 'core_code', 'core_variable', 'flow_router', 'flow_split_batches', 'flow_filter', 'flow_merge', 'chain_llm', 'chain_qa_retrieval', 'chain_summarize', 'chain_router', 'chain_transform', 'condition_if', 'condition_switch', 'condition_validator', 'condition_rate_limit'].includes(node.type) && !node.type.startsWith('ai_tool_') && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs">Configure properties for {node.name}:</p>
                {Object.keys(config).length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
                    <p className="text-slate-400 text-xs">No default parameters configured.</p>
                    <button
                      type="button"
                      onClick={() => handleConfigChange('customParam', 'value')}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-xs font-semibold hover:bg-cyan-500/25 transition cursor-pointer"
                    >
                      + Add Custom Property
                    </button>
                  </div>
                ) : (
                  Object.keys(config).map((key) => (
                    <div key={key}>
                      <label className="text-[11px] font-semibold text-slate-300 block mb-1 capitalize">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={typeof config[key] === 'object' ? JSON.stringify(config[key]) : config[key] || ''}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Expression Syntax Cheatsheet Card */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Dynamic Expressions</span>
              </div>
              <p className="text-[10px] leading-relaxed">
                Refer to incoming data with <code className="text-cyan-300 font-mono">&#123;&#123;$json.property&#125;&#125;</code> or previous node outputs with <code className="text-cyan-300 font-mono">&#123;&#123;$node["Node Name"].json.data&#125;&#125;</code>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CREDENTIALS */}
        {activeTab === 'credentials' && (
          <div className="space-y-3">
            <label className="text-[11px] font-semibold text-slate-300 block">
              Associated Secure Credential
            </label>
            <select
              value={node.credentialId || ''}
              onChange={(e) => onUpdateConfig(node.id, { credentialId: e.target.value || undefined })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-medium focus:border-cyan-500 focus:outline-none"
            >
              <option value="">None / Anonymous</option>
              {credentials.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.name} ({cred.type.toUpperCase()})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Credentials are never exposed to browser bundles. Nodes only reference the Credential ID.
            </p>
          </div>
        )}

        {/* TAB 3: SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-semibold text-slate-200 block">Continue on Error</span>
                <span className="text-[10px] text-slate-400">Allow workflow to continue if this node fails</span>
              </div>
              <input
                type="checkbox"
                checked={node.executionSettings?.continueOnError || false}
                onChange={(e) =>
                  onUpdateConfig(node.id, {
                    executionSettings: {
                      ...node.executionSettings,
                      continueOnError: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Timeout (Milliseconds)
              </label>
              <input
                type="number"
                value={node.executionSettings?.timeoutMs || 15000}
                onChange={(e) =>
                  onUpdateConfig(node.id, {
                    executionSettings: {
                      ...node.executionSettings,
                      timeoutMs: parseInt(e.target.value) || 15000,
                    },
                  })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 7: OUTPUT (next to Settings) */}
        {activeTab === 'output' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block">Step Output Inspector</span>
                <span className="text-[10px] text-slate-400">Result generated by this node (Table / JSON / Schema)</span>
              </div>
              <button
                type="button"
                onClick={handleRunSingleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer text-xs font-semibold"
              >
                <Play className={`w-3 h-3 fill-current ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Executing...' : 'Run Test Step'}</span>
              </button>
            </div>

            <NodeDataInspector
              outputData={resolvedOutputData}
              error={testError || executionResult?.error}
              className="min-h-[460px]"
            />
          </div>
        )}

        {/* TABS 1-3: 3 FUNCTIONS (TABLE / JSON / SCHEMA) PLACED BEFORE PARAMETERS */}
        {(activeTab === 'table' || activeTab === 'json' || activeTab === 'schema') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-white block capitalize">{activeTab} View</span>
                <span className="text-[10px] text-slate-400">Step output inspector ({activeTab.toUpperCase()})</span>
              </div>
              <button
                type="button"
                onClick={handleRunSingleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25 transition cursor-pointer text-xs font-semibold"
              >
                <Play className={`w-3 h-3 fill-current ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Executing...' : 'Run Test Step'}</span>
              </button>
            </div>

            <NodeDataInspector
              outputData={resolvedOutputData}
              error={testError || executionResult?.error}
              mode={activeTab}
              onModeChange={(newMode) => setActiveTab(newMode)}
              className="min-h-[460px]"
            />
          </div>
        )}
      </div>

      {/* Footer Quick Action: Execute Single Node & Delete Node */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={() => onDeleteNode(node.id)}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/35 hover:border-rose-500/60 font-bold transition cursor-pointer text-xs shrink-0"
          title="Delete this event from workflow"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Event</span>
        </button>

        <button
          onClick={handleRunSingleTest}
          disabled={isTesting}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 hover:text-white font-bold transition cursor-pointer text-xs"
        >
          <Play className={`w-3.5 h-3.5 fill-current ${isTesting ? 'animate-spin' : ''}`} />
          <span>{isTesting ? 'Testing Step...' : 'Test Step'}</span>
        </button>
      </div>
    </div>
    </>
  );
};
