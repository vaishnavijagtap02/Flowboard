// PropertySidebar — Right panel for editing selected node/edge properties.

"use client";

import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { NodePropertyEditor } from "./NodePropertyEditor";
import { EdgePropertyEditor } from "./EdgePropertyEditor";
import { X } from "lucide-react";

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
    <div className="w-80 border-l border-gray-200 bg-white shadow-lg flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">
          {selectedNode ? "Node Properties" : "Edge Properties"}
        </h3>
        <button
          onClick={clearSelection}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode && <NodePropertyEditor node={selectedNode} />}
        {selectedEdge && <EdgePropertyEditor edge={selectedEdge} />}
      </div>
    </div>
  );
}
