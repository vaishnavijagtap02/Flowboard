// GET /api/boards/[id] — Fetch active board state snapshot.

import { getActiveBoardState } from "@/lib/storage";
import { ServerTiming } from "@/lib/serverTiming";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const timing = new ServerTiming();
  try {
    const { id } = await props.params;

    if (!id) {
      return Response.json({ error: "Missing board ID", code: "BAD_REQUEST" }, { status: 400 });
    }

    timing.start("load_snapshot");
    const { board, state, isCloudPersisted } = await getActiveBoardState(id);
    timing.stop("load_snapshot", "Load active board state snapshot");

    if (!state) {
      return Response.json(
        { error: "Board not found", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=2, stale-while-revalidate=5",
    });
    timing.applyToHeaders(headers);

    return new Response(
      JSON.stringify({
        success: true,
        board,
        state,
        isCloudPersisted,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("Get Board API Error:", error);
    return Response.json(
      { error: "Internal server error fetching board", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
