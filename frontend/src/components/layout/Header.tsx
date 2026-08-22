// components/layout/Header.tsx — Clean Institutional Top Navigation

import { Shield } from "lucide-react";

export function Header() {
  return (
    <header className="w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono text-xs font-bold">
            TD
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight text-white font-mono">
              TruthDNA
            </span>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              / Forensic Media Diagnostic
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-slate-400 hidden sm:inline">Engine:</span>
            <span className="text-slate-200">Online</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-mono pl-3 border-l border-slate-800">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <span>3-Pillar Standard</span>
          </div>
        </div>
      </div>
    </header>
  );
}
