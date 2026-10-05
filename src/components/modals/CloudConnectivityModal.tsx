import React, { useState } from 'react';
import {
  Cloud,
  CloudLightning,
  Check,
  Copy,
  Terminal,
  Send,
  Loader2,
  ExternalLink,
  Code2,
  X,
  Radio,
  Sparkles,
} from 'lucide-react';
import { Workflow } from '../../types/workflow';

interface CloudConnectivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: Workflow;
}

export const CloudConnectivityModal: React.FC<CloudConnectivityModalProps> = ({
  isOpen,
  onClose,
  workflow,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);
  const [copiedJs, setCopiedJs] = useState(false);
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'javascript'>('curl');

  // Test trigger state
  const [testPayload, setTestPayload] = useState('{\n  "message": "Hello from external application!",\n  "user": "Enterprise Client",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [cloudPing, setCloudPing] = useState<{ status: string; latencyMs: number } | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const checkCloudHealth = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const lat = Math.round(performance.now() - start);
      if (res.ok) {
        setCloudPing({ status: 'Online', latencyMs: lat });
      } else {
        setCloudPing({ status: 'Connecting...', latencyMs: lat });
      }
    } catch {
      setCloudPing({ status: 'Local Mode', latencyMs: 0 });
    } finally {
      setIsPinging(false);
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      checkCloudHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cloud-api.enterprise.io';
  const webhookUrl = `${origin}/api/webhook/${workflow.id}`;
  const triggerUrl = `${origin}/api/workflows/${workflow.id}/trigger`;

  const curlCode = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${testPayload.replace(/'/g, "\\'")}'`;

  const pythonCode = `import requests

url = "${webhookUrl}"
headers = {"Content-Type": "application/json"}
payload = {
    "message": "Hello from external application!",
    "user": "Enterprise Client"
}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Result Output:", response.json())`;

  const jsCode = `const response = await fetch("${webhookUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    message: "Hello from external application!",
    user: "Enterprise Client"
  })
});

const data = await response.json();
console.log("Cloud Execution Output:", data);`;

  const copyToClipboard = (text: string, type: 'url' | 'curl' | 'python' | 'js') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'python') {
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    } else if (type === 'js') {
      setCopiedJs(true);
      setTimeout(() => setCopiedJs(false), 2000);
    }
  };

  const handleRunCloudTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(testPayload);
      } catch {
        parsedBody = { message: testPayload };
      }

      const res = await fetch(`/api/webhook/${workflow.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedBody),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestError(data.error || 'Server responded with an error');
      } else {
        setTestResult(data);
      }
    } catch (err: any) {
      setTestError(err.message || 'Connection error calling cloud webhook');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-emerald-500/40 shadow-2xl shadow-emerald-950/60 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-500/20">
              <CloudLightning className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cloud Active & External API</h3>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-mono font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  LIVE ON CLOUD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                This workflow is live in the cloud. Any external app, backend, or webhook can trigger it directly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-300">
          {/* Cloud Health & Live Internet Apps Connection Status */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
              <div>
                <div className="text-white font-bold flex items-center gap-2">
                  <span>Cloud Engine:</span>
                  <span className="text-emerald-400">{cloudPing?.status || 'Connecting...'}</span>
                  {cloudPing?.latencyMs !== undefined && cloudPing.latencyMs > 0 && (
                    <span className="text-[10px] font-mono text-slate-400">({cloudPing.latencyMs}ms ping)</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Connected to Internet apps • Real-time Webhooks, Telegram, Slack, AI Models Active
                </div>
              </div>
            </div>
            <button
              onClick={checkCloudHealth}
              disabled={isPinging}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium border border-slate-700 transition cursor-pointer"
            >
              {isPinging ? 'Pinging...' : 'Re-check Cloud'}
            </button>
          </div>

          {/* Active Workflow Cloud Endpoint Box */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                Live Cloud Webhook URL
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Method: <strong className="text-emerald-400">POST</strong> (JSON)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none selection:bg-cyan-500/30"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, 'url')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition cursor-pointer shadow-md shrink-0 active:scale-95"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Copied!' : 'Copy URL'}</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
              <span>Workflow ID: <code className="text-slate-300 bg-slate-900 px-1 py-0.5 rounded">{workflow.id}</code></span>
              <span>Name: <strong className="text-slate-200">{workflow.name}</strong></span>
            </div>
          </div>

          {/* Test Trigger In-Place */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">Test Cloud Webhook Live</span>
              </div>
              <button
                type="button"
                onClick={handleRunCloudTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition cursor-pointer shadow-md disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Executing in Cloud...' : 'Send Test Trigger'}</span>
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 font-mono block mb-1">
                Sample Inbound Payload (JSON):
              </label>
              <textarea
                value={testPayload}
                onChange={(e) => setTestPayload(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-cyan-500/80"
              />
            </div>

            {testError && (
              <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-700/60 text-rose-300 text-xs font-mono">
                ❌ {testError}
              </div>
            )}

            {testResult && (
              <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/50 space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-[11px] text-emerald-400 font-mono font-bold">
                  <span>✓ 200 OK • Execution Duration: {testResult.durationMs}ms</span>
                  <span>Status: {testResult.status}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Response returned to calling application:
                </div>
                <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-cyan-200 overflow-x-auto max-h-36">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Code Snippets for External Applications */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-purple-400" />
                Connect External Applications:
              </span>
              {/* Tab Selector */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px]">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    activeTab === 'curl' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    activeTab === 'python' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveTab('javascript')}
                  className={`px-2.5 py-1 rounded transition cursor-pointer ${
                    activeTab === 'javascript' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  JavaScript / Fetch
                </button>
              </div>
            </div>

            {/* Code Display Area */}
            <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
              <pre className="p-4 font-mono text-[11px] text-cyan-200 overflow-x-auto leading-relaxed select-all">
                {activeTab === 'curl' && curlCode}
                {activeTab === 'python' && pythonCode}
                {activeTab === 'javascript' && jsCode}
              </pre>
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'curl') copyToClipboard(curlCode, 'curl');
                  if (activeTab === 'python') copyToClipboard(pythonCode, 'python');
                  if (activeTab === 'javascript') copyToClipboard(jsCode, 'js');
                }}
                className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-mono transition cursor-pointer"
              >
                {(activeTab === 'curl' ? copiedCurl : activeTab === 'python' ? copiedPython : copiedJs) ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            Incoming external requests trigger your workflow nodes and AI Agent in real-time.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
