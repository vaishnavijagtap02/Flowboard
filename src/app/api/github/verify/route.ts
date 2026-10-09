// GET /api/github/verify — Test GitHub token and list accessible repositories.

import { verifyGitHubAuth, listUserRepositories } from "@/lib/github";

export async function GET(req: Request) {
  try {
    const tokenHeader = req.headers.get("x-github-token") || undefined;

    const auth = await verifyGitHubAuth(tokenHeader);
    if (!auth.success) {
      return Response.json(
        {
          error: auth.error || "GitHub authentication failed",
          code: "UNAUTHORIZED",
        },
        { status: 401 }
      );
    }

    const { repositories } = await listUserRepositories(tokenHeader);

    return Response.json({
      success: true,
      user: {
        username: auth.username,
        avatarUrl: auth.avatarUrl,
        rateLimitRemaining: auth.rateLimitRemaining,
      },
      repositories,
    });
  } catch (error) {
    console.error("GitHub Verify API Error:", error);
    return Response.json(
      { error: "Internal server error verifying GitHub", code: "INTERNAL_ERROR" },
      { status: 500 }
    );
  }
}
