// UserMessage — Renders a user's chat message bubble.

"use client";

import type { ChatMessage } from "@/types/chat";
import { User } from "lucide-react";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-2.5 justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-xs text-primary-foreground leading-relaxed shadow-sm">
          {message.content}
        </div>
        <p className="mt-1 text-right text-[10px] text-muted-foreground">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground mt-0.5 border border-border">
        <User size={13} />
      </div>
    </div>
  );
}
