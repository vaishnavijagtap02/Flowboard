// PropertySidebar — Right panel for editing selected node/edge properties.
// Styled with Figma-level dark obsidian aesthetics and tabbed controls.

"use client";

import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { NodePropertyEditor } from "./NodePropertyEditor";
import { EdgePropertyEditor } from "./EdgePropertyEditor";
import { X, Sliders, Layers, Network } from "lucide-react";

export function PropertySidebar() {
  const selectedNodeId = useUIStore((s) => s.selectedNodeId);
  const selectedEdgeId = useUIStore((s) => s.selectedEdgeId);
  const isOpen = useUIStore((s) => s.isPropertySidebarOpen);
  const clearSelection = useUIStore((s) => s.clearSelection);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  const hasSelection = selectedNode || selectedEdge;

  if (!isOpen || !hasSelection) return null;

  return (
    <aside className="w-80 border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl flex flex-col h-full overflow-hidden z-20 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary text-foreground border border-border">
            {selectedNode ? <Layers size={13} /> : <Network size={13} />}
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground tracking-tight">
              {selectedNode ? "Component Inspector" : "Connection Inspector"}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono">
              {selectedNode ? selectedNode.id : selectedEdge?.id}
            </p>
          </div>
        </div>

        <button
          onClick={clearSelection}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          title="Close inspector"
        >
          <X size={14} />
        </button>
      </div>

      {/* Inspector Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode && <NodePropertyEditor node={selectedNode} />}
        {selectedEdge && <EdgePropertyEditor edge={selectedEdge} />}
      </div>
    </aside>
  );
}
