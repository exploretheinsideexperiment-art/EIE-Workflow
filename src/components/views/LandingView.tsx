import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  GitBranch,
  Webhook,
  Mail,
  Database,
  Cpu,
  X
} from 'lucide-react';
import { User, Workspace } from '../../types/workflow';

interface LandingViewProps {
  onLoginSuccess: (user: User, workspace: Workspace) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onLoginSuccess }) => {
  const [modalType, setModalType] = useState<'login' | 'signup' | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = modalType === 'signup' ? '/api/auth/signup' : '/api/auth/login';
      const body = modalType === 'signup' ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.workspace);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      onLoginSuccess(data.user, data.workspace);
    } catch {
      // Fallback
      onLoginSuccess(
        { id: 'usr_demo', email: 'engineer@eie-workflow.com', name: 'EIE Automation Engineer' },
        { id: 'ws_demo', name: 'Production Automation Lab', ownerId: 'usr_demo', membersCount: 1, plan: 'pro' }
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Top Navbar */}
      <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Layers className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white font-sans">
              EIE-WORKFLOW
            </span>
            <span className="text-[10px] text-cyan-400 font-mono block tracking-wider uppercase font-bold">
              Connect. Automate. Simplify.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setError(null);
              setModalType('login');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
          >
            Login
          </button>
          <button
            onClick={() => {
              setError(null);
              setModalType('signup');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-100 hover:bg-slate-700 transition cursor-pointer border border-slate-700"
          >
            Sign Up
          </button>
          <button
            onClick={handleDemoLogin}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
          >
            Get Started (Instant)
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-16 flex flex-col items-center text-center space-y-8 my-auto">
        {/* Glow pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Visual No-Code Automation Architecture</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl">
          Visual Workflow Automation. <br />
          <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Connect. Automate. Simplify.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base text-slate-400 max-w-2xl leading-relaxed">
          The production-ready automation platform connecting Webhooks, REST APIs, Google Gemini AI, PostgreSQL, and communication channels across an infinite visual canvas.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <button
            onClick={handleDemoLogin}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-blue-600 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/30 hover:scale-102 active:scale-98 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Launch Canvas Workspace</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <button
            onClick={() => setModalType('login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 font-bold text-sm hover:bg-slate-800 transition cursor-pointer"
          >
            Account Login
          </button>
        </div>

        {/* Live Diagram Illustration */}
        <div className="w-full max-w-4xl p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-2xl backdrop-blur-md mt-10">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Visual Architecture
            </span>
            <span className="text-cyan-400 font-semibold">100% Real Execution Engine</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30 text-left">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 w-fit mb-2">
                <Webhook className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">1. Inbound Webhook</h4>
              <p className="text-[11px] text-slate-500 mt-1">Automatic endpoint provisioning with instant parsing</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-pink-500/30 text-left">
              <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 w-fit mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">2. Gemini 3.8 AI Agent</h4>
              <p className="text-[11px] text-slate-500 mt-1">Semantic reasoning & structured entity extraction</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-amber-500/30 text-left">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 w-fit mb-2">
                <GitBranch className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">3. IF / Logic Branch</h4>
              <p className="text-[11px] text-slate-500 mt-1">Conditional path evaluation & downstream routing</p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-500/30 text-left">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 w-fit mb-2">
                <Mail className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-xs text-white">4. Dynamic Delivery</h4>
              <p className="text-[11px] text-slate-500 mt-1">Dispatches email, Slack, Telegram, or database write</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-8 text-center text-xs text-slate-500 font-mono">
        EIE-Workflow Platform • Connect. Automate. Simplify. • Built for High-Throughput Automation
      </footer>

      {/* Authentication Modal */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-7 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
              <div>
                <h3 className="font-bold text-base text-white">
                  {modalType === 'signup' ? 'Create EIE-Workflow Account' : 'Welcome to EIE-Workflow'}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {modalType === 'signup' ? 'Start building automations immediately' : 'Log in to your automation workspace'}
                </span>
              </div>
              <button
                onClick={() => setModalType(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {modalType === 'signup' && (
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Mercer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.mercer@enterprise.io"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/25 cursor-pointer mt-2"
              >
                {loading
                  ? 'Verifying...'
                  : modalType === 'signup'
                  ? 'Sign Up & Open Canvas'
                  : 'Log In'}
              </button>

              {/* OAuth Future Support Notice */}
              <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                  Future SSO Integration
                </span>
                <div className="grid grid-cols-2 gap-2 text-slate-400">
                  <button
                    type="button"
                    disabled
                    className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] opacity-50 cursor-not-allowed"
                  >
                    Google Login (Soon)
                  </button>
                  <button
                    type="button"
                    disabled
                    className="py-2 rounded-xl bg-slate-950 border border-slate-800 text-[11px] opacity-50 cursor-not-allowed"
                  >
                    GitHub Login (Soon)
                  </button>
                </div>
              </div>

              <div className="text-center pt-1 text-slate-400">
                {modalType === 'signup' ? (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setModalType('login')}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Login
                    </button>
                  </span>
                ) : (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setModalType('signup')}
                      className="text-cyan-400 hover:underline font-semibold"
                    >
                      Sign Up
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
