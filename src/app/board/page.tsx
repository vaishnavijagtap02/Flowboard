// Main page — Assembles the Flowboard workspace.
// Toolbar (top) + ChatPanel (left, toggled) + Canvas (center) + PropertySidebar (right)
// ArtifactPanel renders as a modal overlay.

"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { PropertySidebar } from "@/components/sidebar/PropertySidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ArtifactPanel } from "@/components/artifacts/ArtifactPanel";

export default function Home() {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Top toolbar */}
        <Toolbar />

        {/* Main content: Chat (left) + Canvas (center) + Sidebar (right) */}
        <div className="flex flex-1 overflow-hidden">
          {/* Chat panel (left, collapsible) */}
          <ChatPanel />

          {/* Canvas takes remaining space */}
          <div className="flex-1 relative">
            <CanvasArea />
          </div>

          {/* Property sidebar (right) */}
          <PropertySidebar />
        </div>
      </div>

      {/* Artifact panel (modal overlay) */}
      <ArtifactPanel />
    </ReactFlowProvider>
  );
}
