// Toolbar — Top bar with node palette, branding, and action buttons.

"use client";

import { NodePalette } from "./NodePalette";
import { MessageSquare, Trash2, Download } from "lucide-react";
import { useUIStore } from "@/stores/uiStore";
import { useCanvasStore } from "@/stores/canvasStore";

export function Toolbar() {
  const toggleChat = useUIStore((s) => s.toggleChat);
  const isChatOpen = useUIStore((s) => s.isChatOpen);
  const openArtifactPanel = useUIStore((s) => s.openArtifactPanel);
  const clearCanvas = useCanvasStore((s) => s.clearCanvas);

  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
            <span className="text-sm font-bold text-white">F</span>
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
            Flowboard
          </span>
        </div>
        <div className="h-6 w-px bg-gray-200" />
        <NodePalette />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={openArtifactPanel}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
          title="Generate Artifacts"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Artifacts</span>
        </button>

        <button
          onClick={toggleChat}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
            isChatOpen
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "text-gray-600 hover:bg-gray-100 border-gray-200"
          }`}
          title="Toggle AI Chat"
        >
          <MessageSquare size={14} />
          <span className="hidden sm:inline">AI Chat</span>
        </button>

        <div className="h-6 w-px bg-gray-200" />

        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors border border-gray-200"
          title="Clear Canvas"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
