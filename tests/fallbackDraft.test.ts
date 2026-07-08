import { describe, expect, test } from "bun:test";
import { createFallbackDraft } from "../src/domain/fallbackDraft";
import type { IssueDraftInput } from "../src/domain/types";

const source: IssueDraftInput["source"] = {
  discordUserId: "user-1",
  discordUsername: "shivam",
  guildId: "guild-1",
  channelId: "channel-1",
  commandName: "issue",
  createdAt: "2026-07-07T00:00:00.000Z",
};

describe("createFallbackDraft", () => {
  test("uses original text for title, summary, and description", () => {
    const draft = createFallbackDraft({ text: "Fix the export bug", source });
    expect(draft.title).toBe("Fix the export bug");
    expect(draft.summary).toBe("Fix the export bug");
    expect(draft.description).toBe("Fix the export bug");
    expect(draft.kind).toBe("generic");
    expect(draft.priority).toBe("medium");
    expect(draft.acceptanceCriteria).toEqual([]);
    expect(draft.labels).toEqual([]);
    expect(draft.reproductionSteps).toEqual([]);
    expect(draft.missingInformation).toEqual([]);
    expect(draft.expectedBehavior).toBe("");
    expect(draft.actualBehavior).toBe("");
  });

  test("truncates long titles to 90 characters", () => {
    const draft = createFallbackDraft({ text: "a".repeat(500), source });
    expect(draft.title.length).toBeLessThanOrEqual(90);
    expect(draft.title.endsWith("…")).toBe(true);
  });

  test("collapses whitespace in the title", () => {
    const draft = createFallbackDraft({ text: "fix\n\nthe   bug", source });
    expect(draft.title).toBe("fix the bug");
  });
});
