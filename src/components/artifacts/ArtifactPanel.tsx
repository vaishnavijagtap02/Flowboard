// ArtifactPanel — Modal overlay for generating and previewing implementation artifacts.
// Generates Docker Compose, Architecture READMEs, API Contracts, and .env templates.

"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { ArtifactPreview } from "./ArtifactPreview";
import { X, FileCode2, FileText, FileJson, Settings, Sparkles, Layers } from "lucide-react";
import type { ArtifactType, GeneratedArtifact } from "@/types/artifacts";

const ARTIFACT_OPTIONS: {
  type: ArtifactType;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "docker-compose",
    label: "Docker Compose",
    description: "Generate docker-compose.yml for local development & multi-container orchestration",
    icon: <FileCode2 size={18} />,
  },
  {
    type: "architecture-readme",
    label: "Architecture README",
    description: "Generate system documentation, service responsibilities, and data flow specifications",
    icon: <FileText size={18} />,
  },
  {
    type: "api-contracts",
    label: "API Contracts",
    description: "Generate TypeScript types and request/response interfaces for boundaries",
    icon: <FileJson size={18} />,
  },
  {
    type: "env-template",
    label: ".env Configuration",
    description: "Generate environment variables and configuration templates for each service",
    icon: <Settings size={18} />,
  },
];

export function ArtifactPanel() {
  const isOpen = useUIStore((s) => s.isArtifactPanelOpen);
  const closePanel = useUIStore((s) => s.closeArtifactPanel);
  const activeArtifact = useUIStore((s) => s.activeArtifact);
  const setActiveArtifact = useUIStore((s) => s.setActiveArtifact);
  const getSemanticGraph = useCanvasStore((s) => s.getSemanticGraph);
  const nodes = useCanvasStore((s) => s.nodes);

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (artifactType: ArtifactType) => {
    if (nodes.length === 0) {
      setError("Your canvas is empty! Add components or load a template first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const graph = getSemanticGraph();
      const response = await fetch("/api/ai/artifacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graph, artifactType }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Failed to generate artifact");
      }

      const filename =
        response.headers.get("X-Artifact-Filename") ?? "artifact.txt";
      const language =
        response.headers.get("X-Artifact-Language") ?? "text";

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let content = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          content += decoder.decode(value, { stream: true });
        }
      }

      const artifact: GeneratedArtifact = {
        type: artifactType,
        filename,
        language,
        content,
        timestamp: Date.now(),
      };

      setActiveArtifact(artifact);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate artifact"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ai/15 text-ai border border-ai/30">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">
                Architecture Compiler & Artifacts
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Compile semantic system graph into real implementation artifacts
              </p>
            </div>
          </div>
          <button
            onClick={closePanel}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Artifact Type Selector */}
          <div className="w-80 border-r border-border p-4 overflow-y-auto bg-secondary/15">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-1">
              Select Output Artifact
            </p>
            <div className="space-y-2">
              {ARTIFACT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleGenerate(opt.type)}
                  disabled={isGenerating}
                  className={`w-full rounded-xl border p-3.5 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeArtifact?.type === opt.type
                      ? "border-ai/60 bg-ai/15 shadow-sm"
                      : "border-border bg-card/60 hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-ai">{opt.icon}</span>
                    <span className="text-xs font-semibold text-foreground">
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-destructive/10 border border-destructive/30 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Right: Code Preview */}
          <div className="flex-1 overflow-hidden bg-background/50">
            {isGenerating ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-ai border-t-transparent" />
                  <p className="text-xs font-medium text-foreground">
                    Compiling semantic architecture graph...
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Generating deterministic code artifact
                  </p>
                </div>
              </div>
            ) : activeArtifact ? (
              <ArtifactPreview artifact={activeArtifact} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center max-w-xs">
                  <FileCode2 size={40} className="mx-auto mb-3 text-muted-foreground/30" />
                  <p className="text-xs font-medium text-foreground">
                    Select an artifact on the left
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Flowboard compiles your nodes and connections into Docker Compose, READMEs, or contracts.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
