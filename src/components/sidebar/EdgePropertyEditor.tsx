// EdgePropertyEditor — Inspector for editing semantic properties of a connection edge.
// Allows changing communication relationships, protocols, and custom labels.

"use client";

import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import { EDGE_RELATIONSHIPS, EDGE_RELATIONSHIP_CONFIG } from "@/lib/constants";
import type { FlowEdge } from "@/types/canvas";
import type { EdgeRelationship } from "@/types/semantic";
import { Trash2, ArrowRight } from "lucide-react";

const PROTOCOL_SUGGESTIONS = [
  "HTTP/2",
  "HTTPS",
  "gRPC",
  "WebSocket",
  "Kafka",
  "AMQP",
  "TCP/RESP",
  "Postgres",
];

interface EdgePropertyEditorProps {
  edge: FlowEdge;
}

export function EdgePropertyEditor({ edge }: EdgePropertyEditorProps) {
  const edges = useCanvasStore((s) => s.edges);
  const nodes = useCanvasStore((s) => s.nodes);
  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const clearSelection = useUIStore((s) => s.clearSelection);

  // Find connected nodes for display
  const sourceNode = nodes.find((n) => n.id === edge.source);
  const targetNode = nodes.find((n) => n.id === edge.target);

  const handleRelationshipChange = (relationship: EdgeRelationship) => {
    const updatedEdges = edges.map((e) =>
      e.id === edge.id
        ? {
            ...e,
            data: { ...e.data, relationship },
          }
        : e
    );
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
    ) as FlowEdge[];
    useCanvasStore.setState({ edges: updatedEdges });
  };

  const handleDelete = () => {
    removeEdge(edge.id);
    clearSelection();
  };

  const currentRelationship = (edge.data?.relationship ?? "connects_to") as EdgeRelationship;

  return (
    <div className="space-y-4 text-xs">
      {/* Edge ID */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Connection ID
        </label>
        <p className="font-mono text-foreground/80 bg-secondary/30 rounded-lg px-2.5 py-1.5 border border-border truncate">
          {edge.id}
        </p>
      </div>

      {/* Connection Flow Direction */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Data Flow
        </label>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/30 p-2.5 border border-border">
          <span className="rounded bg-primary/15 px-2 py-1 font-medium text-primary truncate max-w-[100px] border border-primary/25">
            {sourceNode?.data.name ?? edge.source}
          </span>
          <ArrowRight size={13} className="text-muted-foreground shrink-0" />
          <span className="rounded bg-secondary px-2 py-1 font-medium text-foreground truncate max-w-[100px] border border-border">
            {targetNode?.data.name ?? edge.target}
          </span>
        </div>
      </div>

      {/* Relationship Selector */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Interaction Semantics
        </label>
        <div className="space-y-1">
          {EDGE_RELATIONSHIPS.map((rel) => {
            const config = EDGE_RELATIONSHIP_CONFIG[rel];
            const isSelected = currentRelationship === rel;

            return (
              <button
                key={rel}
                onClick={() => handleRelationshipChange(rel)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 transition-all border text-left ${
                  isSelected
                    ? "bg-secondary/80 shadow-sm border-border"
                    : "border-border/60 bg-secondary/20 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3.5 h-0.5 rounded-full"
                    style={{
                      backgroundColor: config.color,
                      borderStyle:
                        config.style === "dashed" ? "dashed" : "solid",
                    }}
                  />
                  <span
                    className="font-medium text-xs"
                    style={{ color: isSelected ? config.color : undefined }}
                  >
                    {config.label}
                  </span>
                </div>
                {config.animated && (
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[8px] text-muted-foreground border border-border">
                    Live Stream
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Label */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Edge Label
        </label>
        <input
          type="text"
          value={edge.data?.label ?? ""}
          onChange={(e) => handleFieldChange("label", e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          placeholder="e.g. Orders Stream"
        />
      </div>

      {/* Protocol & Suggested Chips */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Wire Protocol
        </label>
        <input
          type="text"
          value={edge.data?.protocol ?? ""}
          onChange={(e) => handleFieldChange("protocol", e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
          placeholder="e.g. gRPC, HTTPS, AMQP"
        />

        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          <span className="text-[9px] text-muted-foreground">Suggested:</span>
          {PROTOCOL_SUGGESTIONS.map((proto) => (
            <button
              key={proto}
              onClick={() => handleFieldChange("protocol", proto)}
              className="rounded bg-secondary/40 hover:bg-secondary px-1.5 py-0.5 text-[9px] text-foreground/80 hover:text-foreground border border-border transition-colors"
            >
              {proto}
            </button>
          ))}
        </div>
      </div>

      {/* Delete Connection */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15 hover:border-destructive/40 transition-colors"
        >
          <Trash2 size={13} />
          Delete Connection
        </button>
      </div>
    </div>
  );
}
