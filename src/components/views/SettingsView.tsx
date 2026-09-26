import React, { useState, useRef } from 'react';
import { Settings, User, Building, Shield, Bell, Check, Key, Camera, Upload } from 'lucide-react';
import { User as UserType, Workspace } from '../../types/workflow';

interface SettingsViewProps {
  user: UserType | null;
  workspace: Workspace | null;
  onUpdateProfile: (name: string, email: string) => void;
  onUpdateAvatar?: (avatar: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, workspace, onUpdateProfile, onUpdateAvatar }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'workspace' | 'security' | 'notifications'>('account');
  const [name, setName] = useState(user?.name || 'Automation Engineer');
  const [email, setEmail] = useState(user?.email || 'admin@eie-workflow.com');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [failureAlerts, setFailureAlerts] = useState(true);
  const [savedNotice, setSavedNotice] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/user/avatar', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: dataUrl }),
        });
        if (res.ok) {
          onUpdateAvatar?.(dataUrl);
        }
      } catch (err) {
        console.error('Failed to update avatar:', err);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = async (presetUrl: string) => {
    try {
      const res = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: presetUrl }),
      });
      if (res.ok) {
        onUpdateAvatar?.(presetUrl);
      }
    } catch (err) {
      console.error('Failed to select preset:', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(name, email);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Settings className="w-4 h-4" />
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Platform Settings</h1>
        </div>
        <p className="text-xs text-slate-400">Configure account preferences, workspace governance, and security</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 text-xs gap-4">
        <button
          onClick={() => setActiveTab('account')}
          className={`py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'account' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>Account Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('workspace')}
          className={`py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'workspace' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Workspace</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'security' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Security & Sessions</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`py-2 font-medium border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'notifications' ? 'border-cyan-400 text-cyan-300 font-bold' : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications</span>
        </button>
      </div>

      {/* Content */}
      <div className="max-w-2xl bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-xs">
        {activeTab === 'account' && (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar & Photo Section */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="relative group">
                  <img
                    src={user?.avatar || '/avatar.svg'}
                    alt={user?.name || 'User Profile'}
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/avatar.svg';
                    }}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-cyan-500/50 shadow-md shadow-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Upload profile picture"
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-cyan-300 transition cursor-pointer"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Profile Picture</h4>
                  <p className="text-[11px] text-slate-400">Displayed in top navigation & collaborative runs</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Presets:</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('/avatar.svg')}
                      title="Cybernetic Core"
                      className="w-5 h-5 rounded-full overflow-hidden border border-slate-700 hover:border-cyan-400 transition"
                    >
                      <img src="/avatar.svg" alt="Cyber" className="w-full h-full object-cover" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('/avatar.png')}
                      title="Tech Lead"
                      className="w-5 h-5 rounded-full overflow-hidden border border-slate-700 hover:border-cyan-400 transition"
                    >
                      <img src="/avatar.png" alt="Tech" className="w-full h-full object-cover" />
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition text-xs font-semibold cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              {savedNotice ? (
                <span className="text-emerald-400 flex items-center gap-1 font-semibold text-xs">
                  <Check className="w-3.5 h-3.5" /> Changes saved successfully!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
              >
                Save Preferences
              </button>
            </div>
          </form>
        )}

        {activeTab === 'workspace' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Workspace Name</label>
              <input
                type="text"
                readOnly
                value={workspace?.name || 'Personal Automation Hub'}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">Current Plan</label>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white uppercase text-xs tracking-wider">
                    {workspace?.plan || 'PRO'} PLAN
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unlimited visual workflows & webhook triggers</p>
                </div>
                <span className="text-cyan-400 font-mono text-[10px] bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  Active
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Two-Factor Authentication (2FA)</span>
                <span className="text-[10px] text-slate-400">Enforce TOTP authenticator prompt upon login</span>
              </div>
              <input
                type="checkbox"
                checked={twoFactorEnabled}
                onChange={(e) => setTwoFactorEnabled(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="font-bold text-white block">Current Session</span>
              <p className="text-[10px] text-slate-400 font-mono">
                IP: 127.0.0.1 • Browser: Chrome / Safari (PWA Enabled) • Status: Active
              </p>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Workflow Failure Alerts</span>
                <span className="text-[10px] text-slate-400">Receive alerts if any step encounters a fatal error</span>
              </div>
              <input
                type="checkbox"
                checked={failureAlerts}
                onChange={(e) => setFailureAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="font-bold text-white block">Daily Execution Digests</span>
                <span className="text-[10px] text-slate-400">Summaries of total events processed</span>
              </div>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
