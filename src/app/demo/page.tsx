"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { PropertySidebar } from "@/components/sidebar/PropertySidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";
import { ArchitectureHealthDrawer } from "@/components/inspector/ArchitectureHealthDrawer";
import { useCanvasStore } from "@/stores/canvasStore";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";
import { Sparkles, ArrowRight, RotateCcw, ShieldCheck, Info, X } from "lucide-react";

export default function DemoPage() {
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const nodes = useCanvasStore((s) => s.nodes);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Pre-populate with the E-Commerce Microservices sample architecture if empty
  useEffect(() => {
    if (nodes.length === 0) {
      loadTemplate("ecommerce");
    }
  }, [loadTemplate, nodes.length]);

  const handleResetDemo = () => {
    loadTemplate("ecommerce");
  };

  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground transition-colors">
        {/* Top Sandbox Notice Banner */}
        {!isBannerDismissed && (
          <div className="bg-ai/10 border-b border-ai/20 px-4 py-2 flex items-center justify-between text-xs text-foreground z-40 transition-colors">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <span className="shrink-0 flex items-center gap-1 rounded-full bg-ai/20 border border-ai/30 px-2 py-0.5 text-[10px] font-bold text-ai">
                <Sparkles size={10} />
                SANDBOX DEMO
              </span>
              <p className="text-[11px] text-muted-foreground truncate">
                Exploring pre-populated architecture. Changes are isolated in memory and will not overwrite personal projects.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-2">
              <button
                onClick={handleResetDemo}
                className="flex items-center gap-1 text-[11px] font-medium text-foreground hover:text-ai transition-colors"
                title="Reset diagram to default demo architecture"
              >
                <RotateCcw size={11} />
                <span className="hidden sm:inline">Reset Architecture</span>
              </button>
              <div className="h-3 w-px bg-border" />
              <Link
                href="/signup"
                className="flex items-center gap-1 text-[11px] font-semibold text-ai hover:underline"
              >
                <span>Save Personal Boards</span>
                <ArrowRight size={11} />
              </Link>
              <button
                onClick={() => setIsBannerDismissed(true)}
                className="text-muted-foreground hover:text-foreground p-0.5 transition-colors"
                title="Dismiss notice"
              >
                <X size={13} />
              </button>
            </div>
          </div>
        )}

        {/* Top toolbar */}
        <Toolbar isDemo={true} />

        {/* Main content: Chat (left) + Canvas (center) + Sidebar (right) */}
        <div className="flex flex-1 overflow-hidden relative">
          {/* Chat panel (left, collapsible) */}
          <ChatPanel />

          {/* Canvas takes remaining space */}
          <div className="flex-1 relative overflow-hidden">
            <CanvasArea />
          </div>

          {/* Property sidebar (right) */}
          <PropertySidebar />
        </div>
      </div>

      {/* Artifact compiler modal */}
      <ArtifactPanel />

      {/* Architecture Linter & Health drawer */}
      <ArchitectureHealthDrawer />
    </ReactFlowProvider>
  );
}
