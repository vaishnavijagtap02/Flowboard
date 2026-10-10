// POST /api/boards/save — Save board state with revision versioning.

import { z } from "zod";
import { saveBoardState } from "@/lib/storage";
import { ServerTiming } from "@/lib/serverTiming";

const SaveBoardSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().optional(),
  canvasData: z.any(),
  chatData: z.any().optional(),
  summary: z.string().optional(),
});

export async function POST(req: Request) {
  const timing = new ServerTiming();
  try {
    timing.start("validation");
    const raw = await req.json();
    const parsed = SaveBoardSchema.safeParse(raw);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Validation error",
          code: "VALIDATION_ERROR",
          details: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 }
      );
    }
    timing.stop("validation", "Zod schema parsing");

    timing.start("storage_write");
    const result = await saveBoardState(parsed.data);
    timing.stop("storage_write", "Persist board revision snapshot");

    const headers = new Headers({ "Content-Type": "application/json" });
    timing.applyToHeaders(headers);

    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    console.error("Save Board API Error:", error);
    return Response.json(
      { error: "Internal server error while saving board", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
