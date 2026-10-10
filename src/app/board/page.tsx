// Main page — Assembles the Flowboard workspace.
// Toolbar (top) + ChatPanel (left, toggled) + Canvas (center) + PropertySidebar (right)
// Supports loading specific board projects via ?id=... query parameter.

"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { PropertySidebar } from "@/components/sidebar/PropertySidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";
import { ArchitectureHealthDrawer } from "@/components/inspector/ArchitectureHealthDrawer";
import { useCanvasStore } from "@/stores/canvasStore";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";

function BoardLoader() {
  const searchParams = useSearchParams();
  const boardId = searchParams.get("id");
  const setGraphState = useCanvasStore((s) => s.setGraphState);
  const loadTemplate = useCanvasStore((s) => s.loadTemplate);
  const nodes = useCanvasStore((s) => s.nodes);

  useEffect(() => {
    if (boardId) {
      // Fetch board from backend
      fetch(`/api/boards/${boardId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.state?.canvasData) {
            const canvas = data.state.canvasData;
            setGraphState({
              title: data.board?.name || "Architecture Board",
              nodes: canvas.nodes || [],
              edges: canvas.edges || [],
              viewport: canvas.viewport,
            });
          }
        })
        .catch((err) => {
          console.error("Failed to load board by ID:", err);
        });
    } else if (nodes.length === 0) {
      // Bootstrap with starter architecture if canvas is brand new
      loadTemplate("ecommerce");
    }
  }, [boardId, setGraphState, loadTemplate, nodes.length]);

  return null;
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <Suspense fallback={null}>
        <BoardLoader />
      </Suspense>

      <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground transition-colors">
        {/* Top toolbar */}
        <Toolbar />

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

      {/* Artifact panel (modal overlay) */}
      <ArtifactPanel />

      {/* Architecture Linter & Health inspector (slide-over drawer) */}
      <ArchitectureHealthDrawer />
    </ReactFlowProvider>
  );
}
