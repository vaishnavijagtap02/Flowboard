// EdgePropertyEditor — Form for editing semantic properties of a selected edge.

"use client";

import { useCanvasStore } from "@/stores/canvasStore";
import { EDGE_RELATIONSHIPS, EDGE_RELATIONSHIP_CONFIG } from "@/lib/constants";
import type { FlowEdge } from "@/types/canvas";
import type { EdgeRelationship } from "@/types/semantic";

interface EdgePropertyEditorProps {
  edge: FlowEdge;
}

export function EdgePropertyEditor({ edge }: EdgePropertyEditorProps) {
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);

  // Find connected nodes for display
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  // To update edge data, we need to work with the edge directly
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);

  const handleRelationshipChange = (relationship: EdgeRelationship) => {
    // Update the edge by replacing it in the store
    const updatedEdges = edges.map((e) =>
      e.id === edge.id
        ? {
            ...e,
            data: { ...e.data, relationship },
          }
        : e
    );
    // Use a direct set approach through the store
    useCanvasStore.setState({ edges: updatedEdges });
  };

  const handleFieldChange = (field: string, value: string) => {
    const updatedEdges = edges.map((e) =>
      e.id === edge.id
        ? {
            ...e,
            data: { ...e.data, [field]: value },
          }
        : e
    );
    useCanvasStore.setState({ edges: updatedEdges });
  };

  const currentRelationship = (edge.data?.relationship ?? "connects_to") as EdgeRelationship;

  return (
    <div className="space-y-4">
      {/* Edge ID (read-only) */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          ID
        </label>
        <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
          {edge.id}
        </p>
      </div>

      {/* Connection info */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Connection
        </label>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <span className="rounded bg-gray-100 px-2 py-1 font-medium">
            {sourceNode?.data.name ?? edge.source}
          </span>
          <span className="text-gray-400">→</span>
          <span className="rounded bg-gray-100 px-2 py-1 font-medium">
            {targetNode?.data.name ?? edge.target}
          </span>
        </div>
      </div>

      {/* Relationship type */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Relationship
        </label>
        <div className="space-y-1">
          {EDGE_RELATIONSHIPS.map((rel) => {
            const config = EDGE_RELATIONSHIP_CONFIG[rel];
            const isSelected = currentRelationship === rel;
            return (
              <button
                key={rel}
                onClick={() => handleRelationshipChange(rel)}
                className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all border text-left ${
                  isSelected ? "shadow-sm" : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: isSelected ? `${config.color}10` : "transparent",
                  borderColor: isSelected ? config.color : "#e5e7eb",
                  color: isSelected ? config.color : "#6b7280",
                }}
              >
                <div
                  className="w-4 h-0.5 rounded-full"
                  style={{
                    backgroundColor: config.color,
                    borderStyle: config.style === "dashed" ? "dashed" : "solid",
                  }}
                />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Label
        </label>
        <input
          type="text"
          value={edge.data?.label ?? ""}
          onChange={(e) => handleFieldChange("label", e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
          placeholder="e.g. send requests"
        />
      </div>

      {/* Protocol */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Protocol
        </label>
        <input
          type="text"
          value={edge.data?.protocol ?? ""}
          onChange={(e) => handleFieldChange("protocol", e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
          placeholder="e.g. HTTP, gRPC, AMQP"
        />
      </div>
    </div>
  );
}
