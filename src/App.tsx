/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PanelLeftOpen } from 'lucide-react';
import {
  Workflow,
  Credential,
  Execution,
  Webhook,
  ApiKey,
  User,
  Workspace
} from './types/workflow';
import { WorkflowTemplate, WORKFLOW_TEMPLATES } from './constants/templates';
import { Navigation } from './components/common/Navigation';
import { Sidebar } from './components/common/Sidebar';
import { WorkflowCanvas } from './components/canvas/WorkflowCanvas';
import { WorkflowsListView } from './components/views/WorkflowsListView';
import { TemplatesView } from './components/views/TemplatesView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { CredentialsView } from './components/views/CredentialsView';
import { ExecutionsView } from './components/views/ExecutionsView';
import { WebhooksView } from './components/views/WebhooksView';
import { ApiKeysView } from './components/views/ApiKeysView';
import { SettingsView } from './components/views/SettingsView';
import { LandingView } from './components/views/LandingView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

const DEFAULT_USER: User = {
  id: 'usr_explore',
  email: 'exploretheinsideexperiment@gmail.com',
  name: 'Explore The Inside Experiment',
};

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_explore',
  name: 'EIE Automation Hub',
  ownerId: 'usr_explore',
  membersCount: 1,
  plan: 'pro',
};

