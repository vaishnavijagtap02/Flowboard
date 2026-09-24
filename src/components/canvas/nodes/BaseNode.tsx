// BaseNode — Shared wrapper for all semantic node types.
// Renders handles, selection ring, icon, name, and technology badge.
// Individual node types (ServiceNode, DatabaseNode, etc.) compose this.

"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
  type LucideIcon,
} from "lucide-react";
import type { FlowNodeData } from "@/types/canvas";
import { NODE_TYPE_CONFIG } from "@/lib/constants";
import { useUIStore } from "@/stores/uiStore";

// Icon mapping from string name to Lucide component
const ICON_MAP: Record<string, LucideIcon> = {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
};

interface BaseNodeProps extends NodeProps<FlowNodeData> {}

function BaseNodeComponent({ id, data, selected }: BaseNodeProps) {
  const config = NODE_TYPE_CONFIG[data.type];
  const Icon = ICON_MAP[config.icon] || Server;
  const selectNode = useUIStore((s) => s.selectNode);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative"
      style={{ minWidth: 220 }}
    >
      {/* Selection ring */}
      <div
        className="absolute -inset-[3px] rounded-xl transition-all duration-200"
        style={{
          border: selected ? `2px solid ${config.color}` : "2px solid transparent",
          boxShadow: selected ? `0 0 16px ${config.color}30` : "none",
        }}
      />

      {/* Node body */}
      <div
        className="relative flex items-start gap-3 rounded-lg px-4 py-3 shadow-md transition-all duration-200 hover:shadow-lg border"
        style={{
          backgroundColor: config.bgColor,
          borderColor: selected ? config.color : config.borderColor,
        }}
      >
        {/* Icon */}
        <div
          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: `${config.color}20`, color: config.color }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">
            {data.name}
          </p>
          {data.technology && (
            <span
              className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: `${config.color}15`,
                color: config.color,
              }}
            >
              {data.technology}
            </span>
          )}
        </div>
      </div>

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !border-2 !border-white !rounded-full transition-colors"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !border-2 !border-white !rounded-full transition-colors"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !border-2 !border-white !rounded-full transition-colors"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !border-2 !border-white !rounded-full transition-colors"
        style={{ backgroundColor: config.color }}
      />
    </div>
  );
}

export const BaseNode = memo(BaseNodeComponent);
