// components/diagnostics/ForensicRationale.tsx — AI Forensic Synthesis Rationale

import { useState } from "react";
import { Terminal, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ForensicRationaleProps {
  rationale: string;
}

export function ForensicRationale({ rationale }: ForensicRationaleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = rationale.length > 350;
  const displayText = isExpanded || !isLong ? rationale : `${rationale.slice(0, 350)}...`;

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <Terminal className="w-3.5 h-3.5" />
          </div>
          <CardTitle>AI Forensic Chain-of-Thought Rationale</CardTitle>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-mono text-indigo-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Gemini 2.5 Flash</span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="p-5 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap selection:bg-indigo-900/60 selection:text-white">
          {displayText}
        </div>

        {isLong && (
          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              icon={
                isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )
              }
            >
              {isExpanded ? "Collapse Analysis" : "Expand Full Analytical Rationale"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
