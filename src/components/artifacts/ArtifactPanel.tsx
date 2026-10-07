// ArtifactPanel — Modal overlay for generating and previewing implementation artifacts.

"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { ArtifactPreview } from "./ArtifactPreview";
import { X, FileCode2, FileText, FileJson, Settings } from "lucide-react";
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
    description: "Generate docker-compose.yml for local development",
    icon: <FileCode2 size={18} />,
  },
  {
    type: "architecture-readme",
    label: "Architecture README",
    description: "Generate comprehensive architecture documentation",
    icon: <FileText size={18} />,
  },
  {
    type: "api-contracts",
    label: "API Contracts",
    description: "Generate TypeScript interfaces for API contracts",
    icon: <FileJson size={18} />,
  },
  {
    type: "env-template",
    label: ".env Template",
    description: "Generate environment variable template",
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
      setError("Add some nodes to your canvas first!");
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

      // Read the streamed content
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[85vh] w-[90vw] max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">
              Generate Artifacts
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Generate implementation files from your architecture
            </p>
          </div>
          <button
            onClick={closePanel}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Artifact Type Selector */}
          <div className="w-72 border-r border-white/10 p-4 overflow-y-auto">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-3">
              Artifact Type
            </p>
            <div className="space-y-2">
              {ARTIFACT_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  onClick={() => handleGenerate(opt.type)}
                  disabled={isGenerating}
                  className={`w-full rounded-xl border p-3 text-left transition-all hover:border-blue-500/40 hover:bg-blue-500/5 disabled:opacity-50 disabled:cursor-not-allowed ${
                    activeArtifact?.type === opt.type
                      ? "border-blue-500/50 bg-blue-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-blue-400">{opt.icon}</span>
                    <span className="text-sm font-medium text-white">
                      {opt.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {opt.description}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Right: Preview */}
          <div className="flex-1 overflow-hidden">
            {isGenerating ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                  <p className="text-sm text-gray-400">
                    Generating artifact...
                  </p>
                </div>
              </div>
            ) : activeArtifact ? (
              <ArtifactPreview artifact={activeArtifact} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FileCode2 size={40} className="mx-auto mb-3 text-gray-600" />
                  <p className="text-sm text-gray-500">
                    Select an artifact type to generate
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
