import React, { useState, useMemo, useEffect } from 'react';
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
import { NODE_LIBRARY } from '../../constants/nodeLibrary';

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
  onDeleteCredential?: (credId: string) => Promise<void> | void;
  onSaveStep?: () => Promise<void>;
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
  onDeleteCredential,
  onSaveStep,
}) => {
  const [credDeleteFeedback, setCredDeleteFeedback] = useState<string | null>(null);

  const handleDeleteCred = async (credId: string) => {
    try {
      if (onDeleteCredential) {
        await onDeleteCredential(credId);
      }
      if (node && node.credentialId === credId) {
        onUpdateConfig(node.id, { credentialId: undefined });
      }
      setCredDeleteFeedback('Credential removed');
      setTimeout(() => setCredDeleteFeedback(null), 3000);
    } catch {
      setCredDeleteFeedback('Failed to remove credential');
      setTimeout(() => setCredDeleteFeedback(null), 3000);
    }
  };
  // Center tabs: strictly Parameters & Settings (exactly matching n8n)
  const [activeCenterTab, setActiveCenterTab] = useState<'params' | 'settings'>('params');

  // Mobile pane view: 'input' | 'center' | 'output' (default 'center')
  const [mobilePane, setMobilePane] = useState<'input' | 'center' | 'output'>('center');

  // Step saving & feedback state
  const [isSavingStep, setIsSavingStep] = useState(false);
  const [stepSavedToast, setStepSavedToast] = useState(false);

  // Credential dropdown state
  const [credentialDropdownOpen, setCredentialDropdownOpen] = useState(false);
  const [showNewCredModal, setShowNewCredModal] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredKey, setNewCredKey] = useState('');
  const [newCredSecondary, setNewCredSecondary] = useState('');
  const [newCredTertiary, setNewCredTertiary] = useState('');
  const [newCredExtra, setNewCredExtra] = useState('');
  const [isSavingCred, setIsSavingCred] = useState(false);
  const [credSaveError, setCredSaveError] = useState<string | null>(null);
  const [credSavedToast, setCredSavedToast] = useState<string | null>(null);

  const handleSaveAndClose = async () => {
    setIsSavingStep(true);
    try {
      if (onSaveStep) {
        await onSaveStep();
      }
      setStepSavedToast(true);
      setTimeout(() => {
        onClose();
      }, 350);
    } catch (err) {
      console.warn('Step save error:', err);
      onClose();
    } finally {
      setIsSavingStep(false);
    }
  };

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
        ...(node.config || {}),
        [key]: value,
      },
    });
  };

  const handleConfigBatch = (changes: Record<string, any>) => {
    onUpdateConfig(node.id, {
      config: {
        ...(node.config || {}),
        ...changes,
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

  // Check if node genuinely requires/supports credentials (API key or service account)
  const supportsCredentials = useMemo(() => {
    const t = node.type.toLowerCase();

    // 1. Explicit exclusion: Core logic, flow control, conditions, triggers, code, json parse never need API keys
    if (
      t.startsWith('core_') ||
      t.startsWith('flow_') ||
      t.startsWith('condition_') ||
      t.startsWith('chain_') ||
      t === 'trigger_manual' ||
      t === 'trigger_schedule' ||
      t === 'trigger_webhook' ||
      t === 'trigger_chat' ||
      t.startsWith('chat_memory') ||
      t.startsWith('chat_sentiment') ||
      t.startsWith('chat_webhook') ||
      t === 'http_request' ||
      t === 'code' ||
      t === 'set' ||
      t === 'if' ||
      t === 'switch' ||
      t === 'merge'
    ) {
      return false;
    }

    // 2. Check definition from NODE_LIBRARY
    const def = NODE_LIBRARY.find((n) => n.type === node.type);
    if (def && typeof def.requiresCredentials === 'boolean') {
      return def.requiresCredentials;
    }

    // 3. Service / External App nodes that require API keys or tokens
    return (
      t.startsWith('app_') ||
      t.includes('telegram') ||
      t.includes('whatsapp') ||
      t.includes('slack') ||
      t.includes('discord') ||
      t.includes('sheets') ||
      t.includes('gmail') ||
      t.includes('google') ||
      t.includes('openai') ||
      t.includes('gemini') ||
      t.includes('claude') ||
      t.includes('anthropic') ||
      t.includes('notion') ||
      t.includes('airtable') ||
      t.includes('github') ||
      t.includes('mailchimp') ||
      t.includes('stripe') ||
      t.includes('twilio') ||
      t.includes('sendgrid') ||
      t.includes('supabase') ||
      t.includes('postgres') ||
      t.includes('mysql') ||
      t.includes('mongodb')
    );
  }, [node.type]);

  // Current selected credential
  const selectedCredential = credentials.find((c) => c.id === node.credentialId);

  // Filter relevant credentials strictly for this node type
  const relevantCredentials = useMemo(() => {
    if (!supportsCredentials) return [];
    const typeLower = node.type.toLowerCase();
    let filtered: Credential[] = [];
    if (typeLower.includes('telegram')) filtered = credentials.filter((c) => c.type === 'telegram');
    else if (typeLower.includes('slack')) filtered = credentials.filter((c) => c.type === 'slack');
    else if (typeLower.includes('discord')) filtered = credentials.filter((c) => c.type === 'discord');
    else if (typeLower.includes('sheets') || typeLower.includes('gmail') || typeLower.includes('google')) {
      filtered = credentials.filter((c) => c.type === 'google' || c.type === 'google_sheets' || c.type === 'gmail');
    } else if (typeLower.includes('gemini')) filtered = credentials.filter((c) => c.type === 'gemini');
    else if (typeLower.includes('openai')) filtered = credentials.filter((c) => c.type === 'openai');
    else if (typeLower.includes('anthropic') || typeLower.includes('claude')) filtered = credentials.filter((c) => c.type === 'anthropic');
    else if (typeLower.includes('postgres') || typeLower.includes('mysql') || typeLower.includes('supabase')) {
      filtered = credentials.filter((c) => c.type === 'postgres' || c.type === 'mysql' || c.type === 'supabase');
    } else {
      filtered = credentials.filter((c) => c.type === 'generic');
    }
    return filtered.length > 0 ? filtered : credentials;
  }, [credentials, node.type, supportsCredentials]);

  // Clean state resets when active node changes
  useEffect(() => {
    setShowNewCredModal(false);
    setCredentialDropdownOpen(false);
    setNewCredName('');
    setNewCredKey('');
    setNewCredSecondary('');
    setNewCredTertiary('');
  }, [node.id]);

  // Ensure non-credential node never holds a credential, and credential node matches type
  useEffect(() => {
    if (!supportsCredentials && node.credentialId) {
      onUpdateConfig(node.id, { credentialId: undefined });
      return;
    }
    if (supportsCredentials && node.credentialId && credentials.length > 0) {
      const currentCred = credentials.find((c) => c.id === node.credentialId);
      if (currentCred) {
        const typeLower = node.type.toLowerCase();
        let isMismatched = false;
        if (typeLower.includes('openai') && currentCred.type !== 'openai') isMismatched = true;
        if (typeLower.includes('gemini') && currentCred.type !== 'gemini') isMismatched = true;
        if (typeLower.includes('anthropic') && currentCred.type !== 'anthropic') isMismatched = true;
        if (typeLower.includes('telegram') && currentCred.type !== 'telegram') isMismatched = true;
        if (typeLower.includes('slack') && currentCred.type !== 'slack') isMismatched = true;
        if (typeLower.includes('discord') && currentCred.type !== 'discord') isMismatched = true;

        if (isMismatched) {
          const matching = relevantCredentials[0];
          onUpdateConfig(node.id, { credentialId: matching ? matching.id : undefined });
        }
      }
    }
  }, [node.id, node.type, node.credentialId, credentials, relevantCredentials, supportsCredentials]);

  // Dynamic Credential Meta by Node Type (no hardcoded Telegram leaks)
  const getCredDefaults = () => {
    const t = node.type.toLowerCase();
    if (t.includes('telegram')) {
      return {
        title: 'Telegram Bot Token',
        nameDefault: 'Telegram Bot Account',
        namePlaceholder: 'e.g. My Alerts Bot',
        keyLabel: 'Telegram Bot Token (from @BotFather)',
        keyPlaceholder: '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ...',
        secondaryLabel: 'Default Chat ID / Channel ID',
        secondaryPlaceholder: 'e.g. -100123456789 or @channel',
        type: 'telegram',
      };
    }
    if (t.includes('openai')) {
      return {
        title: 'OpenAI API Key',
        nameDefault: 'OpenAI Production Key',
        namePlaceholder: 'e.g. OpenAI Production Key',
        keyLabel: 'OpenAI Secret API Key (sk-...)',
        keyPlaceholder: 'sk-proj-... or sk-...',
        secondaryLabel: 'Organization ID (optional)',
        secondaryPlaceholder: 'org-...',
        type: 'openai',
      };
    }
    if (t.includes('gemini')) {
      return {
        title: 'Google Gemini API Key',
        nameDefault: 'Google Gemini Pro Key',
        namePlaceholder: 'e.g. Gemini 1.5/2.5 Pro Key',
        keyLabel: 'Gemini API Key (AIzaSy...)',
        keyPlaceholder: 'AIzaSy...',
        type: 'gemini',
      };
    }
    if (t.includes('anthropic') || t.includes('claude')) {
      return {
        title: 'Anthropic Claude Key',
        nameDefault: 'Claude 3.5 Sonnet Key',
        namePlaceholder: 'e.g. Anthropic Claude Key',
        keyLabel: 'Claude API Key (sk-ant-...)',
        keyPlaceholder: 'sk-ant-api03-...',
        type: 'anthropic',
      };
    }
    if (t.includes('slack')) {
      return {
        title: 'Slack Webhook & Token',
        nameDefault: 'Slack Workspace Connection',
        namePlaceholder: 'e.g. Slack Alerts Connection',
        keyLabel: 'Incoming Webhook URL or Bot Token (xoxb-...)',
        keyPlaceholder: 'https://hooks.slack.com/services/... or xoxb-...',
        secondaryLabel: 'Default Channel (optional)',
        secondaryPlaceholder: 'e.g. #general',
        type: 'slack',
      };
    }
    if (t.includes('discord')) {
      return {
        title: 'Discord Webhook Connection',
        nameDefault: 'Discord Channel Webhook',
        namePlaceholder: 'e.g. Discord Alerts Webhook',
        keyLabel: 'Discord Webhook URL',
        keyPlaceholder: 'https://discord.com/api/webhooks/...',
        type: 'discord',
      };
    }
    if (t.includes('postgres') || t.includes('mysql') || t.includes('supabase')) {
      return {
        title: 'Database Connection',
        nameDefault: 'Database Connection',
        namePlaceholder: 'e.g. Production PostgreSQL DB',
        keyLabel: 'Database Password',
        keyPlaceholder: 'Secret database password',
        secondaryLabel: 'Database Host',
        secondaryPlaceholder: 'localhost or db.eie-cloud.internal',
        tertiaryLabel: 'Database User',
        tertiaryPlaceholder: 'postgres',
        type: 'postgres',
      };
    }
    if (t.includes('sheets') || t.includes('gmail') || t.includes('google')) {
      return {
        title: 'Google Workspace Account',
        nameDefault: 'Google Sheets / Gmail Account',
        namePlaceholder: 'e.g. Google Sheets Account',
        keyLabel: 'OAuth Access Token or Service Account Key',
        keyPlaceholder: 'OAuth token / Service Account JSON',
        type: 'google_sheets',
      };
    }
    return {
      title: `${node.name} Credential`,
      nameDefault: `${node.name} Key`,
      namePlaceholder: `e.g. ${node.name} Production Key`,
      keyLabel: 'API Key or Access Secret',
      keyPlaceholder: 'API Key / Secret Token',
      secondaryLabel: 'Base URL / Host (optional)',
      secondaryPlaceholder: 'https://api.example.com',
      type: 'generic',
    };
  };

  // Handle Quick Credential Creation
  const handleSaveQuickCredential = async () => {
    const defs = getCredDefaults();
    const finalName = (newCredName || defs.nameDefault).trim();
    const secretKey = newCredKey.trim();

    if (!finalName) {
      setCredSaveError('Please enter a credential name');
      return;
    }
    if (!secretKey) {
      setCredSaveError(`Please enter ${defs.keyLabel || 'the API key or Token'}`);
      return;
    }

    setCredSaveError(null);
    setIsSavingCred(true);

    try {
      const data: Record<string, string> = {
        apiKey: secretKey,
        token: secretKey,
        botToken: secretKey,
        webhookUrl: secretKey,
        secret: secretKey,
      };

      if (defs.type === 'telegram') {
        data.botToken = secretKey;
        if (newCredSecondary.trim()) data.chatId = newCredSecondary.trim();
      } else if (defs.type === 'slack') {
        data.webhookUrl = secretKey;
        data.botToken = secretKey;
        if (newCredSecondary.trim()) data.channel = newCredSecondary.trim();
      } else if (defs.type === 'discord') {
        data.webhookUrl = secretKey;
      } else if (defs.type === 'postgres' || defs.type === 'mysql') {
        data.password = secretKey;
        if (newCredSecondary.trim()) data.host = newCredSecondary.trim();
        if (newCredTertiary.trim()) data.user = newCredTertiary.trim();
        if (newCredExtra.trim()) data.database = newCredExtra.trim();
      } else if (defs.type === 'gemini') {
        data.apiKey = secretKey;
      } else if (defs.type === 'openai') {
        data.apiKey = secretKey;
        if (newCredSecondary.trim()) data.orgId = newCredSecondary.trim();
      } else if (defs.type === 'anthropic') {
        data.apiKey = secretKey;
      } else if (defs.type === 'google_sheets' || defs.type === 'google') {
        data.apiKey = secretKey;
        data.token = secretKey;
      } else if (newCredSecondary.trim()) {
        data.host = newCredSecondary.trim();
        data.baseUrl = newCredSecondary.trim();
      }

      const newId = `cred_${Date.now()}`;
      const newCred: any = {
        id: newId,
        name: finalName,
        type: defs.type,
        data,
        createdAt: new Date().toISOString(),
      };

      let savedResult: any = null;
      if (onCreateCredential) {
        savedResult = await onCreateCredential(newCred);
      }

      const finalCredId = savedResult?.id || newId;

      // Update node config with credential ID AND direct parameters for seamless execution
      onUpdateConfig(node.id, {
        credentialId: finalCredId,
        config: {
          ...node.config,
          credentialId: finalCredId,
          ...(defs.type === 'telegram'
            ? {
                botToken: secretKey,
                tokenId: secretKey,
                chatId: data.chatId || node.config?.chatId || '@alerts_channel',
              }
            : {}),
          ...(defs.type === 'slack'
            ? {
                webhookUrl: secretKey,
                channel: data.channel || node.config?.channel || '#general',
              }
            : {}),
          ...(defs.type === 'discord'
            ? {
                webhookUrl: secretKey,
              }
            : {}),
          ...(defs.type === 'openai'
            ? {
                apiKey: secretKey,
              }
            : {}),
          ...(defs.type === 'gemini'
            ? {
                apiKey: secretKey,
              }
            : {}),
          ...(defs.type === 'anthropic'
            ? {
                apiKey: secretKey,
              }
            : {}),
        },
      });

      setCredSavedToast(`✓ ${finalName} saved & connected!`);
      setTimeout(() => setCredSavedToast(null), 3500);

      setNewCredName('');
      setNewCredKey('');
      setNewCredSecondary('');
      setNewCredTertiary('');
      setNewCredExtra('');
      setShowNewCredModal(false);
      setCredentialDropdownOpen(false);
    } catch (err: any) {
      setCredSaveError(`Failed to save: ${err.message || 'Check connection'}`);
    } finally {
      setIsSavingCred(false);
    }
  };

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

          {/* Right Action Icons: Save Step, Delete Step & Close */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSavingStep}
              onClick={handleSaveAndClose}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/25 transition cursor-pointer active:scale-95"
              title="Save step configuration and close"
            >
              {isSavingStep ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              )}
              <span>{isSavingStep ? 'Saving...' : 'Save Step'}</span>
            </button>

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
              onClick={handleSaveAndClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Save & Close (Esc)"
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
                            {selectedCredential && (
                              <button
                                type="button"
                                title="Unassign credential from this node"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onUpdateConfig(node.id, { credentialId: undefined });
                                }}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {selectedCredential && (
                              <button
                                type="button"
                                title={`Delete credential "${selectedCredential.name}"`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCred(selectedCredential.id);
                                }}
                                className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              title="Create or configure credential"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowNewCredModal(true);
                              }}
                              className="p-1 rounded hover:bg-purple-500/20 text-slate-400 hover:text-purple-300 transition cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {credentialDropdownOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
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
                                className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition ${
                                  node.credentialId === cred.id
                                    ? 'bg-purple-500/15 text-purple-300 font-semibold'
                                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <KeyRound className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                                  <span className="truncate">{cred.name}</span>
                                  <span className="text-[10px] text-slate-500 capitalize shrink-0">
                                    {cred.type} API
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {node.credentialId === cred.id && (
                                    <Check className="w-3.5 h-3.5 text-purple-400" />
                                  )}
                                  <button
                                    type="button"
                                    title={`Delete credential "${cred.name}"`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCred(cred.id);
                                    }}
                                    className="p-1 rounded hover:bg-red-500/25 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
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
                      {showNewCredModal && (() => {
                        const defs = getCredDefaults();
                        return (
                          <div className="p-3 mt-2 rounded-xl bg-slate-950 border border-purple-500/50 space-y-2.5 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                                Add New {defs.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowNewCredModal(false)}
                                className="text-slate-400 hover:text-white text-xs cursor-pointer p-0.5"
                              >
                                ✕
                              </button>
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">Credential Name</label>
                              <input
                                type="text"
                                value={newCredName}
                                onChange={(e) => setNewCredName(e.target.value)}
                                placeholder={defs.namePlaceholder}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                data-lpignore="true"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] text-slate-400 block mb-1">{defs.keyLabel}</label>
                              <input
                                type="password"
                                value={newCredKey}
                                onChange={(e) => setNewCredKey(e.target.value)}
                                placeholder={defs.keyPlaceholder}
                                autoComplete="new-password"
                                data-lpignore="true"
                                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none"
                              />
                            </div>

                            {defs.secondaryLabel && (
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{defs.secondaryLabel}</label>
                                <input
                                  type="text"
                                  value={newCredSecondary}
                                  onChange={(e) => setNewCredSecondary(e.target.value)}
                                  placeholder={defs.secondaryPlaceholder || ''}
                                  autoComplete="off"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {defs.tertiaryLabel && (
                              <div>
                                <label className="text-[10px] text-slate-400 block mb-1">{defs.tertiaryLabel}</label>
                                <input
                                  type="text"
                                  value={newCredTertiary}
                                  onChange={(e) => setNewCredTertiary(e.target.value)}
                                  placeholder={defs.tertiaryPlaceholder || ''}
                                  autoComplete="off"
                                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                                />
                              </div>
                            )}

                            {credSaveError && (
                              <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/60 text-rose-300 text-[11px] flex items-center gap-1.5">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                <span>{credSaveError}</span>
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowNewCredModal(false);
                                  setCredSaveError(null);
                                }}
                                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isSavingCred}
                                onClick={handleSaveQuickCredential}
                                className="flex items-center gap-1.5 px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer shadow-md shadow-purple-600/30"
                              >
                                {isSavingCred && <Loader2 className="w-3 h-3 animate-spin" />}
                                <span>{isSavingCred ? 'Saving...' : 'Save Credential'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Toast notification after credential save */}
                      {credSavedToast && (
                        <div className="mt-2 p-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-1.5 animate-in fade-in duration-200">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{credSavedToast}</span>
                        </div>
                      )}

                      {/* Toast notification after credential delete */}
                      {credDeleteFeedback && (
                        <div className="mt-2 p-2 rounded-lg bg-red-950/80 border border-red-500/50 text-red-300 text-xs flex items-center gap-1.5 animate-in fade-in duration-200">
                          <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          <span>{credDeleteFeedback}</span>
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
                              handleConfigBatch({ chatId: e.target.value, chat_id: e.target.value });
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
                              handleConfigBatch({ text: e.target.value, message: e.target.value });
                            }}
                            placeholder='().map((w, i) => { const c = $("Split Cities").all()[i].json.city; return c; })'
                            className="w-full bg-slate-950 border border-slate-800 rounded-r-lg p-2 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-none resize-y"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap mt-1">
                          <button
                            type="button"
                            title="Insert incoming JSON payload expression"
                            onClick={() => {
                              const curr = config.text || config.message || '';
                              const updated = curr ? `${curr} {{$json}}` : '{{$json}}';
                              handleConfigBatch({ text: updated, message: updated });
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] cursor-pointer transition"
                          >
                            + {'{{$json}}'}
                          </button>
                          <button
                            type="button"
                            title="Insert incoming message property"
                            onClick={() => {
                              const curr = config.text || config.message || '';
                              const updated = curr ? `${curr} {{$json.message}}` : '{{$json.message}}';
                              handleConfigBatch({ text: updated, message: updated });
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] cursor-pointer transition"
                          >
                            + {'{{$json.message}}'}
                          </button>
                          <button
                            type="button"
                            title="Insert incoming text property"
                            onClick={() => {
                              const curr = config.text || config.message || '';
                              const updated = curr ? `${curr} {{$json.text}}` : '{{$json.text}}';
                              handleConfigBatch({ text: updated, message: updated });
                            }}
                            className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-cyan-300 font-mono text-[10px] cursor-pointer transition"
                          >
                            + {'{{$json.text}}'}
                          </button>
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

                  {/* 9. OPENAI CHATGPT */}
                  {(node.type === 'app_openai' || node.type === 'ai_model_openai' || node.type === 'ai_openai') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Model</label>
                        <select
                          value={config.model || 'gpt-4o'}
                          onChange={(e) => handleConfigChange('model', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                        >
                          <option value="gpt-4o">gpt-4o (Omni Flagship - Multimodal)</option>
                          <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost Efficient)</option>
                          <option value="o1-preview">o1-preview (Advanced Deep Reasoning)</option>
                          <option value="o3-mini">o3-mini (High-Speed Reasoning)</option>
                          <option value="gpt-4-turbo">gpt-4-turbo (128k High Context)</option>
                          <option value="gpt-3.5-turbo">gpt-3.5-turbo (Legacy Standard)</option>
                        </select>
                      </div>

                      {/* Prompt / Message */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-300">Prompt / User Message</label>
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedField({
                                key: 'prompt',
                                label: 'OpenAI Prompt',
                                value: config.prompt || '',
                              })
                            }
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Expand</span>
                          </button>
                        </div>
                        <div className="relative flex items-stretch">
                          <span className="px-2.5 bg-slate-950/80 border border-r-0 border-slate-800 rounded-l-lg flex items-center justify-center font-mono text-[11px] text-emerald-400 font-bold select-none italic">
                            fx
                          </span>
                          <textarea
                            rows={3}
                            value={config.prompt || ''}
                            onChange={(e) => handleConfigChange('prompt', e.target.value)}
                            placeholder="Summarize the following payload: {{$json}}"
                            className="w-full bg-slate-950 border border-slate-800 rounded-r-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none resize-y"
                          />
                        </div>
                        {renderExpressionEvaluator(config.prompt)}
                      </div>

                      {/* System Instructions */}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">System Instructions (Optional)</label>
                        <textarea
                          rows={2}
                          value={config.systemPrompt || ''}
                          onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
                          placeholder="You are an expert AI assistant that outputs structured, concise results."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none resize-y"
                        />
                      </div>

                      {/* Temperature Slider */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Temperature: <span className="text-emerald-400 font-mono">{config.temperature ?? 0.7}</span>
                          </label>
                          <span className="text-[10px] text-slate-500">0.0 = Precise, 1.0 = Creative</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={config.temperature ?? 0.7}
                          onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                          className="w-full accent-emerald-500"
                        />
                      </div>

                      {/* Max Tokens & Format */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Max Tokens</label>
                          <input
                            type="number"
                            value={config.maxTokens ?? 2048}
                            onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value) || 2048)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-emerald-500 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-slate-300 block mb-1">Response Format</label>
                          <select
                            value={config.responseFormat || 'text'}
                            onChange={(e) => handleConfigChange('responseFormat', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-emerald-500 focus:outline-none"
                          >
                            <option value="text">Text Response</option>
                            <option value="json_object">JSON Object</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 10. ANTHROPIC CLAUDE */}
                  {(node.type === 'app_anthropic' || node.type === 'ai_model_anthropic') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Model</label>
                        <select
                          value={config.model || 'claude-3-5-sonnet'}
                          onChange={(e) => handleConfigChange('model', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
                        >
                          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (State-of-the-Art)</option>
                          <option value="claude-3-5-haiku">Claude 3.5 Haiku (Lightning Fast)</option>
                          <option value="claude-3-opus">Claude 3 Opus (Deep Complex Analysis)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">User Prompt</label>
                        <textarea
                          rows={3}
                          value={config.prompt || ''}
                          onChange={(e) => handleConfigChange('prompt', e.target.value)}
                          placeholder="Analyze and extract key parameters from {{$json}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none resize-y"
                        />
                        {renderExpressionEvaluator(config.prompt)}
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-300">
                            Temperature: <span className="text-amber-400 font-mono">{config.temperature ?? 0.5}</span>
                          </label>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={config.temperature ?? 0.5}
                          onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* 11. SLACK NODE */}
                  {(node.type === 'app_slack' || node.type === 'comm_slack') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'postMessage'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-purple-500 focus:outline-none"
                        >
                          <option value="postMessage">Post Message to Channel</option>
                          <option value="sendDirectMessage">Send Direct Message to User</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Channel / User</label>
                        <input
                          type="text"
                          value={config.channel || ''}
                          onChange={(e) => handleConfigChange('channel', e.target.value)}
                          placeholder="#general, #alerts or @user"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.channel)}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Message Text</label>
                        <textarea
                          rows={3}
                          value={config.text || ''}
                          onChange={(e) => handleConfigChange('text', e.target.value)}
                          placeholder="🚀 Workflow notification: {{$json.summary || 'Completed successfully'}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-purple-500 focus:outline-none resize-y"
                        />
                        {renderExpressionEvaluator(config.text)}
                      </div>
                    </div>
                  )}

                  {/* 12. DISCORD NODE */}
                  {(node.type === 'app_discord' || node.type === 'comm_discord') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Webhook URL</label>
                        <input
                          type="text"
                          value={config.webhookUrl || ''}
                          onChange={(e) => handleConfigChange('webhookUrl', e.target.value)}
                          placeholder="https://discord.com/api/webhooks/..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Content / Message</label>
                        <textarea
                          rows={3}
                          value={config.content || ''}
                          onChange={(e) => handleConfigChange('content', e.target.value)}
                          placeholder="⚡ EIE-Workflow: Alert triggered for {{$json.id || 'Job'}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-indigo-500 focus:outline-none resize-y"
                        />
                        {renderExpressionEvaluator(config.content)}
                      </div>
                    </div>
                  )}

                  {/* 13. GMAIL & EMAIL NODE */}
                  {(node.type === 'app_gmail' || node.type === 'comm_email') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'send'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-red-500 focus:outline-none"
                        >
                          <option value="send">Send Email</option>
                          <option value="draft">Create Draft</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">To Email Address</label>
                        <input
                          type="text"
                          value={config.to || ''}
                          onChange={(e) => handleConfigChange('to', e.target.value)}
                          placeholder="recipient@domain.com, {{$json.email}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-red-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.to)}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Subject</label>
                        <input
                          type="text"
                          value={config.subject || ''}
                          onChange={(e) => handleConfigChange('subject', e.target.value)}
                          placeholder="Automated Alert: {{$json.event || 'Notification'}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-red-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.subject)}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Body (HTML/Text)</label>
                        <textarea
                          rows={4}
                          value={config.body || ''}
                          onChange={(e) => handleConfigChange('body', e.target.value)}
                          placeholder="<p>Hello,</p><p>Process completed: {{$json}}</p>"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-red-500 focus:outline-none resize-y"
                        />
                        {renderExpressionEvaluator(config.body)}
                      </div>
                    </div>
                  )}

                  {/* 14. CODE NODE (JAVASCRIPT / PYTHON) */}
                  {(node.type === 'core_code' || node.type === 'code') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Language</label>
                        <select
                          value={config.language || 'javascript'}
                          onChange={(e) => handleConfigChange('language', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                        >
                          <option value="javascript">JavaScript (ES2024)</option>
                          <option value="python">Python (Pyodide)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Execute Code</label>
                        <textarea
                          rows={6}
                          value={config.code || '// Write custom JavaScript to transform data\nreturn $input.all().map(item => ({\n  ...item.json,\n  processedAt: new Date().toISOString()\n}));'}
                          onChange={(e) => handleConfigChange('code', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-cyan-500 focus:outline-none resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {/* 15. IF CONDITION NODE */}
                  {(node.type === 'condition_if' || node.type === 'core_if') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Value 1 (Expression)</label>
                        <input
                          type="text"
                          value={config.fieldPath || config.value1 || ''}
                          onChange={(e) => {
                            handleConfigBatch({ fieldPath: e.target.value, value1: e.target.value });
                          }}
                          placeholder="{{$json.status}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.fieldPath || config.value1)}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operator</label>
                        <select
                          value={config.operator || '=='}
                          onChange={(e) => handleConfigChange('operator', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-amber-500 focus:outline-none font-mono"
                        >
                          <option value="==">== (Equal To)</option>
                          <option value="!=">!= (Not Equal To)</option>
                          <option value=">">&gt; (Greater Than)</option>
                          <option value="<">&lt; (Less Than)</option>
                          <option value="contains">contains (Substring / Array Includes)</option>
                          <option value="not_contains">does not contain</option>
                          <option value="isEmpty">is empty / null</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Value 2 (Comparison)</label>
                        <input
                          type="text"
                          value={config.value || config.value2 || ''}
                          onChange={(e) => {
                            handleConfigBatch({ value: e.target.value, value2: e.target.value });
                          }}
                          placeholder="success, true, or number"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 16. EDIT FIELDS (SET) NODE */}
                  {(node.type === 'core_edit_fields' || node.type === 'core_set') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field Name (Key)</label>
                        <input
                          type="text"
                          value={config.fieldName || config.key || ''}
                          onChange={(e) => {
                            handleConfigBatch({ fieldName: e.target.value, key: e.target.value });
                          }}
                          placeholder="leadScore or formattedMessage"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-teal-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Field Value (String or Expression)</label>
                        <input
                          type="text"
                          value={config.fieldValue || config.value || ''}
                          onChange={(e) => {
                            handleConfigBatch({ fieldValue: e.target.value, value: e.target.value });
                          }}
                          placeholder="{{$json.name.toUpperCase()}}"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-teal-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.fieldValue || config.value)}
                      </div>
                    </div>
                  )}

                  {/* 17. WAIT / DELAY NODE */}
                  {node.type === 'core_wait' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Wait Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            value={config.amount || config.seconds || 5}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              handleConfigBatch({ amount: val, seconds: val });
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-orange-500 focus:outline-none"
                          />
                          <select
                            value={config.unit || 'seconds'}
                            onChange={(e) => handleConfigChange('unit', e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-orange-500 focus:outline-none"
                          >
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 18. GOOGLE DRIVE */}
                  {node.type === 'app_google_drive' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'upload'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="upload">Upload File</option>
                          <option value="createFolder">Create Folder</option>
                          <option value="download">Download File</option>
                          <option value="search">Search Files</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Folder ID / Path</label>
                        <input
                          type="text"
                          value={config.folderId || 'root'}
                          onChange={(e) => handleConfigChange('folderId', e.target.value)}
                          placeholder="root or folder_id"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 19. GOOGLE CALENDAR */}
                  {node.type === 'app_google_calendar' && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'createEvent'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-green-500 focus:outline-none"
                        >
                          <option value="createEvent">Create Scheduled Event</option>
                          <option value="getEvents">Get Upcoming Agenda</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Event Summary</label>
                        <input
                          type="text"
                          value={config.summary || ''}
                          onChange={(e) => handleConfigChange('summary', e.target.value)}
                          placeholder="Client Onboarding Strategy Session"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-green-500 focus:outline-none"
                        />
                        {renderExpressionEvaluator(config.summary)}
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Duration (Minutes)</label>
                        <input
                          type="number"
                          value={config.durationMinutes || 30}
                          onChange={(e) => handleConfigChange('durationMinutes', parseInt(e.target.value) || 30)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-green-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 20. DATABASE (POSTGRESQL / SUPABASE) */}
                  {(node.type === 'db_postgres' || node.type === 'app_supabase' || node.type === 'db_mysql') && (
                    <div className="space-y-3.5">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">Operation</label>
                        <select
                          value={config.operation || 'execute_query'}
                          onChange={(e) => handleConfigChange('operation', e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="execute_query">Execute SQL Query</option>
                          <option value="insert">Insert Record</option>
                          <option value="update">Update Record</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-300 block mb-1">SQL Query / Table</label>
                        <textarea
                          rows={4}
                          value={config.query || config.table || 'SELECT * FROM users WHERE active = true LIMIT 50;'}
                          onChange={(e) => {
                            handleConfigBatch({ query: e.target.value, table: e.target.value });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-none resize-y"
                        />
                      </div>
                    </div>
                  )}

                  {/* 21. FALLBACK FOR ANY OTHER NODE TYPE */}
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
                    'app_openai',
                    'ai_model_openai',
                    'ai_openai',
                    'app_anthropic',
                    'ai_model_anthropic',
                    'app_slack',
                    'comm_slack',
                    'app_discord',
                    'comm_discord',
                    'app_gmail',
                    'comm_email',
                    'core_code',
                    'code',
                    'condition_if',
                    'core_if',
                    'core_edit_fields',
                    'core_set',
                    'core_wait',
                    'app_google_drive',
                    'app_google_calendar',
                    'db_postgres',
                    'app_supabase',
                    'db_mysql',
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

            {/* Center Pane Footer: Status and Save Step Button */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/95 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-300 font-mono">
                  {stepSavedToast ? '✓ Saved to Workflow' : 'All Changes Auto-Saved'}
                </span>
              </div>
              <button
                type="button"
                disabled={isSavingStep}
                onClick={handleSaveAndClose}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition cursor-pointer active:scale-95"
              >
                {isSavingStep ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>{isSavingStep ? 'Saving...' : 'Save & Close'}</span>
              </button>
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
