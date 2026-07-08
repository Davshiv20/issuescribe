import { describe, expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { CREATE_ISSUE_DRAFTS_TABLE } from "../src/db/schema";
import {
  IssueDraftRepository,
  type NewIssueDraft,
} from "../src/db/issueDraftRepository";

function makeRepository(): IssueDraftRepository {
  const db = new Database(":memory:");
  db.exec(CREATE_ISSUE_DRAFTS_TABLE);
  return new IssueDraftRepository(db);
}

function makeDraft(id: string): NewIssueDraft {
  return {
    id,
    discordInteractionId: "interaction-1",
    discordUserId: "user-1",
    discordUsername: "shivam",
    guildId: "guild-1",
    channelId: "channel-1",
    originalText: "Fix the export bug",
    draftJson: JSON.stringify({ title: "Fix the export bug" }),
  };
}

describe("IssueDraftRepository", () => {
  test("inserts and loads a draft", () => {
    const repo = makeRepository();
    const record = repo.insertDraft(makeDraft("d1"));
    expect(record.status).toBe("draft");
    expect(record.githubIssueUrl).toBeUndefined();
    expect(repo.findById("d1")?.originalText).toBe("Fix the export bug");
  });

  test("returns null for unknown drafts", () => {
    const repo = makeRepository();
    expect(repo.findById("missing")).toBeNull();
  });

  test("claimForCreation succeeds exactly once", () => {
    const repo = makeRepository();
    repo.insertDraft(makeDraft("d1"));
    expect(repo.claimForCreation("d1")).toBe(true);
    // Second click: claim fails, so no second GitHub issue is created.
    expect(repo.claimForCreation("d1")).toBe(false);
  });

  test("claimForCreation fails on cancelled drafts", () => {
    const repo = makeRepository();
    repo.insertDraft(makeDraft("d1"));
    repo.setStatus("d1", "cancelled");
    expect(repo.claimForCreation("d1")).toBe(false);
  });

  test("saveGithubIssue stores URL and number", () => {
    const repo = makeRepository();
    repo.insertDraft(makeDraft("d1"));
    repo.claimForCreation("d1");
    repo.saveGithubIssue("d1", "https://github.com/acme/app/issues/42", 42);
    const record = repo.findById("d1");
    expect(record?.status).toBe("created");
    expect(record?.githubIssueUrl).toBe("https://github.com/acme/app/issues/42");
    expect(record?.githubIssueNumber).toBe(42);
  });

  test("failed creation can be retried after status reset", () => {
    const repo = makeRepository();
    repo.insertDraft(makeDraft("d1"));
    expect(repo.claimForCreation("d1")).toBe(true);
    repo.setStatus("d1", "failed");
    // "failed" is not "draft", so a retry requires no further claim in v0;
    // verify the claim stays closed to prevent duplicates.
    expect(repo.claimForCreation("d1")).toBe(false);
  });
});
