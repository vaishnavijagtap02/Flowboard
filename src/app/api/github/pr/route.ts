// POST /api/github/pr — Create a real GitHub Pull Request with architecture spec & diff.

import { z } from "zod";
import {
  fetchFileFromRepo,
  createArchitecturePullRequest,
} from "@/lib/github";
import {
  serializeArchitectureSpec,
  parseArchitectureSpec,
  calculateArchitectureDiff,
  generateArchitectureDiffMarkdown,
} from "@/engine/gitDiff";
import { SemanticNodeSchema } from "@/schemas/semanticNode";
import { SemanticEdgeSchema } from "@/schemas/semanticEdge";
import type { SemanticGraph } from "@/types/semantic";
import { ServerTiming } from "@/lib/serverTiming";

const CreatePRSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  baseBranch: z.string().optional(),
  branchName: z.string().optional(),
  prTitle: z.string().optional(),
  boardName: z.string().default("Flowboard Architecture"),
  graph: z.object({
    nodes: z.array(SemanticNodeSchema),
    edges: z.array(SemanticEdgeSchema),
  }),
  artifacts: z
    .array(
      z.object({
        path: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});

export async function POST(req: Request) {
  const timing = new ServerTiming();
  try {
    timing.start("validation");
    const tokenHeader = req.headers.get("x-github-token") || undefined;
    const raw = await req.json();

    const parsed = CreatePRSchema.safeParse(raw);
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

    const { owner, repo, baseBranch, branchName, prTitle, boardName, graph, artifacts = [] } = parsed.data;

    // 1. Fetch base branch architecture if it exists to compute real diff
    let baseGraph: SemanticGraph = { nodes: [], edges: [] };
    try {
      timing.start("github_fetch_base");
      const baseFile = await fetchFileFromRepo({
        owner,
        repo,
        path: ".flowboard/architecture.json",
        ref: baseBranch,
        token: tokenHeader,
      });
      baseGraph = parseArchitectureSpec(baseFile.content);
      timing.stop("github_fetch_base", "Fetch base branch spec");
    } catch {
      // File doesn't exist yet on base branch; base is treated as empty graph
    }

    // 2. Compute architecture diff and generate PR markdown description
    timing.start("calculate_diff");
    const diff = calculateArchitectureDiff(baseGraph, graph);
    const prBody = generateArchitectureDiffMarkdown(diff, { boardName });
    timing.stop("calculate_diff", "Calculate semantic architecture graph diff");

    // 3. Serialize updated architecture spec
    const specContent = serializeArchitectureSpec(graph);

    // 4. Assemble files to commit
    const commitFiles = [
      {
        path: ".flowboard/architecture.json",
        content: specContent,
      },
      ...artifacts,
    ];

    // 5. Create branch, commit files, and open Pull Request on GitHub
    const defaultTitle = prTitle || `feat(architecture): update ${boardName}`;
    timing.start("github_create_pr");
    const result = await createArchitecturePullRequest({
      owner,
      repo,
      baseBranch,
      branchName,
      prTitle: defaultTitle,
      prBody,
      files: commitFiles,
      token: tokenHeader,
    });
    timing.stop("github_create_pr", "Git branch, commit, and Pull Request creation");

    const headers = new Headers({ "Content-Type": "application/json" });
    timing.applyToHeaders(headers);

    return new Response(
      JSON.stringify({
        success: true,
        prNumber: result.prNumber,
        prUrl: result.prUrl,
        branch: result.branch,
        diffSummary: diff.summary,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("GitHub PR API Error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Failed to create GitHub Pull Request",
        code: "GITHUB_PR_ERROR",
      },
      { status: 500 }
    );
  }
}
