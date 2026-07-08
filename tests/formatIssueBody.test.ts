import { describe, expect, test } from "bun:test";
import { formatIssueBody } from "../src/domain/formatIssueBody";
import type { IssueDraft, IssueSource } from "../src/domain/types";

const source: IssueSource = {
  discordUserId: "user-1",
  discordUsername: "shivam",
  guildId: "guild-1",
  channelId: "channel-1",
  commandName: "issue",
  createdAt: "2026-07-07T00:00:00.000Z",
};

const baseDraft: IssueDraft = {
  kind: "feature",
  title: "Add JSONL transcript download support",
  summary: "Allow users to download transcripts as JSONL.",
  description: "Users need a JSONL export including roles and tool calls.",
  acceptanceCriteria: ["Transcript is exported as JSONL.", "Each line includes role and content."],
  reproductionSteps: [],
  expectedBehavior: "",
  actualBehavior: "",
  labels: ["enhancement", "export"],
  priority: "medium",
  missingInformation: ["Which conversations should be exportable?"],
};

describe("formatIssueBody", () => {
  test("includes summary, description, criteria, and source metadata", () => {
    const body = formatIssueBody(baseDraft, source, "original discord text");
    expect(body).toContain("## Summary");
    expect(body).toContain("## Description");
    expect(body).toContain("## Acceptance Criteria");
    expect(body).toContain("- Transcript is exported as JSONL.");
    expect(body).toContain("## Missing Information");
    expect(body).toContain("Created from Discord by shivam.");
    expect(body).toContain("> original discord text");
    expect(body).toContain("- Discord user ID: user-1");
    expect(body).toContain("- Guild ID: guild-1");
    expect(body).toContain("- Channel ID: channel-1");
    expect(body).toContain("- Created at: 2026-07-07T00:00:00.000Z");
  });

  test("omits empty sections", () => {
    const body = formatIssueBody(baseDraft, source, "text");
    expect(body).not.toContain("## Reproduction Steps");
    expect(body).not.toContain("## Expected Behavior");
    expect(body).not.toContain("## Actual Behavior");
  });

  test("includes bug sections when present", () => {
    const bugDraft: IssueDraft = {
      ...baseDraft,
      kind: "bug",
      actualBehavior: "Export fails with a timeout.",
      expectedBehavior: "Export completes.",
      reproductionSteps: ["Open a conversation with 600 messages", "Click export"],
    };
    const body = formatIssueBody(bugDraft, source, "text");
    expect(body).toContain("## Actual Behavior");
    expect(body).toContain("## Expected Behavior");
    expect(body).toContain("1. Open a conversation with 600 messages");
    expect(body).toContain("2. Click export");
  });

  test("omits description when identical to summary", () => {
    const draft: IssueDraft = { ...baseDraft, description: baseDraft.summary };
    const body = formatIssueBody(draft, source, "text");
    expect(body).not.toContain("## Description");
  });

  test("blockquotes multiline original text", () => {
    const body = formatIssueBody(baseDraft, source, "line one\nline two");
    expect(body).toContain("> line one\n> line two");
  });
});
