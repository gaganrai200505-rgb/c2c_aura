// components/diagnostics/PillarDeliverables.tsx — What TruthDNA Delivers Section

import { ShieldCheck, BarChart3, AlertOctagon, Share2 } from "lucide-react";

export function PillarDeliverables() {
  const deliverables = [
    {
      badge: "PILLAR 01",
      title: "EVIDENCE",
      desc: "Concrete observations from multiple forensic signals.",
      detail: "Physical, compression, and visual artifact analysis grounded in rigorous signal forensics.",
      icon: ShieldCheck,
      borderColor: "border-indigo-500/30",
      iconBg: "bg-indigo-950/60 text-indigo-400 border-indigo-700/50",
    },
    {
      badge: "PILLAR 02",
      title: "CONFIDENCE",
      desc: "Granular confidence scores instead of a single unexplained percentage.",
      detail: "Multi-dimensional probability distributions across visual, acoustic, and provenance vectors.",
      icon: BarChart3,
      borderColor: "border-blue-500/30",
      iconBg: "bg-blue-950/60 text-blue-400 border-blue-700/50",
    },
    {
      badge: "PILLAR 03",
      title: "UNCERTAINTY",
      desc: "Explicitly identifies limitations, missing information, and fallback conditions.",
      detail: "Transparent declaration of analytical blind spots and unresolved media compression bounds.",
      icon: AlertOctagon,
      borderColor: "border-amber-500/30",
      iconBg: "bg-amber-950/60 text-amber-400 border-amber-700/50",
    },
    {
      badge: "ACTIONABLE",
      title: "SHAREABLE CONTEXT",
      desc: "Generate a concise evidence-based summary for review and sharing.",
      detail: "Exportable citation-grade markdown cards ready for editorial review and verification trails.",
      icon: Share2,
      borderColor: "border-emerald-500/30",
      iconBg: "bg-emerald-950/60 text-emerald-400 border-emerald-700/50",
    },
  ];

  return (
    <section id="about" className="w-full max-w-7xl mx-auto py-12 border-t border-white/[0.06]">
      {/* Section Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-slate-900/60 text-[11px] font-mono text-slate-300 mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span>DIAGNOSTIC OUTCOMES</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
          What TruthDNA Delivers
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-lg mx-auto">
          Delivering principled forensic transparency across four core analytical deliverables.
        </p>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {deliverables.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className={`glass-panel p-5 rounded-xl flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:border-indigo-500/40`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-white/[0.08] text-slate-400">
                    {item.badge}
                  </span>

                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${item.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-sm font-mono font-bold text-white tracking-wider mb-2">
                  {item.title}
                </h3>

                <p className="text-xs font-medium text-slate-200 leading-relaxed mb-3">
                  {item.desc}
                </p>
              </div>

              <p className="text-[11px] text-slate-400 leading-normal pt-3 border-t border-white/[0.06]">
                {item.detail}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
