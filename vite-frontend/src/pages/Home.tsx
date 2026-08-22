import { useState, useCallback, useRef } from "react";
import {
  UploadCloud, Dna, AlertTriangle, Copy, Check,
  Shield, Activity, Search, Zap,
  Video, FileText, ArrowRight, Globe, Sparkles,
} from "lucide-react";
import type { AnalysisState, ForensicSignal, MediaDNAReport } from "../types/truthdna";

const API_ANALYZE_MEDIA = "http://localhost:8000/api/analyze";
const API_ANALYZE_LINK  = "http://localhost:8000/api/analyze-link";
const API_ANALYZE_CLAIM = "http://localhost:8000/api/analyze-claim";

type AnalysisMode = "link" | "media" | "claim";

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

function LoadingSequencer({ mode }: { mode: AnalysisMode }) {
  const stepsByMode: Record<AnalysisMode, { icon: any; label: string }[]> = {
    link: [
      { icon: Globe, label: "Resolving video stream & page metadata..." },
      { icon: Activity, label: "Sampling 15s keyframes & ELA micro-forensics..." },
      { icon: Search, label: "Querying global fact-checking registries..." },
      { icon: Zap, label: "Evaluating cross-modal narrative with Gemini 2.5..." },
    ],
    media: [
      { icon: Activity, label: "Running ELA compression anomaly scan..." },
      { icon: Dna, label: "Extracting pHash & 512-dim CLIP genome..." },
      { icon: Search, label: "Scanning vector ledger for recycled footage..." },
      { icon: Zap, label: "Synthesizing 3-pillar diagnostic..." },
    ],
    claim: [
      { icon: FileText, label: "Decomposing claim assertions & named entities..." },
      { icon: Search, label: "Searching Snopes, Reuters, AP & news registers..." },
      { icon: Shield, label: "Cross-referencing factual consensus & timeline..." },
      { icon: Zap, label: "Building non-binary diagnostic report..." },
    ],
  };

  const steps = stepsByMode[mode];

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
          Sequencing TruthDNA
        </h2>
        <p style={{ color: "#64748b", fontSize: 14 }}>Evaluating evidence across multiple forensic &amp; factual dimensions...</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 400 }}>
        {steps.map(({ icon: Icon, label }, i) => (
          <div key={i} className="glass animate-fade-in-up"
            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
              animationDelay: `${i * 0.25}s`, animationFillMode: "both", opacity: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center",
              justifyContent: "center", background: "rgba(0,212,255,0.1)", flexShrink: 0 }}>
              <Icon style={{ width: 16, height: 16, color: "#00d4ff" }} />
            </div>
            <span style={{ fontSize: 13, color: "#cbd5e1" }}>{label}</span>
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
          <div key={i} style={{ borderRadius: 12, padding: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                style={{ display: "block", marginTop: 6, fontSize: 11, color: "#06b6d4", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                🔗 Source: {sig.source_url}
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
        Scores are multi-dimensional diagnostic estimates. TruthDNA never issues a single binary verdict.
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
            <span style={{ fontSize: 12, color: "rgba(253,230,138,0.85)", lineHeight: 1.6 }}>{u}</span>
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
    try { await navigator.clipboard.writeText(card); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="glass animate-fade-in-up" style={{ padding: 20, animationDelay: "0.45s", animationFillMode: "both", opacity: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
        📋 Shareable Context Card
      </div>
      <p style={{ fontSize: 13, color: "#e2e8f0", marginBottom: 16, lineHeight: 1.6, padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        {card}
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={handleCopy}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: copied ? "rgba(16,185,129,0.1)" : "rgba(0,212,255,0.1)",
            border: copied ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(0,212,255,0.3)",
            color: copied ? "#10b981" : "#00d4ff" }}>
          {copied ? <Check style={{ width: 16, height: 16 }} /> : <Copy style={{ width: 16, height: 16 }} />}
          {copied ? "Copied to Clipboard!" : "Copy Context Card"}
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
    <div style={{ width: "100%", maxWidth: 740, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div className="glass animate-fade-in-up" style={{ padding: 20, display: "flex", alignItems: "center", gap: 16, animationFillMode: "both", opacity: 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <Dna style={{ width: 20, height: 20, color: "#00d4ff" }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>Forensic &amp; Claim Diagnostic Complete</span>
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
          Non-Binary Diagnostic
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

// ─── Main Home Component ──────────────────────────────────────────────────────

export default function Home() {
  const [mode, setMode] = useState<AnalysisMode>("link");
  const [urlInput, setUrlInput] = useState("");
  const [claimInput, setClaimInput] = useState("");
  const [captionInput, setCaptionInput] = useState("");
  const [claimFile, setClaimFile] = useState<File | null>(null);
  const [state, setState] = useState<AnalysisState>({ phase: "idle" });

  // Dropzone drag
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  // 1. Analyze File (Media Forensics)
  const handleFileAnalysis = useCallback(async (file: File) => {
    setState({ phase: "analyzing" });
    const formData = new FormData();
    formData.append("file", file);
    if (captionInput.trim()) {
      formData.append("claim", captionInput.trim());
    }
    try {
      const res = await fetch(API_ANALYZE_MEDIA, { method: "POST", body: formData });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const err = await res.json(); detail = err.detail || detail; } catch {}
        throw new Error(detail);
      }
      const report: MediaDNAReport = await res.json();
      setState({ phase: "complete", report });
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Analysis failed" });
    }
  }, [captionInput]);

  // 2. Analyze Link / Social Reel
  const handleLinkAnalysis = useCallback(async (urlToAnalyze?: string) => {
    const targetUrl = (urlToAnalyze || urlInput).trim();
    if (!targetUrl) return;
    setState({ phase: "analyzing" });
    try {
      const res = await fetch(API_ANALYZE_LINK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const err = await res.json(); detail = err.detail || detail; } catch {}
        throw new Error(detail);
      }
      const report: MediaDNAReport = await res.json();
      setState({ phase: "complete", report });
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Link analysis failed" });
    }
  }, [urlInput]);

  // 3. Analyze Claim / Social Post
  const handleClaimAnalysis = useCallback(async (claimToAnalyze?: string) => {
    const targetClaim = (claimToAnalyze || claimInput).trim();
    if (!targetClaim) return;
    setState({ phase: "analyzing" });
    const formData = new FormData();
    formData.append("claim", targetClaim);
    if (claimFile) {
      formData.append("file", claimFile);
    }
    try {
      const res = await fetch(API_ANALYZE_CLAIM, { method: "POST", body: formData });
      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try { const err = await res.json(); detail = err.detail || detail; } catch {}
        throw new Error(detail);
      }
      const report: MediaDNAReport = await res.json();
      setState({ phase: "complete", report });
    } catch (err: unknown) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Claim verification failed" });
    }
  }, [claimInput, claimFile]);

  const reset = useCallback(() => {
    setState({ phase: "idle" });
    setUrlInput("");
    setClaimInput("");
    setCaptionInput("");
    setClaimFile(null);
  }, []);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }} className="gradient-bg">
      {/* Grid background */}
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
              background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>v0.2</span>
          </div>
          <div style={{ height: 16, width: 1, background: "#1a2540", margin: "0 8px" }} />
          <span style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600,
            color: "#00d4ff", background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)" }}>
            <Shield style={{ width: 14, height: 14 }} /> Universal Forensic &amp; Fact-Checking Engine
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#10b981", animation: "pulse-ring 2s ease-in-out infinite" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>Evidence · Confidence · Uncertainty</span>
        </div>
      </nav>

      {/* Main Container */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>

        {state.phase === "idle" && (
          <div style={{ width: "100%", maxWidth: 680, margin: "0 auto" }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div className="animate-float" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: 76, height: 76, borderRadius: 20, marginBottom: 20,
                background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))",
                border: "1px solid rgba(0,212,255,0.3)" }}>
                <Dna style={{ width: 38, height: 38, color: "#00d4ff" }} />
              </div>
              <h1 style={{ fontSize: 46, fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 12 }}>
                <span className="glow-text" style={{ color: "#00d4ff" }}>Truth</span>
                <span style={{ color: "#fff" }}>DNA</span>
              </h1>
              <p style={{ color: "#64748b", fontSize: 15, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
                Evaluate <span style={{ color: "#00d4ff" }}>Instagram Reels</span>, <span style={{ color: "#a78bfa" }}>Videos</span>, <span style={{ color: "#10b981" }}>News Links</span> &amp; <span style={{ color: "#f59e0b" }}>Claims</span> before sharing.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: "flex", gap: 8, background: "rgba(13,20,36,0.7)", padding: 6, borderRadius: 14,
              border: "1px solid #1a2540", marginBottom: 24, backdropFilter: "blur(12px)" }}>
              {[
                { id: "link" as AnalysisMode, label: "🔗 Reels & Web Links", desc: "Insta, FB, YouTube, News" },
                { id: "media" as AnalysisMode, label: "📁 Media Forensics", desc: "Upload Image or Video" },
                { id: "claim" as AnalysisMode, label: "✍️ Claim & Social Post", desc: "Text Rumor / Screenshot" },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setMode(id)}
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                    background: mode === id ? "rgba(0,212,255,0.15)" : "transparent",
                    color: mode === id ? "#00d4ff" : "#64748b",
                    border: mode === id ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ─── TAB 1: Link & Reel Stream Analysis ─────────────────────────── */}
            {mode === "link" && (
              <div className="glass neon-border" style={{ borderRadius: 20, padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <Globe style={{ width: 18, height: 18, color: "#00d4ff" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Paste Reel, Video, or Article URL</span>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="url"
                    placeholder="e.g. https://www.instagram.com/reel/... or https://youtube.com/shorts/..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLinkAnalysis()}
                    style={{ flex: 1, padding: "14px 16px", borderRadius: 12, fontSize: 13, background: "rgba(8,11,20,0.8)",
                      border: "1px solid #1a2540", color: "#fff", outline: "none" }}
                  />
                  <button
                    onClick={() => handleLinkAnalysis()}
                    disabled={!urlInput.trim()}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", borderRadius: 12,
                      fontSize: 13, fontWeight: 600, cursor: urlInput.trim() ? "pointer" : "not-allowed",
                      background: urlInput.trim() ? "linear-gradient(135deg, #00d4ff, #7c3aed)" : "rgba(26,37,64,0.6)",
                      color: urlInput.trim() ? "#080b14" : "#475569", border: "none" }}>
                    Analyze <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 16, fontSize: 11, color: "#475569" }}>
                  <span>Supported:</span>
                  {["Instagram Reels", "Facebook Videos", "YouTube Shorts", "Twitter/X", "News Articles"].map((p) => (
                    <span key={p} style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#64748b" }}>
                      {p}
                    </span>
                  ))}
                </div>

                {/* Sample presets for quick judge testing */}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(26,37,64,0.6)" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles style={{ width: 13, height: 13, color: "#00d4ff" }} /> Try a sample link:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      { label: "Wikipedia: Moon Landing Conspiracy", url: "https://en.wikipedia.org/wiki/Moon_landing_conspiracy_theories" },
                      { label: "Satire Article (The Onion)", url: "https://theonion.com/scientists-discover-new-form-of-matter/" },
                    ].map(({ label, url }) => (
                      <button key={label} onClick={() => { setUrlInput(url); handleLinkAnalysis(url); }}
                        style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: "rgba(0,212,255,0.05)",
                          border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", cursor: "pointer" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB 2: Media Dropzone Forensics ────────────────────────────── */}
            {mode === "media" && (
              <div>
                <div
                  id="file-dropzone"
                  className={cn("glass neon-border", dragging && "dropzone-active")}
                  style={{ borderRadius: 20, padding: 40, textAlign: "center", cursor: "pointer", transition: "all 0.3s" }}
                  onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag}
                  onDrop={(e) => {
                    e.preventDefault(); setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileAnalysis(f);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}>

                  <input ref={fileInputRef} id="file-input" type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                    style={{ display: "none" }}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileAnalysis(f); }} />

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                      background: dragging ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.08)",
                      border: "1px solid rgba(0,212,255,0.2)" }}>
                      <UploadCloud style={{ width: 28, height: 28, color: "#00d4ff" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 17, fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                        {dragging ? "Release to analyze" : "Drop media file here"}
                      </p>
                      <p style={{ fontSize: 13, color: "#64748b" }}>or click to browse local storage</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 14 }}>
                    {["JPEG", "PNG", "WebP", "MP4", "WebM", "MOV"].map((f) => (
                      <span key={f} style={{ padding: "2px 8px", borderRadius: 999, fontSize: 10, fontFamily: "monospace",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#475569" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Optional claim caption */}
                <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(13,20,36,0.5)", border: "1px solid #1a2540" }}>
                  <label style={{ display: "block", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
                    Optional Caption / Claim to verify against this media:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 'Viral claim: Flood in Delhi yesterday submerging roads'"
                    value={captionInput}
                    onChange={(e) => setCaptionInput(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 8, fontSize: 12, background: "rgba(8,11,20,0.8)",
                      border: "1px solid #1a2540", color: "#fff", outline: "none" }}
                  />
                </div>
              </div>
            )}

            {/* ─── TAB 3: Text Claim & Rumor Verification ─────────────────────── */}
            {mode === "claim" && (
              <div className="glass neon-border" style={{ borderRadius: 20, padding: 32 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <FileText style={{ width: 18, height: 18, color: "#f59e0b" }} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0" }}>Paste Claim, WhatsApp Forward, or Tweet Text</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="e.g. 'Pope Francis was seen wearing a white Balenciaga designer puffer coat in Paris' or paste viral forwarded message..."
                  value={claimInput}
                  onChange={(e) => setClaimInput(e.target.value)}
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 13, background: "rgba(8,11,20,0.8)",
                    border: "1px solid #1a2540", color: "#fff", outline: "none", resize: "vertical", fontFamily: "inherit" }}
                />

                {/* Optional screenshot attachment */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input ref={screenshotInputRef} type="file" accept="image/*" style={{ display: "none" }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setClaimFile(f); }} />
                    <button onClick={() => screenshotInputRef.current?.click()}
                      style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", cursor: "pointer" }}>
                      📷 {claimFile ? `Attached: ${claimFile.name.slice(0, 18)}...` : "Attach Screenshot (Optional)"}
                    </button>
                    {claimFile && (
                      <button onClick={() => setClaimFile(null)} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
                        Remove
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => handleClaimAnalysis()}
                    disabled={!claimInput.trim()}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10,
                      fontSize: 13, fontWeight: 600, cursor: claimInput.trim() ? "pointer" : "not-allowed",
                      background: claimInput.trim() ? "linear-gradient(135deg, #f59e0b, #00d4ff)" : "rgba(26,37,64,0.6)",
                      color: claimInput.trim() ? "#080b14" : "#475569", border: "none" }}>
                    Fact-Check <ArrowRight style={{ width: 15, height: 15 }} />
                  </button>
                </div>

                {/* Presets */}
                <div style={{ marginTop: 20, paddingTop: 14, borderTop: "1px solid rgba(26,37,64,0.6)" }}>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles style={{ width: 13, height: 13, color: "#f59e0b" }} /> Test sample rumors:
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {[
                      "Pope Francis photographed wearing a white luxury puffer jacket in Paris",
                      "Drinking boiled garlic water completely prevents coronavirus",
                      "NASA announced earth will experience 15 days of total darkness",
                    ].map((sample) => (
                      <button key={sample} onClick={() => { setClaimInput(sample); handleClaimAnalysis(sample); }}
                        style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, background: "rgba(245,158,11,0.06)",
                          border: "1px solid rgba(245,158,11,0.25)", color: "#fcd34d", cursor: "pointer", textAlign: "left" }}>
                        {sample.slice(0, 48)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Safety Footer info */}
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 32 }}>
              {[
                { icon: Shield, label: "ELA Frame Forensics", color: "#10b981" },
                { icon: Video, label: "Reel & Video Stream Analyzer", color: "#00d4ff" },
                { icon: Search, label: "Snopes & Fact-Check Grounding", color: "#a78bfa" },
                { icon: Zap, label: "Non-Binary 3-Pillars", color: "#f59e0b" },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 999,
                  fontSize: 12, fontWeight: 500, background: `${color}10`, border: `1px solid ${color}30`, color }}>
                  <Icon style={{ width: 14, height: 14 }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {(state.phase === "uploading" || state.phase === "analyzing") && <LoadingSequencer mode={mode} />}

        {/* Error */}
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

        {/* Complete Diagnostic */}
        {state.phase === "complete" && <DiagnosticView report={state.report} onReset={reset} />}
      </div>

      <footer style={{ position: "relative", zIndex: 10, padding: "16px", borderTop: "1px solid rgba(26,37,64,0.6)", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "#334155" }}>
          TruthDNA enforces a non-binary diagnostic model. No output constitutes a definitive verdict.
        </p>
      </footer>
    </main>
  );
}
