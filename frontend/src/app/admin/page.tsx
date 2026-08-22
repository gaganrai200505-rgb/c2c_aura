"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Activity,
  Cpu,
  Database,
  FileText,
  RefreshCw,
  Shield,
  Server,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Dna,
  Zap,
  Layers,
  ArrowLeft,
  Search,
} from "lucide-react";

// API endpoints
const STATS_URL = "http://localhost:8000/api/admin/stats";
const LEDGER_URL = "http://localhost:8000/api/admin/ledger/records";
const LOG_URL = "http://localhost:8000/api/admin/log";

// Interfaces
interface SystemStats {
  system: {
    uptime_seconds: number;
    uptime_human: string;
    python_version: string;
    platform: string;
  };
  clip_model: {
    status: "loaded" | "failed" | "not_loaded_yet";
    model_name: string;
    load_attempted: boolean;
    load_failed: boolean;
  };
  ledger: {
    collection_name?: string;
    vector_count?: number;
    vector_dim?: number;
    distance_metric?: string;
    similarity_threshold?: number;
    status?: string;
    error?: string;
  };
  ledger_config: {
    collection: string;
    vector_dim: number;
    similarity_threshold: number;
    top_k: number;
  };
  analysis_stats: {
    total_analyses: number;
    lineage_matches: number;
    fallbacks_triggered: number;
    avg_ela_score: number;
    avg_duration_sec: number;
  };
}

interface LedgerRecord {
  id: string;
  payload: {
    event_id?: string;
    description?: string;
    source_url?: string;
    capture_date?: string;
    region?: string;
    media_type?: string;
    tags?: string[];
    is_seed?: boolean;
    [key: string]: unknown;
  };
}

interface AuditLogEntry {
  filename: string;
  media_type: string;
  ela_score: number;
  lineage_match: boolean;
  embedding_valid: boolean;
  search_failed: boolean;
  duration_sec: number;
  timestamp: string;
}

