// ChatPanel — Collapsible left panel for AI chat interaction.
// Contains message list + input. Reads from chatStore and uiStore.

"use client";

import { useUIStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { X, Sparkles } from "lucide-react";

export function ChatPanel() {
  const isOpen = useUIStore((s) => s.isChatOpen);
  const setChatOpen = useUIStore((s) => s.setChatOpen);
  const messages = useChatStore((s) => s.messages);
  const clearMessages = useChatStore((s) => s.clearMessages);

  if (!isOpen) return null;

  return (
    <div className="flex w-96 flex-col border-r border-white/10 bg-[#0f1117] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-blue-600/10 to-violet-600/10">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-600">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Flowboard AI</h3>
            <p className="text-[10px] text-gray-400">Architecture Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="rounded-md px-2 py-1 text-[10px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Clear chat"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setChatOpen(false)}
            className="rounded-md p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ChatMessageList />

      {/* Input */}
      <ChatInput />
    </div>
  );
}
