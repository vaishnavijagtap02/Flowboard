// UserMessage — Renders a user's chat message bubble.

"use client";

import type { ChatMessage } from "@/types/chat";
import { User } from "lucide-react";

export function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex gap-2.5 justify-end">
      <div className="max-w-[85%]">
        <div className="rounded-2xl rounded-br-md bg-gradient-to-r from-blue-600 to-violet-600 px-3.5 py-2.5 text-sm text-white leading-relaxed shadow-lg shadow-blue-600/10">
          {message.content}
        </div>
        <p className="mt-1 text-right text-[10px] text-gray-600">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 mt-0.5">
        <User size={13} className="text-gray-400" />
      </div>
    </div>
  );
}
