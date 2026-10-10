// Toolbar — Midnight Navy & Ice Blue editorial workspace control center.
// Features dual theme switcher (Porcelain Ice vs Midnight Navy), restrained typography,
// and elegant Awwwards-grade layout.

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Download,
  Trash2,
  ChevronDown,
  Layers,
  Share2,
  Check,
  FileCode,
  Copy,
  ArrowDownUp,
  Sun,
  Moon,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";
import { lintArchitecture } from "@/engine/linter";

import { useAuth } from "@/context/AuthContext";
import { ArrowRight, LayoutDashboard } from "lucide-react";

export function Toolbar({ isDemo = false }: { isDemo?: boolean }) {
  const { user } = useAuth();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleChat = useUIStore((s) => s.toggleChat);
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const toggleLinter = useUIStore((s) => s.toggleLinter);
  const isLinterOpen = useUIStore((s) => s.isLinterOpen);
  const openArtifactPanel = useUIStore((s) => s.openArtifactPanel);

  const boardTitle = useCanvasStore((s) => s.boardTitle);
  const setBoardTitle = useCanvasStore((s) => s.setBoardTitle);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const getSemanticGraph = useCanvasStore((s) => s.getSemanticGraph);

  // Local UI state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(boardTitle);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const templateMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        templateMenuRef.current &&
        !templateMenuRef.current.contains(event.target as Node)
      ) {
        setIsTemplateMenuOpen(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live architecture health
  const healthReport = useMemo(() => {
    if (nodes.length === 0) return null;
    const graph = getSemanticGraph();
    return lintArchitecture(graph);
  }, [nodes, edges, getSemanticGraph]);

  const handleTitleSubmit = () => {
    if (tempTitle.trim()) {
      setBoardTitle(tempTitle.trim());
    } else {
      setTempTitle(boardTitle);
    }
    setIsEditingTitle(false);
  };

  const handleExportJSON = () => {
    const graph = getSemanticGraph();
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(graph, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `${boardTitle.toLowerCase().replace(/\s+/g, "-")}-architecture.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setIsExportMenuOpen(false);
  };

  const handleCopyMarkdown = () => {
    const graph = getSemanticGraph();
    const md = `# Architecture: ${boardTitle}
Components: ${graph.nodes.length}
Connections: ${graph.edges.length}

## Components
${graph.nodes.map((n) => `- **${n.name}** (${n.type}) [${n.technology || "General"}]: ${n.description || "N/A"}`).join("\n")}

## Connections
${graph.edges.map((e) => `- ${e.source} --[${e.relationship}${e.protocol ? ` / ${e.protocol}` : ""}]--> ${e.target}`).join("\n")}
`;
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setIsExportMenuOpen(false);
  };

  return (
    <header className="flex h-13 w-full items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-xl z-30 select-none transition-colors duration-200">
      {/* ─── Left: Brand & Architecture Title ───────────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Brand Link */}
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg py-1 px-1.5 transition-all hover:bg-secondary/40"
          title="Return to Flowboard overview"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm ring-1 ring-border transition-transform group-hover:scale-105">
            <span className="text-xs font-bold tracking-tight">F</span>
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Flowboard
          </span>
          {isDemo ? (
            <span className="rounded-full bg-ai/20 text-ai px-2 py-0.5 text-[9px] font-bold border border-ai/35">
              DEMO SANDBOX
            </span>
          ) : (
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-primary border border-border">
              STUDIO
            </span>
          )}
        </Link>

        <div className="h-4 w-px bg-border" />

        {/* Board Title & Renaming */}
        <div className="flex items-center gap-2">
          {isEditingTitle ? (
            <input
              type="text"
              value={tempTitle}
              autoFocus
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSubmit();
                if (e.key === "Escape") {
                  setTempTitle(boardTitle);
                  setIsEditingTitle(false);
                }
              }}
              className="h-7 rounded border border-primary bg-card px-2 text-xs font-medium text-foreground outline-none ring-1 ring-primary/30"
            />
          ) : (
            <button
              onClick={() => {
                setTempTitle(boardTitle);
                setIsEditingTitle(true);
              }}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-foreground/85 hover:bg-secondary/50 transition-colors"
              title="Click to rename architecture"
            >
              <span className="max-w-[190px] truncate">{boardTitle}</span>
              <span className="text-[10px] text-muted-foreground font-normal">✎</span>
            </button>
          )}

          {/* Sync indicator */}
          <div
            className="flex items-center gap-1.5 px-1.5 py-0.5 text-[10px] text-muted-foreground"
            title="Auto-saved in local workspace"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="hidden md:inline">Saved</span>
          </div>
        </div>
      </div>

      {/* ─── Center: Core Canvas Actions & Blueprints ────────────────────── */}
      <div className="flex items-center gap-1.5">
        {/* Templates Picker Dropdown */}
        <div className="relative" ref={templateMenuRef}>
          <button
            onClick={() => setIsTemplateMenuOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-all ${
              isTemplateMenuOpen
                ? "bg-secondary text-foreground"
                : "bg-card text-foreground/80 hover:bg-secondary/60"
            }`}
          >
            <Layers size={13} className="text-primary" />
            <span>Blueprints</span>
            <ChevronDown size={11} className="opacity-60" />
          </button>

          {isTemplateMenuOpen && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 w-76 rounded-xl border border-border bg-card p-2 shadow-xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 mb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Architectural Blueprints
                </p>
                <p className="text-[11px] text-foreground/70">
                  Pre-assembled system designs
                </p>
              </div>
              <div className="space-y-1">
                {ARCHITECTURE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => {
                      loadTemplate(tmpl.id);
                      setIsTemplateMenuOpen(false);
                    }}
                    className="w-full text-left rounded-lg p-2 transition-all hover:bg-secondary/50 border border-transparent hover:border-border group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {tmpl.name}
                      </span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-secondary text-primary border border-border">
                        {tmpl.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {tmpl.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Auto Layout (Dagre) Button */}
        <button
          onClick={() => autoLayout("TB")}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-secondary/60 transition-all active:scale-95"
          title="Auto-organize nodes with Dagre layout algorithm"
        >
          <ArrowDownUp size={13} className="text-primary" />
          <span className="hidden sm:inline">Auto-Layout</span>
        </button>
      </div>

      {/* ─── Right: Theme Toggle, Linter, AI, Artifacts ──────────────────── */}
      <div className="flex items-center gap-2">
        {/* Theme Switcher Capsule (Midnight Navy & Ice Blue) */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:bg-secondary/60 transition-all shadow-sm"
          title="Toggle Midnight Navy & Ice Blue theme"
        >
          {theme === "light" ? (
            <>
              <Sun size={12} className="text-amber-500" />
              <span className="text-[11px] font-semibold text-foreground">Porcelain Ice</span>
            </>
          ) : (
            <>
              <Moon size={12} className="text-ice" />
              <span className="text-[11px] font-semibold text-ice">Midnight Navy</span>
            </>
          )}
        </button>

        {/* Architecture Health Pill */}
        <button
          onClick={toggleLinter}
          className={`flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium transition-all ${
            isLinterOpen
              ? "bg-secondary text-foreground"
              : healthReport && healthReport.score < 90
                ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                : "bg-card text-foreground/80 hover:bg-secondary/60"
          }`}
          title="Toggle Architecture Verification Inspector"
        >
          {healthReport && healthReport.score < 90 ? (
            <AlertTriangle size={13} className="text-amber-500" />
          ) : (
            <ShieldCheck size={13} className="text-emerald-500" />
          )}
          <span className="font-semibold">
            {healthReport ? `${healthReport.score}% Health` : "Analyzer"}
          </span>
          {healthReport && healthReport.issues.length > 0 && (
            <span className="rounded-full bg-amber-500/20 px-1 text-[9px] text-amber-500 font-mono">
              {healthReport.issues.length}
            </span>
          )}
        </button>

        {/* Generate Artifacts Button */}
        <button
          onClick={openArtifactPanel}
          className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground/80 hover:bg-secondary/60 transition-colors"
          title="Generate Docker Compose, API Contracts & README"
        >
          <FileCode size={13} className="text-primary" />
          <span className="hidden sm:inline">Artifacts</span>
        </button>

        {/* AI Copilot Button (Ice Blue AI highlight) */}
        <button
          onClick={toggleChat}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
            isChatOpen
              ? "border-ai bg-ai text-white shadow-sm"
              : "border-ai/35 bg-ai/10 text-ai hover:bg-ai/20 hover:border-ai"
          }`}
          title="Toggle AI Architecture Copilot (⌘J)"
        >
          <Sparkles size={13} className={isChatOpen ? "text-white" : "text-ai"} />
          <span className="font-semibold">AI Copilot</span>
          <kbd className="hidden lg:inline-block rounded bg-black/10 dark:bg-white/10 px-1 text-[9px]">
            ⌘J
          </kbd>
        </button>

        <div className="h-4 w-px bg-border mx-0.5" />

        {/* Export Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 text-foreground/70 hover:bg-secondary/60 transition-colors"
            title="Export architecture"
          >
            <Share2 size={13} />
          </button>

          {isExportMenuOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-52 rounded-xl border border-border bg-card p-1.5 shadow-xl backdrop-blur-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={handleExportJSON}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground/85 hover:bg-secondary/50 transition-colors"
              >
                <Download size={13} className="text-muted-foreground" />
                <span>Export Graph JSON</span>
              </button>
              <button
                onClick={handleCopyMarkdown}
                className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground/85 hover:bg-secondary/50 transition-colors"
              >
                {copied ? (
                  <Check size={13} className="text-[#53745C]" />
                ) : (
                  <Copy size={13} className="text-muted-foreground" />
                )}
                <span>{copied ? "Copied!" : "Copy Summary (Markdown)"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Clear Canvas */}
        <div className="relative">
          <button
            onClick={() => setIsClearConfirmOpen(true)}
            className="flex items-center gap-1 rounded-lg border border-border bg-card p-1.5 text-muted-foreground hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
            title="Clear canvas"
          >
            <Trash2 size={13} />
          </button>

          {isClearConfirmOpen && (
            <div className="absolute top-full right-0 mt-1.5 w-60 rounded-xl border border-destructive/30 bg-card p-3 shadow-xl z-50">
              <p className="text-xs font-semibold text-foreground mb-1">
                Clear all components?
              </p>
              <p className="text-[11px] text-muted-foreground mb-3">
                This will reset the entire architecture diagram.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearCanvas();
                    setIsClearConfirmOpen(false);
                  }}
                  className="flex-1 rounded-md bg-destructive px-2 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="rounded-md bg-secondary px-2.5 py-1 text-xs text-foreground/80 hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Action CTA (Demo vs Dashboard) */}
        {isDemo ? (
          <Link
            href="/signup"
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-all"
            title="Create an account to save personal architecture projects"
          >
            <span>Save Projects</span>
            <ArrowRight size={12} />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/60 transition-colors"
            title="My Saved Architecture Boards"
          >
            <LayoutDashboard size={13} className="text-muted-foreground" />
            <span className="text-[11px]">Dashboard</span>
          </Link>
        )}
      </div>
    </header>
  );
}
