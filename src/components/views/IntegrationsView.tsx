import React from 'react';
import { Blocks, CheckCircle2, ArrowUpRight, Zap, Shield } from 'lucide-react';

interface IntegrationApp {
  id: string;
  name: string;
  category: string;
  description: string;
  iconBg: string;
  iconText: string;
  status: 'connected' | 'available';
  docsUrl?: string;
}

export const IntegrationsView: React.FC = () => {
  const apps: IntegrationApp[] = [
    {
      id: 'gemini',
      name: 'Google Gemini AI',
      category: 'AI Services',
      description: 'Native server-side reasoning, summarization, entity extraction, and classification with Gemini 3.8 Flash.',
      iconBg: 'bg-pink-500/20 text-pink-400',
      iconText: '✦',
      status: 'connected',
    },
    {
      id: 'webhook',
      name: 'HTTP Webhooks',
      category: 'Triggers',
      description: 'Instant public inbound endpoints supporting GET, POST, PUT, and custom signature headers.',
      iconBg: 'bg-cyan-500/20 text-cyan-400',
      iconText: '⚓',
      status: 'connected',
    },
    {
      id: 'telegram',
      name: 'Telegram Bot',
      category: 'Communication',
      description: 'Deliver instant broadcast alerts, notifications, and interactive chat bot responses.',
      iconBg: 'bg-sky-500/20 text-sky-400',
      iconText: '✈',
      status: 'connected',
    },
    {
      id: 'slack',
      name: 'Slack Incoming Webhooks',
      category: 'Communication',
      description: 'Post structured card blocks and direct alerts into team channels.',
      iconBg: 'bg-purple-500/20 text-purple-400',
      iconText: '#',
      status: 'connected',
    },
    {
      id: 'postgres',
      name: 'PostgreSQL Database',
      category: 'Database',
      description: 'Execute parameterized queries, upserts, transactions, and real-time triggers.',
      iconBg: 'bg-blue-500/20 text-blue-400',
      iconText: '🐘',
      status: 'connected',
    },
    {
      id: 'mysql',
      name: 'MySQL Database',
      category: 'Database',
      description: 'Connect transactional MySQL relational stores for read/write workflow logic.',
      iconBg: 'bg-amber-500/20 text-amber-400',
      iconText: '🐬',
      status: 'available',
    },
    {
      id: 'gmail',
      name: 'Gmail & SMTP',
      category: 'Communication',
      description: 'Automate dynamic HTML email dispatches with variable templating and attachments.',
      iconBg: 'bg-rose-500/20 text-rose-400',
      iconText: '✉',
      status: 'connected',
    },
    {
      id: 'github',
      name: 'GitHub API & Webhooks',
      category: 'Developer',
      description: 'Listen to commit pushes, pull requests, issues, and trigger automated builds.',
      iconBg: 'bg-slate-700/40 text-slate-200',
      iconText: '🐙',
      status: 'available',
    },
    {
      id: 'redis',
      name: 'Redis Cache',
      category: 'Database',
      description: 'Sub-millisecond state caching, rate limiting counters, and pub/sub message queues.',
      iconBg: 'bg-red-500/20 text-red-400',
      iconText: '⚡',
      status: 'connected',
    },
    {
      id: 'sheets',
      name: 'Google Sheets',
      category: 'Productivity',
      description: 'Append rows, query sheets, and synchronize customer records automatically.',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      iconText: '▦',
      status: 'available',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Blocks className="w-4 h-4" />
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight">App & Service Integrations</h1>
        </div>
        <p className="text-xs text-slate-400">
          Connect third-party APIs, communication hubs, and databases into your visual nodes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => (
          <div
            key={app.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg border border-white/10 ${app.iconBg}`}
                  >
                    {app.iconText}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{app.name}</h3>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{app.category}</span>
                  </div>
                </div>

                {app.status === 'connected' ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ready</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                    Connectable
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">{app.description}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span className="text-[10px] font-mono">Node SDK Compatible</span>
              <span className="text-cyan-400 font-semibold text-xs flex items-center gap-0.5">
                Active Node
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
