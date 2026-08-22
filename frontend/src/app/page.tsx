"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FileDropzone } from "@/components/diagnostics/FileDropzone";
import { AnalysisProgress } from "@/components/diagnostics/AnalysisProgress";
import { DiagnosticView } from "@/components/diagnostics/DiagnosticView";
import { useForensicAnalysis } from "@/hooks/useForensicAnalysis";

export default function Home() {
  const { state, activeFile, currentStepIndex, analyze, reset } =
    useForensicAnalysis();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100 selection:bg-blue-900 selection:text-white">
      <Header />

      <main className="flex-1 py-12 sm:py-16 flex flex-col items-center">
        <Container size="lg">
          {/* Phase 1: Idle Ingestion State */}
          {state.phase === "idle" && (
            <FileDropzone onFileSelect={analyze} />
          )}

          {/* Phase 2: Ingestion & Sequencing State */}
          {(state.phase === "uploading" || state.phase === "analyzing") && (
            <AnalysisProgress
              file={activeFile}
              currentStepIndex={currentStepIndex}
            />
          )}

          {/* Phase 3: Error State */}
          {state.phase === "error" && (
            <div className="w-full max-w-lg mx-auto py-8">
              <Card variant="elevated" className="border-rose-900/50 bg-slate-900">
                <CardHeader className="border-rose-900/30 bg-rose-950/20">
                  <div className="flex items-center gap-2.5 text-rose-400">
                    <AlertTriangle className="w-5 h-5" />
                    <CardTitle className="text-rose-300">
                      Analysis Pipeline Notice
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono">
                    {state.message}
                  </p>
                  {activeFile && (
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
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
            <DiagnosticView
              report={state.report}
              fileName={activeFile?.name}
              onReset={reset}
            />
          )}
        </Container>
      </main>

      <Footer />
    </div>
  );
}
