// Canvas Store — Source of truth for all nodes and edges on the canvas.
// Handles CRUD operations, React Flow callbacks, and persistence.

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
import type { GraphMutation, MutationResult } from "@/types/mutations";
import { LOCALSTORAGE_KEY } from "@/lib/constants";

interface CanvasStore {
  // ─── State ────────────────────────────────────────────────────────────────
  nodes: FlowNode[];
  edges: FlowEdge[];
  viewport: ViewportState;

  // ─── Node CRUD ────────────────────────────────────────────────────────────
  addNode: (node: FlowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<SemanticNode>) => void;

  // ─── Edge CRUD ────────────────────────────────────────────────────────────
  addEdge: (edge: FlowEdge) => void;
  removeEdge: (edgeId: string) => void;

  // ─── Batch (AI Mutations) ─────────────────────────────────────────────────
  applyMutations: (mutations: GraphMutation[]) => MutationResult;

  // ─── React Flow Callbacks ─────────────────────────────────────────────────
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  setViewport: (viewport: ViewportState) => void;

  // ─── Serialization ────────────────────────────────────────────────────────
  getSemanticGraph: () => SemanticGraph;

  // ─── Persistence ──────────────────────────────────────────────────────────
  saveToLocalStorage: () => void;
  loadFromLocalStorage: () => boolean;
  clearCanvas: () => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // ─── Initial State ──────────────────────────────────────────────────────────
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },

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

  // ─── Batch Mutations (AI) ───────────────────────────────────────────────────

  applyMutations: (mutations) => {
    const result: MutationResult = { applied: [], rejected: [] };
    const state = get();
    let newNodes = [...state.nodes];
    let newEdges = [...state.edges];

    for (const mutation of mutations) {
      switch (mutation.action) {
        case "ADD_NODE": {
          // Check for duplicate ID
          if (newNodes.some((n) => n.id === mutation.node.id)) {
            result.rejected.push({
              mutation,
              reason: `Node "${mutation.node.id}" already exists`,
            });
            break;
          }
          const newNode: FlowNode = {
            id: mutation.node.id,
            type: mutation.node.type,
            position: { x: 0, y: 0 }, // Will be overridden by layout engine
            data: mutation.node,
          };
          newNodes.push(newNode);
          result.applied.push(mutation);
          break;
        }

        case "REMOVE_NODE": {
          const exists = newNodes.some((n) => n.id === mutation.nodeId);
          if (!exists) {
            result.rejected.push({
              mutation,
              reason: `Node "${mutation.nodeId}" not found`,
            });
            break;
          }
          newNodes = newNodes.filter((n) => n.id !== mutation.nodeId);
          newEdges = newEdges.filter(
            (e) => e.source !== mutation.nodeId && e.target !== mutation.nodeId
          );
          result.applied.push(mutation);
          break;
        }

        case "UPDATE_NODE": {
          const nodeIndex = newNodes.findIndex((n) => n.id === mutation.nodeId);
          if (nodeIndex === -1) {
            result.rejected.push({
              mutation,
              reason: `Node "${mutation.nodeId}" not found`,
            });
            break;
          }
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            data: { ...newNodes[nodeIndex].data, ...mutation.updates },
          };
          result.applied.push(mutation);
          break;
        }

        case "ADD_EDGE": {
          const sourceExists = newNodes.some((n) => n.id === mutation.edge.source);
          const targetExists = newNodes.some((n) => n.id === mutation.edge.target);
          if (!sourceExists || !targetExists) {
            result.rejected.push({
              mutation,
              reason: `Source or target node not found (source: ${mutation.edge.source}, target: ${mutation.edge.target})`,
            });
            break;
          }
          if (mutation.edge.source === mutation.edge.target) {
            result.rejected.push({
              mutation,
              reason: "Self-referencing edges not allowed",
            });
            break;
          }
          const newEdge: FlowEdge = {
            id: `e-${nanoid(8)}`,
            source: mutation.edge.source,
            target: mutation.edge.target,
            type: "semantic",
            data: {
              relationship: mutation.edge.relationship,
              label: mutation.edge.label,
              protocol: mutation.edge.protocol,
            },
          };
          newEdges.push(newEdge);
          result.applied.push(mutation);
          break;
        }

        case "REMOVE_EDGE": {
          const edgeExists = newEdges.some((e) => e.id === mutation.edgeId);
          if (!edgeExists) {
            result.rejected.push({
              mutation,
              reason: `Edge "${mutation.edgeId}" not found`,
            });
            break;
          }
          newEdges = newEdges.filter((e) => e.id !== mutation.edgeId);
          result.applied.push(mutation);
          break;
        }
      }
    }

    set({ nodes: newNodes, edges: newEdges });
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

  getSemanticGraph: (): SemanticGraph => {
    const { nodes, edges } = get();
    return {
      nodes: nodes
        .map((n) => n.data)
        .sort((a, b) => a.id.localeCompare(b.id)),
      edges: edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        relationship: e.data?.relationship ?? "connects_to",
        label: e.data?.label,
        protocol: e.data?.protocol,
      })),
    };
  },

  // ─── Persistence ────────────────────────────────────────────────────────────

  saveToLocalStorage: () => {
    try {
      const { nodes, edges, viewport } = get();
      const data = {
        version: 1,
        savedAt: new Date().toISOString(),
        canvas: { nodes, edges, viewport },
      };
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to save to localStorage:", e);
    }
  },

  loadFromLocalStorage: (): boolean => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data?.version === 1 && data?.canvas) {
        set({
          nodes: data.canvas.nodes ?? [],
          edges: data.canvas.edges ?? [],
          viewport: data.canvas.viewport ?? { x: 0, y: 0, zoom: 1 },
        });
        return true;
      }
      return false;
    } catch (e) {
      console.error("Failed to load from localStorage:", e);
      return false;
    }
  },

  clearCanvas: () => {
    set({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } });
    localStorage.removeItem(LOCALSTORAGE_KEY);
  },
}));
