// src/lib/realtime.ts
// Real-time multiplayer collaboration engine powered by Supabase Realtime Channels.
// Provides live mutation broadcasting, peer cursor tracking, and presence state.

import { getSupabaseClient } from "./supabase";
import { GraphMutation } from "@/types/mutations";

export interface UserPresence {
  userId: string;
  userName: string;
  userColor: string;
  cursor?: { x: number; y: number };
  selectedNodeId?: string | null;
  lastActive: number;
}

export interface RealtimeMutationMessage {
  senderId: string;
  senderName: string;
  mutations: GraphMutation[];
  timestamp: number;
}

export interface RealtimeBoardSession {
  channelName: string;
  broadcastMutation: (mutations: GraphMutation[]) => Promise<void>;
  updateCursor: (cursor: { x: number; y: number }, selectedNodeId?: string | null) => Promise<void>;
  unsubscribe: () => Promise<void>;
}

/**
 * Creates or joins a real-time multiplayer room for a specific board.
 */
export function joinBoardRealtimeRoom(params: {
  boardId: string;
  currentUser: { id: string; name: string; color?: string };
  onPeerPresenceChange?: (peers: UserPresence[]) => void;
  onRemoteMutation?: (message: RealtimeMutationMessage) => void;
}): RealtimeBoardSession | null {
  const { boardId, currentUser, onPeerPresenceChange, onRemoteMutation } = params;
  const supabase = getSupabaseClient();

  if (!supabase) {
    // If Supabase credentials are not set, return graceful mock/offline session
    return {
      channelName: `board:${boardId}:offline`,
      broadcastMutation: async () => {},
      updateCursor: async () => {},
      unsubscribe: async () => {},
    };
  }

  const channelName = `flowboard:board:${boardId}`;
  const userColor =
    currentUser.color ||
    `#${Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")}`;

  const channel = supabase.channel(channelName, {
    config: {
      presence: { key: currentUser.id },
      broadcast: { self: false },
    },
  });

  // Listen for remote mutation events
  channel.on(
    "broadcast",
    { event: "remote_mutation" },
    ({ payload }: { payload: RealtimeMutationMessage }) => {
      if (onRemoteMutation) {
        onRemoteMutation(payload);
      }
    }
  );

  // Listen for peer presence updates
  channel.on("presence", { event: "sync" }, () => {
    if (onPeerPresenceChange) {
      const state = channel.presenceState();
      const peers: UserPresence[] = [];

      for (const key of Object.keys(state)) {
        const presences = state[key] as unknown as UserPresence[];
        if (Array.isArray(presences) && presences[0]) {
          peers.push(presences[0]);
        }
      }

      onPeerPresenceChange(peers);
    }
  });

  // Subscribe and track initial presence
  channel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      await channel.track({
        userId: currentUser.id,
        userName: currentUser.name,
        userColor,
        lastActive: Date.now(),
      });
    }
  });

  return {
    channelName,
    broadcastMutation: async (mutations: GraphMutation[]) => {
      await channel.send({
        type: "broadcast",
        event: "remote_mutation",
        payload: {
          senderId: currentUser.id,
          senderName: currentUser.name,
          mutations,
          timestamp: Date.now(),
        },
      });
    },
    updateCursor: async (cursor, selectedNodeId) => {
      await channel.track({
        userId: currentUser.id,
        userName: currentUser.name,
        userColor,
        cursor,
        selectedNodeId,
        lastActive: Date.now(),
      });
    },
    unsubscribe: async () => {
      await supabase.removeChannel(channel);
    },
  };
}
