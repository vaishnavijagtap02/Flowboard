// GET /api/boards/[id]/history — Fetch board version history.
// POST /api/boards/[id]/history — Roll back board to a specific historical version.

import { z } from "zod";
import { getBoardHistory, rollbackBoardVersion } from "@/lib/storage";

const RollbackSchema = z.object({
  version: z.number().int().positive(),
});

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    if (!id) {
      return Response.json({ error: "Missing board ID", code: "BAD_REQUEST" }, { status: 400 });
    }

    const { history } = await getBoardHistory(id);

    return Response.json({
      success: true,
      history,
    });
  } catch (error) {
    console.error("Get Board History Error:", error);
    return Response.json(
      { error: "Internal server error fetching history", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const raw = await req.json();
    const parsed = RollbackSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues.map((i) => i.message).join("; "),
        },
        { status: 400 }
      );
    }

    const result = await rollbackBoardVersion(id, parsed.data.version);

    if (!result.success) {
      return Response.json(
        { error: `Version ${parsed.data.version} not found for board`, code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      restoredState: result.state,
    });
  } catch (error) {
    console.error("Rollback Board Error:", error);
    return Response.json(
      { error: "Internal server error rolling back version", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
