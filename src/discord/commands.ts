import { SlashCommandBuilder } from "discord.js";
import { MAX_INPUT_CHARS } from "../config";

export const ISSUE_COMMAND_NAME = "issue";

export const issueCommand = new SlashCommandBuilder()
  .setName(ISSUE_COMMAND_NAME)
  .setDescription("Create a GitHub issue from plain text")
  .addStringOption((option) =>
    option
      .setName("text")
      .setDescription(`Describe the issue in plain text (max ${MAX_INPUT_CHARS} characters)`)
      .setRequired(true),
  );
