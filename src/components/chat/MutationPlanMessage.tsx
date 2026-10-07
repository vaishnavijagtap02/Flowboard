// MutationPlanMessage — Shows a proposed AI mutation plan with approve/reject buttons.
// Displays a human-readable preview of each mutation in the plan.

"use client";

import { useChatStore } from "@/stores/chatStore";
import type { ChatMessage } from "@/types/chat";
import type { GraphMutation } from "@/types/mutations";
import {
  Check,
  X,
  Plus,
  Minus,
  Pencil,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function MutationPlanMessage({ message }: { message: ChatMessage }) {
  const approvePlan = useChatStore((s) => s.approvePlan);
  const rejectPlan = useChatStore((s) => s.rejectPlan);

  const plan = message.mutationPlan;
  if (!plan) return null;

  const isPending = message.status === "pending";
  const isApproved = message.status === "approved";
  const isRejected = message.status === "rejected";

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 mt-0.5">
        <Sparkles size={13} className="text-blue-400" />
      </div>
      <div className="max-w-[90%] w-full">
        {/* Explanation */}
        {message.content && (
          <div className="rounded-2xl rounded-bl-md bg-white/5 border border-white/5 px-3.5 py-2.5 text-sm text-gray-200 leading-relaxed mb-2">
            {message.content}
          </div>
        )}

        {/* Mutation Plan Card */}
        <div
          className={`rounded-xl border overflow-hidden ${
            isApproved
              ? "border-emerald-500/30 bg-emerald-500/5"
              : isRejected
                ? "border-red-500/30 bg-red-500/5"
                : "border-blue-500/30 bg-blue-500/5"
          }`}
        >
          {/* Plan Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isApproved
                    ? "text-emerald-400"
                    : isRejected
                      ? "text-red-400"
                      : "text-blue-400"
                }`}
              >
                {isApproved
                  ? "✓ Applied"
                  : isRejected
                    ? "✕ Rejected"
                    : "Proposed Changes"}
              </span>
            </div>
            <span className="text-[10px] text-gray-500">
              {plan.mutations.length} mutation
              {plan.mutations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Mutation List */}
          <div className="divide-y divide-white/5">
            {plan.mutations.map((mutation, i) => (
              <MutationPreviewRow key={i} mutation={mutation} index={i} />
            ))}
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2 p-3 border-t border-white/5">
              <button
                onClick={approvePlan}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-medium text-white hover:bg-emerald-500 transition-colors"
              >
                <Check size={14} />
                Apply Changes
              </button>
              <button
                onClick={rejectPlan}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/20 transition-colors"
              >
                <X size={14} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Individual Mutation Row ───────────────────────────────────────────────────

function MutationPreviewRow({
  mutation,
  index,
}: {
  mutation: GraphMutation;
  index: number;
}) {
  const { icon, label, detail, color } = getMutationDisplay(mutation);

  return (
    <div className="flex items-start gap-2.5 px-3 py-2">
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded mt-0.5"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-gray-200 truncate">{label}</p>
        {detail && (
          <p className="text-[10px] text-gray-500 truncate mt-0.5">{detail}</p>
        )}
      </div>
      <span className="text-[10px] text-gray-600 shrink-0">#{index + 1}</span>
    </div>
  );
}

function getMutationDisplay(mutation: GraphMutation): {
  icon: React.ReactNode;
  label: string;
  detail: string;
  color: string;
} {
  switch (mutation.action) {
    case "ADD_NODE":
      return {
        icon: <Plus size={12} />,
        label: `Add "${mutation.node.name}"`,
        detail: `${mutation.node.type}${mutation.node.technology ? ` · ${mutation.node.technology}` : ""}`,
        color: "#10B981",
      };
    case "REMOVE_NODE":
      return {
        icon: <Minus size={12} />,
        label: `Remove node`,
        detail: mutation.nodeId,
        color: "#EF4444",
      };
    case "UPDATE_NODE":
      return {
        icon: <Pencil size={12} />,
        label: `Update node`,
        detail: `${mutation.nodeId} → ${Object.keys(mutation.updates).join(", ")}`,
        color: "#F59E0B",
      };
    case "ADD_EDGE":
      return {
        icon: <ArrowRight size={12} />,
        label: `Connect ${mutation.edge.source} → ${mutation.edge.target}`,
        detail: mutation.edge.relationship,
        color: "#3B82F6",
      };
    case "REMOVE_EDGE":
      return {
        icon: <Minus size={12} />,
        label: `Remove edge`,
        detail: mutation.edgeId,
        color: "#EF4444",
      };
  }
}
