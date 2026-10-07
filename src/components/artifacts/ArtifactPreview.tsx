// ArtifactPreview — Code preview with copy and download buttons.

"use client";

import { useState, useCallback } from "react";
import type { GeneratedArtifact } from "@/types/artifacts";
import { Copy, Check, Download, FileCode2 } from "lucide-react";

export function ArtifactPreview({
  artifact,
}: {
  artifact: GeneratedArtifact;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(artifact.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = artifact.content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [artifact.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = artifact.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [artifact.content, artifact.filename]);

  return (
    <div className="flex h-full flex-col">
      {/* Preview Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <FileCode2 size={14} className="text-blue-400" />
          <span className="text-sm font-medium text-white">
            {artifact.filename}
          </span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-gray-400">
            {artifact.language}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <>
                <Check size={13} className="text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-500 transition-colors"
          >
            <Download size={13} />
            Download
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto p-4 bg-[#0a0b0f]">
        <pre className="text-sm leading-relaxed">
          <code className="text-gray-300 font-mono">{artifact.content}</code>
        </pre>
      </div>
    </div>
  );
}
