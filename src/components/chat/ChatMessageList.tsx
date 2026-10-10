// ChatMessageList — Scrollable list of chat messages with auto-scroll and quick architectural prompts.

"use client";

import { useEffect, useRef } from "react";
import { useChatStore } from "@/stores/chatStore";
import { UserMessage } from "./UserMessage";
import { AIMessage } from "./AIMessage";
import { MutationPlanMessage } from "./MutationPlanMessage";
import { Sparkles, Terminal, Zap, Shield, ArrowRight } from "lucide-react";

const SUGGESTED_PROMPTS = [
  {
    icon: <Zap size={12} className="text-amber-500" />,
    text: "Add a Redis caching layer for read replica performance",
  },
  {
    icon: <Shield size={12} className="text-primary" />,
    text: "Introduce an API Gateway with JWT verification and rate limiting",
  },
  {
    icon: <ArrowRight size={12} className="text-ai" />,
    text: "Decouple processing using a Kafka event queue",
  },
  {
    icon: <Terminal size={12} className="text-primary" />,
    text: "Inspect single points of failure and synchronous deadlocks",
  },
];

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
      <div className="flex-1 flex flex-col items-center justify-center p-5 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ai/15 border border-ai/30 mb-3 shadow-lg shadow-ai/5">
          <Sparkles size={20} className="text-ai" />
        </div>
        <h4 className="text-xs font-bold text-foreground mb-1 tracking-tight">
          System Design Copilot
        </h4>
        <p className="text-[11px] text-muted-foreground max-w-[260px] leading-relaxed mb-4">
          Ask Flowboard AI to optimize your design, add microservices, inject caches, or propose architecture refactors.
        </p>

        <div className="w-full space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground text-left px-1">
            Suggested Actions
          </p>
          {SUGGESTED_PROMPTS.map((prompt, i) => (
            <SuggestionButton key={i} icon={prompt.icon} text={prompt.text} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3.5 space-y-3">
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

function SuggestionButton({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  const sendMessage = useChatStore((s) => s.sendMessage);

  return (
    <button
      onClick={() => sendMessage(text)}
      className="w-full flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-left text-xs text-foreground/80 hover:text-foreground hover:bg-secondary hover:border-ai/30 transition-all group"
    >
      <span className="shrink-0">{icon}</span>
      <span className="text-[11px] line-clamp-1 flex-1 leading-normal">
        {text}
      </span>
      <ArrowRight
        size={11}
        className="opacity-0 group-hover:opacity-100 text-muted-foreground transition-opacity shrink-0"
      />
    </button>
  );
}
