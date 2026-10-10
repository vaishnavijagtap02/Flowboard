// NodePropertyEditor — Figma-level inspector for editing semantic component properties.
// Features technology suggestions, responsibilities management, and AI actions.

"use client";

import { useState } from "react";
import { useCanvasStore } from "@/stores/canvasStore";
import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { NODE_TYPE_CONFIG, NODE_TYPES } from "@/lib/constants";
import type { FlowNode } from "@/types/canvas";
import type { NodeType } from "@/types/semantic";
import {
  Plus,
  X,
  Copy,
  Check,
  Trash2,
  Sparkles,
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

interface NodePropertyEditorProps {
  node: FlowNode;
}

export function NodePropertyEditor({ node }: NodePropertyEditorProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNode = useCanvasStore((s) => s.removeNode);
  const clearSelection = useUIStore((s) => s.clearSelection);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const [newResponsibility, setNewResponsibility] = useState("");
  const [copiedId, setCopiedId] = useState(false);

  const config = NODE_TYPE_CONFIG[node.data.type] || NODE_TYPE_CONFIG.service;

  const handleChange = (field: string, value: string) => {
    updateNodeData(node.id, { [field]: value });
  };

  const handleTypeChange = (newType: NodeType) => {
    updateNodeData(node.id, { type: newType });
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(node.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  const addResponsibility = () => {
    if (!newResponsibility.trim()) return;
    const current = node.data.responsibilities ?? [];
    updateNodeData(node.id, {
      responsibilities: [...current, newResponsibility.trim()],
    });
    setNewResponsibility("");
  };

  const removeResponsibility = (index: number) => {
    const current = node.data.responsibilities ?? [];
    updateNodeData(node.id, {
      responsibilities: current.filter((_, i) => i !== index),
    });
  };

  const handleDelete = () => {
    removeNode(node.id);
    clearSelection();
  };

  const handleAskAI = () => {
    setChatOpen(true);
    sendMessage(
      `Review component "${node.data.name}" (${config.label} - ${node.data.technology || "General"}). Suggest recommended design patterns, caching strategies, and fault tolerances.`
    );
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Component ID */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Component ID
        </label>
        <div className="flex items-center justify-between rounded-lg bg-secondary/30 px-2.5 py-1.5 border border-border">
          <span className="font-mono text-foreground/80 truncate">{node.id}</span>
          <button
            onClick={handleCopyId}
            className="text-muted-foreground hover:text-foreground transition-colors ml-2"
            title="Copy ID"
          >
            {copiedId ? (
              <Check size={12} className="text-ai" />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
      </div>

      {/* Semantic Type Grid */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
          Semantic Primitive
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {NODE_TYPES.map((type) => {
            const typeConfig = NODE_TYPE_CONFIG[type];
            const Icon = ICON_MAP[typeConfig.icon] || Server;
            const isSelected = node.data.type === type;

            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`flex flex-col items-center justify-center rounded-lg p-2 transition-all border ${
                  isSelected
                    ? "shadow-sm scale-102"
                    : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
                style={{
                  backgroundColor: isSelected
                    ? `${typeConfig.color}20`
                    : undefined,
                  borderColor: isSelected ? typeConfig.color : undefined,
                  color: isSelected ? typeConfig.color : undefined,
                }}
                title={typeConfig.label}
              >
                <Icon size={14} className="mb-1" />
                <span className="text-[9px] font-medium leading-none">
                  {typeConfig.label.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Name */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Component Name
        </label>
        <input
          type="text"
          value={node.data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          placeholder="e.g. Auth Gateway"
        />
      </div>

      {/* Technology Stack & Recommendations */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Technology Stack
        </label>
        <input
          type="text"
          value={node.data.technology ?? ""}
          onChange={(e) => handleChange("technology", e.target.value)}
          className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
          placeholder="e.g. Go, PostgreSQL, Redis"
        />

        {/* Quick Suggestion Chips */}
        {config.defaultTech && config.defaultTech.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="text-[9px] text-muted-foreground">Suggested:</span>
            {config.defaultTech.map((tech) => (
              <button
                key={tech}
                onClick={() => handleChange("technology", tech)}
                className="rounded bg-secondary/50 hover:bg-secondary px-1.5 py-0.5 text-[9px] text-foreground/80 hover:text-foreground border border-border transition-colors"
              >
                {tech}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Architectural Role
        </label>
        <textarea
          value={node.data.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors resize-none leading-relaxed"
          placeholder="Describe purpose, throughput, or SLA..."
        />
      </div>

      {/* Responsibilities Tags */}
      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Responsibilities & Tasks
        </label>
        <div className="space-y-1.5">
          {(node.data.responsibilities ?? []).map((resp, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 rounded-lg bg-secondary/30 px-2.5 py-1.5 border border-border group"
            >
              <span className="text-foreground text-[11px] truncate">{resp}</span>
              <button
                onClick={() => removeResponsibility(index)}
                className="text-muted-foreground hover:text-destructive transition-colors"
                title="Remove responsibility"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addResponsibility();
              }}
              className="flex-1 rounded-lg border border-border bg-secondary/20 px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              placeholder="Add duty (e.g. JWT Auth)..."
            />
            <button
              onClick={addResponsibility}
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-border space-y-2">
        <button
          onClick={handleAskAI}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-ai/30 bg-ai/15 py-2 text-xs font-semibold text-ai hover:bg-ai/25 hover:border-ai/50 transition-colors shadow-sm"
        >
          <Sparkles size={13} className="text-ai" />
          Ask AI to Review Component
        </button>

        <button
          onClick={handleDelete}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-destructive/20 bg-destructive/5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/15 hover:border-destructive/40 transition-colors"
        >
          <Trash2 size={13} />
          Delete Component
        </button>
      </div>
    </div>
  );
}