function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [ledgerRecords, setLedgerRecords] = useState<LedgerRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"overview" | "ledger" | "logs">("overview");

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsRes, ledgerRes, logsRes] = await Promise.all([
        fetch(STATS_URL),
        fetch(LEDGER_URL),
        fetch(LOG_URL),
      ]);

      if (!statsRes.ok) throw new Error(`Stats endpoint returned HTTP ${statsRes.status}`);
      if (!ledgerRes.ok) throw new Error(`Ledger endpoint returned HTTP ${ledgerRes.status}`);
      if (!logsRes.ok) throw new Error(`Log endpoint returned HTTP ${logsRes.status}`);

      const statsData: SystemStats = await statsRes.json();
      const ledgerData = await ledgerRes.json();
      const logsData = await logsRes.json();

      setStats(statsData);
      setLedgerRecords(ledgerData.records || []);
      setAuditLogs(logsData.entries || []);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to connect to TruthDNA Admin API.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return (
    <main className="min-h-screen gradient-bg flex flex-col text-slate-200">
      {/* Background grid pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Top Navigation Bar */}
      <nav className="relative z-10 flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Dna className="w-5 h-5 text-cyan-400" />
            <span className="text-sm font-bold text-white tracking-wide">TruthDNA</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-mono"
              style={{
                background: "rgba(0,212,255,0.1)",
                color: "#00d4ff",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              ADMIN
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800 mx-2" />

          {/* Navigation Links */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg border border-slate-800/80">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Forensic Analysis
            </Link>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-500/30">
              <Shield className="w-3.5 h-3.5" />
              Admin Dashboard
            </span>
          </div>
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center gap-4">
          {lastRefreshed && (
            <span className="text-xs font-mono text-slate-400 hidden md:inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Updated: {lastRefreshed}
            </span>
          )}

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5",
              autoRefresh
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/30"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            )}
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              )}
            />
            {autoRefresh ? "Auto-refresh ON (5s)" : "Auto-refresh OFF"}
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors disabled:opacity-50"
            title="Refresh diagnostics now"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-cyan-400")} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 px-4 sm:px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 glass p-4 rounded-xl border border-red-500/30 bg-red-950/20 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-300">Backend Connection Warning</h4>
              <p className="text-xs text-red-200/70">{error}</p>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 rounded bg-red-900/50 hover:bg-red-900/80 text-xs font-medium text-red-200 border border-red-500/30"
            >
              Retry
            </button>
          </div>
        )}

        {/* Tab Selection Headers */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-3">
          {[
            { id: "overview", label: "System Diagnostics & Metrics", icon: Activity },
            { id: "ledger", label: `Vector Ledger Records (${ledgerRecords.length})`, icon: Database },
            { id: "logs", label: `Analysis Audit Logs (${auditLogs.length})`, icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as "overview" | "ledger" | "logs")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border",
                activeTab === id
                  ? "bg-cyan-950/60 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-950/50"
                  : "bg-slate-900/40 text-slate-400 border-slate-800/60 hover:bg-slate-800/40 hover:text-slate-200"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Top 4 Primary Diagnostic Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: System & Server */}
              <div className="glass p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Server className="w-4 h-4 text-cyan-400" />
                    FastAPI Engine
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                    ONLINE
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-2xl font-bold font-mono text-white">
                      {stats ? stats.system.uptime_human : "--"}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">System Uptime</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Python {stats?.system.python_version || "--"}</span>
                    <span>{stats?.system.platform || "--"}</span>
                  </div>
                </div>
              </div>

              {/* Card 2: CLIP Model Status */}
              <div className="glass p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    CLIP Embedding Model
                  </div>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-mono border",
                      stats?.clip_model.status === "loaded"
                        ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/30"
                        : stats?.clip_model.status === "failed"
                        ? "bg-red-950/60 text-red-400 border-red-500/30"
                        : "bg-amber-950/60 text-amber-400 border-amber-500/30"
                    )}
                  >
                    {stats?.clip_model.status === "loaded"
                      ? "READY"
                      : stats?.clip_model.status === "failed"
                      ? "FAILED"
                      : "LAZY LOAD"}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="text-xs font-mono text-cyan-300 truncate" title={stats?.clip_model.model_name}>
                    {stats?.clip_model.model_name || "openai/clip-vit-base-patch32"}
                  </div>
                  <p className="text-[11px] text-slate-400">512-Dimensional Semantic Encoder</p>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Load Attempted:</span>
                    <span className="font-mono text-slate-300">
                      {stats?.clip_model.load_attempted ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Qdrant Vector Ledger */}
              <div className="glass p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Database className="w-4 h-4 text-purple-400" />
                    Vector Ledger
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/60 text-purple-300 border border-purple-500/30">
                    IN-MEMORY
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-2xl font-bold font-mono text-white">
                      {stats?.ledger.vector_count ?? stats?.ledger_config?.top_k ?? "--"}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Seeded Reference Records</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Dim: {stats?.ledger_config?.vector_dim || 512}</span>
                    <span>Cos ≥ {stats?.ledger_config?.similarity_threshold || 0.8}</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Analysis Engine Stats */}
              <div className="glass p-5 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-slate-300 text-xs font-semibold">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Analyses Pipeline
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-500/30">
                    GEMINI 2.5
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-2xl font-bold font-mono text-white">
                      {stats?.analysis_stats.total_analyses ?? 0}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">Processed Media Requests</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Avg Duration:</span>
                    <span className="font-mono text-amber-300">
                      {stats?.analysis_stats.avg_duration_sec ?? 0}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary Banner */}
            <div className="glass p-6 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">
                    {stats?.analysis_stats.lineage_matches ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">Lineage Vector Matches</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">
                    {stats?.analysis_stats.fallbacks_triggered ?? 0}
                  </div>
                  <div className="text-xs text-slate-400">Pipeline Fallbacks Triggered</div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xl font-bold font-mono text-white">
                    {stats?.analysis_stats.avg_ela_score ?? "0.0000"}
                  </div>
                  <div className="text-xs text-slate-400">Average ELA Compression Score</div>
                </div>
              </div>
            </div>

            {/* Quick Record Snippets preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ledger Quick Preview */}
              <div className="glass p-6 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-purple-400" />
                    Seeded Ledger Records
                  </h3>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    View All ({ledgerRecords.length}) →
                  </button>
                </div>
                <div className="space-y-3">
                  {ledgerRecords.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No ledger records retrieved.</p>
                  ) : (
                    ledgerRecords.slice(0, 3).map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-mono">
                          <span className="text-cyan-300 font-semibold">
                            {rec.payload.event_id || rec.id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                            {rec.payload.media_type || "image"}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-1">
                          {rec.payload.description}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Analysis Log Quick Preview */}
              <div className="glass p-6 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    Recent Analysis Log
                  </h3>
                  <button
                    onClick={() => setActiveTab("logs")}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    View History ({auditLogs.length}) →
                  </button>
                </div>
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
                      No analyses recorded yet. Drop an image on the home page to populate the audit log!
                    </div>
                  ) : (
                    auditLogs.slice(0, 3).map((log, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-200 font-mono">{log.filename}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2">
                            <span>ELA: {log.ela_score}</span>
                            <span>•</span>
                            <span>{log.duration_sec}s</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {log.lineage_match ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30">
                              Lineage Match
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                              No Match
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Qdrant Ledger Records */}
        {activeTab === "ledger" && (
          <div className="glass p-6 rounded-xl border border-slate-800 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-purple-400" />
                  Qdrant Vector Ledger (`truthdna_lineage`)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  In-memory historical records used for cosine similarity lineage matching ($dim=512$, threshold $\ge 0.8$).
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-950/60 text-purple-300 border border-purple-500/30">
                {ledgerRecords.length} Records Active
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Event ID / Record ID</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Tags</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {ledgerRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 italic">
                        No vector records found in collection.
                      </td>
                    </tr>
                  ) : (
                    ledgerRecords.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-cyan-300">{rec.payload.event_id || rec.id}</div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{rec.id}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-sans max-w-sm">
                          {rec.payload.description || "--"}
                        </td>
                        <td className="py-3 px-4 text-slate-400">{rec.payload.region || "--"}</td>
                        <td className="py-3 px-4 text-slate-400">{rec.payload.capture_date || "--"}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {rec.payload.media_type || "image"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {rec.payload.tags?.map((tag) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/60 text-cyan-400 border border-cyan-800/40"
                              >
                                #{tag}
                              </span>
                            )) || "--"}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Analysis Audit Logs */}
        {activeTab === "logs" && (
          <div className="glass p-6 rounded-xl border border-slate-800 animate-fade-in space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Analysis Audit Log (Last 50 Entries)
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  In-memory forensic execution audit log recording ELA scores, vector match outputs, and duration metrics.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                {auditLogs.length} Logged Runs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Filename</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">ELA Score</th>
                    <th className="py-3 px-4">Lineage</th>
                    <th className="py-3 px-4">Embedding</th>
                    <th className="py-3 px-4">Search</th>
                    <th className="py-3 px-4">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500 italic">
                        No analysis sessions logged since backend startup.
                        <br />
                        <Link href="/" className="text-cyan-400 hover:underline mt-2 inline-block font-sans text-xs">
                          Go to Home Page and upload an image to test →
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 text-slate-400 text-[11px]">
                          {log.timestamp || "--"}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-200">{log.filename}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {log.media_type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[11px] font-bold",
                              log.ela_score > 0.6
                                ? "bg-red-950/60 text-red-400 border border-red-500/30"
                                : log.ela_score > 0.3
                                ? "bg-amber-950/60 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30"
                            )}
                          >
                            {log.ela_score}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {log.lineage_match ? (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950/60 text-purple-300 border border-purple-500/30">
                              MATCH
                            </span>
                          ) : (
                            <span className="text-slate-500">None</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.embedding_valid ? (
                            <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3.5 h-3.5" /> Zero-Vector
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {log.search_failed ? (
                            <span className="text-amber-400 text-[11px]">Fallback</span>
                          ) : (
                            <span className="text-emerald-400 text-[11px]">OK</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-cyan-300">{log.duration_sec}s</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-4 border-t border-slate-800/60 text-center text-xs text-slate-600">
        TruthDNA Admin Telemetry · Real-time pipeline diagnostics & vector ledger inspection
      </footer>
    </main>
  );
}
