import React, { useState } from 'react';
import {
  Webhook as WebhookIcon,
  Copy,
  Check,
  Send,
  ExternalLink,
  Code2,
  Terminal,
  Activity,
  Radio
} from 'lucide-react';
import { Webhook, Workflow } from '../../types/workflow';

interface WebhooksViewProps {
  webhooks: Webhook[];
  workflows: Workflow[];
  onOpenWorkflow: (wfId: string) => void;
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ webhooks, workflows, onOpenWorkflow }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "event": "customer.created",\n  "name": "Jordan Hayes",\n  "company": "Horizon Robotics",\n  "priority": "High"\n}');
  const [selectedWebhookPath, setSelectedWebhookPath] = useState<string>(webhooks[0]?.path || '');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDispatchTest = async () => {
    if (!selectedWebhookPath) return;
    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const parsedBody = JSON.parse(testPayload);
      const res = await fetch(`/api/webhook/${selectedWebhookPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-EIE-Test-Dispatcher': 'true',
        },
        body: JSON.stringify(parsedBody),
      });
      const data = await res.json();
      setDispatchResult({ status: res.status, data });
    } catch (err: any) {
      setDispatchResult({ error: err.message });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <WebhookIcon className="w-4 h-4" />
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Active Webhook Ingestion</h1>
        </div>
        <p className="text-xs text-slate-400">
          Public HTTPS triggers automatically provisioned for connected workflows
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Registered Webhooks Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3">Webhook Name & Endpoint</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Inbound Calls</th>
                  <th className="px-5 py-3">Last Trigger</th>
                  <th className="px-5 py-3 text-right">Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200">
                {webhooks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No webhook triggers created yet. Add a "Webhook Trigger" node to any workflow.
                    </td>
                  </tr>
                ) : (
                  webhooks.map((wh) => {
                    const fullUrl = `${window.location.origin}/api/webhook/${wh.path}`;
                    const targetWorkflow = workflows.find((w) => w.id === wh.workflowId);

                    return (
                      <tr key={wh.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-white mb-1">{wh.name}</div>
                          <div className="flex items-center gap-2">
                            <code className="text-[11px] font-mono text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 select-all">
                              {fullUrl}
                            </code>
                            <button
                              onClick={() => handleCopy(fullUrl, wh.id)}
                              className="text-slate-400 hover:text-white"
                              title="Copy URL"
                            >
                              {copiedId === wh.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold">
                            {wh.method}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-400 text-[11px]">
                          {wh.callCount} calls
                        </td>
                        <td className="px-5 py-4 font-mono text-slate-500 text-[11px]">
                          {wh.lastCalledAt ? new Date(wh.lastCalledAt).toLocaleTimeString() : 'Never'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => onOpenWorkflow(wh.workflowId)}
                            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1"
                          >
                            <span>{targetWorkflow?.name?.slice(0, 16) || 'Canvas'}...</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* cURL Snippet Card */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>cURL Trigger Command</span>
              </span>
              <button
                onClick={() =>
                  handleCopy(
                    `curl -X POST ${window.location.origin}/api/webhook/${webhooks[0]?.path || 'wh_lead_inbound'} \\\n  -H "Content-Type: application/json" \\\n  -d '{"message": "Hello from external webhook"}'`,
                    'curl_cmd'
                  )
                }
                className="text-slate-400 hover:text-white text-[10px] flex items-center gap-1"
              >
                {copiedId === 'curl_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copy cURL</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto select-all">
{`curl -X POST ${window.location.origin}/api/webhook/${webhooks[0]?.path || 'wh_lead_inbound'} \\
  -H "Content-Type: application/json" \\
  -d '{"message": "Hello from external webhook"}'`}
            </pre>
          </div>
        </div>

        {/* Right 1 Col: Live In-App Webhook Dispatcher */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 text-xs">
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-cyan-400" />
              <span>Simulate Inbound Webhook</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Send a test event payload directly into your workflow execution pipeline.
            </p>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">Target Endpoint</label>
            <select
              value={selectedWebhookPath}
              onChange={(e) => setSelectedWebhookPath(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
            >
              {webhooks.map((w) => (
                <option key={w.id} value={w.path}>
                  /api/webhook/{w.path}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 block mb-1">JSON Payload</label>
            <textarea
              rows={6}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono text-[11px] focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          <button
            onClick={handleDispatchTest}
            disabled={isDispatching || !selectedWebhookPath}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer shadow-md shadow-cyan-500/25"
          >
            <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-pulse' : ''}`} />
            <span>{isDispatching ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
          </button>

          {/* Test Response */}
          {dispatchResult && (
            <div className="pt-2 border-t border-slate-800 space-y-1">
              <span className="text-[10px] uppercase font-mono text-emerald-400 font-bold block">
                Workflow Response ({dispatchResult.status || 200})
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
                {JSON.stringify(dispatchResult.data || dispatchResult.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
