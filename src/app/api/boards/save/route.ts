// POST /api/boards/save — Save board state with revision versioning.

import { z } from "zod";
import { saveBoardState } from "@/lib/storage";

const SaveBoardSchema = z.object({
  boardId: z.string().min(1),
  name: z.string().optional(),
  canvasData: z.any(),
  chatData: z.any().optional(),
  summary: z.string().optional(),
});

export async function POST(req: Request) {
  try {
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

    const result = await saveBoardState(parsed.data);

    return Response.json(result);
  } catch (error) {
    console.error("Save Board API Error:", error);
    return Response.json(
      { error: "Internal server error while saving board", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
