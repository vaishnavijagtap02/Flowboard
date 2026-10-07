import { create } from "zustand";
import { nanoid } from "nanoid";
import type { ChatMessage } from "@/types/chat";
import type { AIMutationPlan } from "@/types/mutations";
import { parseMutationPlan } from "@/engine/mutationEngine";
import { useCanvasStore } from "./canvasStore";

interface ChatStore {
  messages: ChatMessage[];
  isStreaming: boolean;
  pendingPlan: AIMutationPlan | null;

  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  sendMessage: (content: string) => Promise<void>;
  setPendingPlan: (plan: AIMutationPlan | null) => void;
  approvePlan: () => void;
  rejectPlan: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isStreaming: false,
  pendingPlan: null,

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
  })),

  setPendingPlan: (plan) => set({ pendingPlan: plan }),

  clearMessages: () => set({ messages: [], pendingPlan: null, isStreaming: false }),

  approvePlan: () => {
    const { pendingPlan } = get();
    if (!pendingPlan) return;
    
    // Apply mutations via canvas store (delegates to engine layer)
    const applyMutations = useCanvasStore.getState().applyMutations;
    applyMutations(pendingPlan);
    
    // Update the message status to approved
    set((state) => ({
      pendingPlan: null,
      messages: state.messages.map(m => 
        m.type === "mutation_plan" && m.status === "pending" 
          ? { ...m, status: "approved" as const }
          : m
      )
    }));
  },

  rejectPlan: () => {
    set((state) => ({
      pendingPlan: null,
      messages: state.messages.map(m => 
        m.type === "mutation_plan" && m.status === "pending" 
          ? { ...m, status: "rejected" as const }
          : m
      )
    }));
  },

  sendMessage: async (content: string) => {
    const { messages, addMessage, updateMessage } = get();
    const getSemanticGraph = useCanvasStore.getState().getSemanticGraph;
    
    // Add User Message
    const userMsg: ChatMessage = {
      id: nanoid(),
      role: "user",
      type: "text",
      content,
      status: "complete",
      timestamp: Date.now()
    };
    addMessage(userMsg);
    
    // Add empty Assistant Message (streaming)
    const assistantMsgId = nanoid();
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      type: "text",
      content: "",
      status: "streaming",
      timestamp: Date.now()
    };
    addMessage(assistantMsg);
    
    set({ isStreaming: true });

    try {
      const graph = getSemanticGraph();
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, graph, history })
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        
        // Update UI with incoming chunks
        updateMessage(assistantMsgId, { content: fullText });
      }

      // Done streaming. Now we parse to see if there's a mutation plan.
      // Format expects: Explanation text... ===MUTATION_PLAN=== { JSON }
      const parts = fullText.split("===MUTATION_PLAN===");
      const explanation = parts[0].trim();
      
      let parsedPlan: AIMutationPlan | undefined = undefined;
      let hasPlan = false;
      
      if (parts.length > 1) {
        const rawPlan = parts[1].trim();
        const plan = parseMutationPlan(rawPlan);
        if (plan) {
          parsedPlan = plan;
          hasPlan = true;
        }
      }
      
      // Update the final message
      updateMessage(assistantMsgId, {
        content: explanation,
        type: hasPlan ? "mutation_plan" : "text",
        status: hasPlan ? "pending" : "complete",
        mutationPlan: parsedPlan
      });
      
      if (hasPlan && parsedPlan) {
        set({ pendingPlan: parsedPlan });
      }

    } catch (error) {
      console.error("Chat Error:", error);
      updateMessage(assistantMsgId, { 
        content: "Sorry, I encountered an error while processing your request.",
        type: "error",
        status: "complete"
      });
    } finally {
      set({ isStreaming: false });
    }
  }
}));
