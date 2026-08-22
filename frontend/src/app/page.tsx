"use client";

import { useState, useCallback, useRef } from "react";
import { UploadCloud, Dna, AlertTriangle, Copy, Check, Shield, Activity, Search, Zap } from "lucide-react";
import type { AnalysisState, ForensicSignal, MediaDNAReport } from "@/types/truthdna";

const API_URL = "http://localhost:8000/api/analyze";

// ─── Utility ────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ForensicSignal["status"] }) {
  const cls =
    status === "Clean"
      ? "pill-clean"
      : status === "Suspicious"
      ? "pill-suspicious"
      : "pill-altered";
  const dot =
    status === "Clean" ? "bg-emerald-400" : status === "Suspicious" ? "bg-amber-400" : "bg-red-400";

  return (
    <span
      className={cn(
        cls,
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide"
      )}
    >
      <span className={cn(dot, "w-1.5 h-1.5 rounded-full")} />
      {status}
    </span>
  );
}

// ─── Confidence dial ──────────────────────────────────────────────────────────

function ConfidenceDial({ label, value }: { label: string; value: number }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - value * circumference;

  const color =
    value >= 0.7
      ? "#10b981"
      : value >= 0.4
      ? "#f59e0b"
      : "#ef4444";

  const formattedLabel = label
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          <circle cx="48" cy="48" r={radius} className="dial-track" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            className="dial-fill"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(value * 100)}
          </span>
        </div>
      </div>
      <span className="text-xs text-center text-slate-400 leading-tight max-w-[80px]">
        {formattedLabel}
      </span>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingSequencer() {
  const steps = [
    { icon: Activity, label: "Running ELA micro-forensics..." },
    { icon: Dna, label: "Extracting digital genome..." },
    { icon: Search, label: "Scanning vector ledger..." },
    { icon: Zap, label: "Synthesizing with Gemini 2.5 Flash..." },
  ];

  return (
    <div className="flex flex-col items-center gap-8 py-16">
      {/* Spinning DNA ring */}
      <div className="relative w-28 h-28">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderTopColor: "#00d4ff",
            borderRightColor: "#7c3aed",
            animation: "dna-spin 1.4s linear infinite",
          }}
        />
        <div
          className="absolute inset-3 rounded-full border-2 border-transparent"
          style={{
            borderBottomColor: "#00d4ff",
            borderLeftColor: "#7c3aed",
            animation: "dna-spin 1s linear infinite reverse",
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Dna className="w-8 h-8 text-cyan-400" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold glow-text text-cyan-400 mb-2">
          Sequencing Media DNA
        </h2>
        <p className="text-slate-400 text-sm">
          Running multi-dimensional forensic analysis...
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex flex-col gap-3 w-full max-w-sm">
        {steps.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl glass animate-fade-in-up"
            style={{ animationDelay: `${i * 0.3}s`, animationFillMode: "both", opacity: 0 }}
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(0,212,255,0.1)" }}>
              <Icon className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-300">{label}</span>
            <div className="ml-auto w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence matrix ──────────────────────────────────────────────────────────

function EvidenceMatrix({ signals }: { signals: ForensicSignal[] }) {
  return (
    <div
      className="glass p-6 animate-fade-in-up"
      style={{ animationDelay: "0.1s", animationFillMode: "both", opacity: 0 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(0,212,255,0.15)" }}>
          <Shield className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">Evidence Matrix</h3>
        <span className="ml-auto text-xs text-slate-500">{signals.length} signal{signals.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="flex flex-col gap-3">
        {signals.map((sig, i) => (
          <div
            key={i}
            className="rounded-xl p-4 transition-all hover:scale-[1.01]"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <span className="text-sm font-medium text-slate-200">{sig.dimension}</span>
              <StatusPill status={sig.status} />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{sig.finding}</p>
            {sig.media_timestamp && (
              <span className="mt-2 inline-block text-xs text-cyan-600 font-mono">
                @ {sig.media_timestamp}
              </span>
            )}
            {sig.source_url && (
              <a
                href={sig.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-xs text-cyan-500 hover:underline truncate"
              >
                {sig.source_url}
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Confidence dials ─────────────────────────────────────────────────────────

function ConfidenceDials({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown);
  return (
    <div
      className="glass p-6 animate-fade-in-up"
      style={{ animationDelay: "0.2s", animationFillMode: "both", opacity: 0 }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "rgba(124,58,237,0.15)" }}>
          <Activity className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">Confidence Breakdown</h3>
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {entries.map(([key, val]) => (
          <ConfidenceDial key={key} label={key} value={Math.max(0, Math.min(1, val))} />
        ))}
      </div>

      <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed">
        Scores are multi-dimensional estimates, not a single verdict.
        Individual confidence values do not confirm or deny manipulation.
      </p>
    </div>
  );
}

// ─── Uncertainty box ──────────────────────────────────────────────────────────

function UncertaintyBox({ uncertainties }: { uncertainties: string[] }) {
  return (
    <div
      className="rounded-2xl p-6 animate-fade-in-up"
      style={{
        animationDelay: "0.3s",
        animationFillMode: "both",
        opacity: 0,
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.25)",
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
        <h3 className="text-base font-semibold text-amber-300">Known Unknowns & Blind Spots</h3>
      </div>
      <ul className="flex flex-col gap-2.5">
        {uncertainties.map((u, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
            <span className="text-xs text-amber-200/80 leading-relaxed">{u}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Weighting rationale ──────────────────────────────────────────────────────

function WeightingRationale({ rationale }: { rationale: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = rationale.length > 300;
  const display = expanded || !isLong ? rationale : rationale.slice(0, 300) + "...";

  return (
    <div
      className="glass p-6 animate-fade-in-up"
      style={{ animationDelay: "0.35s", animationFillMode: "both", opacity: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Dna className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-slate-300">AI Chain-of-Thought Rationale</h3>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{display}</p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-cyan-500 hover:text-cyan-300 transition-colors"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}

// ─── Action tray ──────────────────────────────────────────────────────────────

function ActionTray({ card, onReset }: { card: string; onReset: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const el = document.createElement("textarea");
      el.value = card;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="glass p-5 animate-fade-in-up"
      style={{ animationDelay: "0.45s", animationFillMode: "both", opacity: 0 }}
    >
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        <span className="text-cyan-400 font-semibold">Shareable Context Card: </span>
        {card}
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          id="copy-context-card"
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: copied ? "rgba(16,185,129,0.15)" : "rgba(0,212,255,0.1)",
            border: `1px solid ${copied ? "rgba(16,185,129,0.4)" : "rgba(0,212,255,0.3)"}`,
            color: copied ? "#10b981" : "#00d4ff",
          }}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy Context Card"}
        </button>
        <button
          id="analyze-another"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
          }}
        >
          <Dna className="w-4 h-4" />
          Analyze Another
        </button>
      </div>
    </div>
  );
}

// ─── Diagnostic view (3 pillars) ─────────────────────────────────────────────

function DiagnosticView({ report, onReset }: { report: MediaDNAReport; onReset: () => void }) {
  const alteredCount = report.forensic_evidence.filter((s) => s.status === "Altered").length;
  const suspiciousCount = report.forensic_evidence.filter((s) => s.status === "Suspicious").length;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
      {/* Summary bar */}
      <div
        className="glass p-5 flex items-center gap-4 animate-fade-in-up"
        style={{ animationFillMode: "both", opacity: 0 }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <Dna className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold text-white">Forensic Analysis Complete</span>
          </div>
          <p className="text-xs text-slate-400">
            {report.forensic_evidence.length} signals analysed ·{" "}
            <span className="text-red-400">{alteredCount} Altered</span> ·{" "}
            <span className="text-amber-400">{suspiciousCount} Suspicious</span>
            {report.lineage_match_found && (
              <span className="text-cyan-400"> · Lineage match detected</span>
            )}
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{
            background: "rgba(0,212,255,0.1)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "#00d4ff",
          }}
        >
          No Binary Verdict
        </div>
      </div>

      {/* Pillar 1 — Evidence Matrix */}
      <EvidenceMatrix signals={report.forensic_evidence} />

      {/* Pillar 2 — Confidence Dials */}
      <ConfidenceDials breakdown={report.confidence_breakdown} />

      {/* Pillar 3 — Uncertainty Box */}
      <UncertaintyBox uncertainties={report.explicit_uncertainties} />

      {/* Chain-of-thought */}
      <WeightingRationale rationale={report.weighting_rationale} />

      {/* Action Tray */}
      <ActionTray card={report.shareable_context_card} onReset={onReset} />
    </div>
  );
}

// ─── Hero Drop Zone ───────────────────────────────────────────────────────────

function HeroDropzone({ onFile }: { onFile: (file: File) => void }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(e.type === "dragenter" || e.type === "dragover");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFile(file);
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Logo / Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 animate-float"
          style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))", border: "1px solid rgba(0,212,255,0.3)" }}>
          <Dna className="w-10 h-10 text-cyan-400" />
        </div>
        <h1 className="text-5xl font-black tracking-tight mb-3">
          <span className="glow-text text-cyan-400">Truth</span>
          <span className="text-white">DNA</span>
        </h1>
        <p className="text-slate-400 text-base max-w-sm mx-auto leading-relaxed">
          Forensic media analysis powered by AI. 
          <span className="text-amber-400"> Never a binary verdict</span> — always Evidence, Confidence & Uncertainty.
        </p>
      </div>

      {/* Drop zone */}
      <div
        id="file-dropzone"
        className={cn(
          "relative rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
          "glass neon-border",
          dragging && "dropzone-active"
        )}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload media file for analysis"
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          id="file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
          className="hidden"
          onChange={handleChange}
          aria-label="Select file for forensic analysis"
        />

        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: dragging ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              transform: dragging ? "scale(1.1)" : "scale(1)",
            }}
          >
            <UploadCloud className="w-8 h-8 text-cyan-400" />
          </div>

          <div>
            <p className="text-xl font-semibold text-white mb-1">
              {dragging ? "Release to analyze" : "Drop media here"}
            </p>
            <p className="text-sm text-slate-400">
              or <span className="text-cyan-400 hover:underline">browse files</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mt-2">
            {["JPEG", "PNG", "WebP", "GIF", "MP4", "WebM", "MOV"].map((f) => (
              <span
                key={f}
                className="px-2.5 py-0.5 rounded-full text-xs font-mono"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#64748b",
                }}
              >
                {f}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-600 mt-1">Max 20MB · Images & Videos</p>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        {[
          { icon: Shield, label: "ELA Forensics", color: "#10b981" },
          { icon: Dna, label: "DNA Fingerprint", color: "#00d4ff" },
          { icon: Search, label: "Lineage Search", color: "#a78bfa" },
          { icon: Zap, label: "Gemini 2.5 Flash", color: "#f59e0b" },
        ].map(({ icon: Icon, label, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: `${color}10`,
              border: `1px solid ${color}30`,
              color,
            }}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AnalysisState>({ phase: "idle" });

  const handleFile = useCallback(async (file: File) => {
    setState({ phase: "uploading" });

    const formData = new FormData();
    formData.append("file", file);

    setState({ phase: "analyzing" });

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let detail = `HTTP ${res.status}`;
        try {
          const err = await res.json();
          detail = err.detail || detail;
        } catch {}
        throw new Error(detail);
      }

      const report: MediaDNAReport = await res.json();
      setState({ phase: "complete", report });
    } catch (err: unknown) {
      setState({
        phase: "error",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return (
    <main className="min-h-screen gradient-bg flex flex-col">
      {/* Background grid */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Nav bar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Dna className="w-5 h-5 text-cyan-400" />
          <span className="text-sm font-bold text-white tracking-wide">TruthDNA</span>
          <span className="px-2 py-0.5 rounded text-xs font-mono"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
            v0.1
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">3-Pillar Diagnostic</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-12">
        {state.phase === "idle" && <HeroDropzone onFile={handleFile} />}

        {(state.phase === "uploading" || state.phase === "analyzing") && (
          <LoadingSequencer />
        )}

        {state.phase === "error" && (
          <div className="w-full max-w-lg mx-auto text-center">
            <div className="glass rounded-2xl p-8"
              style={{ border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)" }}>
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Analysis Failed</h2>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">{state.message}</p>
              <button
                id="retry-button"
                onClick={reset}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff" }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {state.phase === "complete" && (
          <DiagnosticView report={state.report} onReset={reset} />
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 border-t border-slate-800/60 text-center">
        <p className="text-xs text-slate-600">
          TruthDNA enforces a non-binary diagnostic. No output constitutes a definitive verdict.
        </p>
      </footer>
    </main>
  );
}
