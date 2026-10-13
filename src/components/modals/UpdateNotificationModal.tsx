import React, { useState, useEffect } from 'react';
import { RefreshCw, Sparkles, X, ArrowUpCircle, CheckCircle2, GitCommit, Bell } from 'lucide-react';
import { useAppUpdate } from '../../hooks/useAppUpdate';

interface UpdateNotificationModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  forceOpen = false,
  onClose,
}) => {
  const { isUpdateAvailable, versionInfo, applyUpdate, isApplying } = useAppUpdate();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Open modal whenever a new update is detected, unless dismissed in this session
  useEffect(() => {
    if ((isUpdateAvailable && !isDismissed) || forceOpen) {
      setIsOpen(true);
    }
  }, [isUpdateAvailable, isDismissed, forceOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    setIsDismissed(true);
    onClose?.();
  };

  const handleUpdateClick = async () => {
    await applyUpdate();
  };

  if (!isOpen) return null;

  const deployedTime = versionInfo?.builtAt
    ? new Date(versionInfo.builtAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-6 text-white shadow-2xl border border-cyan-500/40 ring-1 ring-cyan-500/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="update-title"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-20 right-0 w-36 h-36 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          disabled={isApplying}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Dismiss for now"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 shrink-0 ring-2 ring-cyan-400/30">
            <RefreshCw className={`w-6 h-6 ${isApplying ? 'animate-spin' : ''}`} />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-300"></span>
            </span>
          </div>

          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold tracking-wide uppercase mb-1">
              <Sparkles className="w-3 h-3" />
              <span>GitHub Update Pushed</span>
            </div>
            <h2 id="update-title" className="text-lg font-bold text-white tracking-tight">
              नया अपडेट उपलब्ध है!
            </h2>
            <p className="text-xs text-slate-400">
              New website version deployed & ready
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-3.5 mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <GitCommit className="w-3.5 h-3.5 text-cyan-400" />
              <span>डिप्लॉय स्टेटस:</span>
            </span>
            <span className="font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live on GitHub
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">अपडेट का समय:</span>
            <span className="text-slate-200 font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded">
              {deployedTime}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 pt-1 border-t border-slate-800/80 leading-relaxed">
            GitHub repository पर नया कोड/डेटा पुश हो चुका है। नवीनतम अपडेट, नए नोड्स और बदलाव लोड करने के लिए नीचे बटन पर क्लिक करें।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Main User-Requested Button */}
          <button
            onClick={handleUpdateClick}
            disabled={isApplying}
            className="w-full relative group overflow-hidden flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 border border-cyan-300/30 active:scale-[0.98] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isApplying ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
            <span>{isApplying ? 'अपडेट हो रहा है... (Reloading...)' : 'Click here to update'}</span>
          </button>

          {/* Dismiss secondary button */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isApplying}
            className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            Dismiss / बाद में अपडेट करें
          </button>
        </div>

        {/* Helpful note */}
        <p className="text-[10px] text-center text-slate-500 mt-3">
          क्लिक करते ही पुराना ब्राउज़र कैश साफ हो जाएगा और नई वेबसाइट लोड हो जाएगी।
        </p>
      </div>
    </div>
  );
};
