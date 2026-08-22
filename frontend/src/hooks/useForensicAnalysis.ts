// hooks/useForensicAnalysis.ts — Forensic Analysis Lifecycle Hook

import { useState, useCallback, useRef } from "react";
import type { AnalysisState, MediaDNAReport } from "@/types/truthdna";
import { API_URL, MAX_FILE_SIZE_BYTES, SUPPORTED_MIME_TYPES } from "@/lib/constants";

export interface ForensicAnalysisHook {
  state: AnalysisState;
  activeFile: File | null;
  currentStepIndex: number;
  analyze: (file: File) => Promise<void>;
  reset: () => void;
}

export function useForensicAnalysis(): ForensicAnalysisHook {
  const [state, setState] = useState<AnalysisState>({ phase: "idle" });
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState({ phase: "idle" });
    setActiveFile(null);
    setCurrentStepIndex(0);
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      // Validate file size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setState({
          phase: "error",
          message: `File size (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds the 20 MB limit.`,
        });
        setActiveFile(file);
        return;
      }

      // Validate MIME type
      if (!SUPPORTED_MIME_TYPES.includes(file.type as typeof SUPPORTED_MIME_TYPES[number])) {
        setState({
          phase: "error",
          message: `Unsupported file type "${file.type || "unknown"}". Supported formats: JPEG, PNG, WebP, GIF, MP4, WebM, MOV.`,
        });
        setActiveFile(file);
        return;
      }

      setActiveFile(file);
      setState({ phase: "uploading" });
      setCurrentStepIndex(0);

      // Advance step indicator during execution
      let step = 0;
      intervalRef.current = setInterval(() => {
        step = (step + 1) % 4;
        setCurrentStepIndex(step);
      }, 1600);

      setState({ phase: "analyzing" });

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          body: formData,
        });

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

        if (!response.ok) {
          let errorDetail = `Server responded with status ${response.status}`;
          try {
            const errJson = await response.json();
            if (errJson.detail) {
              errorDetail = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
            }
          } catch {
            // fallback to status code message
          }
          throw new Error(errorDetail);
        }

        const report: MediaDNAReport = await response.json();
        setState({ phase: "complete", report });
      } catch (err: unknown) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setState({
          phase: "error",
          message: err instanceof Error ? err.message : "An unexpected forensic analysis error occurred.",
        });
      }
    },
    []
  );

  return {
    state,
    activeFile,
    currentStepIndex,
    analyze,
    reset,
  };
}