const getDefaultWorkflows = (): Workflow[] => {
  return WORKFLOW_TEMPLATES.map((tpl, idx) => ({
    id: `wf_${tpl.id}`,
    name: tpl.workflow.name,
    description: tpl.workflow.description,
    active: tpl.workflow.active,
    nodes: tpl.workflow.nodes,
    connections: tpl.workflow.connections,
    viewport: tpl.workflow.viewport,
    workspaceId: 'ws_explore',
    createdAt: new Date(Date.now() - idx * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    executionCount: 18 + idx * 7,
    lastExecutedAt: new Date(Date.now() - idx * 3600000).toISOString(),
  }));
};

const DEFAULT_CREDENTIALS: Credential[] = [
  { id: 'c1', workspaceId: 'ws_explore', name: 'OpenAI Production Key', type: 'openai', data: { apiKey: 'sk-demo...' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c2', workspaceId: 'ws_explore', name: 'Gemini Pro 1.5 API Key', type: 'gemini', data: { apiKey: 'AIzaDemo...' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c3', workspaceId: 'ws_explore', name: 'Slack Bot Workspace Token', type: 'slack', data: { botToken: 'xoxb-demo...' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'c4', workspaceId: 'ws_explore', name: 'Discord Webhook Connector', type: 'discord', data: { webhookUrl: 'https://discord.com/api/webhooks/...' }, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const DEFAULT_EXECUTIONS: Execution[] = [
  {
    id: 'exec_101',
    workflowId: 'wf_tpl_webhook_ai_email',
    workflowName: 'Webhook → AI Agent → Smart Email Alert',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 15 + 1140).toISOString(),
    durationMs: 1140,
    triggerType: 'webhook',
    nodeResults: {
      n_wh: {
        nodeId: 'n_wh',
        nodeName: 'Customer Inbound Webhook',
        nodeType: 'trigger_webhook',
        status: 'success',
        durationMs: 45,
        output: { leadName: 'Elena Vance' },
      },
      n_ai: {
        nodeId: 'n_ai',
        nodeName: 'Gemini AI Lead Scorer',
        nodeType: 'ai_agent',
        status: 'success',
        durationMs: 720,
        output: { leadScore: 94, urgencyLevel: 'Critical' },
      },
    },
    logs: [
      { timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), level: 'info', message: 'Webhook payload received.' },
      { timestamp: new Date(Date.now() - 1000 * 60 * 15 + 720).toISOString(), level: 'info', message: 'Gemini model scored lead successfully.' },
    ],
  },
  {
    id: 'exec_102',
    workflowId: 'wf_tpl_webhook_ai_email',
    workflowName: 'Webhook → AI Agent → Smart Email Alert',
    status: 'success',
    startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    finishedAt: new Date(Date.now() - 1000 * 60 * 60 + 980).toISOString(),
    durationMs: 980,
    triggerType: 'manual',
    nodeResults: {},
    logs: [],
  },
];

const DEFAULT_WEBHOOKS: Webhook[] = [
  {
    id: 'wh_inbound_lead',
    workflowId: 'wf_tpl_webhook_ai_email',
    nodeId: 'n_wh',
    name: 'Customer Inbound Lead Listener',
    path: 'inbound_lead',
    method: 'POST',
    callCount: 47,
    lastCalledAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
];

const DEFAULT_API_KEYS: ApiKey[] = [
  {
    id: 'key_prod_01',
    workspaceId: 'ws_explore',
    name: 'Default Automation Client Key',
    keyPrefix: 'eie_live_948a',
    secretKey: 'eie_live_948af038c8b1a37c9e01',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Data collections
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Navigation State
  const [currentView, setCurrentView] = useState<string>('workflows');
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('eie_sidebar_open');
      if (saved !== null) {
        return saved === 'true';
      }
      return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    } catch {
      return true;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('eie_sidebar_open', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Check initial authentication
  useEffect(() => {
    async function initAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setWorkspace(data.workspace);
          setIsLoadingAuth(false);
          return;
        }
      } catch (err) {
        console.warn('[EIE] Server auth check failed, activating client-side offline mode:', err);
      }

      // Fallback for static hosting (GitHub Pages) or offline mode
      try {
        const storedUser = localStorage.getItem('eie_user');
        const storedWs = localStorage.getItem('eie_workspace');
        if (storedUser && storedWs) {
          setUser(JSON.parse(storedUser));
          setWorkspace(JSON.parse(storedWs));
        } else {
          setUser(DEFAULT_USER);
          setWorkspace(DEFAULT_WORKSPACE);
          localStorage.setItem('eie_user', JSON.stringify(DEFAULT_USER));
          localStorage.setItem('eie_workspace', JSON.stringify(DEFAULT_WORKSPACE));
        }
      } catch {
        setUser(DEFAULT_USER);
        setWorkspace(DEFAULT_WORKSPACE);
      }
      setIsLoadingAuth(false);
    }
    initAuth();
  }, []);

  // Fetch application data
  const refreshAllData = async () => {
    try {
      const [wfRes, credRes, execRes, whRes, keyRes] = await Promise.all([
        fetch('/api/workflows').catch(() => null),
        fetch('/api/credentials').catch(() => null),
        fetch('/api/executions').catch(() => null),
        fetch('/api/webhooks').catch(() => null),
        fetch('/api/api-keys').catch(() => null),
      ]);

      if (wfRes && wfRes.ok) {
        const data = await wfRes.json();
        setWorkflows(data);
        try { localStorage.setItem('eie_workflows', JSON.stringify(data)); } catch {}
      } else {
        const localWfs = localStorage.getItem('eie_workflows');
        if (localWfs) {
          setWorkflows(JSON.parse(localWfs));
        } else {
          const defaults = getDefaultWorkflows();
          setWorkflows(defaults);
          try { localStorage.setItem('eie_workflows', JSON.stringify(defaults)); } catch {}
        }
      }

      if (credRes && credRes.ok) {
        setCredentials(await credRes.json());
      } else {
        const localCreds = localStorage.getItem('eie_credentials');
        setCredentials(localCreds ? JSON.parse(localCreds) : DEFAULT_CREDENTIALS);
      }

      if (execRes && execRes.ok) {
        setExecutions(await execRes.json());
      } else {
        const localExecs = localStorage.getItem('eie_executions');
        setExecutions(localExecs ? JSON.parse(localExecs) : DEFAULT_EXECUTIONS);
      }

      if (whRes && whRes.ok) {
        setWebhooks(await whRes.json());
      } else {
        const localWhs = localStorage.getItem('eie_webhooks');
        setWebhooks(localWhs ? JSON.parse(localWhs) : DEFAULT_WEBHOOKS);
      }

      if (keyRes && keyRes.ok) {
        setApiKeys(await keyRes.json());
      } else {
        const localKeys = localStorage.getItem('eie_api_keys');
        setApiKeys(localKeys ? JSON.parse(localKeys) : DEFAULT_API_KEYS);
      }
    } catch (err) {
      console.warn('[EIE] Failed to fetch server data, loaded local state:', err);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAllData();
    }
  }, [user]);

  // Global Keyboard Shortcuts (Ctrl+K for search, Ctrl+B for sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- ACTIONS ---
  const handleCreateNewWorkflow = async () => {
    const fallbackNewWf: Workflow = {
      id: `wf_${Date.now()}`,
      name: 'Untitled Automation Workflow',
      description: 'Visually connects APIs, triggers, AI models, and communication channels.',
      active: false,
      nodes: [],
      connections: [],
      viewport: { x: 120, y: 120, zoom: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      workspaceId: workspace?.id || 'ws_explore',
    };

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackNewWf),
      });

      if (res.ok) {
        const newWf = await res.json();
        setWorkflows((prev) => [newWf, ...prev]);
        setActiveWorkflowId(newWf.id);
        setCurrentView('editor');
        return;
      }
    } catch {
      // Local fallback
    }

    setWorkflows((prev) => {
      const updated = [fallbackNewWf, ...prev];
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setActiveWorkflowId(fallbackNewWf.id);
    setCurrentView('editor');
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    const fallbackNewWf: Workflow = {
      id: `wf_${Date.now()}`,
      name: template.workflow.name,
      description: template.workflow.description,
      active: template.workflow.active,
      nodes: template.workflow.nodes,
      connections: template.workflow.connections,
      viewport: template.workflow.viewport,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      workspaceId: workspace?.id || 'ws_explore',
    };

    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackNewWf),
      });

      if (res.ok) {
        const newWf = await res.json();
        setWorkflows((prev) => [newWf, ...prev]);
        setActiveWorkflowId(newWf.id);
        setCurrentView('editor');
        return;
      }
    } catch {
      // Local fallback
    }

    setWorkflows((prev) => {
      const updated = [fallbackNewWf, ...prev];
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setActiveWorkflowId(fallbackNewWf.id);
    setCurrentView('editor');
  };

  const handleSaveWorkflow = async (updatedWf: Workflow) => {
    setWorkflows((prev) => {
      const updated = prev.map((w) => (w.id === updatedWf.id ? updatedWf : w));
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });

    try {
      await fetch(`/api/workflows/${updatedWf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWf),
      });
    } catch {
      // Offline fallback already updated state
    }
  };

  const handleToggleActive = async (wfId: string) => {
    setWorkflows((prev) => {
      const updated = prev.map((w) => (w.id === wfId ? { ...w, active: !w.active } : w));
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });

    try {
      await fetch(`/api/workflows/${wfId}/toggle`, { method: 'POST' });
    } catch {
      // Handled locally
    }
  };

  const handleDuplicateWorkflow = async (wfId: string) => {
    const target = workflows.find((w) => w.id === wfId);
    if (!target) return;

    const dup: Workflow = {
      ...target,
      id: `wf_${Date.now()}`,
      name: `${target.name} (Copy)`,
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
    };

    setWorkflows((prev) => {
      const updated = [dup, ...prev];
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });

    try {
      await fetch(`/api/workflows/${wfId}/duplicate`, { method: 'POST' });
    } catch {
      // Handled locally
    }
  };

  const handleDeleteWorkflow = async (wfId: string) => {
    setWorkflows((prev) => {
      const updated = prev.filter((w) => w.id !== wfId);
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (activeWorkflowId === wfId) {
      setActiveWorkflowId(null);
      setCurrentView('workflows');
    }

    try {
      await fetch(`/api/workflows/${wfId}`, { method: 'DELETE' });
    } catch {
      // Handled locally
    }
  };

  const handleImportWorkflow = async (importedWf: any) => {
    const newWf: Workflow = {
      id: `wf_${Date.now()}`,
      name: importedWf.name ? `${importedWf.name} (Imported)` : 'Imported Workflow',
      description: importedWf.description || '',
      active: false,
      nodes: importedWf.nodes || [],
      connections: importedWf.connections || [],
      viewport: importedWf.viewport || { x: 120, y: 120, zoom: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      executionCount: 0,
      workspaceId: workspace?.id || 'ws_explore',
    };

    setWorkflows((prev) => {
      const updated = [newWf, ...prev];
      try { localStorage.setItem('eie_workflows', JSON.stringify(updated)); } catch {}
      return updated;
    });
    setActiveWorkflowId(newWf.id);
    setCurrentView('editor');

    try {
      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWf),
      });
    } catch {
      // Handled locally
    }
  };

  const handleAddCredential = async (credData: { name: string; type: string; data: Record<string, string> }) => {
    const res = await fetch('/api/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credData),
    });
    const newCred = await res.json();
    setCredentials((prev) => [...prev, newCred]);
  };

  const handleDeleteCredential = async (id: string) => {
    await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    setCredentials((prev) => prev.filter((c) => c.id !== id));
  };

  const handleCreateApiKey = async (name: string) => {
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const newKey = await res.json();
    setApiKeys((prev) => [newKey, ...prev]);
    return newKey;
  };

  const handleDeleteApiKey = async (id: string) => {
    await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleUpdateProfile = async (name: string, email: string) => {
    if (user) {
      const updated = { ...user, name, email };
      setUser(updated);
      try { localStorage.setItem('eie_user', JSON.stringify(updated)); } catch {}
      try {
        await fetch('/api/user/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email }),
        });
      } catch (err) {
        console.error('Failed to save profile changes:', err);
      }
    }
  };

  const handleUpdateAvatar = (avatar: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, avatar };
      try { localStorage.setItem('eie_user', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const handleRenameActiveWorkflow = (newName: string) => {
    if (!activeWorkflowId) return;
    setWorkflows((prev) =>
      prev.map((w) => (w.id === activeWorkflowId ? { ...w, name: newName } : w))
    );
  };

  // If still checking authentication, show clean loader
  if (isLoadingAuth) {
    return (
      <div className="h-screen w-screen bg-[#070b14] flex items-center justify-center text-cyan-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest uppercase">Initializing EIE-Workflow</span>
        </div>
      </div>
    );
  }

  // If user is not logged in, show landing page
  if (!user) {
    return (
      <LandingView
        onLoginSuccess={(loggedUser, loggedWorkspace) => {
          setUser(loggedUser);
          setWorkspace(loggedWorkspace);
        }}
      />
    );
  }

  const activeWorkflow = workflows.find((w) => w.id === activeWorkflowId) || workflows[0] || null;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <Navigation
        currentView={currentView}
        activeWorkflowName={activeWorkflow?.name}
        user={user}
        workspace={workspace}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
        onNavigate={(view) => setCurrentView(view)}
        onRenameWorkflow={handleRenameActiveWorkflow}
        onOpenGlobalSearch={() => setSearchModalOpen(true)}
        onLogout={() => setUser(null)}
        onUpdateUser={(updated) => setUser(updated)}
      />

      {/* Main Area: Sidebar + Active View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile backdrop for drawer */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 top-14 bg-black/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
            onClick={toggleSidebar}
            aria-hidden="true"
          />
        )}

        {/* Left Navigation Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          currentView={currentView}
          workflowCount={workflows.length}
          activeWorkflowsCount={workflows.filter((w) => w.active).length}
          onNavigate={(view) => setCurrentView(view)}
          onCreateWorkflow={handleCreateNewWorkflow}
        />

        {/* View Switcher */}
        <main className="flex-1 flex flex-col relative overflow-hidden bg-[#070b14]">
          {/* Quick toggle button when sidebar is collapsed/hidden in non-editor views */}
          {!isSidebarOpen && currentView !== 'editor' && (
            <button
              onClick={toggleSidebar}
              aria-label="Show navigation menu"
              title="Show menu (Sidebar)"
              className="absolute left-3 top-3 z-20 flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-300 shadow-xl shadow-black/60 text-xs font-medium transition cursor-pointer backdrop-blur-md group animate-in fade-in duration-200"
            >
              <PanelLeftOpen className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-mono tracking-wide">Menu</span>
            </button>
          )}

          {currentView === 'editor' && activeWorkflow && (
            <WorkflowCanvas
              key={activeWorkflow.id}
              workflow={activeWorkflow}
              credentials={credentials}
              isSidebarOpen={isSidebarOpen}
              onToggleSidebar={toggleSidebar}
              onSave={handleSaveWorkflow}
              onToggleActive={() => handleToggleActive(activeWorkflow.id)}
            />
          )}

          {currentView === 'workflows' && (
            <WorkflowsListView
              workflows={workflows}
              onOpenWorkflow={(wfId) => {
                setActiveWorkflowId(wfId);
                setCurrentView('editor');
              }}
              onCreateWorkflow={handleCreateNewWorkflow}
              onOpenTemplates={() => setCurrentView('templates')}
              onToggleActive={handleToggleActive}
              onDuplicateWorkflow={handleDuplicateWorkflow}
              onDeleteWorkflow={handleDeleteWorkflow}
              onImportWorkflow={handleImportWorkflow}
            />
          )}

          {currentView === 'templates' && (
            <TemplatesView onUseTemplate={handleUseTemplate} />
          )}

          {currentView === 'integrations' && (
            <IntegrationsView />
          )}

          {currentView === 'credentials' && (
            <CredentialsView
              credentials={credentials}
              onAddCredential={handleAddCredential}
              onDeleteCredential={handleDeleteCredential}
            />
          )}

          {currentView === 'executions' && (
            <ExecutionsView
              executions={executions}
              onOpenWorkflow={(wfId) => {
                setActiveWorkflowId(wfId);
                setCurrentView('editor');
              }}
            />
          )}

          {currentView === 'webhooks' && (
            <WebhooksView
              webhooks={webhooks}
              workflows={workflows}
              onOpenWorkflow={(wfId) => {
                setActiveWorkflowId(wfId);
                setCurrentView('editor');
              }}
            />
          )}

          {currentView === 'api-keys' && (
            <ApiKeysView
              apiKeys={apiKeys}
              onCreateKey={handleCreateApiKey}
              onDeleteKey={handleDeleteApiKey}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              user={user}
              workspace={workspace}
              onUpdateProfile={handleUpdateProfile}
              onUpdateAvatar={handleUpdateAvatar}
            />
          )}
        </main>
      </div>

      {/* Global Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        workflows={workflows}
        credentials={credentials}
        executions={executions}
        onSelectWorkflow={(id) => {
          setActiveWorkflowId(id);
          setCurrentView('editor');
        }}
        onNavigate={(view) => setCurrentView(view)}
      />

      {/* PWA Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
}
