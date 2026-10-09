// src/lib/github.ts
// Production GitHub API client using @octokit/rest.
// Supports Personal Access Tokens (PAT) via GITHUB_TOKEN env var or x-github-token header.

import { Octokit } from "@octokit/rest";

/**
 * Returns an authenticated Octokit instance.
 * Prioritizes the explicitly passed token (e.g. from user session/header),
 * falling back to process.env.GITHUB_TOKEN.
 */
export function getGitHubClient(tokenOverride?: string): Octokit | null {
  const token = tokenOverride || process.env.GITHUB_TOKEN;
  if (!token) return null;

  return new Octokit({
    auth: token,
    userAgent: "flowboard-architecture-bot/1.0",
  });
}

/**
 * Verifies credentials and retrieves the authenticated user details.
 */
export async function verifyGitHubAuth(token?: string): Promise<{
  success: boolean;
  username?: string;
  avatarUrl?: string;
  rateLimitRemaining?: number;
  error?: string;
}> {
  const octokit = getGitHubClient(token);
  if (!octokit) {
    return {
      success: false,
      error: "No GitHub token provided. Set GITHUB_TOKEN in .env.local or pass 'x-github-token' header.",
    };
  }

  try {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const { data: rate } = await octokit.rest.rateLimit.get();

    return {
      success: true,
      username: user.login,
      avatarUrl: user.avatar_url,
      rateLimitRemaining: rate.rate.remaining,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "GitHub authentication failed",
    };
  }
}

/**
 * Lists repositories accessible to the authenticated user.
 */
export async function listUserRepositories(token?: string): Promise<{
  repositories: Array<{
    id: number;
    name: string;
    fullName: string;
    private: boolean;
    defaultBranch: string;
    description: string | null;
  }>;
}> {
  const octokit = getGitHubClient(token);
  if (!octokit) throw new Error("GitHub client not authenticated");

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 50,
  });

  return {
    repositories: data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      defaultBranch: r.default_branch,
      description: r.description,
    })),
  };
}

/**
 * Fetches and parses a file from a repository (e.g., .flowboard/architecture.json).
 */
export async function fetchFileFromRepo(params: {
  owner: string;
  repo: string;
  path: string;
  ref?: string;
  token?: string;
}): Promise<{ content: string; sha: string }> {
  const { owner, repo, path, ref, token } = params;
  const octokit = getGitHubClient(token);
  if (!octokit) throw new Error("GitHub client not authenticated");

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Target path "${path}" is a directory, not a file`);
  }

  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { content, sha: data.sha };
}

/**
 * Creates a git branch, commits updated files, and creates an actual Pull Request.
 */
export async function createArchitecturePullRequest(params: {
  owner: string;
  repo: string;
  baseBranch?: string;
  branchName?: string;
  prTitle: string;
  prBody: string;
  files: Array<{ path: string; content: string }>;
  token?: string;
}): Promise<{
  prNumber: number;
  prUrl: string;
  branch: string;
}> {
  const { owner, repo, prTitle, prBody, files, token } = params;
  const octokit = getGitHubClient(token);
  if (!octokit) throw new Error("GitHub client not authenticated");

  // 1. Get default or target base branch
  let base = params.baseBranch;
  if (!base) {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    base = repoData.default_branch;
  }

  // 2. Get latest commit SHA of base branch
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${base}`,
  });
  const baseSha = refData.object.sha;

  // 3. Create a unique feature branch name
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const branchName = params.branchName || `flowboard/arch-${timestamp}`;

  await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: baseSha,
  });

  // 4. Commit each file to the new branch
  for (const file of files) {
    // Check if file already exists to supply sha for update
    let existingSha: string | undefined;
    try {
      const { data: existing } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.path,
        ref: branchName,
      });
      if (!Array.isArray(existing) && existing.type === "file") {
        existingSha = existing.sha;
      }
    } catch {
      // File does not exist yet; will create new
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: file.path,
      branch: branchName,
      message: `chore(architecture): update ${file.path} via Flowboard`,
      content: Buffer.from(file.content, "utf-8").toString("base64"),
      sha: existingSha,
    });
  }

  // 5. Open a Pull Request
  const { data: pr } = await octokit.rest.pulls.create({
    owner,
    repo,
    title: prTitle,
    body: prBody,
    head: branchName,
    base,
  });

  return {
    prNumber: pr.number,
    prUrl: pr.html_url,
    branch: branchName,
  };
}
