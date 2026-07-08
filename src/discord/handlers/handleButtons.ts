import { MessageFlags, type ButtonInteraction } from "discord.js";
import type { Octokit } from "@octokit/rest";
import type { IssueDraftRepository } from "../../db/issueDraftRepository";
import { formatIssueBody } from "../../domain/formatIssueBody";
import type { IssueDraft, IssueDraftRecord } from "../../domain/types";
import {
  createGithubIssue,
  type GithubRepoConfig,
} from "../../github/createGithubIssue";
import { parseButtonId } from "../../utils/ids";
import { errorMessage, logger } from "../../utils/logger";

export type ButtonDeps = {
  repository: IssueDraftRepository;
  octokit: Octokit;
  githubRepo: GithubRepoConfig;
};

export async function handleButtonInteraction(
  interaction: ButtonInteraction,
  deps: ButtonDeps,
): Promise<void> {
  const parsed = parseButtonId(interaction.customId);
  if (!parsed) {
    return;
  }

  logger.info({
    event: "button_clicked",
    draftId: parsed.draftId,
    discordUserId: interaction.user.id,
    button: parsed.action,
  });

  const record = deps.repository.findById(parsed.draftId);
  if (!record) {
    await interaction.reply({
      content: "This draft no longer exists. Please run /issue again.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (record.discordUserId !== interaction.user.id) {
    await interaction.reply({
      content: "Only the user who created this draft can perform this action.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (parsed.action === "cancel") {
    await handleCancel(interaction, deps, record);
  } else {
    await handleCreate(interaction, deps, record);
  }
}

async function handleCancel(
  interaction: ButtonInteraction,
  deps: ButtonDeps,
  record: IssueDraftRecord,
): Promise<void> {
  if (record.status === "draft") {
    deps.repository.setStatus(record.id, "cancelled");
  }
  await interaction.update({
    content: "Cancelled. No GitHub issue was created.",
    embeds: [],
    components: [],
  });
}

async function handleCreate(
  interaction: ButtonInteraction,
  deps: ButtonDeps,
  record: IssueDraftRecord,
): Promise<void> {
  if (record.status === "created" && record.githubIssueUrl) {
    await interaction.reply({
      content: `This draft was already created as a GitHub issue: ${record.githubIssueUrl}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (record.status === "cancelled") {
    await interaction.reply({
      content: "This draft was cancelled. Please run /issue again.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Atomic claim: a second Create click loses this race and does nothing.
  if (!deps.repository.claimForCreation(record.id)) {
    const latest = deps.repository.findById(record.id);
    await interaction.reply({
      content: latest?.githubIssueUrl
        ? `This draft was already created as a GitHub issue: ${latest.githubIssueUrl}`
        : "This draft is already being processed.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  await interaction.update({
    content: "Creating GitHub issue…",
    components: [],
  });

  const draft = JSON.parse(record.draftJson) as IssueDraft;
  const body = formatIssueBody(
    draft,
    {
      discordUserId: record.discordUserId,
      discordUsername: record.discordUsername,
      guildId: record.guildId,
      channelId: record.channelId,
      commandName: "issue",
      createdAt: record.createdAt,
    },
    record.originalText,
  );

  logger.info({
    event: "github_issue_creation_started",
    draftId: record.id,
    discordUserId: record.discordUserId,
  });

  try {
    const issue = await createGithubIssue(deps.octokit, deps.githubRepo, {
      title: draft.title,
      body,
      labels: draft.labels,
    });

    deps.repository.saveGithubIssue(record.id, issue.url, issue.number);

    logger.info({
      event: "github_issue_creation_succeeded",
      draftId: record.id,
      discordUserId: record.discordUserId,
      githubIssueNumber: issue.number,
    });

    await interaction.editReply({
      content: `✅ Created GitHub issue: ${issue.url}`,
      embeds: [],
      components: [],
    });
  } catch (error) {
    // Terminal state: the buttons are gone from the message, so the user
    // re-runs /issue after fixing configuration.
    deps.repository.setStatus(record.id, "failed");

    logger.error({
      event: "github_issue_creation_failed",
      draftId: record.id,
      discordUserId: record.discordUserId,
      error: errorMessage(error),
    });

    await interaction.editReply({
      content:
        "I could not create the GitHub issue. Please check GitHub token/repo configuration.",
      embeds: [],
      components: [],
    });
  }
}
