"use client";

import { useState } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/diagnostics/FileDropzone";
import { AnalysisPipeline } from "@/components/diagnostics/AnalysisPipeline";
import { PillarDeliverables } from "@/components/diagnostics/PillarDeliverables";
import { AnalysisProgress } from "@/components/diagnostics/AnalysisProgress";
import { DiagnosticView } from "@/components/diagnostics/DiagnosticView";
import { useForensicAnalysis } from "@/hooks/useForensicAnalysis";

export default function Home() {
  const { state, activeFile, currentStepIndex, analyze, reset } =
    useForensicAnalysis();
  const [activeNav, setActiveNav] = useState<string>("Analyze");

  const handleNavClick = (nav: string) => {
    setActiveNav(nav);
    if (nav === "Analyze" && state.phase !== "idle") {
      reset();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07090e] text-slate-100 bg-forensics-grid selection:bg-indigo-900 selection:text-white">
      <Header
        activeNav={activeNav}
        onNavClick={handleNavClick}
        onNewAnalysis={reset}
      />

      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* Phase 1: Landing State with 2-Column Hero, Pipeline & Deliverables */}
        {state.phase === "idle" && (
          <div className="space-y-12 sm:space-y-16">
            <FileDropzone onFileSelect={analyze} />
            <AnalysisPipeline />
            <PillarDeliverables />
          </div>
        )}

        {/* Phase 2: Ingestion & Sequencing State */}
        {(state.phase === "uploading" || state.phase === "analyzing") && (
          <div className="py-12">
            <AnalysisProgress
              file={activeFile}
              currentStepIndex={currentStepIndex}
            />
          </div>
        )}

        {/* Phase 3: Error State */}
        {state.phase === "error" && (
          <div className="w-full max-w-lg mx-auto py-16">
            <Card variant="elevated" className="border-rose-900/50 bg-[#0c101d]">
              <CardHeader className="border-rose-900/30 bg-rose-950/30">
                <div className="flex items-center gap-2.5 text-rose-400">
                  <AlertTriangle className="w-5 h-5" />
                  <CardTitle className="text-rose-300">
                    Forensic Pipeline Alert
                  </CardTitle>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-6">
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                  {state.message}
                </p>
                {activeFile && (
                  <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] text-xs font-mono text-slate-400">
                    File: {activeFile.name} ({(activeFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </CardContent>

              <CardFooter className="justify-end">
                <Button
                  id="retry-button"
                  variant="outline"
                  size="sm"
                  onClick={reset}
                  icon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset & Try Again
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Phase 4: Diagnostic View State */}
        {state.phase === "complete" && (
          <div className="py-6">
            <DiagnosticView
              report={state.report}
              fileName={activeFile?.name}
              onReset={reset}
            />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
