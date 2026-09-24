// SemanticEdge — Custom edge that displays the relationship label
// and uses relationship-specific styling (solid/dashed, animated, color).

"use client";

import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import type { FlowEdgeData } from "@/types/canvas";
import { EDGE_RELATIONSHIP_CONFIG } from "@/lib/constants";
import type { EdgeRelationship } from "@/types/semantic";

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
}: EdgeProps<FlowEdgeData>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const relationship = (data?.relationship ?? "connects_to") as EdgeRelationship;
  const config = EDGE_RELATIONSHIP_CONFIG[relationship];
  const label = data?.label || config.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: selected ? config.color : `${config.color}99`,
          strokeWidth: selected ? 2.5 : 1.5,
          strokeDasharray: config.style === "dashed" ? "6 4" : undefined,
        }}
        className={config.animated ? "react-flow__edge-animated" : ""}
      />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan absolute pointer-events-auto"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
          }}
        >
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm border"
            style={{
              backgroundColor: "white",
              color: config.color,
              borderColor: `${config.color}40`,
            }}
          >
            {label}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const SemanticEdge = memo(SemanticEdgeComponent);

// React Flow edgeTypes registry
export const edgeTypes = {
  semantic: SemanticEdge,
};
