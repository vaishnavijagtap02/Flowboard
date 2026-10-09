// GET /api/boards/[id] — Fetch active board state snapshot.

import { getActiveBoardState } from "@/lib/storage";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return Response.json({ error: "Missing board ID", code: "BAD_REQUEST" }, { status: 400 });
    }

    const { board, state, isCloudPersisted } = await getActiveBoardState(id);

    if (!state) {
      return Response.json(
        { error: "Board not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      board,
      state,
      isCloudPersisted,
    });
  } catch (error) {
    console.error("Get Board API Error:", error);
    return Response.json(
      { error: "Internal server error fetching board", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
