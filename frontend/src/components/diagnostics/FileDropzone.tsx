// components/diagnostics/FileDropzone.tsx — Clean & Intuitive Forensic Media Ingestion

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FolderOpen,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { Button } from "@/components/ui/Button";

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export function FileDropzone({ onFileSelect, disabled = false }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [disabled, onFileSelect]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  const handleTriggerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/20 bg-blue-950/30 text-xs font-mono text-blue-300 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Multi-Modal Forensic Intelligence</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 font-mono">
          Forensic Media Verification
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto leading-relaxed">
          Upload images or videos for comprehensive tamper analysis, error-level forensics, and provenance diagnostics.
        </p>
      </div>

      {/* Main Upload Area */}
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
          "w-full rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center gap-5 bg-slate-900/60 shadow-lg shadow-black/30",
          isDragging
            ? "border-blue-500 bg-blue-950/30 scale-[1.01]"
            : "border-slate-700/80 hover:border-slate-500 hover:bg-slate-900/90",
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

        {/* Upload Icon */}
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-105">
          <Upload className="w-7 h-7" />
        </div>

        <div className="space-y-1 text-center">
          <p className="text-base sm:text-lg font-semibold text-white">
            {isDragging ? "Drop media file to begin analysis" : "Drag and drop media file here"}
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            or click anywhere to select from your computer
          </p>
        </div>

        {/* Action button */}
        <Button
          type="button"
          variant="primary"
          size="md"
          icon={<FolderOpen className="w-4 h-4" />}
          onClick={(e) => {
            e.stopPropagation();
            handleTriggerClick();
          }}
        >
          Select Media File
        </Button>

        {/* Format Tags */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          {SUPPORTED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-slate-300"
            >
              {ext}
            </span>
          ))}
          <span className="text-xs text-slate-500 font-mono pl-1">· Max 20 MB</span>
        </div>
      </div>

      {/* Subtle Horizontal Capabilities Strip */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-blue-400" />
          <span>Error Level Forensics</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Digital Genome & pHash</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>Gemini 2.5 Flash Synthesis</span>
        </div>
      </div>
    </div>
  );
}
