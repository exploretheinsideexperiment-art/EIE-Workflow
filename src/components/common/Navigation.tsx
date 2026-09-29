import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Search,
  Bell,
  ChevronDown,
  User as UserIcon,
  LogOut,
  FolderGit2,
  Workflow as WorkflowIcon,
  Key,
  Webhook,
  Activity,
  Upload,
  Camera,
  Check,
  ShieldCheck,
  ExternalLink,
  Laptop,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { User, Workspace } from '../../types/workflow';
import { PWAInstallButton } from './PWAInstallButton';
import { compressImageForAvatar } from '../../utils/imageUtils';

interface NavigationProps {
  currentView: string;
  activeWorkflowName?: string;
  user: User | null;
  workspace: Workspace | null;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onNavigate: (view: string) => void;
  onRenameWorkflow?: (newName: string) => void;
  onOpenGlobalSearch: () => void;
  onLogout: () => void;
  onUpdateUser?: (updated: User) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView,
  activeWorkflowName,
  user,
  workspace,
  isSidebarOpen = true,
  onToggleSidebar,
  onNavigate,
  onRenameWorkflow,
  onOpenGlobalSearch,
  onLogout,
  onUpdateUser,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Handle uploading custom photo
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const dataUrl = await compressImageForAvatar(file, 256, 0.88);

      // Optimistic update
      if (user && onUpdateUser) {
        onUpdateUser({ ...user, avatar: dataUrl });
      }

