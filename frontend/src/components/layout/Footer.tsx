// components/layout/Footer.tsx — Clean Institutional Diagnostic Footer

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#070a12] py-8 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
        <div className="flex flex-col gap-1 text-center sm:text-left">
          <p className="text-slate-400 font-semibold">
            TruthDNA · Forensic Diagnostic Protocol
          </p>
          <p className="text-[11px] text-slate-500 max-w-md">
            Enforces a non-binary diagnostic methodology. All outputs articulate Evidence, Confidence Calibration, and Explicit Uncertainties.
          </p>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>ELA Forensics</span>
          <span>·</span>
          <span>Digital Genome</span>
          <span>·</span>
          <span>Qdrant Ledger</span>
        </div>
      </div>
    </footer>
  );
}
