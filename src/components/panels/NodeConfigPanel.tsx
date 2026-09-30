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
  Sparkles
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { WorkflowNodeData, Credential, ExecutionNodeResult } from '../../types/workflow';

interface NodeConfigPanelProps {
  node: WorkflowNodeData | null;
  credentials: Credential[];
  executionResult?: ExecutionNodeResult;
  onClose: () => void;
  onUpdateConfig: (nodeId: string, updates: Partial<WorkflowNodeData>) => void;
  onDeleteNode: (nodeId: string) => void;
  onTestNode: (node: WorkflowNodeData) => Promise<any>;
}

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  node,
  credentials,
  executionResult,
  onClose,
  onUpdateConfig,
  onDeleteNode,
  onTestNode,
}) => {
  const [activeTab, setActiveTab] = useState<'params' | 'credentials' | 'settings' | 'test'>('params');
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  if (!node) return null;

  const IconComponent = ((Icons as any)[node.icon] || Icons.Box) as React.ComponentType<{ className?: string }>;
  const config = node.config || {};

  const handleConfigChange = (key: string, value: any) => {
    onUpdateConfig(node.id, {
      config: {
        ...node.config,
        [key]: value,
      },
    });
  };

  const handleRunSingleTest = async () => {
    setIsTesting(true);
    setTestError(null);
    try {
      const res = await onTestNode(node);
      setTestResult(res);
      setActiveTab('test');
    } catch (err: any) {
      setTestError(err.message || 'Test execution failed');
      setActiveTab('test');
    } finally {
      setIsTesting(false);
    }
  };

  // Full Webhook URL for current origin
  const fullWebhookUrl = `${window.location.origin}/api/webhook/${config.webhookPath || node.id}`;

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
              onClick={() => setActiveTab('test')}
              className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 transition cursor-pointer shrink-0"
            >
              View JSON Output
            </button>
          </div>
        )}

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-2 text-xs">
        <button
          onClick={() => setActiveTab('params')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'params'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Parameters</span>
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'credentials'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Credentials</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`px-3 py-2.5 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'test'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
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
                    value={config.model || 'gemini-3.8-flash'}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite</option>
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
                      value={config.model || 'gemini-3.8-flash'}
                      onChange={(e) => handleConfigChange('model', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Recommended, Fast & Intelligent)</option>
                      <option value="gemini-flash-latest">gemini-flash-latest (General Multimodal)</option>
                      <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Ultra Lightweight)</option>
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

            {/* 11. Generic Fallback for other nodes */}
            {!['http_request', 'trigger_webhook', 'ai_agent', 'logic_if', 'data_code', 'comm_email', 'ai_model_gemini', 'ai_model_openai', 'ai_model_claude', 'ai_memory_window', 'ai_memory_redis', 'app_slack', 'app_google_sheets'].includes(node.type) && !node.type.startsWith('ai_tool_') && (
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

        {/* TAB 4: TEST / OUTPUT INSPECTOR */}
        {activeTab === 'test' && (
          <div className="space-y-3">
            {testError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                <strong>Error:</strong> {testError}
              </div>
            )}

            {testResult ? (
              <div>
                <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-1">Node Output JSON</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            ) : executionResult?.output ? (
              <div>
                <span className="text-[10px] uppercase font-mono text-emerald-400 block mb-1">Last Execution Output</span>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto max-h-64 whitespace-pre-wrap">
                  {JSON.stringify(executionResult.output, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500">
                <Terminal className="w-6 h-6 mx-auto mb-1 opacity-50" />
                <p>Click "Test Node" below to execute this single node with mock data.</p>
              </div>
            )}
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
