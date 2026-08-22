// components/diagnostics/AnalysisPipeline.tsx — 6-Stage TruthDNA Analysis Pipeline

import {
  Shield,
  Fingerprint,
  Database,
  Globe,
  Brain,
  FileCheck2,
  ChevronRight,
} from "lucide-react";

export function AnalysisPipeline() {
  const stages = [
    {
      num: "01",
      title: "ELA Forensics",
      desc: "Compression & frame analysis",
      icon: Shield,
      colorClass: "text-purple-400 border-purple-500/30 bg-purple-950/30 shadow-purple-950/40",
      pillBg: "bg-purple-950/60 text-purple-300 border-purple-800/50",
    },
    {
      num: "02",
      title: "Digital Genome",
      desc: "pHash + CLIP embeddings",
      icon: Fingerprint,
      colorClass: "text-blue-400 border-blue-500/30 bg-blue-950/30 shadow-blue-950/40",
      pillBg: "bg-blue-950/60 text-blue-300 border-blue-800/50",
    },
    {
      num: "03",
      title: "Qdrant Ledger",
      desc: "Historical similarity matching",
      icon: Database,
      colorClass: "text-cyan-400 border-cyan-500/30 bg-cyan-950/30 shadow-cyan-950/40",
      pillBg: "bg-cyan-950/60 text-cyan-300 border-cyan-800/50",
    },
    {
      num: "04",
      title: "Web Grounding",
      desc: "Contextual web search",
      icon: Globe,
      colorClass: "text-emerald-400 border-emerald-500/30 bg-emerald-950/30 shadow-emerald-950/40",
      pillBg: "bg-emerald-950/60 text-emerald-300 border-emerald-800/50",
    },
    {
      num: "05",
      title: "LLM Synthesis",
      desc: "Gemini reasoning engine",
      icon: Brain,
      colorClass: "text-amber-400 border-amber-500/30 bg-amber-950/30 shadow-amber-950/40",
      pillBg: "bg-amber-950/60 text-amber-300 border-amber-800/50",
    },
    {
      num: "06",
      title: "Diagnostic Report",
      desc: "Evidence, Confidence & Uncertainty",
      icon: FileCheck2,
      colorClass: "text-indigo-400 border-indigo-500/30 bg-indigo-950/30 shadow-indigo-950/40",
      pillBg: "bg-indigo-950/60 text-indigo-300 border-indigo-800/50",
    },
  ];

  return (
    <section id="ledger" className="w-full max-w-7xl mx-auto py-12 border-t border-white/[0.06]">
      {/* Section Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-slate-900/60 text-[11px] font-mono text-slate-300 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>END-TO-END VERIFICATION WORKFLOW</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          TruthDNA Analysis Pipeline
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl mx-auto">
          Six synchronized stages transforming raw media into multi-pillar diagnostic intelligence.
        </p>
      </div>

      {/* Horizontal Pipeline Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 relative">
        {stages.map((stg, i) => {
          const Icon = stg.icon;
          const isLast = i === stages.length - 1;

          return (
            <div
              key={stg.num}
              className="glass-panel p-4 rounded-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 group relative overflow-hidden"
            >
              {/* Top Row: Number and Icon */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${stg.pillBg}`}>
                  {stg.num}
                </span>

                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-transform group-hover:scale-110 ${stg.colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-bold text-white tracking-wide">
                  {stg.title}
                </h3>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {stg.desc}
                </p>
              </div>

              {/* Connecting Indicator for desktop */}
              {!isLast && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 z-20 pointer-events-none text-slate-600">
                  <ChevronRight className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
