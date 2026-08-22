// components/diagnostics/ShareableCard.tsx — Exportable Context Card

import { useState } from "react";
import { Copy, Check, RotateCcw, Share2, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ShareableCardProps {
  cardText: string;
  onReset: () => void;
}

export function ShareableCard({ cardText, onReset }: ShareableCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(cardText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = cardText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([cardText], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TruthDNA-Diagnostic-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <Share2 className="w-3.5 h-3.5" />
          </div>
          <CardTitle>Shareable Diagnostic Context Card</CardTitle>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Markdown / Citation Format
        </span>
      </CardHeader>

      <CardContent className="p-6">
        <div className="p-5 rounded-xl bg-black/40 border border-white/[0.06] font-mono text-xs sm:text-sm text-slate-200 leading-relaxed select-all">
          {cardText}
        </div>
      </CardContent>

      <CardFooter className="justify-between flex-wrap gap-4 p-4 sm:p-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            id="copy-context-card"
            variant="primary"
            size="md"
            onClick={handleCopy}
            icon={
              copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-900" />
              )
            }
          >
            {copied ? "Copied to Clipboard" : "Copy Context Card"}
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleDownload}
            icon={<Download className="w-4 h-4 text-slate-300" />}
          >
            Download Markdown Report
          </Button>
        </div>

        <Button
          id="analyze-another"
          variant="outline"
          size="md"
          onClick={onReset}
          icon={<RotateCcw className="w-4 h-4" />}
        >
          Analyze Another Media File
        </Button>
      </CardFooter>
    </Card>
  );
}
