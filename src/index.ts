import { loadConfig } from "./config";
import { openDatabase } from "./db/db";
import { IssueDraftRepository } from "./db/issueDraftRepository";
import { createBotClient } from "./discord/client";
import { createGithubClient } from "./github/githubClient";
import { errorMessage, logger } from "./utils/logger";

async function main(): Promise<void> {
  const config = loadConfig();

  logger.info({ event: "bot_startup", nodeEnv: config.nodeEnv });

  const db = openDatabase(config.databasePath);
  const repository = new IssueDraftRepository(db);
  const octokit = createGithubClient(config.github.token);

  const client = createBotClient({
    repository,
    octokit,
    githubRepo: { owner: config.github.owner, repo: config.github.repo },
    llm: { apiKey: config.openai.apiKey, model: config.openai.model },
  });

  await client.login(config.discord.botToken);
}

main().catch((error) => {
  logger.error({ event: "bot_startup_failed", error: errorMessage(error) });
  process.exit(1);
});
