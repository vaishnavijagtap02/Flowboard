// Canvas Store — Source of truth for all nodes and edges on the canvas.
// Handles CRUD operations, React Flow callbacks, and persistence.
// AI mutations are processed via the engine layer (engine/mutationEngine.ts).

import { create } from "zustand";
import {
  applyNodeChanges,
  applyEdgeChanges,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from "@xyflow/react";
import { nanoid } from "nanoid";
import type { FlowNode, FlowEdge, ViewportState } from "@/types/canvas";
import type { SemanticNode, SemanticGraph } from "@/types/semantic";
import type { AIMutationPlan, MutationResult } from "@/types/mutations";
import { processAndApplyMutations } from "@/engine/mutationEngine";
import { serializeForAI } from "@/engine/serializer";
import { saveState, loadState, clearState } from "@/lib/persistence";
import { useChatStore } from "./chatStore";
import { layoutEntireGraph } from "@/engine/layoutEngine";
import { ARCHITECTURE_TEMPLATES } from "@/lib/templates";

interface CanvasStore {
  // ─── State ────────────────────────────────────────────────────────────────
  boardTitle: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: ViewportState;

  // ─── Title ────────────────────────────────────────────────────────────────
  setBoardTitle: (title: string) => void;

  // ─── Node CRUD ────────────────────────────────────────────────────────────
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<SemanticNode>) => void;

  // ─── Edge CRUD ────────────────────────────────────────────────────────────
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;

  // ─── Layout & Templates ───────────────────────────────────────────────────
  autoLayout: (direction?: "TB" | "LR") => void;
  loadTemplate: (templateId: string) => void;

  // ─── Batch (AI Mutations) ─────────────────────────────────────────────────
  applyMutations: (plan: AIMutationPlan) => MutationResult;

  // ─── React Flow Callbacks ─────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setViewport: (viewport: ViewportState) => void;

  // ─── Serialization ────────────────────────────────────────────────────────
  getSemanticGraph: () => SemanticGraph;

  setGraphState: (params: {
    title?: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport?: ViewportState;
  }) => void;
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // ─── Initial State ──────────────────────────────────────────────────────────
  boardTitle: "Distributed System Architecture",
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

  setBoardTitle: (boardTitle) => set({ boardTitle }),

  setGraphState: (params) => {
    set({
      boardTitle: params.title || get().boardTitle,
      nodes: params.nodes,
      edges: params.edges,
      viewport: params.viewport || get().viewport,
    });
  },

  // ─── Node CRUD ──────────────────────────────────────────────────────────────

  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
  },

  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      // Also remove all edges connected to this node
      edges: state.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      ),
    }));
  },

  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...data } }
          : node
      ),
    }));
  },

  // ─── Edge CRUD ──────────────────────────────────────────────────────────────

  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }));
  },

  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== edgeId),
    }));
  },

  // ─── Layout & Templates ─────────────────────────────────────────────────────

  autoLayout: (direction = "TB") => {
    const { nodes, edges } = get();
    if (nodes.length === 0) return;
    const laidOutNodes = layoutEntireGraph(nodes, edges, direction);
    set({ nodes: laidOutNodes });
  },

  loadTemplate: (templateId: string) => {
    const template = ARCHITECTURE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    set({
      boardTitle: template.name,
      nodes: template.nodes,
      edges: template.edges,
    });
  },

  // ─── Batch Mutations (AI) ───────────────────────────────────────────────────
  // Delegates to engine/mutationEngine.ts for validation + layout + application.

  applyMutations: (plan) => {
    const { nodes, edges } = get();
    const { nodes: newNodes, edges: newEdges, result } =
      processAndApplyMutations(plan, nodes, edges);

    set({ nodes: newNodes, edges: newEdges });

    // Log rejected mutations for debugging
    if (result.rejected.length > 0) {
      console.warn(
        `[MutationEngine] ${result.rejected.length} mutation(s) rejected:`,
        result.rejected.map((r) => r.reason)
      );
    }

    return result;
  },

  // ─── React Flow Callbacks ───────────────────────────────────────────────────

  onNodesChange: (changes) => {
    set((state) => ({
      nodes: applyNodeChanges(changes, state.nodes),
    }));
  },

  onEdgesChange: (changes) => {
    set((state) => ({
      edges: applyEdgeChanges(changes, state.edges),
    }));
  },

  onConnect: (connection) => {
    const newEdge: FlowEdge = {
      id: `e-${nanoid(8)}`,
      source: connection.source,
      target: connection.target,
      type: "semantic",
      data: {
        relationship: "connects_to",
        label: "",
        protocol: "",
      },
    };
    set((state) => ({ edges: [...state.edges, newEdge] }));
  },

  setViewport: (viewport) => {
    set({ viewport });
  },

  // ─── Serialization ─────────────────────────────────────────────────────────
  // Delegates to engine/serializer.ts for consistent semantic-only output.

  getSemanticGraph: (): SemanticGraph => {
    const { nodes, edges } = get();
    return serializeForAI(nodes, edges);
  },

  // ─── Persistence ────────────────────────────────────────────────────────────

  saveToLocalStorage: () => {
    const { nodes, edges, viewport } = get();
    const messages = useChatStore.getState().messages;
    saveState(nodes, edges, viewport, messages);
  },

  loadFromLocalStorage: (): boolean => {
    const data = loadState();
    if (data?.canvas) {
      set({
        nodes: data.canvas.nodes ?? [],
        edges: data.canvas.edges ?? [],
        viewport: data.canvas.viewport ?? { x: 0, y: 0, zoom: 1 },
      });
      if (data.chat?.messages && data.chat.messages.length > 0) {
        useChatStore.getState().setMessages(data.chat.messages);
      }
      return true;
    }
    return false;
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
    useChatStore.getState().clearMessages();
    clearState();
  },
}));
