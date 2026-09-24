// NodePalette — Draggable node type buttons in the toolbar.
// Users drag from here onto the canvas to create new semantic nodes.

"use client";

import { NODE_TYPES, NODE_TYPE_CONFIG } from "@/lib/constants";
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

const ICON_MAP: Record<string, LucideIcon> = {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
};

export function NodePalette() {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/flowboard-node-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex items-center gap-1">
      {NODE_TYPES.map((type) => {
        const config = NODE_TYPE_CONFIG[type];
        const Icon = ICON_MAP[config.icon] || Server;

        return (
          <button
            key={type}
            draggable
            onDragStart={(e) => onDragStart(e, type)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-grab active:cursor-grabbing border hover:shadow-sm"
            style={{
              backgroundColor: `${config.color}10`,
              borderColor: `${config.color}30`,
              color: config.color,
            }}
            title={`Drag to add ${config.label}`}
          >
            <Icon size={14} />
            <span className="hidden lg:inline">{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
