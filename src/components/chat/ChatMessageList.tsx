// ChatMessageList — Scrollable list of chat messages with auto-scroll.

"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { MutationPlanMessage } from "./MutationPlanMessage";
import { MessageSquare } from "lucide-react";

export function ChatMessageList() {
  const messages = useChatStore((s) => s.messages);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-600/20 mb-3">
          <MessageSquare size={22} className="text-blue-400" />
        </div>
        <h4 className="text-sm font-medium text-white mb-1">
          Start a conversation
        </h4>
        <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed">
          Ask the AI to analyze your architecture, add components, or suggest
          improvements. It can see your entire graph.
        </p>
        <div className="mt-4 space-y-2 w-full max-w-[240px]">
          {[
            "Add a Redis cache layer",
            "What are the bottlenecks?",
            "Add auth service with JWT",
          ].map((suggestion) => (
            <SuggestionChip key={suggestion} text={suggestion} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => {
        if (msg.role === "user") {
          return <UserMessage key={msg.id} message={msg} />;
        }

        if (msg.type === "mutation_plan" && msg.mutationPlan) {
          return <MutationPlanMessage key={msg.id} message={msg} />;
        }

        return <AIMessage key={msg.id} message={msg} />;
      })}
    </div>
  );
}

function SuggestionChip({ text }: { text: string }) {
  const sendMessage = useChatStore((s) => s.sendMessage);

  return (
    <button
      onClick={() => sendMessage(text)}
      className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all"
    >
      {text}
    </button>
  );
}
