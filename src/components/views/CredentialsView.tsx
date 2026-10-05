import React, { useState } from 'react';
import { KeyRound, Plus, Trash2, Shield, Lock, CheckCircle2, X } from 'lucide-react';
import { Credential } from '../../types/workflow';

interface CredentialsViewProps {
  credentials: Credential[];
  onAddCredential: (cred: { id?: string; name: string; type: string; data: Record<string, string> }) => Promise<any>;
  onDeleteCredential: (id: string) => Promise<void>;
}

export const CredentialsView: React.FC<CredentialsViewProps> = ({
  credentials,
  onAddCredential,
  onDeleteCredential,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [credName, setCredName] = useState('');
  const [credType, setCredType] = useState('telegram');
  const [secretVal, setSecretVal] = useState('');
  const [hostVal, setHostVal] = useState('');
  const [extraVal, setExtraVal] = useState('');
  const [userVal, setUserVal] = useState('');
  const [portVal, setPortVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let name = credName.trim();
    if (!name) {
      const defaultNames: Record<string, string> = {
        telegram: 'Telegram Bot Account',
        openai: 'OpenAI Production Key',
        gemini: 'Google Gemini Pro Key',
        anthropic: 'Claude Sonnet Key',
        slack: 'Slack Workspace Connection',
        discord: 'Discord Webhook Connection',
        postgres: 'PostgreSQL Database',
        mysql: 'MySQL Database',
        github: 'GitHub Personal Token',
        google_sheets: 'Google Sheets Account',
        custom_api: 'Custom REST API Key',
      };
      name = defaultNames[credType] || `${credType.toUpperCase()} Credential`;
    }

    if (!secretVal.trim()) {
      setFormError('Please enter the secret token / API key / password');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const data: Record<string, string> = {
        apiKey: secretVal.trim(),
        token: secretVal.trim(),
        botToken: secretVal.trim(),
        webhookUrl: secretVal.trim(),
        secret: secretVal.trim(),
      };

      if (credType === 'telegram') {
        data.botToken = secretVal.trim();
        if (extraVal.trim()) data.chatId = extraVal.trim();
      } else if (credType === 'slack') {
        data.webhookUrl = secretVal.trim();
        data.botToken = secretVal.trim();
        if (extraVal.trim()) data.channel = extraVal.trim();
      } else if (credType === 'discord') {
        data.webhookUrl = secretVal.trim();
      } else if (credType === 'postgres' || credType === 'mysql') {
        data.password = secretVal.trim();
        data.host = hostVal.trim() || 'localhost';
        data.port = portVal.trim() || (credType === 'postgres' ? '5432' : '3306');
        data.database = extraVal.trim() || 'postgres';
        data.user = userVal.trim() || 'postgres';
      } else if (credType === 'gemini') {
        data.apiKey = secretVal.trim();
      } else if (credType === 'openai') {
        data.apiKey = secretVal.trim();
        if (extraVal.trim()) data.orgId = extraVal.trim();
      } else if (credType === 'anthropic') {
        data.apiKey = secretVal.trim();
      } else if (credType === 'github') {
        data.token = secretVal.trim();
      } else if (credType === 'google_sheets' || credType === 'google') {
        data.apiKey = secretVal.trim();
        data.token = secretVal.trim();
      }

      await onAddCredential({ name, type: credType, data });
      setToastMessage(`✓ Credential "${name}" saved successfully!`);
      setTimeout(() => setToastMessage(null), 3500);

      setModalOpen(false);
      setCredName('');
      setSecretVal('');
      setHostVal('');
      setExtraVal('');
      setUserVal('');
      setPortVal('');
      setFormError(null);
    } catch (err: any) {
      setFormError(`Error saving: ${err.message || 'Please check inputs'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <KeyRound className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Credential Store</h1>
          </div>
          <p className="text-xs text-slate-400">
            Encrypted authorization tokens referenced safely by ID in workflow nodes
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Credential</span>
        </button>
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
        <p>
          Credentials are encrypted at rest with AES-256. Workflow definitions store only unique identifier pointers (e.g. <code className="text-cyan-400">cred_1042</code>) preventing credential leakage during export.
        </p>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Credentials Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="px-5 py-3">Credential Name</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Masked Secret</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {credentials.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No credentials saved yet. Click "+ New Credential" to connect your APIs.
                </td>
              </tr>
            ) : (
              credentials.map((cred) => (
                <tr key={cred.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-semibold text-white flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{cred.name}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono uppercase text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                      {cred.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-400 text-[11px]">
                    {Object.values(cred.data)[0] || '••••••••••••'}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {new Date(cred.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onDeleteCredential(cred.id)}
                      className="p-1.5 hover:text-rose-400 text-slate-500 rounded hover:bg-slate-800 transition"
                      title="Delete Credential"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Credential Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">Add New Credential</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Credential Name</label>
                <input
                  type="text"
                  required
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="e.g. Production Gemini API Key"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Integration Type</label>
                <select
                  value={credType}
                  onChange={(e) => setCredType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="telegram">Telegram Bot (Token & Alerts)</option>
                  <option value="slack">Slack (Incoming Webhooks & Bot)</option>
                  <option value="discord">Discord (Channel Webhook)</option>
                  <option value="gemini">Google Gemini AI (3.8 Flash / Pro)</option>
                  <option value="openai">OpenAI (ChatGPT / GPT-4o / Reasoning)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="google_sheets">Google Workspace (Sheets, Gmail, Calendar)</option>
                  <option value="postgres">PostgreSQL Database</option>
                  <option value="mysql">MySQL Database</option>
                  <option value="github">GitHub (Personal Access Token)</option>
                  <option value="custom_api">Custom REST API / Webhook (Bearer Token)</option>
                </select>
              </div>

              {/* Main Secret / Token / Password Input */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  {credType === 'telegram'
                    ? 'Telegram Bot Token (from @BotFather)'
                    : credType === 'slack' || credType === 'discord'
                    ? 'Webhook URL'
                    : credType === 'postgres' || credType === 'mysql'
                    ? 'Database Password'
                    : credType === 'gemini'
                    ? 'Gemini API Key (AIzaSy...)'
                    : credType === 'openai'
                    ? 'OpenAI Secret API Key (sk-...)'
                    : credType === 'anthropic'
                    ? 'Anthropic Claude API Key (sk-ant-...)'
                    : credType === 'google_sheets'
                    ? 'Google OAuth Token / Service Account Key'
                    : 'API Key / Secret Token'}
                </label>
                <input
                  type={credType === 'slack' || credType === 'discord' ? 'text' : 'password'}
                  required
                  value={secretVal}
                  onChange={(e) => setSecretVal(e.target.value)}
                  placeholder={
                    credType === 'telegram'
                      ? '123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ'
                      : credType === 'slack'
                      ? 'https://hooks.slack.com/services/...'
                      : credType === 'discord'
                      ? 'https://discord.com/api/webhooks/...'
                      : '••••••••••••••••••••••••'
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Telegram Optional Chat ID */}
              {credType === 'telegram' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Chat ID / Channel (Optional)</label>
                  <input
                    type="text"
                    value={extraVal}
                    onChange={(e) => setExtraVal(e.target.value)}
                    placeholder="e.g. -100123456789 or @my_channel"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Slack Optional Channel */}
              {credType === 'slack' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Default Channel (Optional)</label>
                  <input
                    type="text"
                    value={extraVal}
                    onChange={(e) => setExtraVal(e.target.value)}
                    placeholder="#general or #alerts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              {/* OpenAI Optional Org ID */}
              {credType === 'openai' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Organization ID (Optional)</label>
                  <input
                    type="text"
                    value={extraVal}
                    onChange={(e) => setExtraVal(e.target.value)}
                    placeholder="org-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              )}

              {/* Database Specific Fields */}
              {(credType === 'postgres' || credType === 'mysql') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Database Host</label>
                    <input
                      type="text"
                      value={hostVal}
                      onChange={(e) => setHostVal(e.target.value)}
                      placeholder="localhost"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Port</label>
                    <input
                      type="text"
                      value={portVal}
                      onChange={(e) => setPortVal(e.target.value)}
                      placeholder={credType === 'postgres' ? '5432' : '3306'}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Database Name</label>
                    <input
                      type="text"
                      value={extraVal}
                      onChange={(e) => setExtraVal(e.target.value)}
                      placeholder="postgres"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Username</label>
                    <input
                      type="text"
                      value={userVal}
                      onChange={(e) => setUserVal(e.target.value)}
                      placeholder="postgres"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setFormError(null);
                  }}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  {isSubmitting && <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : 'Save Credential'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
