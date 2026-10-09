// src/lib/storage.ts
// Board persistence and versioning layer.
// Connects to Supabase when configured, with an in-memory fallback for local development.

import { getSupabaseClient, isSupabaseConfigured } from "./supabase";

export interface BoardStateSnapshot {
  id: string;
  boardId: string;
  version: number;
  canvasData: unknown;
  chatData?: unknown;
  summary?: string;
  createdAt: string;
  isActive: boolean;
}

export interface BoardMetadata {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// In-memory fallback store when Supabase env vars are not set
const memoryBoards = new Map<string, BoardMetadata>();
const memoryStates = new Map<string, BoardStateSnapshot[]>();

/**
 * Saves a new versioned snapshot of the board.
 */
export async function saveBoardState(params: {
  boardId: string;
  name?: string;
  canvasData: unknown;
  chatData?: unknown;
  summary?: string;
}): Promise<{
  success: boolean;
  version: number;
  snapshotId: string;
  isCloudPersisted: boolean;
  message?: string;
}> {
  const { boardId, name = "Architecture Board", canvasData, chatData, summary } = params;
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    try {
      // 1. Ensure board exists in 'boards' table
      const { data: existingBoard } = await supabase
        .from("boards")
        .select("id")
        .eq("id", boardId)
        .maybeSingle();

      if (!existingBoard) {
        await supabase.from("boards").insert({
          id: boardId,
          name,
          updated_at: now,
        });
      } else {
        await supabase
          .from("boards")
          .update({ name, updated_at: now })
          .eq("id", boardId);
      }

      // 2. Fetch latest version number
      const { data: latestState } = await supabase
        .from("board_states")
        .select("version")
        .eq("board_id", boardId)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (latestState?.version || 0) + 1;

      // 3. Mark previous active state inactive
      await supabase
        .from("board_states")
        .update({ is_active: false })
        .eq("board_id", boardId);

      // 4. Insert new versioned snapshot
      const snapshotId = crypto.randomUUID();
      const { error: insertError } = await supabase.from("board_states").insert({
        id: snapshotId,
        board_id: boardId,
        version: nextVersion,
        canvas_data: canvasData,
        chat_data: chatData,
        summary: summary || `Saved revision v${nextVersion}`,
        is_active: true,
        created_at: now,
      });

      if (insertError) {
        throw insertError;
      }

      return {
        success: true,
        version: nextVersion,
        snapshotId,
        isCloudPersisted: true,
      };
    } catch (err) {
      console.error("Supabase save failed, falling back to local memory store:", err);
    }
  }

  // Fallback: In-memory store
  if (!memoryBoards.has(boardId)) {
    memoryBoards.set(boardId, {
      id: boardId,
      name,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    const existing = memoryBoards.get(boardId)!;
    existing.name = name;
    existing.updatedAt = now;
  }

  const existingStates = memoryStates.get(boardId) || [];
  const nextVersion = existingStates.length > 0 ? existingStates[existingStates.length - 1].version + 1 : 1;

  for (const s of existingStates) {
    s.isActive = false;
  }

  const snapshotId = crypto.randomUUID();
  const newSnapshot: BoardStateSnapshot = {
    id: snapshotId,
    boardId,
    version: nextVersion,
    canvasData,
    chatData,
    summary: summary || `Saved revision v${nextVersion}`,
    createdAt: now,
    isActive: true,
  };

  existingStates.push(newSnapshot);
  memoryStates.set(boardId, existingStates);

  return {
    success: true,
    version: nextVersion,
    snapshotId,
    isCloudPersisted: false,
    message: isSupabaseConfigured()
      ? "Supabase write had an issue, persisted to memory"
      : "Persisted to development store. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to save directly to Supabase cloud.",
  };
}

/**
 * Loads the active board state.
 */
export async function getActiveBoardState(boardId: string): Promise<{
  board: BoardMetadata | null;
  state: BoardStateSnapshot | null;
  isCloudPersisted: boolean;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: board } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .maybeSingle();

      const { data: state } = await supabase
        .from("board_states")
        .select("*")
        .eq("board_id", boardId)
        .eq("is_active", true)
        .maybeSingle();

      if (state) {
        return {
          board: board
            ? {
                id: board.id,
                name: board.name,
                description: board.description,
                createdAt: board.created_at,
                updatedAt: board.updated_at,
              }
            : null,
          state: {
            id: state.id,
            boardId: state.board_id,
            version: state.version,
            canvasData: state.canvas_data,
            chatData: state.chat_data,
            summary: state.summary,
            createdAt: state.created_at,
            isActive: state.is_active,
          },
          isCloudPersisted: true,
        };
      }
    } catch (err) {
      console.error("Supabase get failed, checking local memory store:", err);
    }
  }

  // Memory fallback
  const board = memoryBoards.get(boardId) || null;
  const states = memoryStates.get(boardId) || [];
  const state = states.find((s) => s.isActive) || states[states.length - 1] || null;

  return {
    board,
    state,
    isCloudPersisted: false,
  };
}

/**
 * Retrieves the version history of a board.
 */
export async function getBoardHistory(boardId: string): Promise<{
  history: Array<{
    id: string;
    version: number;
    summary?: string;
    createdAt: string;
    isActive: boolean;
  }>;
}> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data } = await supabase
        .from("board_states")
        .select("id, version, summary, created_at, is_active")
        .eq("board_id", boardId)
        .order("version", { ascending: false });

      if (data) {
        return {
          history: data.map((d) => ({
            id: d.id,
            version: d.version,
            summary: d.summary,
            createdAt: d.created_at,
            isActive: d.is_active,
          })),
        };
      }
    } catch (err) {
      console.error("Supabase history query failed:", err);
    }
  }

  const states = memoryStates.get(boardId) || [];
  return {
    history: [...states].reverse().map((s) => ({
      id: s.id,
      version: s.version,
      summary: s.summary,
      createdAt: s.createdAt,
      isActive: s.isActive,
    })),
  };
}

/**
 * Rolls back a board to a specific version number.
 */
export async function rollbackBoardVersion(
  boardId: string,
  targetVersion: number
): Promise<{ success: boolean; state: BoardStateSnapshot | null }> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data: targetState } = await supabase
        .from("board_states")
        .select("*")
        .eq("board_id", boardId)
        .eq("version", targetVersion)
        .maybeSingle();

      if (!targetState) {
        return { success: false, state: null };
      }

      // Mark all inactive
      await supabase
        .from("board_states")
        .update({ is_active: false })
        .eq("board_id", boardId);

      // Mark target active
      await supabase
        .from("board_states")
        .update({ is_active: true })
        .eq("id", targetState.id);

      return {
        success: true,
        state: {
          id: targetState.id,
          boardId: targetState.board_id,
          version: targetState.version,
          canvasData: targetState.canvas_data,
          chatData: targetState.chat_data,
          summary: targetState.summary,
          createdAt: targetState.created_at,
          isActive: true,
        },
      };
    } catch (err) {
      console.error("Supabase rollback failed:", err);
    }
  }

  // Memory fallback
  const states = memoryStates.get(boardId) || [];
  const target = states.find((s) => s.version === targetVersion);
  if (!target) return { success: false, state: null };

  for (const s of states) {
    s.isActive = s.version === targetVersion;
  }

  return { success: true, state: target };
}
