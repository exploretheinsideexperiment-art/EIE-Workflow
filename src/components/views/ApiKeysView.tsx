import React, { useState } from 'react';
import { ShieldCheck, Plus, Trash2, Key, Copy, Check, AlertTriangle, X } from 'lucide-react';
import { ApiKey } from '../../types/workflow';

interface ApiKeysViewProps {
  apiKeys: ApiKey[];
  onCreateKey: (name: string) => Promise<any>;
  onDeleteKey: (id: string) => Promise<void>;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ apiKeys, onCreateKey, onDeleteKey }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [newlyCreatedSecret, setNewlyCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;

    setIsSubmitting(true);
    try {
      const res = await onCreateKey(keyName);
      setNewlyCreatedSecret(res.secretKey);
      setKeyName('');
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
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight">EIE-Workflow API Keys</h1>
          </div>
          <p className="text-xs text-slate-400">
            Authenticate programmatic REST calls to trigger and manage workflows remotely
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedSecret(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Create API Key</span>
        </button>
      </div>

      {/* Keys Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="px-5 py-3">Key Name</th>
              <th className="px-5 py-3">Key Token Prefix</th>
              <th className="px-5 py-3">Created</th>
              <th className="px-5 py-3">Last Used</th>
              <th className="px-5 py-3 text-right">Revoke</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-200">
            {apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500">
                  No active API keys found. Click "Create API Key" to generate a token.
                </td>
              </tr>
            ) : (
              apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5 font-semibold text-white flex items-center gap-2">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{k.name}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-cyan-300 text-[11px]">
                    <code>{k.keyPrefix}****************</code>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-mono text-[11px]">
                    {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => onDeleteKey(k.id)}
                      className="p-1.5 hover:text-rose-400 text-slate-500 rounded hover:bg-slate-800 transition"
                      title="Revoke Key"
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

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-white">Create API Key</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {newlyCreatedSecret ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p>
                    Please copy this secret key now. You will not be able to view it again after closing this window!
                  </p>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs">
                  <span className="text-cyan-300 break-all select-all">{newlyCreatedSecret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(newlyCreatedSecret);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="ml-2 text-slate-400 hover:text-white shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  onClick={() => setModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="space-y-4 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Key Name / Description</label>
                  <input
                    type="text"
                    required
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="e.g. CI/CD Deployment Trigger"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition"
                  >
                    {isSubmitting ? 'Generating...' : 'Generate Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
