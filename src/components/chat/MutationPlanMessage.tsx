// MutationPlanMessage — Shows a proposed AI architecture mutation plan.
// Styled like a Linear pull-request / Git diff card with approve/reject workflow.

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
  GitPullRequest,
  CheckCircle2,
  XCircle,
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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai/15 text-ai border border-ai/30 mt-0.5">
        <Sparkles size={13} />
      </div>

      <div className="max-w-[92%] w-full space-y-2">
        {/* Explanation Message */}
        {message.content && (
          <div className="rounded-2xl rounded-tl-sm bg-secondary/40 border border-border px-3.5 py-2.5 text-xs text-foreground leading-relaxed">
            {message.content}
          </div>
        )}

        {/* Mutation Diff Card */}
        <div
          className={`rounded-xl border overflow-hidden shadow-lg transition-all ${
            isApproved
              ? "border-emerald-500/40 bg-emerald-500/10"
              : isRejected
                ? "border-destructive/40 bg-destructive/10"
                : "border-ai/40 bg-card shadow-ai/5"
          }`}
        >
          {/* Plan Header */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-border bg-secondary/20">
            <div className="flex items-center gap-2">
              <GitPullRequest
                size={13}
                className={
                  isApproved
                    ? "text-emerald-500"
                    : isRejected
                      ? "text-destructive"
                      : "text-ai"
                }
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider ${
                  isApproved
                    ? "text-emerald-500"
                    : isRejected
                      ? "text-destructive"
                      : "text-ai"
                }`}
              >
                {isApproved
                  ? "✓ Changes Applied"
                  : isRejected
                    ? "✕ Plan Rejected"
                    : "Architecture Proposal"}
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {plan.mutations.length} change{plan.mutations.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Mutations List */}
          <div className="divide-y divide-border">
            {plan.mutations.map((mutation, i) => (
              <MutationPreviewRow key={i} mutation={mutation} index={i} />
            ))}
          </div>

          {/* Action Buttons */}
          {isPending && (
            <div className="flex gap-2 p-2.5 border-t border-border bg-secondary/20">
              <button
                onClick={approvePlan}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-sm active:scale-98"
              >
                <Check size={13} strokeWidth={2.5} />
                Apply to Canvas
              </button>
              <button
                onClick={rejectPlan}
                className="flex items-center justify-center gap-1 rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors"
              >
                <X size={13} />
                Reject
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MutationPreviewRow({
  mutation,
  index,
}: {
  mutation: GraphMutation;
  index: number;
}) {
  const { icon, label, detail, color } = getMutationDisplay(mutation);

  return (
    <div className="flex items-start gap-2.5 px-3 py-2 hover:bg-secondary/30 transition-colors">
      <div
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded mt-0.5 border"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}35`,
          color,
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground truncate">{label}</p>
        {detail && (
          <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-mono">
            {detail}
          </p>
        )}
      </div>
      <span className="text-[9px] text-muted-foreground/60 shrink-0 font-mono mt-0.5">
        #{index + 1}
      </span>
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
        icon: <Plus size={11} strokeWidth={2.5} />,
        label: `Add Component "${mutation.node.name}"`,
        detail: `${mutation.node.type}${mutation.node.technology ? ` · ${mutation.node.technology}` : ""}`,
        color: "#0284C7",
      };
    case "REMOVE_NODE":
      return {
        icon: <Minus size={11} strokeWidth={2.5} />,
        label: `Remove Component`,
        detail: mutation.nodeId,
        color: "#EF4444",
      };
    case "UPDATE_NODE":
      return {
        icon: <Pencil size={11} />,
        label: `Update Component`,
        detail: `${mutation.nodeId} → ${Object.keys(mutation.updates).join(", ")}`,
        color: "#F59E0B",
      };
    case "ADD_EDGE":
      return {
        icon: <ArrowRight size={11} strokeWidth={2.5} />,
        label: `Connect ${mutation.edge.source} → ${mutation.edge.target}`,
        detail: `${mutation.edge.relationship}${mutation.edge.protocol ? ` (${mutation.edge.protocol})` : ""}`,
        color: "#38BDF8",
      };
    case "REMOVE_EDGE":
      return {
        icon: <Minus size={11} strokeWidth={2.5} />,
        label: `Remove Connection`,
        detail: mutation.edgeId,
        color: "#EF4444",
      };
  }
}
