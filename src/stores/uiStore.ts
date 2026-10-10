// UI Store — Manages panel visibility, selection, transient UI state, and Midnight Navy & Ice Blue theme.

import { create } from "zustand";
import type { GeneratedArtifact } from "@/types/artifacts";

export type AppTheme = "light" | "dark";
export type BotanicalTheme = AppTheme; // Backward-compatible alias

interface UIStore {
  // ─── Theme State ────────────────────────────────────────────────────────
  theme: AppTheme;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;

  // ─── Selection ──────────────────────────────────────────────────────────
  selectedNodeId: string | null;
  selectedEdgeId: string | null;

  // ─── Panel State ────────────────────────────────────────────────────────
  isChatOpen: boolean;
  isPropertySidebarOpen: boolean;
  isArtifactPanelOpen: boolean;
  isLinterOpen: boolean;
  activeArtifact: GeneratedArtifact | null;

  // ─── Actions ────────────────────────────────────────────────────────────
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  clearSelection: () => void;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  togglePropertySidebar: () => void;
  toggleLinter: () => void;
  setLinterOpen: (open: boolean) => void;
  openArtifactPanel: () => void;
  closeArtifactPanel: () => void;
  setActiveArtifact: (artifact: GeneratedArtifact | null) => void;
}

function applyThemeToDOM(theme: AppTheme) {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    try {
      localStorage.setItem("flowboard:theme", theme);
    } catch {}
  }
}

export const useUIStore = create<UIStore>((set, get) => ({
  // ─── Initial State ──────────────────────────────────────────────────────
  theme: "light",
  selectedNodeId: null,
  selectedEdgeId: null,
  isChatOpen: false,
  isPropertySidebarOpen: true,
  isArtifactPanelOpen: false,
  isLinterOpen: false,
  activeArtifact: null,

  // ─── Theme Actions ──────────────────────────────────────────────────────
  toggleTheme: () => {
    const nextTheme = get().theme === "light" ? "dark" : "light";
    applyThemeToDOM(nextTheme);
    set({ theme: nextTheme });
  },

  setTheme: (theme: AppTheme) => {
    applyThemeToDOM(theme);
    set({ theme });
  },

  // ─── Selection Actions ──────────────────────────────────────────────────
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

  toggleLinter: () => {
    set((state) => ({ isLinterOpen: !state.isLinterOpen }));
  },

  setLinterOpen: (open) => {
    set({ isLinterOpen: open });
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
