// AIMessage — Renders the AI assistant's message bubble with streaming indicator.

"use client";

import type { ChatMessage } from "@/types/chat";
import { Sparkles, AlertCircle } from "lucide-react";

export function AIMessage({ message }: { message: ChatMessage }) {
  const isStreaming = message.status === "streaming";
  const isError = message.type === "error";

  return (
    <div className="flex gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-600/20 mt-0.5">
        <Sparkles size={13} className="text-blue-400" />
      </div>
      <div className="max-w-[85%]">
        <div
          className={`rounded-2xl rounded-bl-md px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
            isError
              ? "bg-red-500/10 text-red-300 border border-red-500/20"
              : "bg-white/5 text-gray-200 border border-white/5"
          }`}
        >
          {isError && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <AlertCircle size={12} className="text-red-400" />
              <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider">
                Error
              </span>
            </div>
          )}
          <div className="whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block ml-1 animate-pulse">▊</span>
            )}
          </div>
        </div>
        <p className="mt-1 text-[10px] text-gray-600">
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
