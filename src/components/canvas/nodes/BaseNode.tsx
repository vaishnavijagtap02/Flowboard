// BaseNode — Midnight Navy & Ice Blue architecture index card.
// Minimal, restrained, tactile card aesthetic with WCAG AA compliance.

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
  Trash2,
  Copy,
  Sparkles,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { nanoid } from "nanoid";
import type { FlowNode } from "@/types/canvas";
import { NODE_TYPE_CONFIG } from "@/lib/constants";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useChatStore } from "@/stores/chatStore";

const ICON_MAP: Record<string, LucideIcon> = {
  Server,
  Database,
  Globe,
  ArrowLeftRight,
  Zap,
  Shield,
  Monitor,
};

interface BaseNodeProps extends NodeProps<FlowNode> {}

function BaseNodeComponent({ id, data, selected }: BaseNodeProps) {
  const config = NODE_TYPE_CONFIG[data.type] || NODE_TYPE_CONFIG.service;
  const Icon = ICON_MAP[config.icon] || Server;

  const selectNode = useUIStore((s) => s.selectNode);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const addNode = useCanvasStore((s) => s.addNode);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(id);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = `${data.type}-${nanoid(6)}`;
    const duplicatedNode: FlowNode = {
      id: newId,
      type: data.type,
      position: {
        x: (data as any).x || 100 + 40,
        y: (data as any).y || 100 + 40,
      },
      data: {
        ...data,
        id: newId,
        name: `${data.name} (Copy)`,
      },
    };
    addNode(duplicatedNode);
    selectNode(newId);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  const handleAskAI = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatOpen(true);
    sendMessage(`Analyze the role, failure modes, and scalability of the "${data.name}" (${config.label}) component.`);
  };

  const responsibilities = data.responsibilities || [];

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer select-none"
      style={{ minWidth: 230 }}
    >
      {/* Floating Action Capsule (Visible on select or hover) */}
      <div
        className={`absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-md transition-all duration-150 z-30 ${
          selected
            ? "opacity-100 scale-100 pointer-events-auto"
            : "opacity-0 scale-95 pointer-events-none group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto"
        }`}
      >
        <button
          onClick={handleAskAI}
          className="flex h-5 w-5 items-center justify-center rounded-full text-ai hover:bg-ai/15 transition-colors"
          title="Ask AI to analyze component"
        >
          <Sparkles size={11} />
        </button>
        <button
          onClick={handleDuplicate}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Duplicate component"
        >
          <Copy size={11} />
        </button>
        <button
          onClick={handleClick}
          className="flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Edit properties"
        >
          <Settings size={11} />
        </button>
        <div className="h-2.5 w-px bg-border" />
        <button
          onClick={handleDelete}
          className="flex h-5 w-5 items-center justify-center rounded-full text-destructive hover:bg-destructive/15 transition-colors"
          title="Delete component"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Selection Accent Ring */}
      <div
        className="absolute -inset-[2px] rounded-2xl transition-all duration-200 pointer-events-none"
        style={{
          border: selected ? `2px solid ${config.color}` : "2px solid transparent",
          boxShadow: selected ? `0 0 16px ${config.glowColor}` : "none",
        }}
      />

      {/* Main Index Card Body */}
      <div
        className={`relative flex flex-col rounded-xl border p-3.5 shadow-sm transition-all duration-200 ${
          selected
            ? "bg-card border-foreground/30 shadow-md"
            : "bg-card border-border hover:border-foreground/20 hover:shadow-md"
        }`}
      >
        {/* Top Meta: Category Tag & Tech Stack */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: config.color }}
            />
            <span
              className="text-[9px] font-bold tracking-wider uppercase font-mono"
              style={{ color: config.color }}
            >
              {config.label}
            </span>
          </div>

          {data.technology && (
            <span className="rounded-full bg-secondary/70 border border-border px-2 py-0.5 text-[9px] font-medium text-foreground/80 truncate max-w-[100px]">
              {data.technology}
            </span>
          )}
        </div>

        {/* Content: Icon + Title */}
        <div className="flex items-start gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border mt-0.5"
            style={{
              backgroundColor: `${config.color}15`,
              borderColor: `${config.color}30`,
              color: config.color,
            }}
          >
            <Icon size={14} strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground tracking-tight leading-snug line-clamp-2">
              {data.name}
            </p>
            {data.description && (
              <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                {data.description}
              </p>
            )}
          </div>
        </div>

        {/* Responsibilities Chips */}
        {responsibilities.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-border flex flex-wrap gap-1">
            {responsibilities.slice(0, 2).map((resp, i) => (
              <span
                key={i}
                className="rounded bg-secondary/50 px-1.5 py-0.5 text-[9px] text-foreground/75 truncate max-w-[170px]"
              >
                {resp}
              </span>
            ))}
            {responsibilities.length > 2 && (
              <span className="text-[9px] text-muted-foreground self-center">
                +{responsibilities.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── 4 Magnetic Handles ────────────────────────────────────────── */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !border-2 !border-card !rounded-full transition-transform hover:scale-130 shadow-sm"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !border-2 !border-card !rounded-full transition-transform hover:scale-130 shadow-sm"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2.5 !h-2.5 !border-2 !border-card !rounded-full transition-transform hover:scale-130 shadow-sm"
        style={{ backgroundColor: config.color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2.5 !h-2.5 !border-2 !border-card !rounded-full transition-transform hover:scale-130 shadow-sm"
        style={{ backgroundColor: config.color }}
      />
    </div>
  );
}

function areBaseNodePropsEqual(prev: BaseNodeProps, next: BaseNodeProps): boolean {
  if (prev.id !== next.id) return false;
  if (prev.selected !== next.selected) return false;
  if (prev.dragging !== next.dragging) return false;
  if (prev.isConnectable !== next.isConnectable) return false;

  const p = prev.data;
  const n = next.data;
  if (p === n) return true;
  if (!p || !n) return false;

  if (p.id !== n.id) return false;
  if (p.type !== n.type) return false;
  if (p.name !== n.name) return false;
  if (p.technology !== n.technology) return false;
  if (p.description !== n.description) return false;

  const prevResp = p.responsibilities || [];
  const nextResp = n.responsibilities || [];
  if (prevResp.length !== nextResp.length) return false;
  for (let i = 0; i < prevResp.length; i++) {
    if (prevResp[i] !== nextResp[i]) return false;
  }

  return true;
}

export const BaseNode = memo(BaseNodeComponent, areBaseNodePropsEqual);

