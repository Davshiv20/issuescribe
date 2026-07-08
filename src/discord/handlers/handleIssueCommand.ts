import { MessageFlags, type ChatInputCommandInteraction } from "discord.js";
import { MAX_INPUT_CHARS } from "../../config";
import type { IssueDraftInput } from "../../domain/types";
import { generateIssueDraft, type LlmConfig } from "../../llm/generateIssueDraft";
import type { IssueDraftRepository } from "../../db/issueDraftRepository";
import { newDraftId } from "../../utils/ids";
import { errorMessage, logger } from "../../utils/logger";
import { buildIssueButtons, buildIssuePreviewEmbed } from "../components/issuePreview";

export type IssueCommandDeps = {
  repository: IssueDraftRepository;
  llm: LlmConfig;
};

export async function handleIssueCommand(
  interaction: ChatInputCommandInteraction,
  deps: IssueCommandDeps,
): Promise<void> {
  const text = interaction.options.getString("text", true).trim();

  logger.info({
    event: "slash_command_received",
    discordUserId: interaction.user.id,
    guildId: interaction.guildId ?? undefined,
    channelId: interaction.channelId,
  });

  if (text.length === 0) {
    await interaction.reply({
      content: "The issue text is empty. Please describe the issue.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (text.length > MAX_INPUT_CHARS) {
    await interaction.reply({
      content: `This request is too long. Please keep it under ${MAX_INPUT_CHARS} characters.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Defer immediately: LLM generation takes longer than Discord's 3s window.
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const input: IssueDraftInput = {
    text,
    source: {
      discordUserId: interaction.user.id,
      discordUsername: interaction.user.username,
      guildId: interaction.guildId ?? "",
      channelId: interaction.channelId,
      commandName: interaction.commandName,
      createdAt: new Date().toISOString(),
    },
  };

  const { draft, usedFallback } = await generateIssueDraft(input, deps.llm);

  const draftId = newDraftId();
  try {
    deps.repository.insertDraft({
      id: draftId,
      discordInteractionId: interaction.id,
      discordUserId: input.source.discordUserId,
      discordUsername: input.source.discordUsername,
      guildId: input.source.guildId,
      channelId: input.source.channelId,
      originalText: text,
      draftJson: JSON.stringify(draft),
    });
  } catch (error) {
    logger.error({
      event: "draft_persist_failed",
      draftId,
      discordUserId: input.source.discordUserId,
      error: errorMessage(error),
    });
    await interaction.editReply({
      content: "Something went wrong while saving the draft. Please try again.",
    });
    return;
  }

  logger.info({
    event: "draft_persisted",
    draftId,
    discordUserId: input.source.discordUserId,
    guildId: input.source.guildId,
    channelId: input.source.channelId,
  });

  await interaction.editReply({
    embeds: [buildIssuePreviewEmbed(draft, usedFallback)],
    components: [buildIssueButtons(draftId)],
  });
}
