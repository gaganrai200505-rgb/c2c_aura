// components/layout/Footer.tsx — Clean Institutional Diagnostic Footer

import { Shield, Database, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer id="docs" className="w-full border-t border-white/[0.08] bg-[#05070a] py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
          {/* Brand & Protocol */}
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-sm font-mono font-bold text-white tracking-tight">
                Truth<span className="text-gradient-cyan">DNA</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-700/50">
                PRO v0.1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              TruthDNA strictly enforces non-binary forensic diagnostics. Outputs represent multi-dimensional evidence observations, confidence calibration, and explicit uncertainties.
            </p>
          </div>

          {/* Telemetry features */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>3-Pillar Standard</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Qdrant Vector Provenance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Gemini 2.5 Synthesis</span>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-[11px] text-slate-400 font-mono">
          <span>TruthDNA Forensic Media Intelligence · Built for high-stakes verification</span>
          <span>In-Memory Volatile Processing · Zero Permanent Retention</span>
        </div>
      </div>
    </footer>
  );
}
