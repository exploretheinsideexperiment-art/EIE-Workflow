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
import { WorkflowTemplate } from './constants/templates';
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
        }
      } catch (err) {
        console.warn('[EIE] Auth check failed or offline:', err);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    initAuth();
  }, []);

  // Fetch application data
  const refreshAllData = async () => {
    try {
      const [wfRes, credRes, execRes, whRes, keyRes] = await Promise.all([
        fetch('/api/workflows'),
        fetch('/api/credentials'),
        fetch('/api/executions'),
        fetch('/api/webhooks'),
        fetch('/api/api-keys'),
      ]);

      if (wfRes.ok) setWorkflows(await wfRes.json());
      if (credRes.ok) setCredentials(await credRes.json());
      if (execRes.ok) setExecutions(await execRes.json());
      if (whRes.ok) setWebhooks(await whRes.json());
      if (keyRes.ok) setApiKeys(await keyRes.json());
    } catch (err) {
      console.error('[EIE] Failed to fetch data:', err);
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
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled Automation Workflow',
          description: 'Visually connects APIs, triggers, AI models, and communication channels.',
          nodes: [],
          connections: [],
          viewport: { x: 120, y: 120, zoom: 1 },
        }),
      });

      const newWf = await res.json();
      setWorkflows((prev) => [newWf, ...prev]);
      setActiveWorkflowId(newWf.id);
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to create workflow:', err);
    }
  };

  const handleUseTemplate = async (template: WorkflowTemplate) => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.workflow.name,
          description: template.workflow.description,
          nodes: template.workflow.nodes,
          connections: template.workflow.connections,
          viewport: template.workflow.viewport,
        }),
      });

      const newWf = await res.json();
      setWorkflows((prev) => [newWf, ...prev]);
      setActiveWorkflowId(newWf.id);
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to instantiate template:', err);
    }
  };

  const handleSaveWorkflow = async (updatedWf: Workflow) => {
    try {
      const res = await fetch(`/api/workflows/${updatedWf.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWf),
      });
      const saved = await res.json();
      setWorkflows((prev) => prev.map((w) => (w.id === saved.id ? saved : w)));
    } catch (err) {
      console.error('Failed to save workflow:', err);
    }
  };

  const handleToggleActive = async (wfId: string) => {
    try {
      const res = await fetch(`/api/workflows/${wfId}/toggle`, { method: 'POST' });
      const data = await res.json();
      setWorkflows((prev) =>
        prev.map((w) => (w.id === wfId ? { ...w, active: data.active } : w))
      );
    } catch (err) {
      console.error('Failed to toggle workflow:', err);
    }
  };

  const handleDuplicateWorkflow = async (wfId: string) => {
    try {
      const res = await fetch(`/api/workflows/${wfId}/duplicate`, { method: 'POST' });
      const dup = await res.json();
      setWorkflows((prev) => [dup, ...prev]);
    } catch (err) {
      console.error('Failed to duplicate workflow:', err);
    }
  };

  const handleDeleteWorkflow = async (wfId: string) => {
    try {
      await fetch(`/api/workflows/${wfId}`, { method: 'DELETE' });
      setWorkflows((prev) => prev.filter((w) => w.id !== wfId));
      if (activeWorkflowId === wfId) {
        setActiveWorkflowId(null);
        setCurrentView('workflows');
      }
    } catch (err) {
      console.error('Failed to delete workflow:', err);
    }
  };

  const handleImportWorkflow = async (importedWf: any) => {
    try {
      const res = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: importedWf.name ? `${importedWf.name} (Imported)` : 'Imported Workflow',
          description: importedWf.description || '',
          nodes: importedWf.nodes || [],
          connections: importedWf.connections || [],
          viewport: importedWf.viewport || { x: 120, y: 120, zoom: 1 },
        }),
      });
      const newWf = await res.json();
      setWorkflows((prev) => [newWf, ...prev]);
      setActiveWorkflowId(newWf.id);
      setCurrentView('editor');
    } catch (err) {
      console.error('Failed to import workflow:', err);
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
          {/* Quick toggle button when sidebar is collapsed/hidden */}
          {!isSidebarOpen && (
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
              onUpdateAvatar={(avatar) => setUser((prev) => (prev ? { ...prev, avatar } : null))}
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
