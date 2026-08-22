import { useState, useCallback, useRef } from "react";
import {
  UploadCloud, Dna, AlertTriangle, Copy, Check,
  Shield, Activity, Search, Zap,
} from "lucide-react";
import type { AnalysisState, ForensicSignal, MediaDNAReport } from "../types/truthdna";

const API_URL = "http://localhost:8000/api/analyze";

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ForensicSignal["status"] }) {
  const cls =
    status === "Clean" ? "pill-clean" :
    status === "Suspicious" ? "pill-suspicious" :
    "pill-altered";
  const dot =
    status === "Clean" ? "#10b981" :
    status === "Suspicious" ? "#f59e0b" :
    "#ef4444";
  return (
    <span className={cn(cls, "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide")}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: dot, display: "inline-block" }} />
      {status}
    </span>
  );
}

// ─── Confidence Dial ──────────────────────────────────────────────────────────

function ConfidenceDial({ label, value }: { label: string; value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - value * circumference;
  const color = value >= 0.7 ? "#10b981" : value >= 0.4 ? "#f59e0b" : "#ef4444";
  const formatted = label.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative", width: 96, height: 96 }}>
        <svg viewBox="0 0 96 96" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
          <circle cx="48" cy="48" r={radius} className="dial-track" />
          <circle cx="48" cy="48" r={radius} className="dial-fill" stroke={color}
            strokeDasharray={circumference} strokeDashoffset={offset} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18, fontWeight: "bold", color }}>{Math.round(value * 100)}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", maxWidth: 80, lineHeight: 1.3 }}>{formatted}</span>
    </div>
  );
}

// ─── Loading Sequencer ────────────────────────────────────────────────────────

