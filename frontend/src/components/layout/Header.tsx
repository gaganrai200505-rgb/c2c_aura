// components/layout/Header.tsx — Futuristic Digital Forensics Navigation

import { useState } from "react";
import { Shield, Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  onNewAnalysis?: () => void;
  activeNav?: string;
  onNavClick?: (nav: string) => void;
}

export function Header({
  onNewAnalysis,
  activeNav = "Analyze",
  onNavClick,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "Analyze", href: "#analyze" },
    { label: "Reports", href: "#reports" },
    { label: "Ledger", href: "#ledger" },
    { label: "About", href: "#about" },
    { label: "Docs", href: "#docs" },
  ];

  const handleItemClick = (label: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavClick) {
      onNavClick(label);
    }
    setMobileMenuOpen(false);

    // Smooth scroll to section if exists
    const id = label.toLowerCase();
    const elem = document.getElementById(id);
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="w-full border-b border-white/[0.08] bg-[#07090e]/85 backdrop-blur-xl sticky top-0 z-50 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 via-blue-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-mono text-sm font-bold shadow-lg shadow-indigo-950/40">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#07090e]" />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white font-mono">
                Truth<span className="text-gradient-cyan">DNA</span>
              </span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 tracking-wider">
                PRO v0.1
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline tracking-tight">
              Forensic Media Intelligence
            </span>
          </div>
        </div>

        {/* Center: Navigation Items */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-white/[0.06] backdrop-blur-md">
          {navItems.map((item) => {
            const isActive = activeNav === item.label;
            return (
              <button
                key={item.label}
                type="button"
                onClick={(e) => handleItemClick(item.label, e)}
                className={`relative px-4 py-1.5 text-xs font-mono font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "text-white bg-indigo-950/60 shadow-sm border border-indigo-500/40 shadow-indigo-950/50"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-white/[0.06] text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Gemini 2.5:</span>
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>

          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              if (onNewAnalysis) {
                onNewAnalysis();
              } else {
                const dropzone = document.getElementById("file-dropzone");
                dropzone?.scrollIntoView({ behavior: "smooth" });
                dropzone?.focus();
              }
            }}
            icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}
            className="hidden sm:inline-flex bg-gradient-to-r from-white via-slate-100 to-slate-200 text-slate-950 font-semibold hover:opacity-95 shadow-md shadow-white/5 border border-white/80"
          >
            Analyze Media
          </Button>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/[0.08] bg-[#07090e]/95 backdrop-blur-2xl px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={(e) => handleItemClick(item.label, e)}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                activeNav === item.label
                  ? "bg-indigo-950/60 text-white border border-indigo-500/40"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-2">
            <Button
              variant="accent"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onNewAnalysis) onNewAnalysis();
              }}
              className="w-full justify-center"
              icon={<Sparkles className="w-4 h-4 text-indigo-600" />}
            >
              Analyze Media
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
