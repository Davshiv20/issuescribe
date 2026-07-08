import type { Octokit } from "@octokit/rest";
import { errorMessage, logger } from "../utils/logger";

export type CreateGithubIssueInput = {
  title: string;
  body: string;
  labels: string[];
};

export type CreatedGithubIssue = {
  number: number;
  url: string;
};

export type GithubRepoConfig = {
  owner: string;
  repo: string;
};

export async function createGithubIssue(
  octokit: Octokit,
  repoConfig: GithubRepoConfig,
  input: CreateGithubIssueInput,
): Promise<CreatedGithubIssue> {
  try {
    const response = await octokit.issues.create({
      owner: repoConfig.owner,
      repo: repoConfig.repo,
      title: input.title,
      body: input.body,
      labels: input.labels,
    });
    return { number: response.data.number, url: response.data.html_url };
  } catch (error) {
    // Labels can fail on repos with restricted label creation. Retry once
    // without labels rather than failing the whole issue.
    if (input.labels.length > 0) {
      logger.warn({
        event: "github_issue_labels_failed_retrying_without_labels",
        error: errorMessage(error),
      });
      const response = await octokit.issues.create({
        owner: repoConfig.owner,
        repo: repoConfig.repo,
        title: input.title,
        body: input.body,
      });
      return { number: response.data.number, url: response.data.html_url };
    }
    throw error;
  }
}
