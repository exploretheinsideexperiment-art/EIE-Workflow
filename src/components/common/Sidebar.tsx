import React from 'react';
import {
  Workflow,
  LayoutTemplate,
  Blocks,
  KeyRound,
  History,
  Webhook as WebhookIcon,
  ShieldCheck,
  Settings as SettingsIcon,
  PlusCircle,
  PanelLeftClose
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentView: string;
  workflowCount: number;
  activeWorkflowsCount: number;
  onNavigate: (view: string) => void;
  onCreateWorkflow: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  currentView,
  workflowCount,
  activeWorkflowsCount,
  onNavigate,
  onCreateWorkflow,
}) => {
  const navItems = [
    { id: 'workflows', label: 'Workflows', icon: Workflow, badge: workflowCount },
    { id: 'templates', label: 'Templates', icon: LayoutTemplate, badgeText: 'New' },
    { id: 'integrations', label: 'Integrations', icon: Blocks },
    { id: 'credentials', label: 'Credentials', icon: KeyRound },
    { id: 'executions', label: 'Executions', icon: History, pulse: true },
    { id: 'webhooks', label: 'Webhooks', icon: WebhookIcon },
    { id: 'api-keys', label: 'API Keys', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside
      className={`h-full border-r border-slate-800 bg-[#090d16] flex flex-col justify-between select-none shrink-0 transition-all duration-300 ease-in-out z-40 ${
        isOpen
          ? 'w-64 lg:w-56 p-3 translate-x-0 opacity-100 fixed lg:relative inset-y-0 left-0 top-14 lg:top-0 shadow-2xl lg:shadow-none'
          : 'w-0 -translate-x-full opacity-0 pointer-events-none overflow-hidden p-0 border-r-0 fixed lg:relative'
      }`}
    >
      <div className="space-y-3">
        {/* Top Header with Hide to Left Button */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Navigation
          </span>
          <button
            onClick={onToggle}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition cursor-pointer text-xs"
            title="Hide menu to left"
            aria-label="Hide menu to left"
          >
            <span className="text-[10px] font-mono font-medium">Hide</span>
            <PanelLeftClose className="w-4 h-4 text-cyan-400" />
          </button>
        </div>

        {/* Create Workflow Button */}
        <button
          onClick={() => {
            onCreateWorkflow();
            if (window.innerWidth < 1024) onToggle();
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 stroke-[2.5]" />
          <span>New Workflow</span>
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  if (window.innerWidth < 1024) onToggle();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {item.badge}
                  </span>
                )}

                {item.badgeText && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-950 text-pink-400 border border-pink-800 font-bold">
                    {item.badgeText}
                  </span>
                )}

                {item.pulse && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Engine Health Status */}
      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-300">Engine Active</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400">{activeWorkflowsCount} Live</span>
        </div>
        <p className="text-[10px] text-slate-500 leading-tight">
          Webhook listeners and execution queue ready.
        </p>
      </div>
    </aside>
  );
};
