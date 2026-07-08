import type { IssueDraft, IssueSource } from "./types";

function section(heading: string, content: string): string {
  return `## ${heading}\n\n${content}`;
}

function bulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

function numberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function blockquote(text: string): string {
  return text
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function formatIssueBody(
  draft: IssueDraft,
  source: IssueSource,
  originalText: string,
): string {
  const sections: string[] = [];

  if (draft.summary.trim()) {
    sections.push(section("Summary", draft.summary.trim()));
  }

  if (draft.description.trim() && draft.description.trim() !== draft.summary.trim()) {
    sections.push(section("Description", draft.description.trim()));
  }

  if (draft.actualBehavior.trim()) {
    sections.push(section("Actual Behavior", draft.actualBehavior.trim()));
  }

  if (draft.expectedBehavior.trim()) {
    sections.push(section("Expected Behavior", draft.expectedBehavior.trim()));
  }

  if (draft.reproductionSteps.length > 0) {
    sections.push(section("Reproduction Steps", numberedList(draft.reproductionSteps)));
  }

  if (draft.acceptanceCriteria.length > 0) {
    sections.push(section("Acceptance Criteria", bulletList(draft.acceptanceCriteria)));
  }

  if (draft.missingInformation.length > 0) {
    sections.push(section("Missing Information", bulletList(draft.missingInformation)));
  }

  const sourceSection = [
    `Created from Discord by ${source.discordUsername}.`,
    "",
    "Original request:",
    "",
    blockquote(originalText),
    "",
    "Metadata:",
    `- Discord user ID: ${source.discordUserId}`,
    `- Guild ID: ${source.guildId}`,
    `- Channel ID: ${source.channelId}`,
    `- Created at: ${source.createdAt}`,
  ].join("\n");

  sections.push(section("Source", sourceSection));

  return sections.join("\n\n");
}
