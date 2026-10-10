// AIMessage — Renders the AI assistant's message bubble with streaming indicator.

"use client";

import type { ChatMessage } from "@/types/chat";
import { Sparkles, AlertCircle } from "lucide-react";

export function AIMessage({ message }: { message: ChatMessage }) {
  const isStreaming = message.status === "streaming";
  const isError = message.type === "error";

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ai/15 text-ai border border-ai/30 mt-0.5">
        <Sparkles size={13} />
      </div>
      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
            isError
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-secondary/50 text-foreground border border-border"
          }`}
        >
          {isError && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle size={12} className="text-destructive" />
              <span className="text-[10px] font-medium text-destructive uppercase tracking-wider">
                Error
              </span>
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block ml-1 animate-pulse text-ai">▊</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {isStreaming
            ? "Thinking..."
            : new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
        </p>
      </div>
    </div>
  );
}
