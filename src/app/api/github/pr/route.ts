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
  try {
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

    const { owner, repo, baseBranch, branchName, prTitle, boardName, graph, artifacts = [] } = parsed.data;

    // 1. Fetch base branch architecture if it exists to compute real diff
    let baseGraph: SemanticGraph = { nodes: [], edges: [] };
    try {
      const baseFile = await fetchFileFromRepo({
        owner,
        repo,
        path: ".flowboard/architecture.json",
        ref: baseBranch,
        token: tokenHeader,
      });
      baseGraph = parseArchitectureSpec(baseFile.content);
    } catch {
      // File doesn't exist yet on base branch; base is treated as empty graph
    }

    // 2. Compute architecture diff and generate PR markdown description
    const diff = calculateArchitectureDiff(baseGraph, graph);
    const prBody = generateArchitectureDiffMarkdown(diff, { boardName });

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

    return Response.json({
      success: true,
      prNumber: result.prNumber,
      prUrl: result.prUrl,
      branch: result.branch,
      diffSummary: diff.summary,
    });
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
