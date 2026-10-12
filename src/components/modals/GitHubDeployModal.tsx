import React, { useState } from 'react';
import {
  X,
  GitBranch,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  Terminal,
  Globe,
  ArrowRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  const pushCommand = `git add .
git commit -m "Update automation workflow & website"
git push origin main`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-[#090d16] border border-emerald-500/40 shadow-2xl shadow-emerald-950/80 p-5 sm:p-6 text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  GitHub Auto-Deploy & Sync
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Automated CI/CD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                गिटहब पर रिपॉजिटरी पुश करने पर वेबसाइट ऑटोमैटिकली लाइव अपडेट होती है
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Card */}
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              GitHub Actions Workflow सक्रिय है (.github/workflows/deploy.yml)
            </span>
            <span className="text-[10px] font-mono bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700">
              READY
            </span>
          </div>
          <p className="text-[11.5px] text-slate-300 leading-relaxed">
            इस प्रोजेक्ट में स्वचालित GitHub Actions पाइपलाइन कॉन्फ़िगर है। जैसे ही आप रिपॉजिटरी के <code>main</code> या <code>master</code> ब्रांच पर पुश करेंगे, GitHub स्वचालित रूप से नई वेबसाइट बिल्ड करके GitHub Pages पर लाइव कर देगा!
          </p>
        </div>

        {/* 1-Time 30-Second Setup on GitHub */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
          <h3 className="text-xs font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            GitHub Pages 1-टाइम सेटअप (30 सेकंड):
          </h3>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-[11.5px] leading-relaxed pl-1">
            <li>
              अपने GitHub Repository पर जाएं:{' '}
              <span className="text-cyan-400 font-mono text-[11px]">github.com/your-username/your-repo</span>
            </li>
            <li>
              ऊपर मेनू में <strong className="text-white">Settings</strong> पर क्लिक करें।
            </li>
            <li>
              बाएं साइडबार में <strong className="text-white">Pages</strong> खोलें।
            </li>
            <li>
              <strong className="text-white">Build and deployment &gt; Source</strong> में{' '}
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800">
                GitHub Actions
              </span>{' '}
              चुनें (या <em>Deploy from a branch</em> &gt; <em>gh-pages</em> चुनें)।
            </li>
            <li>
              बस! अब हर <code>git push</code> के बाद आपकी लाइव वेबसाइट 1-2 मिनट में खुद-ब-खुद अपडेट हो जाएगी।
            </li>
          </ol>
        </div>

        {/* How to Push Command Box */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              वेबसाइट अपडेट करने के लिए पुश कमांड:
            </span>
            <button
              onClick={() => copyToClipboard(pushCommand, 'push')}
              className="text-[10.5px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 cursor-pointer"
            >
              {copiedCmd === 'push' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCmd === 'push' ? 'Copied!' : 'Copy Commands'}</span>
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 space-y-1 select-all">
            <div className="text-slate-500"># 1. सभी फाइलें स्टेज करें</div>
            <div>git add .</div>
            <div className="text-slate-500 mt-1"># 2. बदलाव कमिट करें</div>
            <div>git commit -m "Update automation workflow &amp; website"</div>
            <div className="text-slate-500 mt-1"># 3. गिटहब पर पुश करें (वेबसाइट लाइव अपडेट होगी)</div>
            <div className="text-emerald-400 font-bold">git push origin main</div>
          </div>
        </div>

        {/* Built Outputs Note */}
        <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            <code>dist/</code> और <code>docs/</code> दोनों फ़ोल्डर्स बिल्ड में ऑटो-सिंक होते हैं, जिससे सभी प्रकार के GitHub Pages होस्टिंग सपोर्टेड रहते हैं।
          </span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition shadow-md shadow-emerald-600/30"
          >
            समझ गया (OK)
          </button>
        </div>
      </div>
    </div>
  );
};
