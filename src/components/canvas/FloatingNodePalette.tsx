// FloatingNodePalette — Midnight Navy & Ice Blue tactile dock for adding architecture components.
// Ergonomic, minimal, and adaptable across light and dark themes.

"use client";

import { useCallback } from "react";
import {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
  GripHorizontal,
  type LucideIcon,
} from "lucide-react";
import { useReactFlow } from "@xyflow/react";
import { nanoid } from "nanoid";
import { NODE_TYPES, NODE_TYPE_CONFIG } from "@/lib/constants";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import type { FlowNode } from "@/types/canvas";
import type { NodeType } from "@/types/semantic";

const ICON_MAP: Record<string, LucideIcon> = {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
};

export function FloatingNodePalette() {
  const addNode = useCanvasStore((s) => s.addNode);
  const selectNode = useUIStore((s) => s.selectNode);
  const reactFlow = useReactFlow();

  const handleDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/flowboard-node-type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleClickAdd = useCallback(
    (type: NodeType) => {
      const config = NODE_TYPE_CONFIG[type];
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const position = reactFlow.screenToFlowPosition({
        x: centerX + (Math.random() * 60 - 30),
        y: centerY + (Math.random() * 60 - 30),
      });

      const id = `${type}-${nanoid(6)}`;
      const newNode: FlowNode = {
        id,
        type,
        position,
        data: {
          id,
          type,
          name: `New ${config.label}`,
          technology: config.defaultTech[0] || "",
          description: config.description,
          responsibilities: [],
        },
      };

      addNode(newNode);
      selectNode(id);
    },
    [addNode, selectNode, reactFlow]
  );

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <div className="flex items-center gap-1 rounded-2xl border border-border bg-card/95 px-3 py-2 shadow-lg backdrop-blur-xl transition-all">
        <div className="hidden sm:flex items-center pr-2.5 border-r border-border text-muted-foreground">
          <GripHorizontal size={14} />
          <span className="text-[10px] font-semibold tracking-wider uppercase ml-1.5">
            Primitives
          </span>
        </div>

        {/* Node buttons */}
        <div className="flex items-center gap-1.5">
          {NODE_TYPES.map((type) => {
            const config = NODE_TYPE_CONFIG[type];
            const Icon = ICON_MAP[config.icon] || Server;

            return (
              <button
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                onClick={() => handleClickAdd(type)}
                className="group relative flex items-center gap-2 rounded-xl border border-transparent bg-secondary/30 hover:bg-secondary hover:border-border px-2.5 py-1.5 text-xs font-medium transition-all duration-150 cursor-grab active:cursor-grabbing hover:scale-102 active:scale-98"
                title={`Click or drag to add ${config.label} (Key: ${config.shortcut})`}
              >
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-lg transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${config.color}15`,
                    color: config.color,
                  }}
                >
                  <Icon size={13} strokeWidth={2.2} />
                </div>

                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-bold text-foreground tracking-tight">
                    {config.label}
                  </span>
                  <span className="text-[9px] text-muted-foreground hidden md:inline">
                    {config.category}
                  </span>
                </div>

                <kbd className="hidden lg:inline-block ml-0.5 rounded bg-card border border-border px-1 py-0.2 text-[8px] font-mono text-muted-foreground group-hover:text-foreground">
                  {config.shortcut}
                </kbd>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
