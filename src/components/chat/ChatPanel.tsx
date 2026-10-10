// ChatPanel — Premium AI Architecture Copilot Panel.
// Designed with Linear/Raycast aesthetic, architectural context chips,
// and structured mutation workflow.

"use client";

import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useCanvasStore } from "@/stores/canvasStore";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { X, Sparkles, Terminal, Trash2 } from "lucide-react";

export function ChatPanel() {
  const isOpen = useUIStore((s) => s.isChatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const messages = useChatStore((s) => s.messages);
  const clearMessages = useChatStore((s) => s.clearMessages);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  if (!isOpen) return null;

  return (
    <aside className="flex w-96 flex-col border-r border-border bg-card/95 shadow-2xl backdrop-blur-2xl overflow-hidden z-20 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ai/15 text-ai border border-ai/30 shadow-sm">
            <Sparkles size={14} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-foreground tracking-tight">
                Flowboard AI
              </h3>
              <span className="rounded bg-ai/15 px-1.5 py-0.5 text-[9px] font-mono font-medium text-ai border border-ai/25">
                COPILOT
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Context: {nodes.length} nodes · {edges.length} edges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Clear chat history"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={() => setChatOpen(false)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Close AI panel (⌘J)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatMessageList />

      {/* Input */}
      <ChatInput />
    </aside>
  );
}
