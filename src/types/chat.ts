// Chat types for the AI interaction panel.

import type { AIMutationPlan } from "./mutations";

export type ChatRole = "user" | "assistant" | "system";

export type MessageType = "text" | "mutation_plan" | "error";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  type: MessageType;
  content: string;
  mutationPlan?: AIMutationPlan;
  status: "pending" | "streaming" | "complete" | "approved" | "rejected";
  timestamp: number;
}
