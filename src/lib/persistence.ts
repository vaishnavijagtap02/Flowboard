// lib/persistence.ts — Dedicated debounced persistence module.
//
// From SYSTEM_DESIGN §4.5:
//   Save (debounced, every 2 seconds after change):
//     → Serializes full state (visual + semantic) to JSON
//     → Writes to localStorage key: "flowboard:canvas"
//
//   Load (on page mount):
//     → Check localStorage for "flowboard:canvas"
//     → If found: parse JSON, return hydrated state
//     → If not found: return null

import { LOCALSTORAGE_KEY, AUTO_SAVE_DEBOUNCE_MS } from "@/lib/constants";
import type { FlowNode, FlowEdge, ViewportState } from "@/types/canvas";
import type { ChatMessage } from "@/types/chat";

// ─── Persisted Data Shape ────────────────────────────────────────────────────

interface PersistedData {
  version: 1;
  savedAt: string;
  canvas: {
    nodes: FlowNode[];
    edges: FlowEdge[];
    viewport: ViewportState;
  };
  chat: {
    messages: ChatMessage[];
  };
}

// ─── Save ────────────────────────────────────────────────────────────────────

/**
 * Saves the full canvas + chat state to localStorage.
 * Should be called via the debounced wrapper below, not directly.
 */
export function saveState(
  nodes: FlowNode[],
  edges: FlowEdge[],
  viewport: ViewportState,
  messages: ChatMessage[] = []
): void {
  try {
    const data: PersistedData = {
      version: 1,
      savedAt: new Date().toISOString(),
      canvas: { nodes, edges, viewport },
      chat: { messages },
    };
    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage:", e);
  }
}

// ─── Load ────────────────────────────────────────────────────────────────────

/**
 * Loads persisted state from localStorage.
 * Returns the parsed data or null if nothing is found / parse fails.
 */
export function loadState(): PersistedData | null {
  try {
    const raw = localStorage.getItem(LOCALSTORAGE_KEY);
    if (!raw) return null;

    const data = JSON.parse(raw);
    if (data?.version === 1 && data?.canvas) {
      return data as PersistedData;
    }
    return null;
  } catch (e) {
    console.error("Failed to load from localStorage:", e);
    return null;
  }
}

/**
 * Clears all persisted state.
 */
export function clearState(): void {
  localStorage.removeItem(LOCALSTORAGE_KEY);
}

// ─── Debounced Auto-Save ─────────────────────────────────────────────────────

let saveTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Schedules a debounced save. Multiple calls within the debounce window
 * collapse into a single save at the end.
 */
export function debouncedSave(
  nodes: FlowNode[],
  edges: FlowEdge[],
  viewport: ViewportState,
  messages: ChatMessage[] = []
): void {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveState(nodes, edges, viewport, messages);
  }, AUTO_SAVE_DEBOUNCE_MS);
}

/**
 * Cancels any pending debounced save. Useful when the component unmounts.
 */
export function cancelPendingSave(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
}
