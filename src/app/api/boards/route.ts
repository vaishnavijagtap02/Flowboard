// GET /api/boards — List all architecture boards.
// DELETE /api/boards?id=... — Delete a board.

import { listBoards, deleteBoard } from "@/lib/storage";
import { ServerTiming } from "@/lib/serverTiming";

export async function GET() {
  const timing = new ServerTiming();
  try {
    timing.start("fetch_boards");
    const result = await listBoards();
    timing.stop("fetch_boards", "Query storage boards catalog");

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=2, stale-while-revalidate=5",
    });
    timing.applyToHeaders(headers);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("List Boards API Error:", error);
    return Response.json(
      { error: "Internal server error fetching boards", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return Response.json({ error: "Missing board id", code: "BAD_REQUEST" }, { status: 400 });
    }

    const result = await deleteBoard(id);
    return Response.json(result);
  } catch (error) {
    console.error("Delete Board API Error:", error);
    return Response.json(
      { error: "Internal server error deleting board", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
