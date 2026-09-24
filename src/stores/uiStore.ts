// UI Store — Manages panel visibility, selection, and transient UI state.

import { create } from "zustand";
import type { GeneratedArtifact } from "@/types/artifacts";

interface UIStore {
  // ─── Selection ──────────────────────────────────────────────────────────
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // ─── Panel State ────────────────────────────────────────────────────────
  isChatOpen: boolean;
  isPropertySidebarOpen: boolean;
  isArtifactPanelOpen: boolean;
  activeArtifact: GeneratedArtifact | null;

  // ─── Actions ────────────────────────────────────────────────────────────
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  togglePropertySidebar: () => void;
  openArtifactPanel: () => void;
  closeArtifactPanel: () => void;
  setActiveArtifact: (artifact: GeneratedArtifact | null) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // ─── Initial State ──────────────────────────────────────────────────────
  selectedNodeId: null,
  selectedEdgeId: null,
  isChatOpen: false,
  isPropertySidebarOpen: true,
  isArtifactPanelOpen: false,
  activeArtifact: null,

  // ─── Actions ────────────────────────────────────────────────────────────

  selectNode: (nodeId) => {
    set({
      selectedNodeId: nodeId,
      selectedEdgeId: null,
      isPropertySidebarOpen: nodeId !== null,
    });
  },

  selectEdge: (edgeId) => {
    set({
      selectedNodeId: null,
      selectedEdgeId: edgeId,
      isPropertySidebarOpen: edgeId !== null,
    });
  },

  clearSelection: () => {
    set({ selectedNodeId: null, selectedEdgeId: null });
  },

  toggleChat: () => {
    set((state) => ({ isChatOpen: !state.isChatOpen }));
  },

  setChatOpen: (open) => {
    set({ isChatOpen: open });
  },

  togglePropertySidebar: () => {
    set((state) => ({
      isPropertySidebarOpen: !state.isPropertySidebarOpen,
    }));
  },

  openArtifactPanel: () => {
    set({ isArtifactPanelOpen: true });
  },

  closeArtifactPanel: () => {
    set({ isArtifactPanelOpen: false, activeArtifact: null });
  },

  setActiveArtifact: (artifact) => {
    set({ activeArtifact: artifact });
  },
}));
