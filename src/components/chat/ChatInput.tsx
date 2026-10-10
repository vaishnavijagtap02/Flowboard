// ChatInput — Message input with send button.

"use client";

import { useState, useRef, useCallback } from "react";
import { useChatStore } from "@/stores/chatStore";
import { Send } from "lucide-react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    sendMessage(trimmed);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  return (
    <div className="border-t border-border p-3 bg-card/60">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2 focus-within:border-ai/50 focus-within:ring-1 focus-within:ring-ai/30 transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? "AI is synthesizing..."
              : "Ask about your architecture..."
          }
          disabled={isStreaming}
          rows={1}
          className="flex-1 resize-none bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none disabled:opacity-50"
          style={{ maxHeight: 120 }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ai text-white transition-all hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
        >
          <Send size={13} />
        </button>
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground text-center">
        Shift+Enter for newline · AI proposes changes for your approval
      </p>
    </div>
  );
}
