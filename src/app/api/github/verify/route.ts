// GET /api/github/verify — Test GitHub token and list accessible repositories.

import { verifyGitHubAuth, listUserRepositories } from "@/lib/github";
import { ServerTiming } from "@/lib/serverTiming";

export async function GET(req: Request) {
  const timing = new ServerTiming();
  try {
    const tokenHeader = req.headers.get("x-github-token") || undefined;

    timing.start("github_auth");
    const auth = await verifyGitHubAuth(tokenHeader);
    timing.stop("github_auth", "Verify GitHub OAuth/PAT token");

    if (!auth.success) {
      return Response.json(
        {
          error: auth.error || "GitHub authentication failed",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    timing.start("github_repos");
    const { repositories } = await listUserRepositories(tokenHeader);
    timing.stop("github_repos", "Fetch accessible repositories");

    const headers = new Headers({
      "Content-Type": "application/json",
      "Cache-Control": "private, max-age=10",
    });
    timing.applyToHeaders(headers);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          username: auth.username,
          avatarUrl: auth.avatarUrl,
          rateLimitRemaining: auth.rateLimitRemaining,
        },
        repositories,
      }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error("GitHub Verify API Error:", error);
    return Response.json(
      { error: "Internal server error verifying GitHub", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