function LoadingSequencer() {
  const steps = [
    { icon: Activity, label: "Running ELA micro-forensics..." },
    { icon: Dna, label: "Extracting digital genome..." },
    { icon: Search, label: "Scanning vector ledger..." },
    { icon: Zap, label: "Synthesizing with Gemini 2.5 Flash..." },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, padding: "64px 0" }}>
      <div style={{ position: "relative", width: 112, height: 112 }}>
        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid transparent",
          borderTopColor: "#00d4ff", borderRightColor: "#7c3aed",
          animation: "spin 1.4s linear infinite" }} />
        <div style={{ position: "absolute", inset: 12, borderRadius: "50%", border: "2px solid transparent",
          borderBottomColor: "#00d4ff", borderLeftColor: "#7c3aed",
          animation: "spin 1s linear infinite reverse" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Dna style={{ width: 32, height: 32, color: "#00d4ff" }} />
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h2 className="glow-text" style={{ fontSize: 24, fontWeight: 800, color: "#00d4ff", marginBottom: 8 }}>
          Sequencing Media DNA
        </h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Running multi-dimensional forensic analysis...</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 360 }}>
        {steps.map(({ icon: Icon, label }, i) => (
          <div key={i} className="glass animate-fade-in-up"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
              animationDelay: `${i * 0.3}s`, animationFillMode: "both", opacity: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", background: "rgba(0,212,255,0.1)", flexShrink: 0 }}>
              <Icon style={{ width: 16, height: 16, color: "#00d4ff" }} />
            </div>
            <span style={{ fontSize: 14, color: "#cbd5e1" }}>{label}</span>
            <div style={{ marginLeft: "auto", width: 16, height: 16, borderRadius: "50%",
              border: "2px solid #00d4ff", borderTopColor: "transparent" }} className="animate-spin" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence Matrix ──────────────────────────────────────────────────────────

function EvidenceMatrix({ signals }: { signals: ForensicSignal[] }) {
  return (
    <div className="glass animate-fade-in-up" style={{ padding: 24, animationDelay: "0.1s", animationFillMode: "both", opacity: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,212,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Shield style={{ width: 16, height: 16, color: "#00d4ff" }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Evidence Matrix</h3>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#475569" }}>{signals.length} signal{signals.length !== 1 ? "s" : ""}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {signals.map((sig, i) => (
          <div key={i} style={{ borderRadius: 12, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", transition: "transform 0.15s" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#e2e8f0" }}>{sig.dimension}</span>
              <StatusPill status={sig.status} />
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>{sig.finding}</p>
            {sig.media_timestamp && (
              <span style={{ marginTop: 8, display: "inline-block", fontSize: 11, color: "#0e7490", fontFamily: "monospace" }}>
                @ {sig.media_timestamp}
              </span>
            )}
            {sig.source_url && (
              <a href={sig.source_url} target="_blank" rel="noopener noreferrer"
                style={{ display: "block", marginTop: 4, fontSize: 11, color: "#06b6d4", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {sig.source_url}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Confidence Dials Section ─────────────────────────────────────────────────

function ConfidenceDials({ breakdown }: { breakdown: Record<string, number> }) {
  return (
    <div className="glass animate-fade-in-up" style={{ padding: 24, animationDelay: "0.2s", animationFillMode: "both", opacity: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Activity style={{ width: 16, height: 16, color: "#a78bfa" }} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Confidence Breakdown</h3>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 16 }}>
        {Object.entries(breakdown).map(([key, val]) => (
          <ConfidenceDial key={key} label={key} value={Math.max(0, Math.min(1, val))} />
        ))}
      </div>
      <p style={{ marginTop: 16, fontSize: 11, color: "#475569", textAlign: "center", lineHeight: 1.6 }}>
        Scores are multi-dimensional estimates, not a single verdict.
      </p>
    </div>
  );
}

// ─── Uncertainty Box ──────────────────────────────────────────────────────────

function UncertaintyBox({ uncertainties }: { uncertainties: string[] }) {
  return (
    <div className="animate-fade-in-up" style={{ borderRadius: 16, padding: 24,
      animationDelay: "0.3s", animationFillMode: "both", opacity: 0,
      background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <AlertTriangle style={{ width: 20, height: 20, color: "#f59e0b", flexShrink: 0 }} />
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#fcd34d" }}>Known Unknowns &amp; Blind Spots</h3>
      </div>
      <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {uncertainties.map((u, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ marginTop: 6, width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f59e0b", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(253,230,138,0.8)", lineHeight: 1.6 }}>{u}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Weighting Rationale ──────────────────────────────────────────────────────

function WeightingRationale({ rationale }: { rationale: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = rationale.length > 300;
  const display = expanded || !isLong ? rationale : rationale.slice(0, 300) + "...";
  return (
    <div className="glass animate-fade-in-up" style={{ padding: 24, animationDelay: "0.35s", animationFillMode: "both", opacity: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Dna style={{ width: 16, height: 16, color: "#00d4ff" }} />
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>AI Chain-of-Thought Rationale</h3>
      </div>
      <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.7 }}>{display}</p>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)}
          style={{ marginTop: 8, fontSize: 12, color: "#06b6d4", background: "none", border: "none", cursor: "pointer" }}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ─── Action Tray ──────────────────────────────────────────────────────────────

function ActionTray({ card, onReset }: { card: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(card); } catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="glass animate-fade-in-up" style={{ padding: 20, animationDelay: "0.45s", animationFillMode: "both", opacity: 0 }}>
      <p style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>{card}</p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={handleCopy}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: copied ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.1)",
            border: copied ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(0,212,255,0.3)",
            color: copied ? "#10b981" : "#00d4ff" }}>
          {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
          {copied ? "Copied!" : "Copy Context Card"}
        </button>
        <button onClick={onReset}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.3)", color: "#a78bfa" }}>
          <Dna style={{ width: 16, height: 16 }} />
          Analyze Another
        </button>
      </div>
    </div>
  );
}

// ─── Diagnostic View ──────────────────────────────────────────────────────────

function DiagnosticView({ report, onReset }: { report: MediaDNAReport; onReset: () => void }) {
  const alteredCount = report.forensic_evidence.filter((s) => s.status === "Altered").length;
  const suspiciousCount = report.forensic_evidence.filter((s) => s.status === "Suspicious").length;
  return (
    <div style={{ width: "100%", maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="glass animate-fade-in-up" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, animationFillMode: "both", opacity: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Dna style={{ width: 20, height: 20, color: "#00d4ff" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Forensic Analysis Complete</span>
          </div>
          <p style={{ fontSize: 12, color: "#64748b" }}>
            {report.forensic_evidence.length} signals analysed ·{" "}
            <span style={{ color: "#f87171" }}>{alteredCount} Altered</span> ·{" "}
            <span style={{ color: "#fbbf24" }}>{suspiciousCount} Suspicious</span>
            {report.lineage_match_found && <span style={{ color: "#00d4ff" }}> · Lineage match detected</span>}
          </p>
        </div>
        <div style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
          background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff" }}>
          No Binary Verdict
        </div>
      </div>
      <EvidenceMatrix signals={report.forensic_evidence} />
      <ConfidenceDials breakdown={report.confidence_breakdown} />
      <UncertaintyBox uncertainties={report.explicit_uncertainties} />
      <WeightingRationale rationale={report.weighting_rationale} />
      <ActionTray card={report.shareable_context_card} onReset={onReset} />
    </div>
  );
}

// ─── Hero Drop Zone ───────────────────────────────────────────────────────────

function HeroDropzone({ onFile }: { onFile: (f: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }, [onFile]);

  return (
    <div style={{ width: "100%", maxWidth: 640, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="animate-float" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 80, height: 80, borderRadius: 20, marginBottom: 24,
          background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))",
          border: "1px solid rgba(0,212,255,0.3)" }}>
          <Dna style={{ width: 40, height: 40, color: "#00d4ff" }} />
        </div>
        <h1 style={{ fontSize: 52, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
          <span className="glow-text" style={{ color: "#00d4ff" }}>Truth</span>
          <span style={{ color: "#fff" }}>DNA</span>
        </h1>
        <p style={{ color: "#64748b", fontSize: 15, maxWidth: 360, margin: "0 auto", lineHeight: 1.7 }}>
          Forensic media analysis powered by AI.{" "}
          <span style={{ color: "#f59e0b" }}>Never a binary verdict</span> — always Evidence, Confidence &amp; Uncertainty.
        </p>
      </div>

      <div id="file-dropzone"
        className={cn("glass neon-border", dragging && "dropzone-active")}
        style={{ borderRadius: 20, padding: 48, textAlign: "center", cursor: "pointer", transition: "all 0.3s" }}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button" tabIndex={0} aria-label="Upload media file for analysis"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}>

        <input ref={inputRef} id="file-input" type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }}
          aria-label="Select file for forensic analysis" />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
            background: dragging ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.2)", transform: dragging ? "scale(1.1)" : "scale(1)", transition: "all 0.3s" }}>
            <UploadCloud style={{ width: 32, height: 32, color: "#00d4ff" }} />
          </div>
          <p style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 4 }}>
            {dragging ? "Release to analyze" : "Drop media here"}
          </p>
          <p style={{ fontSize: 14, color: "#64748b" }}>
            or <span style={{ color: "#00d4ff" }}>browse files</span>
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginTop: 16 }}>
          {["JPEG", "PNG", "WebP", "GIF", "MP4", "WebM", "MOV"].map((f) => (
            <span key={f} style={{ padding: "2px 10px", borderRadius: 999, fontSize: 11, fontFamily: "monospace",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
              {f}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "#334155", marginTop: 8 }}>Max 20MB · Images &amp; Videos</p>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 32 }}>
        {[
          { icon: Shield, label: "ELA Forensics", color: "#10b981" },
          { icon: Dna, label: "DNA Fingerprint", color: "#00d4ff" },
          { icon: Search, label: "Lineage Search", color: "#a78bfa" },
          { icon: Zap, label: "Gemini 2.5 Flash", color: "#f59e0b" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999,
            fontSize: 12, fontWeight: 500, background: `${color}10`, border: `1px solid ${color}30`, color }}>
            <Icon style={{ width: 14, height: 14 }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AnalysisState>({ phase: "idle" });

  const handleFile = useCallback(async (file: File) => {
    setState({ phase: "uploading" });
    const formData = new FormData();
    formData.append("file", file);
    setState({ phase: "analyzing" });
    try {
      const res = await fetch(API_URL, { method: "POST", body: formData });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const err = await res.json(); detail = err.detail || detail; } catch {}
        throw new Error(detail);
      }
      const report: MediaDNAReport = await res.json();
      setState({ phase: "complete", report });
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Unknown error" });
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }} className="gradient-bg">
      {/* Background grid */}
      <div className="grid-bg" style={{ position: "fixed", inset: 0, pointerEvents: "none" }} />

      {/* Nav */}
      <nav style={{ position: "relative", zIndex: 10, display: "flex", flexWrap: "wrap", alignItems: "center",
        justifyContent: "space-between", padding: "16px 24px",
        borderBottom: "1px solid rgba(26,37,64,0.8)", backdropFilter: "blur(12px)", background: "rgba(8,11,20,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Dna style={{ width: 20, height: 20, color: "#00d4ff" }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "0.05em" }}>TruthDNA</span>
            <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontFamily: "monospace",
              background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>v0.1</span>
          </div>
          <div style={{ height: 16, width: 1, background: "#1a2540", margin: "0 8px" }} />
          <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            color: "#00d4ff", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}>
            <Shield style={{ width: 14, height: 14 }} /> Forensic Analysis
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse-ring 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>3-Pillar Diagnostic</span>
        </div>
      </nav>

      {/* Content */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        {state.phase === "idle" && <HeroDropzone onFile={handleFile} />}
        {(state.phase === "uploading" || state.phase === "analyzing") && <LoadingSequencer />}
        {state.phase === "error" && (
          <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
            <div className="glass" style={{ borderRadius: 20, padding: 32, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              <AlertTriangle style={{ width: 40, height: 40, color: "#ef4444", margin: "0 auto 16px" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 8 }}>Analysis Failed</h2>
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>{state.message}</p>
              <button id="retry-button" onClick={reset}
                style={{ padding: "10px 20px", borderRadius: 12, fontSize: 14, fontWeight: 500, cursor: "pointer",
                  background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff" }}>
                Try Again
              </button>
            </div>
          </div>
        )}
        {state.phase === "complete" && <DiagnosticView report={state.report} onReset={reset} />}
      </div>

      <footer style={{ position: "relative", zIndex: 10, padding: "16px", borderTop: "1px solid rgba(26,37,64,0.6)", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#334155" }}>
          TruthDNA enforces a non-binary diagnostic. No output constitutes a definitive verdict.
        </p>
      </footer>
    </main>
  );
}
