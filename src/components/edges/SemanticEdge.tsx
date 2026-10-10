// SemanticEdge — Midnight Navy & Ice Blue architecture connection edge.
// Renders relationship labels, protocols, and tactile frosted badges.

"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowEdge } from "@/types/canvas";
import { EDGE_RELATIONSHIP_CONFIG } from "@/lib/constants";
import type { EdgeRelationship } from "@/types/semantic";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import { X } from "lucide-react";

function SemanticEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<FlowEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const removeEdge = useCanvasStore((s) => s.removeEdge);
  const selectEdge = useUIStore((s) => s.selectEdge);

  const relationship = (data?.relationship ?? "connects_to") as EdgeRelationship;
  const config = EDGE_RELATIONSHIP_CONFIG[relationship] || EDGE_RELATIONSHIP_CONFIG.connects_to;
  const label = data?.label || config.label;
  const protocol = data?.protocol;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeEdge(id);
  };

  const handleLabelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectEdge(id);
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? config.color : `${config.color}C0`,
          strokeWidth: selected ? 2.5 : 1.75,
          strokeDasharray: config.style === "dashed" ? "5 4" : undefined,
          filter: selected ? `drop-shadow(0 0 6px ${config.color}60)` : undefined,
        }}
        className={config.animated ? "react-flow__edge-animated" : ""}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute pointer-events-auto group"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
          onClick={handleLabelClick}
        >
          <div
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium shadow-sm border transition-all duration-150 cursor-pointer ${
              selected
                ? "bg-card border-foreground/30 shadow-md ring-1 ring-border scale-105 text-foreground"
                : "bg-card/95 border-border text-foreground/85 hover:border-foreground/30 hover:scale-105"
            }`}
          >
            {/* Semantic indicator dot */}
            <span
              className={`h-1.5 w-1.5 rounded-full ${config.animated ? "animate-pulse" : ""}`}
              style={{ backgroundColor: config.color }}
            />

            <span className="font-sans font-medium">{label}</span>

            {protocol && (
              <span className="rounded bg-secondary/80 px-1 py-0.2 text-[8px] font-mono text-foreground/75">
                {protocol}
              </span>
            )}

            {/* Quick delete on hover */}
            <button
              onClick={handleDelete}
              className="ml-0.5 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-opacity"
              title="Delete connection"
            >
              <X size={10} />
            </button>
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

function areEdgePropsEqual(
  prev: EdgeProps<FlowEdge>,
  next: EdgeProps<FlowEdge>
): boolean {
  if (prev.id !== next.id) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.sourceX !== next.sourceX || prev.sourceY !== next.sourceY) return false;
  if (prev.targetX !== next.targetX || prev.targetY !== next.targetY) return false;
  if (prev.sourcePosition !== next.sourcePosition || prev.targetPosition !== next.targetPosition) return false;

  const p = prev.data;
  const n = next.data;
  if (p === n) return true;
  if (!p || !n) return false;

  if (p.relationship !== n.relationship) return false;
  if (p.label !== n.label) return false;
  if (p.protocol !== n.protocol) return false;

  return true;
}

export const SemanticEdge = memo(SemanticEdgeComponent, areEdgePropsEqual);

export const edgeTypes = {
  semantic: SemanticEdge,
};
