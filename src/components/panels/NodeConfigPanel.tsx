import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  KeyRound,
  Sliders,
  Settings as SettingsIcon,
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
  ArrowRightToLine,
  ArrowRightFromLine,
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
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  FlaskConical,
  Plus,
  Maximize2,
  Pencil,
  FileSpreadsheet,
  Mail,
  Loader2
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { Workflow, WorkflowNodeData, Credential, ExecutionNodeResult } from '../../types/workflow';
import { NodeDataInspector } from '../common/NodeDataInspector';
import { evaluateExpressionInContext, getDefaultSampleOutputForNodeType } from '../../utils/workflowDataFlow';

interface NodeConfigPanelProps {
  node: WorkflowNodeData | null;
  workflow?: Workflow;
  credentials: Credential[];
  executionResult?: ExecutionNodeResult;
  inputData?: any;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onTestNode: (node: WorkflowNodeData) => Promise<any>;
  onOpenLiveChat?: () => void;
  onCreateCredential?: (cred: Partial<Credential>) => void;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  workflow,
  credentials,
  executionResult,
  inputData,
  onClose,
  onUpdateConfig,
  onDeleteNode,
  onTestNode,
  onOpenLiveChat,
  onCreateCredential,
}) => {
  // Center tabs: strictly Parameters & Settings (exactly matching n8n)
  const [activeCenterTab, setActiveCenterTab] = useState<'params' | 'settings'>('params');

  // Mobile pane view: 'input' | 'center' | 'output' (default 'center')
  const [mobilePane, setMobilePane] = useState<'input' | 'center' | 'output'>('center');

  // Credential dropdown state
  const [credentialDropdownOpen, setCredentialDropdownOpen] = useState(false);
  const [showNewCredModal, setShowNewCredModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredKey, setNewCredKey] = useState('');

  // Expression expanded modal state
  const [expandedField, setExpandedField] = useState<{ key: string; label: string; value: string } | null>(null);

  // Testing & Step Execution state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Inline helpers & copy states
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [showSecretToken, setShowSecretToken] = useState(false);
  const [showAdditionalFields, setShowAdditionalFields] = useState(false);

  // Chat Trigger Inline Testing
  const [chatTestMsg, setChatTestMsg] = useState('');
  const [chatTestResponse, setChatTestResponse] = useState<string | null>(null);
  const [isChatTesting, setIsChatTesting] = useState(false);

  if (!node) return null;

  const IconComponent = (((Icons as any)[node.icon || ''] || Icons.Box)) as React.ComponentType<{ className?: string }>;
  const config = node.config || {};
  const executionSettings = node.executionSettings || {};

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, {
      config: {
        ...node.config,
        [key]: value,
      },
    });
  };

  const handleExecutionSettingChange = (key: string, value: any) => {
    onUpdateConfig(node.id, {
      executionSettings: {
        ...node.executionSettings,
        [key]: value,
      },
    });
  };

  // Full Webhook URL for webhook nodes
  const fullWebhookUrl = `${window.location.origin}/api/webhook/${config.webhookPath || node.id}`;

  // Execute Step (Orange Button in Header)
  const handleRunSingleTest = async () => {
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await onTestNode(node);
      setTestResult(res);
      // On mobile, automatically show output when test succeeds
      if (window.innerWidth < 768) {
        setMobilePane('output');
      }
    } catch (err: any) {
      setTestError(err.message || 'Step execution failed');
      if (window.innerWidth < 768) {
        setMobilePane('output');
      }
    } finally {
      setIsTesting(false);
    }
  };

  // Resolved Output data: either latest test result or execution result or fallback sample
  const resolvedOutputData = useMemo(() => {
    if (testResult !== null && testResult !== undefined) return testResult;
    if (executionResult?.output !== undefined) return executionResult.output;
    return null;
  }, [testResult, executionResult]);

  // Current selected credential
  const selectedCredential = credentials.find((c) => c.id === node.credentialId);

  // Filter relevant credentials for this node type
  const relevantCredentials = useMemo(() => {
    const typeLower = node.type.toLowerCase();
    if (typeLower.includes('telegram')) return credentials.filter((c) => c.type === 'telegram' || c.type === 'generic');
    if (typeLower.includes('slack')) return credentials.filter((c) => c.type === 'slack' || c.type === 'generic');
    if (typeLower.includes('sheets') || typeLower.includes('google')) return credentials.filter((c) => c.type === 'google' || c.type === 'gemini');
    if (typeLower.includes('gemini')) return credentials.filter((c) => c.type === 'gemini');
    if (typeLower.includes('openai')) return credentials.filter((c) => c.type === 'openai');
    return credentials;
  }, [credentials, node.type]);

  // Handle Quick Credential Creation
  const handleSaveQuickCredential = () => {
    if (!newCredName.trim() || !onCreateCredential) return;
    let credType = 'generic';
    if (node.type.includes('telegram')) credType = 'telegram';
    if (node.type.includes('slack')) credType = 'slack';
    if (node.type.includes('gemini')) credType = 'gemini';
    if (node.type.includes('openai')) credType = 'openai';

    const newId = `c_${Date.now()}`;
    onCreateCredential({
      id: newId,
      name: newCredName.trim(),
      type: credType,
      data: { apiKey: newCredKey.trim(), botToken: newCredKey.trim() },
    });
    onUpdateConfig(node.id, { credentialId: newId });
    setNewCredName('');
    setNewCredKey('');
    setShowNewCredModal(false);
    setCredentialDropdownOpen(false);
  };

  // Check if node requires/supports credentials
  const supportsCredentials = useMemo(() => {
    const t = node.type;
    return (
      t.includes('telegram') ||
      t.includes('slack') ||
      t.includes('sheets') ||
      t.includes('gmail') ||
      t.includes('whatsapp') ||
      t.includes('gemini') ||
      t.includes('openai') ||
      t.includes('claude') ||
      t === 'http_request'
    );
  }, [node.type]);

  // Evaluate dynamic expression live against incoming input data
  const renderExpressionEvaluator = (rawText: string) => {
    if (!rawText || !rawText.includes('{{')) return null;
    const evaluated = evaluateExpressionInContext(rawText, inputData, workflow);
    return (
      <div className="mt-1 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center justify-between gap-1">
        <span className="text-slate-500">Evaluates to:</span>
        <span className="truncate">{String(evaluated)}</span>
      </div>
    );
  };

  return (
    <>
      {/* Semi-transparent Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Main n8n Node Configuration Modal (3-Pane: Input, Parameters/Settings, Output) */}
      <div
        className="fixed inset-0 sm:inset-3 md:inset-6 lg:inset-8 z-55 bg-slate-900 border border-slate-800 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TOP MODAL HEADER: Node Icon, Title, Docs Link, Close Button */}
        <div className="h-13 px-4 border-b border-slate-800 bg-slate-950/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* App / Node Icon */}
            <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0">
              <IconComponent className="w-4 h-4" />
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={node.name}
              onChange={(e) => onUpdateConfig(node.id, { name: e.target.value })}
              className="text-sm sm:text-base font-bold text-white bg-transparent border-b border-transparent hover:border-slate-750 focus:border-orange-500 focus:outline-none w-48 sm:w-72 truncate"
              title="Click to rename step"
            />

            {/* Docs link */}
            <a
              href="https://docs.n8n.io"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition ml-2"
            >
              <span>Docs</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>

          {/* Right Action Icons: Delete Step & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onDeleteNode(node.id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer text-xs"
              title="Delete step"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MOBILE VIEW SWITCHER (Only visible on small screens < md) */}
        <div className="flex md:hidden border-b border-slate-800 bg-slate-950/80 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setMobilePane('input')}
            className={`flex-1 py-2 font-semibold text-center transition border-b-2 ${
              mobilePane === 'input'
                ? 'border-sky-500 text-sky-400 bg-sky-500/10'
                : 'border-transparent text-slate-400'
            }`}
          >
            INPUT {inputData ? `(${Array.isArray(inputData) ? inputData.length : 1})` : ''}
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('center')}
            className={`flex-1 py-2 font-semibold text-center transition border-b-2 ${
              mobilePane === 'center'
                ? 'border-orange-500 text-orange-400 bg-orange-500/10'
                : 'border-transparent text-slate-400'
            }`}
          >
            {activeCenterTab === 'params' ? 'Parameters' : 'Settings'}
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('output')}
            className={`flex-1 py-2 font-semibold text-center transition border-b-2 ${
              mobilePane === 'output'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                : 'border-transparent text-slate-400'
            }`}
          >
            OUTPUT {resolvedOutputData ? '(1)' : ''}
          </button>
        </div>

        {/* 3-COLUMN LAYOUT BODY: INPUT (Left) | Parameters & Settings (Center) | OUTPUT (Right) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* ============================================================== */}
          {/* PANE 1: LEFT - INPUT (Incoming Data from Preceding Nodes)      */}
          {/* ============================================================== */}
          <div
            className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-800/90 bg-slate-950/50 flex flex-col shrink-0 min-h-0 overflow-hidden ${
              mobilePane === 'input' ? 'flex flex-1' : 'hidden md:flex'
            }`}
          >
            {/* Header: INPUT */}
            <div className="h-11 px-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ArrowRightToLine className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">INPUT</span>
              </div>
              {inputData && (
                <span className="text-[10px] font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-full">
                  {Array.isArray(inputData) ? `${inputData.length} ${inputData.length === 1 ? 'item' : 'items'}` : '1 item'}
                </span>
              )}
            </div>

            {/* Content: Inspector if data exists, else "No input data" placeholder */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {inputData ? (
                <NodeDataInspector
                  outputData={inputData}
                  className="border-0 rounded-none h-full"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <ArrowRightToLine className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-300 block">No input data</span>
                    <span className="text-xs text-slate-500 leading-relaxed block mt-1 max-w-[220px]">
                      Execute the node that connects to this node or execute step.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* PANE 2: CENTER - Parameters & Settings Tabs + Execute Step     */}
          {/* ============================================================== */}
          <div
            className={`flex-1 border-b md:border-b-0 md:border-r border-slate-800/90 bg-slate-900 flex flex-col min-w-0 min-h-0 overflow-hidden ${
              mobilePane === 'center' ? 'flex flex-1' : 'hidden md:flex'
            }`}
          >
            {/* Center Subheader Tabs Bar: < Parameters > Settings + [ ☡ Execute step ] */}
            <div className="h-11 px-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
              {/* Tab Navigation: < Parameters > Settings */}
              <div className="flex items-center gap-1">
                {/* Previous tab arrow */}
                <button
                  type="button"
                  onClick={() => setActiveCenterTab('params')}
                  disabled={activeCenterTab === 'params'}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition cursor-pointer"
                  title="Parameters"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Parameters Tab */}
                <button
                  type="button"
                  onClick={() => setActiveCenterTab('params')}
                  className={`px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 -mb-[1px] ${
                    activeCenterTab === 'params'
                      ? 'border-[#FF6D5A] text-[#FF6D5A]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Parameters</span>
                </button>

                {/* Next tab arrow */}
                <button
                  type="button"
                  onClick={() => setActiveCenterTab('settings')}
                  disabled={activeCenterTab === 'settings'}
                  className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition cursor-pointer"
                  title="Settings"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Settings Tab */}
                <button
                  type="button"
                  onClick={() => setActiveCenterTab('settings')}
                  className={`px-3 py-2 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border-b-2 -mb-[1px] ${
                    activeCenterTab === 'settings'
                      ? 'border-[#FF6D5A] text-[#FF6D5A]'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Settings</span>
                </button>
              </div>

              {/* [ ☡ Execute step ] Button (Solid vibrant orange like n8n) */}
              <button
                type="button"
                onClick={handleRunSingleTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6D5A] hover:bg-[#ff553e] active:scale-95 text-white font-bold text-xs shadow-md shadow-[#FF6D5A]/25 transition cursor-pointer disabled:opacity-60"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FlaskConical className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isTesting ? 'Executing...' : 'Execute step'}</span>
              </button>
            </div>

            {/* Center Body: Parameters or Settings Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* -------------------------------------------------------- */}
              {/* TAB 1: PARAMETERS                                         */}
              {/* -------------------------------------------------------- */}
              {activeCenterTab === 'params' && (
                <div className="space-y-4">
                  {/* CREDENTIAL SELECTOR (Top of Parameters, Matching Screenshot 1) */}
                  {supportsCredentials && (
                    <div className="space-y-1.5 relative">
                      <label className="text-[11px] font-semibold text-slate-300 block">Credential</label>

                      {/* Dropdown Input with Key Icon, Name, Caret, Pencil */}
                      <div className="relative">
                        <div
                          onClick={() => setCredentialDropdownOpen(!credentialDropdownOpen)}
                          className={`w-full bg-slate-950 border rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer transition ${
                            credentialDropdownOpen
                              ? 'border-purple-500 shadow-sm shadow-purple-500/20 ring-1 ring-purple-500/30'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span className="text-slate-200 truncate font-medium">
                              {selectedCredential ? selectedCredential.name : 'Select or create account...'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-slate-400 shrink-0">
                            {credentialDropdownOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                            <Pencil
                              className="w-3.5 h-3.5 hover:text-white transition ml-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowNewCredModal(true);
                              }}
                            />
                          </div>
                        </div>

                        {/* Credential Popover Menu */}
                        {credentialDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1 space-y-0.5">
                            {relevantCredentials.map((cred) => (
                              <div
                                key={cred.id}
                                onClick={() => {
                                  onUpdateConfig(node.id, { credentialId: cred.id });
                                  setCredentialDropdownOpen(false);
                                }}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                                  node.credentialId === cred.id
                                    ? 'bg-purple-500/15 text-purple-300 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                                  <span>{cred.name}</span>
                                  <span className="text-[10px] text-slate-500 capitalize">
                                    {cred.type} API
                                  </span>
                                </div>
                                {node.credentialId === cred.id && (
                                  <Check className="w-3.5 h-3.5 text-purple-400" />
                                )}
                              </div>
                            ))}

                            {/* + Create new credential */}
                            <div
                              onClick={() => {
                                setShowNewCredModal(true);
                                setCredentialDropdownOpen(false);
                              }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 cursor-pointer border-t border-slate-800/80 mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Create new credential</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Modal for Quick Credential Creation */}
                      {showNewCredModal && (
                        <div className="p-3 mt-2 rounded-xl bg-slate-950 border border-purple-500/50 space-y-2.5">
                          <span className="text-xs font-bold text-white block">Add New Credential</span>
                          <input
                            type="text"
                            value={newCredName}
                            onChange={(e) => setNewCredName(e.target.value)}
                            placeholder="e.g. Telegram account 2"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-purple-500 focus:outline-none"
                          />
                          <input
                            type="password"
                            value={newCredKey}
                            onChange={(e) => setNewCredKey(e.target.value)}
                            placeholder="API Key / Bot Token"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-purple-500 focus:outline-none"
                          />
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setShowNewCredModal(false)}
                              className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveQuickCredential}
                              className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold"
                            >
                              Save Credential
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ------------------------------------------------------ */}
                  {/* NODE PARAMETER FIELDS                                  */}
                  {/* ------------------------------------------------------ */}

                  {/* 1. TELEGRAM UPDATE NODE (MATCHING SCREENSHOT 1 EXACTLY) */}
                  {(node.type === 'app_telegram' || node.type === 'comm_telegram') && (
                    <div className="space-y-3.5">
                      {/* Chat ID ("C..") */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Chat ID</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={config.chatId || config.chat_id || ''}
                            onChange={(e) => {
                              handleConfigChange('chatId', e.target.value);
                              handleConfigChange('chat_id', e.target.value);
                            }}
                            placeholder="5102553052"
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        {renderExpressionEvaluator(config.chatId || config.chat_id)}
                      </div>

                      {/* Text ("T...") with fx and expand button */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-300">Text</label>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedField({
                                key: 'text',
                                label: 'Telegram Text Message',
                                value: config.text || config.message || '',
                              })
                            }
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Expand</span>
                          </button>
                        </div>

                        <div className="relative flex items-stretch">
                          <span className="px-2.5 bg-slate-950/80 border border-r-0 border-slate-800 rounded-l-lg flex items-center justify-center font-mono text-[11px] text-cyan-400 font-bold select-none italic">
                            fx
                          </span>
                          <textarea
                            rows={4}
                            value={config.text || config.message || ''}
                            onChange={(e) => {
                              handleConfigChange('text', e.target.value);
                              handleConfigChange('message', e.target.value);
                            }}
                            placeholder='().map((w, i) => { const c = $("Split Cities").all()[i].json.city; return c; })'
                            className="w-full bg-slate-950 border border-slate-800 rounded-r-lg p-2 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-none resize-y"
                          />
                        </div>
                        {renderExpressionEvaluator(config.text || config.message)}
                      </div>

                      {/* Reply Markup ("Repl...") */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Reply Markup</label>
                        <select
                          value={config.replyMarkup || 'None'}
                          onChange={(e) => handleConfigChange('replyMarkup', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="None">None</option>
                          <option value="InlineKeyboard">Inline Keyboard</option>
                          <option value="ReplyKeyboard">Reply Keyboard</option>
                        </select>
                      </div>

                      {/* Additional Fields Accordion */}
                      <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                        <button
                          type="button"
                          onClick={() => setShowAdditionalFields(!showAdditionalFields)}
                          className="w-full px-3 py-2.5 flex items-center justify-between text-left text-slate-300 font-semibold text-xs hover:bg-slate-900 transition cursor-pointer"
                        >
                          <span>Additional Fields</span>
                          <Plus className={`w-3.5 h-3.5 transition-transform ${showAdditionalFields ? 'rotate-45' : ''}`} />
                        </button>

                        {showAdditionalFields && (
                          <div className="p-3 border-t border-slate-800 space-y-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Parse Mode</label>
                              <select
                                value={config.parseMode || 'HTML'}
                                onChange={(e) => handleConfigChange('parseMode', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                              >
                                <option value="HTML">HTML</option>
                                <option value="Markdown">Markdown</option>
                                <option value="MarkdownV2">MarkdownV2</option>
                                <option value="None">None</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 text-xs">Disable Notification</span>
                              <input
                                type="checkbox"
                                checked={config.disableNotification || false}
                                onChange={(e) => handleConfigChange('disableNotification', e.target.checked)}
                                className="w-4 h-4 accent-emerald-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. HTTP REQUEST */}
                  {node.type === 'http_request' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Method</label>
                        <select
                          value={config.method || 'GET'}
                          onChange={(e) => handleConfigChange('method', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
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
                        <div className="flex items-stretch">
                          <span className="px-2.5 bg-slate-950 border border-r-0 border-slate-800 rounded-l-lg flex items-center font-mono text-[11px] text-cyan-400 italic">
                            fx
                          </span>
                          <input
                            type="text"
                            value={config.url || ''}
                            onChange={(e) => handleConfigChange('url', e.target.value)}
                            placeholder="https://api.example.com/data"
                            className="w-full bg-slate-950 border border-slate-800 rounded-r-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                        {renderExpressionEvaluator(config.url)}
                      </div>

                      {['POST', 'PUT', 'PATCH'].includes(config.method || 'GET') && (
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Request Body (JSON)</label>
                          <textarea
                            rows={4}
                            value={config.body || ''}
                            onChange={(e) => handleConfigChange('body', e.target.value)}
                            placeholder='{\n  "query": "{{$json.customer}}"\n}'
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. WEBHOOK TRIGGER */}
                  {node.type === 'trigger_webhook' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Webhook Path</label>
                        <input
                          type="text"
                          value={config.webhookPath || ''}
                          onChange={(e) => handleConfigChange('webhookPath', e.target.value)}
                          placeholder="inbound-webhook"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-mono text-cyan-400">Inbound URL</span>
                          <button
                            type="button"
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
                    </div>
                  )}

                  {/* 4. SCHEDULE TRIGGER */}
                  {node.type === 'trigger_schedule' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Cron Expression</label>
                        <input
                          type="text"
                          value={config.cron || '0 9 * * 1'}
                          onChange={(e) => handleConfigChange('cron', e.target.value)}
                          placeholder="0 9 * * 1"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">Every Monday at 9:00 AM UTC</span>
                      </div>
                    </div>
                  )}

                  {/* 5. CHAT TRIGGER */}
                  {node.type === 'chat_trigger' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Welcome Message</label>
                        <input
                          type="text"
                          value={config.welcomeMessage || ''}
                          onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                          placeholder="Hello! How can I assist your workflow today?"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 6. AI AGENT & LLM MODELS */}
                  {node.type === 'ai_agent' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Agent Type</label>
                        <select
                          value={config.agentType || 'tools_agent'}
                          onChange={(e) => handleConfigChange('agentType', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="tools_agent">Tools Agent (ReAct / Function Calling)</option>
                          <option value="conversational_agent">Conversational Agent</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">System Instructions</label>
                        <textarea
                          rows={4}
                          value={config.systemPrompt || ''}
                          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                          placeholder="You are an autonomous AI Agent that solves problems..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 7. GEMINI MODEL */}
                  {node.type === 'ai_model_gemini' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Model</label>
                        <select
                          value={config.model || 'gemini-2.5-flash'}
                          onChange={(e) => handleConfigChange('model', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                        >
                          <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & Multimodal)</option>
                          <option value="gemini-2.5-pro">gemini-2.5-pro (Deep Reasoning)</option>
                        </select>
                      </div>

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
                          className="w-full accent-orange-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 8. GOOGLE SHEETS */}
                  {node.type === 'app_google_sheets' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'getRows'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                        >
                          <option value="getRows">Get Rows</option>
                          <option value="appendRow">Append Row</option>
                          <option value="updateRow">Update Row</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Spreadsheet ID</label>
                        <input
                          type="text"
                          value={config.spreadsheetId || ''}
                          onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                          placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Sheet Tab Name</label>
                        <input
                          type="text"
                          value={config.sheetName || 'Sheet1'}
                          onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                          placeholder="Sheet1"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 9. FALLBACK FOR ANY OTHER NODE TYPE */}
                  {![
                    'app_telegram',
                    'comm_telegram',
                    'http_request',
                    'trigger_webhook',
                    'trigger_schedule',
                    'chat_trigger',
                    'ai_agent',
                    'ai_model_gemini',
                    'app_google_sheets',
                  ].includes(node.type) && (
                    <div className="space-y-3.5">
                      {Object.keys(config).length === 0 ? (
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-2">
                          <p className="text-slate-400 text-xs">Standard node parameters.</p>
                          <button
                            type="button"
                            onClick={() => handleConfigChange('customField', 'value')}
                            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium"
                          >
                            + Add Field
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
                              value={config[key] ?? ''}
                              onChange={(e) => handleConfigChange(key, e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
                            />
                            {renderExpressionEvaluator(String(config[key] || ''))}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* -------------------------------------------------------- */}
              {/* TAB 2: SETTINGS (MATCHING SCREENSHOT 2 EXACTLY)           */}
              {/* -------------------------------------------------------- */}
              {activeCenterTab === 'settings' && (
                <div className="space-y-4">
                  {/* Toggle 1: Always Output Data */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-slate-200 block">Always Output Data</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                        Guarantees that this node will always output at least one item, even if the result was empty.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={executionSettings.alwaysOutputData || false}
                        onChange={(e) => handleExecutionSettingChange('alwaysOutputData', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Toggle 2: Execute Once */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="pr-3">
                      <span className="text-xs font-semibold text-slate-200 block">Execute Once</span>
                      <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                        Execute the node only once, no matter how many items it receives as input.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={executionSettings.executeOnce || false}
                        onChange={(e) => handleExecutionSettingChange('executeOnce', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Toggle 3: Retry On Fail */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="pr-3">
                        <span className="text-xs font-semibold text-slate-200 block">Retry On Fail</span>
                        <span className="text-[10px] text-slate-400 leading-tight block mt-0.5">
                          If execution fails, retry up to maximum tries.
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={Boolean(executionSettings.retryCount && executionSettings.retryCount > 0)}
                          onChange={(e) =>
                            handleExecutionSettingChange('retryCount', e.target.checked ? 3 : 0)
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    {Boolean(executionSettings.retryCount && executionSettings.retryCount > 0) && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-850">
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Max Tries</label>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={executionSettings.retryCount || 3}
                            onChange={(e) => handleExecutionSettingChange('retryCount', parseInt(e.target.value) || 3)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Wait Between Tries (ms)</label>
                          <input
                            type="number"
                            min="100"
                            step="500"
                            value={executionSettings.retryWaitMs || 1000}
                            onChange={(e) => handleExecutionSettingChange('retryWaitMs', parseInt(e.target.value) || 1000)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 font-mono text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Dropdown: On Error */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">On Error</label>
                    <select
                      value={executionSettings.onError || 'stop'}
                      onChange={(e) => handleExecutionSettingChange('onError', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="stop">Stop Workflow</option>
                      <option value="continue">Continue Regular Output</option>
                      <option value="continueErrorOutput">Continue Error Output</option>
                    </select>
                  </div>

                  {/* Textarea: Notes */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Notes</label>
                    <textarea
                      rows={4}
                      value={node.notes || ''}
                      onChange={(e) => onUpdateConfig(node.id, { notes: e.target.value })}
                      placeholder="Write notes about what this node does..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 text-xs focus:border-orange-500 focus:outline-none resize-y"
                    />
                  </div>

                  {/* Toggle: Display Note in Flow */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block">Display Note in Flow</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Display this note directly on the canvas under this node
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={executionSettings.displayNoteInFlow || false}
                        onChange={(e) => handleExecutionSettingChange('displayNoteInFlow', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  {/* Version Footer (Matching Screenshot 2) */}
                  <div className="pt-2 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>{node.name} version 1.2 (Latest)</span>
                  </div>

                  {/* Subtle link at bottom (Matching Screenshot 2) */}
                  <div className="text-center pt-4">
                    <span className="text-xs text-slate-500 hover:text-slate-400 cursor-pointer">
                      💡 I wish this node would...
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* PANE 3: RIGHT - OUTPUT (Produced by this Node)                 */}
          {/* ============================================================== */}
          <div
            className={`w-full md:w-80 lg:w-96 bg-slate-950/50 flex flex-col shrink-0 min-h-0 overflow-hidden ${
              mobilePane === 'output' ? 'flex flex-1' : 'hidden md:flex'
            }`}
          >
            {/* Header: OUTPUT */}
            <div className="h-11 px-3.5 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ArrowRightFromLine className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">OUTPUT</span>
              </div>
              {resolvedOutputData && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {Array.isArray(resolvedOutputData) ? `${resolvedOutputData.length} items` : '1 item'}
                </span>
              )}
            </div>

            {/* Content: Inspector if data exists, else "No output data" placeholder */}
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {resolvedOutputData || testError ? (
                <NodeDataInspector
                  outputData={resolvedOutputData}
                  error={testError || executionResult?.error}
                  className="border-0 rounded-none h-full"
                />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <ArrowRightFromLine className="w-7 h-7 stroke-[1.5]" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-300 block">No output data</span>
                    <span className="text-xs text-slate-500 leading-relaxed block mt-1 max-w-[220px]">
                      The node will produce output data when it executes.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunSingleTest}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FF6D5A] hover:bg-[#ff553e] text-white font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Execute step</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDED EXPRESSION MODAL */}
      {expandedField && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <span className="text-cyan-400 italic font-mono">fx</span>
                <span>Edit Expression: {expandedField.label}</span>
              </span>
              <button
                type="button"
                onClick={() => setExpandedField(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              rows={8}
              value={expandedField.value}
              onChange={(e) => {
                const val = e.target.value;
                setExpandedField({ ...expandedField, value: val });
                handleConfigChange(expandedField.key, val);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-slate-200 font-mono focus:border-orange-500 focus:outline-none"
            />

            {renderExpressionEvaluator(expandedField.value)}

            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1">
              <span>Supports syntax: <code>&#123;&#123;$json.property&#125;&#125;</code> and <code>$(&quot;Node Name&quot;).all()</code></span>
              <button
                type="button"
                onClick={() => setExpandedField(null)}
                className="px-4 py-1.5 rounded-lg bg-[#FF6D5A] text-white font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
