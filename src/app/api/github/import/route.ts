// POST /api/github/import — Import architecture from a GitHub repository.

import { z } from "zod";
import { fetchFileFromRepo } from "@/lib/github";
import { parseArchitectureSpec } from "@/engine/gitDiff";
import { ServerTiming } from "@/lib/serverTiming";

const ImportRequestSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  path: z.string().default(".flowboard/architecture.json"),
  ref: z.string().optional(),
});

export async function POST(req: Request) {
  const timing = new ServerTiming();
  try {
    timing.start("validation");
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
    timing.stop("validation", "Zod request schema validation");

    const { owner, repo, path, ref } = parsed.data;

    try {
      timing.start("github_fetch");
      const { content, sha } = await fetchFileFromRepo({
        owner,
        repo,
        path,
        ref,
        token: tokenHeader,
      });
      timing.stop("github_fetch", "Fetch file content from GitHub Octokit API");

      timing.start("parse_spec");
      const graph = parseArchitectureSpec(content);
      timing.stop("parse_spec", "Parse architecture specification");

      const headers = new Headers({ "Content-Type": "application/json" });
      timing.applyToHeaders(headers);

      return new Response(
        JSON.stringify({
          success: true,
          graph,
          sha,
          source: { owner, repo, path, ref },
        }),
        { status: 200, headers }
      );
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
