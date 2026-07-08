import { REST, Routes } from "discord.js";
import { loadConfig } from "../config";
import { errorMessage, logger } from "../utils/logger";
import { issueCommand } from "./commands";

async function registerCommands(): Promise<void> {
  const config = loadConfig();
  const rest = new REST().setToken(config.discord.botToken);

  logger.info({ event: "command_registration_started", guildId: config.discord.guildId });

  await rest.put(
    Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
    { body: [issueCommand.toJSON()] },
  );

  logger.info({ event: "command_registration_succeeded", guildId: config.discord.guildId });
}

registerCommands().catch((error) => {
  logger.error({ event: "command_registration_failed", error: errorMessage(error) });
  process.exit(1);
});
