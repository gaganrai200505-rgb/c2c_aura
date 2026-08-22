"use client";

import { useState, useCallback, useRef } from "react";
import {
  UploadCloud,
  Dna,
  AlertTriangle,
  Copy,
  Check,
  Shield,
  Activity,
  Search,
  Zap,
  Lock,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  ExternalLink,
  Clock,
  Fingerprint,
} from "lucide-react";
import type { AnalysisState, ForensicSignal, MediaDNAReport } from "@/types/truthdna";

const API_URL = "http://localhost:8000/api/analyze";

// ─── Utility ────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

function formatMetricLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
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
    status === "Clean"
      ? "bg-emerald-400"
      : status === "Suspicious"
      ? "bg-amber-400"
      : "bg-red-400";

  return (
    <span
      className={cn(
        cls,
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium tracking-wide"
      )}
    >
      <span className={cn(dot, "w-1.5 h-1.5 rounded-full")} />
      {status}
    </span>
  );
}

// ─── Confidence dial ──────────────────────────────────────────────────────────

function ConfidenceDial({ label, value }: { label: string; value: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const offset = circumference - clamped * circumference;

  const color =
    clamped >= 0.7
      ? "#10b981"
      : clamped >= 0.4
      ? "#f59e0b"
      : "#ef4444";

  const formattedLabel = formatMetricLabel(label);

  return (
    <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 min-w-[120px]">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={radius} className="dial-track" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="dial-fill"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-mono font-bold" style={{ color }}>
            {Math.round(clamped * 100)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-center font-medium text-slate-200 line-clamp-1 max-w-[110px]">
        {formattedLabel}
      </span>
    </div>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────

function LoadingSequencer({ fileName }: { fileName?: string }) {
  const steps = [
    { icon: Activity, label: "Running ELA micro-forensics..." },
    { icon: Dna, label: "Extracting digital genome & pHash..." },
    { icon: Search, label: "Searching Qdrant vector ledger..." },
    { icon: Zap, label: "Synthesizing with Gemini 2.5 Flash..." },
  ];

  return (
    <div className="flex flex-col items-center gap-8 py-16 w-full max-w-md mx-auto">
      {/* Spinning DNA ring */}
      <div className="relative w-24 h-24">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-purple-500 animate-spin"
          style={{ animationDuration: "1.4s" }}
        />
        <div
          className="absolute inset-2 rounded-full border-2 border-transparent border-b-cyan-400 border-l-purple-500 animate-spin"
          style={{ animationDuration: "1s", animationDirection: "reverse" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <Dna className="w-7 h-7 text-cyan-400" />
        </div>
      </div>

      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-white tracking-tight font-mono">
          Sequencing Media DNA
        </h2>
        {fileName && (
          <p className="text-xs font-mono text-cyan-400 bg-slate-900 px-3 py-1 rounded-md border border-slate-800 inline-block">
            {fileName}
          </p>
        )}
        <p className="text-slate-400 text-xs pt-1">
          Running multi-dimensional forensic analysis...
        </p>
      </div>

      {/* Step indicators */}
      <div className="flex flex-col gap-3 w-full">
        {steps.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl glass"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "rgba(0,212,255,0.1)" }}
            >
              <Icon className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-xs font-mono text-slate-300">{label}</span>
            <div className="ml-auto w-4 h-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Evidence matrix ──────────────────────────────────────────────────────────

function EvidenceMatrix({ signals }: { signals: ForensicSignal[] }) {
  const [filter, setFilter] = useState<string>("ALL");

  const filtered =
    filter === "ALL"
      ? signals
      : signals.filter((s) => s.status === filter);

  return (
    <div className="glass p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(0,212,255,0.15)" }}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Pillar 1: Evidence Matrix
            </h3>
            <p className="text-xs text-slate-400">
              {signals.length} signal{signals.length !== 1 ? "s" : ""} evaluated
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {["ALL", "Altered", "Suspicious", "Clean"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-2.5 py-1 rounded text-xs font-mono transition-colors",
                filter === f
                  ? "bg-slate-800 text-white font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 font-mono py-4 text-center">
            No signals match the selected filter.
          </p>
        ) : (
          filtered.map((sig, i) => (
            <div
              key={i}
              className="rounded-xl p-4 bg-slate-900/40 border border-slate-800/80 hover:border-slate-700 transition-all space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-bold text-slate-200 font-mono tracking-wide">
                  {sig.dimension}
                </span>
                <StatusPill status={sig.status} />
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {sig.finding}
              </p>
              {(sig.media_timestamp || sig.source_url) && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
                  {sig.media_timestamp && (
                    <span className="inline-flex items-center gap-1 text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Clock className="w-3 h-3 text-cyan-500" />
                      @ {sig.media_timestamp}
                    </span>
                  )}
                  {sig.source_url && (
                    <a
                      href={sig.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-400 hover:underline truncate max-w-sm"
                    >
                      <ExternalLink className="w-3 h-3 text-cyan-500 shrink-0" />
                      <span className="truncate">{sig.source_url}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Confidence dials ─────────────────────────────────────────────────────────

function ConfidenceDials({ breakdown }: { breakdown: Record<string, number> }) {
  const entries = Object.entries(breakdown);
  return (
    <div className="glass p-6 space-y-5">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(124,58,237,0.15)" }}
        >
          <Activity className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Pillar 2: Confidence Calibration
          </h3>
          <p className="text-xs text-slate-400">
            {entries.length} dimensional confidence metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {entries.map(([key, val]) => (
          <ConfidenceDial key={key} label={key} value={val} />
        ))}
      </div>

      <p className="text-xs font-mono text-slate-500 text-center pt-2 leading-relaxed">
        Scores represent vector probability calibrations and do not force a single binary label.
      </p>
    </div>
  );
}

// ─── Uncertainty box ──────────────────────────────────────────────────────────

function UncertaintyBox({ uncertainties }: { uncertainties: string[] }) {
  return (
    <div className="rounded-2xl p-6 bg-amber-950/20 border border-amber-900/40 space-y-4">
      <div className="flex items-center gap-2.5 pb-3 border-b border-amber-900/30">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
        <h3 className="text-sm font-bold text-amber-300 font-mono uppercase tracking-wider">
          Pillar 3: Explicit Uncertainties & Blind Spots
        </h3>
      </div>

      <ul className="flex flex-col gap-2.5">
        {uncertainties.map((u, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs font-mono text-amber-200/90 leading-relaxed">{u}</span>
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
    <div className="glass p-6 space-y-3">
      <div className="flex items-center gap-2">
        <Dna className="w-4 h-4 text-cyan-400" />
        <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
          Forensic Chain-of-Thought Rationale
        </h3>
      </div>
      <p className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-950/60 p-4 rounded-xl border border-slate-800">
        {display}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
        >
          {expanded ? (
            <>
              Show less <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Read full rationale <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
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

  const handleDownload = () => {
    const blob = new Blob([card], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TruthDNA-Report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
          Shareable Context Card:
        </span>
      </div>
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed select-all">
        {card}
      </div>
      <div className="flex gap-3 flex-wrap pt-2">
        <button
          id="copy-context-card"
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all"
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
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all"
        >
          <Download className="w-4 h-4" />
          Download Markdown
        </button>

        <button
          id="analyze-another"
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all ml-auto"
          style={{
            background: "rgba(124,58,237,0.1)",
            border: "1px solid rgba(124,58,237,0.3)",
            color: "#a78bfa",
          }}
        >
          <RotateCcw className="w-4 h-4" />
          Analyze Another File
        </button>
      </div>
    </div>
  );
}

// ─── Diagnostic view (3 pillars) ─────────────────────────────────────────────

function DiagnosticView({
  report,
  fileName,
  onReset,
}: {
  report: MediaDNAReport;
  fileName?: string;
  onReset: () => void;
}) {
  const alteredCount = report.forensic_evidence.filter((s) => s.status === "Altered").length;
  const suspiciousCount = report.forensic_evidence.filter((s) => s.status === "Suspicious").length;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 py-6">
      {/* Summary bar */}
      <div className="glass p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Dna className="w-5 h-5 text-cyan-400" />
            <span className="text-base font-bold text-white font-mono">
              Forensic Analysis Complete
            </span>
            {fileName && (
              <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {fileName}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            {report.forensic_evidence.length} signals analysed ·{" "}
            <span className="text-red-400">{alteredCount} Altered</span> ·{" "}
            <span className="text-amber-400">{suspiciousCount} Suspicious</span>
            {report.lineage_match_found && (
              <span className="text-cyan-400"> · Lineage match detected</span>
            )}
          </p>
        </div>

        {report.digital_genome?.visual_phash && (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <Fingerprint className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="truncate max-w-[140px]">{report.digital_genome.visual_phash}</span>
          </div>
        )}
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
      if (file) {
        onFile(file);
      }
    },
    [onFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFile(file);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-8">
      {/* Logo / Hero */}
      <div className="text-center mb-10 space-y-4">
        {/* Protocol Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-xs font-mono font-medium text-cyan-300 shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>NON-BINARY DIAGNOSTIC PROTOCOL</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <div
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl"
            style={{
              background: "rgba(0, 212, 255, 0.1)",
              border: "1px solid rgba(0, 212, 255, 0.3)",
            }}
          >
            <Dna className="w-6 h-6 text-cyan-400" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
            <span className="text-cyan-400">Truth</span>DNA
          </h1>
        </div>

        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Multi-layered forensic media analysis evaluating Evidence, Confidence Calibration, and Explicit Uncertainty without binary verdict forcing.
        </p>
      </div>

      {/* Drop zone */}
      <div
        id="file-dropzone"
        className={cn(
          "relative rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-300 glass",
          dragging && "border-cyan-400 bg-cyan-950/20 scale-[1.01]"
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
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
            style={{
              background: dragging ? "rgba(0,212,255,0.2)" : "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
            }}
          >
            <UploadCloud className="w-7 h-7 text-cyan-400" />
          </div>

          <div>
            <p className="text-lg font-semibold text-white mb-1">
              {dragging ? "Release file to begin forensic pipeline" : "Drop media file here"}
            </p>
            <p className="text-xs text-slate-400">
              or <span className="text-cyan-400 hover:underline font-semibold">browse files from computer</span>
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {["JPEG", "PNG", "WebP", "GIF", "MP4", "WebM", "MOV"].map((f) => (
              <span
                key={f}
                className="px-2 py-0.5 rounded text-xs font-mono bg-slate-900 border border-slate-800 text-slate-400"
              >
                {f}
              </span>
            ))}
          </div>

          <p className="text-xs text-slate-500 font-mono mt-1">Max 20MB · Images & Videos</p>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono pt-2">
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            <span>Processed securely in volatile memory</span>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-2.5 mt-8">
        {[
          { icon: Shield, label: "ELA Forensics", tag: "Micro-Forensics" },
          { icon: Dna, label: "DNA Fingerprint", tag: "Perceptual Hash" },
          { icon: Search, label: "Lineage Search", tag: "Vector Ledger" },
          { icon: Zap, label: "Gemini 2.5 Flash", tag: "LLM Engine" },
        ].map(({ icon: Icon, label, tag }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono text-slate-200 transition-all shadow-xs group cursor-default"
          >
            <Icon className="w-3.5 h-3.5 text-cyan-400 group-hover:text-cyan-300 shrink-0" />
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              {tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [state, setState] = useState<AnalysisState>({ phase: "idle" });
  const [activeFileName, setActiveFileName] = useState<string | undefined>();

  const handleFile = useCallback(async (file: File) => {
    setActiveFileName(file.name);
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
        message: err instanceof Error ? err.message : "Unknown forensic analysis error",
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ phase: "idle" });
    setActiveFileName(undefined);
  }, []);

  return (
    <main className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
      {/* Nav bar */}
      <nav className="relative z-10 flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white tracking-wide">TruthDNA</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono"
              style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}>
              v0.1
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2 sm:mt-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-slate-400">3-Pillar Diagnostic</span>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {state.phase === "idle" && <HeroDropzone onFile={handleFile} />}

        {(state.phase === "uploading" || state.phase === "analyzing") && (
          <LoadingSequencer fileName={activeFileName} />
        )}

        {state.phase === "error" && (
          <div className="w-full max-w-lg mx-auto text-center">
            <div
              className="glass rounded-2xl p-8 space-y-4"
              style={{
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.05)",
              }}
            >
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-white font-mono">Analysis Failed</h2>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">{state.message}</p>
              <button
                id="retry-button"
                onClick={reset}
                className="px-5 py-2 rounded-xl text-xs font-mono font-semibold transition-all hover:scale-105"
                style={{
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.3)",
                  color: "#00d4ff",
                }}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {state.phase === "complete" && (
          <DiagnosticView report={state.report} fileName={activeFileName} onReset={reset} />
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-800/80 text-center font-mono text-xs text-slate-500">
        <p>TruthDNA enforces a non-binary diagnostic methodology. No output constitutes a definitive verdict.</p>
      </footer>
    </main>
  );
}
