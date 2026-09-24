// NodePropertyEditor — Form for editing semantic properties of a selected node.

"use client";

import { useCanvasStore } from "@/stores/canvasStore";
import { NODE_TYPE_CONFIG, NODE_TYPES } from "@/lib/constants";
import type { FlowNode } from "@/types/canvas";
import type { NodeType } from "@/types/semantic";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface NodePropertyEditorProps {
  node: FlowNode;
}

export function NodePropertyEditor({ node }: NodePropertyEditorProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const [newResponsibility, setNewResponsibility] = useState("");

  const config = NODE_TYPE_CONFIG[node.data.type];

  const handleChange = (field: string, value: string) => {
    updateNodeData(node.id, { [field]: value });
  };

  const handleTypeChange = (newType: NodeType) => {
    updateNodeData(node.id, { type: newType });
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

  return (
    <div className="space-y-4">
      {/* Node ID (read-only) */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          ID
        </label>
        <p className="text-xs text-gray-500 font-mono bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
          {node.id}
        </p>
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Type
        </label>
        <div className="grid grid-cols-4 gap-1">
          {NODE_TYPES.map((type) => {
            const typeConfig = NODE_TYPE_CONFIG[type];
            const isSelected = node.data.type === type;
            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type)}
                className={`rounded-md px-2 py-1.5 text-[10px] font-medium transition-all border ${
                  isSelected
                    ? "shadow-sm"
                    : "opacity-60 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: isSelected ? `${typeConfig.color}15` : "transparent",
                  borderColor: isSelected ? typeConfig.color : "#e5e7eb",
                  color: typeConfig.color,
                }}
              >
                {typeConfig.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Name
        </label>
        <input
          type="text"
          value={node.data.name}
          onChange={(e) => handleChange("name", e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
          placeholder="Component name"
        />
      </div>

      {/* Technology */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Technology
        </label>
        <input
          type="text"
          value={node.data.technology ?? ""}
          onChange={(e) => handleChange("technology", e.target.value)}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
          placeholder="e.g. Node.js, PostgreSQL, Redis"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Description
        </label>
        <textarea
          value={node.data.description ?? ""}
          onChange={(e) => handleChange("description", e.target.value)}
          rows={3}
          className="w-full rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors resize-none"
          placeholder="What does this component do?"
        />
      </div>

      {/* Responsibilities */}
      <div>
        <label className="block text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-1">
          Responsibilities
        </label>
        <div className="space-y-1.5">
          {(node.data.responsibilities ?? []).map((resp, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md bg-gray-50 px-2 py-1.5 border border-gray-100 group"
            >
              <span className="flex-1 text-xs text-gray-700">{resp}</span>
              <button
                onClick={() => removeResponsibility(index)}
                className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Minus size={12} />
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
              className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
              placeholder="Add responsibility..."
            />
            <button
              onClick={addResponsibility}
              className="rounded-md p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Type info */}
      <div className="rounded-lg p-3 border" style={{ backgroundColor: `${config.color}08`, borderColor: `${config.color}20` }}>
        <p className="text-[11px] text-gray-500">{config.description}</p>
      </div>
    </div>
  );
}
