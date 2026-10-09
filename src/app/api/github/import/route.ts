// POST /api/github/import — Import architecture from a GitHub repository.

import { z } from "zod";
import { fetchFileFromRepo } from "@/lib/github";
import { parseArchitectureSpec } from "@/engine/gitDiff";

const ImportRequestSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().default(".flowboard/architecture.json"),
  ref: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const tokenHeader = req.headers.get("x-github-token") || undefined;
    const raw = await req.json();

    const parsed = ImportRequestSchema.safeParse(raw);
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

    const { owner, repo, path, ref } = parsed.data;

    try {
      const { content, sha } = await fetchFileFromRepo({
        owner,
        repo,
        path,
        ref,
        token: tokenHeader,
      });

      const graph = parseArchitectureSpec(content);

      return Response.json({
        success: true,
        graph,
        sha,
        source: { owner, repo, path, ref },
      });
    } catch (fetchErr) {
      return Response.json(
        {
          error: `Could not fetch or parse "${path}" from ${owner}/${repo}: ${
            fetchErr instanceof Error ? fetchErr.message : String(fetchErr)
          }`,
          code: "FILE_FETCH_ERROR",
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("GitHub Import API Error:", error);
    return Response.json(
      { error: "Internal server error during import", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