      const res = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user && onUpdateUser) {
          onUpdateUser(data.user);
        }
      }
      setUploadSuccess(true);
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update avatar:', err);
    } finally {
      setIsUploading(false);
      if (event.target) event.target.value = '';
    }
  };

  // Preset avatar switch
  const handleSelectPreset = async (presetUrl: string) => {
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: presetUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user && onUpdateUser) {
          onUpdateUser(data.user);
        }
      }
    } catch (err) {
      console.error('Failed to select preset:', err);
    }
  };

  const currentAvatar = user?.avatar || '/avatar.svg';

  return (
    <header className="h-14 border-b border-slate-800 bg-[#090d16] px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Left: Brand Identity & Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Sidebar Toggle Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Hide sidebar menu to left' : 'Show sidebar menu'}
            title={isSidebarOpen ? 'Hide menu to left' : 'Show menu'}
            className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
              isSidebarOpen
                ? 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 hover:bg-slate-800/80'
                : 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 shadow-sm shadow-cyan-500/20 hover:bg-cyan-500/25'
            }`}
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-slate-300 hover:text-cyan-400" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        )}

        <div
          onClick={() => onNavigate('workflows')}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Go to workflows"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20 group-hover:scale-105 transition">
            <Layers className="w-4 h-4 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-cyan-400 transition font-sans">
                EIE-WORKFLOW
              </span>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-mono border border-cyan-800 font-bold">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono tracking-tight leading-none hidden sm:block">
              Connect. Automate. Simplify.
            </p>
          </div>
        </div>

        {/* Workflow Title in Editor View */}
        {currentView === 'editor' && activeWorkflowName && (
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
            <WorkflowIcon className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={activeWorkflowName}
              onChange={(e) => onRenameWorkflow?.(e.target.value)}
              className="text-xs font-semibold text-slate-200 bg-transparent hover:bg-slate-800/50 focus:bg-slate-900 border border-transparent hover:border-slate-700 focus:border-cyan-500 px-2 py-1 rounded-lg focus:outline-none transition max-w-[280px] truncate"
              title="Click to rename workflow"
            />
          </div>
        )}
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <button
          onClick={onOpenGlobalSearch}
          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 hover:border-slate-700 hover:text-slate-300 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>Search workflows, nodes, executions...</span>
          </div>
          <kbd className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Actions, PWA Button & User Avatar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Workspace Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
          <FolderGit2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium truncate max-w-[130px]">{workspace?.name || 'Personal Lab'}</span>
        </div>

        {/* Active User Profile Menu with Interactive Toggle */}
        <div className="relative" ref={menuRef}>
          {/* Composite Button: Avatar + Down Arrow Button */}
          <div
            className={`flex items-center gap-1.5 p-1 pl-1.5 rounded-2xl border transition-all duration-200 ${
              isMenuOpen
                ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
            }`}
          >
            {/* Avatar Button */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="User profile picture and menu"
              aria-expanded={isMenuOpen}
              className="relative flex items-center focus:outline-none group cursor-pointer"
            >
              <div className="relative">
                <img
                  src={currentAvatar}
                  alt={user?.name || 'User Profile'}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to local avatar.png or svg if error
                    (e.target as HTMLImageElement).src = '/avatar.svg';
                  }}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-md shadow-cyan-500/20 group-hover:ring-cyan-400 group-hover:scale-105 transition duration-150"
                />
                {/* Glowing Online Status Indicator Dot */}
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090d16]" />
              </div>
            </button>

            {/* Active Down Arrow Button */}
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Toggle user menu"
              aria-expanded={isMenuOpen}
              title={isMenuOpen ? 'Close profile menu' : 'Open profile menu'}
              className={`p-1 rounded-lg transition-all duration-200 cursor-pointer ${
                isMenuOpen
                  ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-500/40'
                  : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
              }`}
            >
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ease-out ${
                  isMenuOpen ? 'rotate-180 text-cyan-400' : 'text-slate-400'
                }`}
              />
            </button>
          </div>

          {/* Interactive Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0b101d] border border-slate-800 shadow-2xl p-2 text-xs text-slate-200 animate-in fade-in-50 zoom-in-95 duration-150 z-50 divide-y divide-slate-800/80">
              {/* Profile Card Header */}
              <div className="p-2.5 pb-3">
                <div className="flex items-start gap-3">
                  <div className="relative group shrink-0">
                    <img
                      src={currentAvatar}
                      alt={user?.name || 'User'}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/avatar.svg';
                      }}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-cyan-500/60 shadow-md"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload new picture"
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-400 transition"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-white text-sm truncate">
                        {user?.name || 'EIE Automation Engineer'}
                      </p>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60 font-mono font-bold">
                        PRO
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate font-mono">
                      {user?.email || 'exploretheinsideexperiment@gmail.com'}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Automation Engine Active</span>
                    </div>
                  </div>
                </div>

                {/* Picture Upload / Change Action */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition text-[11px] font-semibold cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'Uploading...' : 'Upload Photo'}</span>
                    </button>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSelectPreset('/avatar.svg')}
                        title="Cybernetic Core Avatar"
                        className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition hover:scale-105"
                      >
                        <img src="/avatar.svg" alt="Cyber Core" className="w-full h-full object-cover" />
                      </button>
                      <button
                        onClick={() => handleSelectPreset('/avatar.png')}
                        title="Tech Portrait Avatar"
                        className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition hover:scale-105"
                      >
                        <img src="/avatar.png" alt="Tech Lead" className="w-full h-full object-cover" />
                      </button>
                    </div>
                  </div>

                  {uploadSuccess && (
                    <p className="mt-1.5 text-[10px] text-emerald-400 flex items-center gap-1 justify-center">
                      <Check className="w-3 h-3" /> Profile picture updated!
                    </p>
                  )}
                </div>
              </div>

              {/* Workspace Quota Status */}
              <div className="p-2.5 bg-slate-950/40">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-medium text-slate-300">{workspace?.name || 'Personal Hub'}</span>
                  <span className="text-cyan-400 font-mono">4,820 / 10k runs</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full w-[48%]" />
                </div>
              </div>

              {/* Navigation Menu Links */}
              <div className="p-1 space-y-0.5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-left"
                >
                  <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
                  <div className="flex-1">
                    <p className="font-medium">Account & Preferences</p>
                    <p className="text-[10px] text-slate-500">Profile, workspace & notifications</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('api-keys');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-left"
                >
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <div className="flex-1">
                    <p className="font-medium">API Keys & Tokens</p>
                    <p className="text-[10px] text-slate-500">Programmatic access credentials</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('webhooks');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-left"
                >
                  <Webhook className="w-3.5 h-3.5 text-emerald-400" />
                  <div className="flex-1">
                    <p className="font-medium">Webhooks Manager</p>
                    <p className="text-[10px] text-slate-500">Inbound trigger URLs & tests</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNavigate('executions');
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer text-left"
                >
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  <div className="flex-1">
                    <p className="font-medium">Execution Logs</p>
                    <p className="text-[10px] text-slate-500">Live runs, history & debug stats</p>
                  </div>
                </button>
              </div>

              {/* Logout Footer */}
              <div className="p-1">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 transition cursor-pointer text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
