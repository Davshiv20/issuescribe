import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import type { IssueDraft } from "../../domain/types";
import { buildButtonId } from "../../utils/ids";

const EMBED_FIELD_MAX = 1024;

function fieldValue(text: string): string {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return "_None_";
  }
  return trimmed.length > EMBED_FIELD_MAX
    ? `${trimmed.slice(0, EMBED_FIELD_MAX - 1)}…`
    : trimmed;
}

function bulletField(items: string[]): string {
  return fieldValue(items.map((item) => `- ${item}`).join("\n"));
}

export function buildIssuePreviewEmbed(draft: IssueDraft, usedFallback: boolean): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle("Issue Preview")
    .addFields(
      { name: "Title", value: fieldValue(draft.title) },
      { name: "Summary", value: fieldValue(draft.summary) },
      { name: "Acceptance Criteria", value: bulletField(draft.acceptanceCriteria) },
      { name: "Labels", value: fieldValue(draft.labels.join(", ")) },
      { name: "Missing Information", value: bulletField(draft.missingInformation) },
      { name: "Kind / Priority", value: fieldValue(`${draft.kind} / ${draft.priority}`) },
    );

  if (usedFallback) {
    embed.setDescription("⚠️ The LLM failed, so I created a basic draft from your text.");
  }

  return embed;
}

export function buildIssueButtons(draftId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(buildButtonId("create", draftId))
      .setLabel("Create Issue")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(buildButtonId("cancel", draftId))
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary),
  );
}
