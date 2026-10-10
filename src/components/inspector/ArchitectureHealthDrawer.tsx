// ArchitectureHealthDrawer — Slide-over inspector panel for static architecture analysis.
// Shows live health score, synchronous cycle warnings, security tier breaches,
// SPOFs, and provides 1-click "Fix with AI" remediation.

"use client";

import { useMemo } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  X,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Zap,
} from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { useChatStore } from "@/stores/chatStore";
import { lintArchitecture, type ArchitectureIssue } from "@/engine/linter";

export function ArchitectureHealthDrawer() {
  const isOpen = useUIStore((s) => s.isLinterOpen);
  const setLinterOpen = useUIStore((s) => s.setLinterOpen);
  const selectNode = useUIStore((s) => s.selectNode);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const sendMessage = useChatStore((s) => s.sendMessage);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const getSemanticGraph = useCanvasStore((s) => s.getSemanticGraph);

  const report = useMemo(() => {
    if (nodes.length === 0) return null;
    const graph = getSemanticGraph();
    return lintArchitecture(graph);
  }, [nodes, edges, getSemanticGraph]);

  if (!isOpen) return null;

  const handleFixWithAI = (issue: ArchitectureIssue) => {
    setChatOpen(true);
    sendMessage(
      `Fix this architectural issue in the diagram: "${issue.title}".\nDetails: ${issue.message}\nRecommendation: ${issue.recommendation}`
    );
  };

  const score = report?.score ?? 100;
  const scoreColor =
    score >= 90
      ? "text-emerald-500 border-emerald-500/40 bg-emerald-500/15"
      : score >= 70
        ? "text-amber-500 border-amber-500/40 bg-amber-500/15"
        : "text-destructive border-destructive/40 bg-destructive/15";

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-96 max-w-[90vw] flex flex-col border-l border-border bg-card/95 shadow-2xl backdrop-blur-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary border border-primary/25">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Architecture Health
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Static distributed systems linter
            </p>
          </div>
        </div>
        <button
          onClick={() => setLinterOpen(false)}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Score Card */}
        <div className="rounded-xl border border-border bg-secondary/30 p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
              Health Score
            </p>
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {score}
              <span className="text-sm font-normal text-muted-foreground">/100</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {score >= 90
                ? "Excellent · Ready for scale"
                : score >= 70
                  ? "Good · Minor improvements recommended"
                  : "Critical issues detected"}
            </p>
          </div>

          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-xl font-black ${scoreColor}`}
          >
            {score >= 90 ? "A+" : score >= 70 ? "B" : "C"}
          </div>
        </div>

        {/* Quick Graph Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 text-center">
            <span className="block text-base font-bold text-foreground">
              {nodes.length}
            </span>
            <span className="text-[10px] text-muted-foreground">Components</span>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 text-center">
            <span className="block text-base font-bold text-foreground">
              {edges.length}
            </span>
            <span className="text-[10px] text-muted-foreground">Connections</span>
          </div>
          <div className="rounded-lg border border-border bg-secondary/20 p-2.5 text-center">
            <span
              className={`block text-base font-bold ${
                (report?.issues.length ?? 0) === 0
                  ? "text-emerald-500"
                  : "text-amber-500"
              }`}
            >
              {report?.issues.length ?? 0}
            </span>
            <span className="text-[10px] text-muted-foreground">Issues</span>
          </div>
        </div>

        {/* Detected Issues */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Diagnostic Checks
            </span>
            <span className="text-[10px] text-muted-foreground">
              {report?.issues.length || 0} found
            </span>
          </div>

          {report && report.issues.length > 0 ? (
            <div className="space-y-3">
              {report.issues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-2 shadow-sm"
                >
                  <div className="flex items-start gap-2">
                    {issue.severity === "error" ? (
                      <AlertCircle
                        size={15}
                        className="text-destructive shrink-0 mt-0.5"
                      />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle
                        size={15}
                        className="text-amber-500 shrink-0 mt-0.5"
                      />
                    ) : (
                      <Info
                        size={15}
                        className="text-ai shrink-0 mt-0.5"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-foreground leading-tight">
                        {issue.title}
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        {issue.message}
                      </p>
                    </div>
                  </div>

                  {/* Affected Node Badges */}
                  {issue.affectedNodeIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[9px] text-muted-foreground">Target:</span>
                      {issue.affectedNodeIds.map((nodeId) => (
                        <button
                          key={nodeId}
                          onClick={() => selectNode(nodeId)}
                          className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-mono text-ai hover:bg-ai/20 border border-border transition-colors"
                          title="Click to select node"
                        >
                          {nodeId}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Recommendation */}
                  <div className="rounded-lg bg-secondary/40 p-2 text-[10px] text-foreground/80 border border-border">
                    <span className="font-semibold text-ai">
                      Recommendation:{" "}
                    </span>
                    {issue.recommendation}
                  </div>

                  {/* 1-Click Fix with AI */}
                  <button
                    onClick={() => handleFixWithAI(issue)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-ai/30 bg-ai/15 py-1.5 text-xs font-semibold text-ai hover:bg-ai/25 hover:border-ai/50 transition-all active:scale-98"
                  >
                    <Sparkles size={12} className="text-ai" />
                    Fix with Flowboard AI
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2
                size={28}
                className="mx-auto text-emerald-500 mb-2"
              />
              <p className="text-xs font-semibold text-foreground">
                All Architecture Checks Passing!
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                No synchronous deadlocks, tier leaks, or unbuffered bottlenecks found.
              </p>
            </div>
          )}
        </div>

        {/* Passed Audits Checklist */}
        {report && report.passedChecks && report.passedChecks.length > 0 && (
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Verified Properties
            </span>
            <div className="space-y-1.5">
              {report.passedChecks.map((check, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg bg-secondary/20 px-2.5 py-1.5 text-xs text-foreground/80 border border-border"
                >
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <span className="text-[11px]">{check}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
