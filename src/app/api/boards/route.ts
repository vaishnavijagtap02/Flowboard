// GET /api/boards — List all architecture boards.
// DELETE /api/boards?id=... — Delete a board.

import { listBoards, deleteBoard } from "@/lib/storage";

export async function GET() {
  try {
    const result = await listBoards();
    return Response.json({
      success: true,
      ...result,
    });
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
