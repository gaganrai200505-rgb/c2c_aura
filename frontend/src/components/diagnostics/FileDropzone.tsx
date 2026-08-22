// components/diagnostics/FileDropzone.tsx — Two-Column Forensic Hero & Media Ingestion Panel

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FolderOpen,
  FileCheck2,
  Gauge,
  HelpCircle,
  Lock,
  Sparkles,
  FileText,
} from "lucide-react";
import { cn, formatBytes } from "@/lib/utils";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelect, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleFileProcess = useCallback(
    (file: File) => {
      setStagedFile(file);
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileProcess(files[0]);
      }
    },
    [disabled, handleFileProcess]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleTriggerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div id="analyze" className="w-full max-w-7xl mx-auto py-6 sm:py-10">
      {/* 2-Column Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* LEFT COLUMN: Editorial Value Proposition & 3 Feature Cards */}
        <div className="lg:col-span-7 flex flex-col space-y-6 sm:space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-950/40 text-xs font-mono font-medium text-indigo-300 w-fit backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span>FORENSIC DIAGNOSTIC PROTOCOL</span>
          </div>

          {/* Headline */}
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-mono">
              Uncover the <br />
              <span className="text-gradient-hero">Media DNA</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl pt-2">
              TruthDNA analyzes images and videos using multi-layer forensic signals, digital fingerprints, historical similarity, and contextual web grounding — without forcing a binary fake-or-real verdict.
            </p>
          </div>

          {/* 3 Small Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {/* Card 1: Evidence First */}
            <div className="glass-panel p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/70 border border-indigo-700/50 flex items-center justify-center text-indigo-300 mb-3 shadow-xs">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                Evidence First
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Multi-signal forensic observations
              </p>
            </div>

            {/* Card 2: Calibrated Confidence */}
            <div className="glass-panel p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-lg bg-blue-950/70 border border-blue-700/50 flex items-center justify-center text-blue-300 mb-3 shadow-xs">
                <Gauge className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                Calibrated Confidence
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Granular confidence across dimensions
              </p>
            </div>

            {/* Card 3: Explicit Uncertainty */}
            <div className="glass-panel p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5">
              <div className="w-8 h-8 rounded-lg bg-purple-950/70 border border-purple-700/50 flex items-center justify-center text-purple-300 mb-3 shadow-xs">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-1">
                Explicit Uncertainty
              </h3>
              <p className="text-[11px] text-slate-400 leading-snug">
                Transparent limitations and blind spots
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Premium Media Upload Panel */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-panel-glow p-6 sm:p-8 rounded-2xl relative overflow-hidden">
            {/* Subtle technical background grid */}
            <div className="absolute inset-0 pointer-events-none bg-dot-grid opacity-20" />
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-indigo-600/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Heading */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-white font-mono tracking-tight flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Analyze Your Media
                  </h2>
                  <p className="text-xs text-slate-400">
                    Upload image or video for 3-pillar forensic sequencing
                  </p>
                </div>
                <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  v0.1
                </span>
              </div>

              {/* Drag-and-drop dropzone */}
              <div
                id="file-dropzone"
                role="button"
                tabIndex={0}
                aria-label="Upload media file for forensic analysis"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={handleTriggerClick}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleTriggerClick()}
                className={cn(
                  "w-full rounded-xl border-2 border-dashed p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center gap-4 bg-black/40",
                  isDragging
                    ? "border-indigo-400 bg-indigo-950/40 scale-[1.01]"
                    : "border-slate-700/80 hover:border-indigo-500/70 hover:bg-black/60",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <input
                  ref={inputRef}
                  id="file-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  onChange={handleInputChange}
                  disabled={disabled}
                />

                {/* Upload Icon with glow */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-blue-500/15 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-md shadow-indigo-950/50">
                  <Upload className="w-6 h-6" />
                </div>

                <div className="space-y-1 text-center">
                  <p className="text-sm sm:text-base font-semibold text-white">
                    {isDragging ? "Release file to initialize pipeline" : "Drop image or video here"}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    or click to browse
                  </p>
                </div>

                {/* Prominent Gradient Button */}
                <Button
                  type="button"
                  variant="accent"
                  size="md"
                  icon={<FolderOpen className="w-4 h-4 text-indigo-600" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerClick();
                  }}
                  className="bg-gradient-to-r from-white via-slate-100 to-slate-200 text-slate-950 font-bold hover:opacity-95 shadow-md shadow-white/10"
                >
                  Browse Files
                </Button>

                {/* Formats & File Limit */}
                <div className="space-y-1 pt-1">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    {SUPPORTED_EXTENSIONS.map((ext) => (
                      <span
                        key={ext}
                        className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-900/90 border border-white/[0.06] text-slate-300"
                      >
                        {ext}
                      </span>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Maximum size: 20MB
                  </p>
                </div>
              </div>

              {/* Staged File Preview (if selected) */}
              {stagedFile && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-indigo-300 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono font-medium text-white truncate">
                        {stagedFile.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {formatBytes(stagedFile.size)} · {stagedFile.type}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                    Ready
                  </span>
                </div>
              )}

              {/* Privacy message */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono text-center">
                <Lock className="w-3 h-3 text-slate-500" />
                <span>Your media is processed securely for analysis.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
