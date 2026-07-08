import { Client, Events, GatewayIntentBits } from "discord.js";
import type { Octokit } from "@octokit/rest";
import type { IssueDraftRepository } from "../db/issueDraftRepository";
import type { GithubRepoConfig } from "../github/createGithubIssue";
import type { LlmConfig } from "../llm/generateIssueDraft";
import { errorMessage, logger } from "../utils/logger";
import { ISSUE_COMMAND_NAME } from "./commands";
import { handleButtonInteraction } from "./handlers/handleButtons";
import { handleIssueCommand } from "./handlers/handleIssueCommand";

export type BotDeps = {
  repository: IssueDraftRepository;
  octokit: Octokit;
  githubRepo: GithubRepoConfig;
  llm: LlmConfig;
};

export function createBotClient(deps: BotDeps): Client {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info({ event: "bot_ready", botUser: readyClient.user.tag });
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === ISSUE_COMMAND_NAME) {
        await handleIssueCommand(interaction, {
          repository: deps.repository,
          llm: deps.llm,
        });
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction, {
          repository: deps.repository,
          octokit: deps.octokit,
          githubRepo: deps.githubRepo,
        });
      }
    } catch (error) {
      logger.error({
        event: "interaction_handler_failed",
        discordUserId: interaction.user.id,
        error: errorMessage(error),
      });
    }
  });

  return client;
}
