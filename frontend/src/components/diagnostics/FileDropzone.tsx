// components/diagnostics/FileDropzone.tsx — Clean & Intuitive Forensic Media Ingestion

import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileSearch,
  Sliders,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";
import { Card } from "@/components/ui/Card";
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
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      {/* Editorial Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-3 font-mono">
          Forensic Media Verification
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Multi-dimensional media analysis delivering calibrated evidence, confidence metrics, and explicit uncertainties without binary oversimplifications.
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
          "w-full rounded-2xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 select-none flex flex-col items-center justify-center gap-5 bg-slate-900/60",
          isDragging
            ? "border-blue-500 bg-blue-950/20 scale-[1.005]"
            : "border-slate-700 hover:border-slate-500 hover:bg-slate-900/80",
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
        <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
          <Upload className="w-7 h-7" />
        </div>

        <div className="space-y-1 text-center">
          <p className="text-base sm:text-lg font-semibold text-white">
            {isDragging ? "Release file to begin forensic pipeline" : "Drag and drop media file here"}
          </p>
          <p className="text-xs sm:text-sm text-slate-400">
            Supports both high-resolution images and video clips
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

      {/* 3-Pillar Methodology Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-10">
        <Card variant="default" className="p-5">
          <div className="flex items-center gap-2.5 mb-2 text-slate-200">
            <FileSearch className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              Pillar 1: Evidence
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Error Level Analysis (ELA), visual tampering, voice consistency, and EXIF provenance checks.
          </p>
        </Card>

        <Card variant="default" className="p-5">
          <div className="flex items-center gap-2.5 mb-2 text-slate-200">
            <Sliders className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              Pillar 2: Confidence
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Multi-dimensional probability distributions across visual, acoustic, and provenance vectors.
          </p>
        </Card>

        <Card variant="default" className="p-5">
          <div className="flex items-center gap-2.5 mb-2 text-slate-200">
            <AlertCircle className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider">
              Pillar 3: Uncertainty
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Explicit documentation of analytical blind spots, missing references, and compression limits.
          </p>
        </Card>
      </div>
    </div>
  );
}
