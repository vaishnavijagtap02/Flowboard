// Main page — Assembles the Flowboard workspace.
// Toolbar (top) + Canvas (center) + PropertySidebar (right) + ChatPanel (left, toggled)

"use client";

import { ReactFlowProvider } from "@xyflow/react";
import { Toolbar } from "@/components/toolbar/Toolbar";
import { CanvasArea } from "@/components/canvas/CanvasArea";
import { PropertySidebar } from "@/components/sidebar/PropertySidebar";

export default function Home() {
  return (
    <ReactFlowProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        {/* Top toolbar */}
        <Toolbar />

        {/* Main content: Canvas + Sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Canvas takes remaining space */}
          <div className="flex-1 relative">
            <CanvasArea />
          </div>

          {/* Property sidebar (right) */}
          <PropertySidebar />
        </div>
      </div>
    </ReactFlowProvider>
  );
}
