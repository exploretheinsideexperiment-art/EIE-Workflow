import React, { useState } from 'react';
import {
  X,
  Workflow as WorkflowIcon,
  Sparkles,
  Webhook,
  Clock,
  Layers,
  Bot,
  ArrowRight,
  Check
} from 'lucide-react';
import { WorkflowNodeData, WorkflowConnection } from '../../types/workflow';

interface CreateWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, starterNodes: WorkflowNodeData[], starterConnections: WorkflowConnection[]) => void;
}

export const CreateWorkflowModal: React.FC<CreateWorkflowModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [name, setName] = useState('New Automation Workflow');
  const [description, setDescription] = useState('Automates triggers, AI models, and application endpoints.');
  const [starterType, setStarterType] = useState<'blank' | 'webhook_ai' | 'schedule_report' | 'ai_tools'>('blank');

  if (!isOpen) return null;

  const handleCreate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = name.trim() || 'Untitled Automation Workflow';

    let starterNodes: WorkflowNodeData[] = [];
    let starterConnections: WorkflowConnection[] = [];

    if (starterType === 'webhook_ai') {
      starterNodes = [
        {
          id: 'n_wh_1',
          name: 'Inbound Webhook',
          type: 'trigger_webhook',
          category: 'Triggers',
          icon: 'Webhook',
          position: { x: 120, y: 180 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Inbound Data' }],
          config: {
            webhookPath: 'inbound-leads',
            method: 'POST',
            samplePayload: '{\n  "leadName": "Elena Vance",\n  "company": "Apex Dynamics",\n  "revenue": "$45,000"\n}'
          }
        },
        {
          id: 'n_ai_1',
          name: 'Gemini AI Agent',
          type: 'ai_agent',
          category: 'AI',
          icon: 'Bot',
          position: { x: 440, y: 180 },
          inputs: [
            { id: 'in_main', name: 'main', type: 'main', label: 'Input' },
            { id: 'in_model', name: 'model', type: 'model', label: 'Model' },
            { id: 'in_memory', name: 'memory', type: 'memory', label: 'Memory' },
            { id: 'in_tools', name: 'tool', type: 'tool', label: 'Tools' }
          ],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Response' }],
          config: {
            agentType: 'tools_agent',
            model: 'gemini-3.8-flash',
            systemPrompt: 'You are an intelligent qualification AI Agent. Evaluate lead urgency and recommend action.',
            userPromptTemplate: 'Evaluate lead: {{$json}}',
            temperature: 0.2
          }
        },
        {
          id: 'n_slack_1',
          name: 'Team Alert',
          type: 'app_slack',
          category: 'Applications',
          icon: 'MessageSquare',
          position: { x: 800, y: 180 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Result' }],
          config: {
            channel: '#alerts',
            text: '🚀 High-Priority Lead Processed: {{$json.customer || $json.leadName}}'
          }
        }
      ];

      starterConnections = [
        { id: 'c_wh_ai', fromNodeId: 'n_wh_1', fromPortId: 'out_main', toNodeId: 'n_ai_1', toPortId: 'in_main' },
        { id: 'c_ai_slack', fromNodeId: 'n_ai_1', fromPortId: 'out_main', toNodeId: 'n_slack_1', toPortId: 'in_main' }
      ];
    } else if (starterType === 'schedule_report') {
      starterNodes = [
        {
          id: 'n_cron_1',
          name: 'Schedule Trigger',
          type: 'trigger_schedule',
          category: 'Triggers',
          icon: 'Clock',
          position: { x: 120, y: 180 },
          inputs: [],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Schedule' }],
          config: { cron: '0 9 * * 1-5', interval: 'Every weekday morning at 09:00 AM' }
        },
        {
          id: 'n_sheets_1',
          name: 'Google Sheets',
          type: 'app_google_sheets',
          category: 'Applications',
          icon: 'FileSpreadsheet',
          position: { x: 440, y: 180 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Sheet Data' }],
          config: { operation: 'Read Rows', sheetName: 'Sheet1' }
        },
        {
          id: 'n_tg_1',
          name: 'Telegram Channel',
          type: 'app_telegram',
          category: 'Applications',
          icon: 'Send',
          position: { x: 780, y: 180 },
          inputs: [{ id: 'in_main', name: 'main', type: 'main', label: 'Input' }],
          outputs: [{ id: 'out_main', name: 'main', type: 'main', label: 'Delivered' }],
          config: { chatId: '@operations_alerts', text: 'Daily Morning Audit: {{$json.text || "Report completed"}}' }
        }
      ];

      starterConnections = [
        { id: 'c_cron_sheets', fromNodeId: 'n_cron_1', fromPortId: 'out_main', toNodeId: 'n_sheets_1', toPortId: 'in_main' },
        { id: 'c_sheets_tg', fromNodeId: 'n_sheets_1', fromPortId: 'out_main', toNodeId: 'n_tg_1', toPortId: 'in_main' }
      ];
    }

    onCreate(finalName, description.trim(), starterNodes, starterConnections);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg rounded-2xl bg-[#090d16] border border-slate-800 shadow-2xl p-6 text-slate-100 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <WorkflowIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white tracking-tight">Create New Workflow</h2>
              <p className="text-xs text-slate-400">Set a name and initial template for your automation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Workflow Name <span className="text-cyan-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lead Qualification Pipeline, Sync DB to Sheets..."
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-white placeholder-slate-500 transition font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of what this workflow automates..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-slate-300 placeholder-slate-500 transition"
            />
          </div>

          {/* Starter Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">
              Starting Canvas Template
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div
                onClick={() => setStarterType('blank')}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  starterType === 'blank'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  {starterType === 'blank' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Blank Canvas</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Start from scratch with infinite canvas</div>
                </div>
              </div>

              <div
                onClick={() => setStarterType('webhook_ai')}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  starterType === 'webhook_ai'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Webhook className="w-4 h-4 text-purple-400" />
                  {starterType === 'webhook_ai' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Webhook + AI</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Inbound API, Gemini Agent & Slack Alert</div>
                </div>
              </div>

              <div
                onClick={() => setStarterType('schedule_report')}
                className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                  starterType === 'schedule_report'
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  {starterType === 'schedule_report' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-200">Cron Audit</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Scheduled audit with Google Sheets & Telegram</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/25 active:scale-95 transition cursor-pointer"
            >
              <span>Create & Open Canvas</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
