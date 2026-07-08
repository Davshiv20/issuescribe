import type { Database } from "bun:sqlite";
import type { IssueDraftRecord, IssueDraftStatus } from "../domain/types";

type IssueDraftRow = {
  id: string;
  discord_interaction_id: string;
  discord_user_id: string;
  discord_username: string;
  guild_id: string;
  channel_id: string;
  original_text: string;
  draft_json: string;
  status: IssueDraftStatus;
  github_issue_url: string | null;
  github_issue_number: number | null;
  created_at: string;
  updated_at: string;
};

function rowToRecord(row: IssueDraftRow): IssueDraftRecord {
  return {
    id: row.id,
    discordInteractionId: row.discord_interaction_id,
    discordUserId: row.discord_user_id,
    discordUsername: row.discord_username,
    guildId: row.guild_id,
    channelId: row.channel_id,
    originalText: row.original_text,
    draftJson: row.draft_json,
    status: row.status,
    githubIssueUrl: row.github_issue_url ?? undefined,
    githubIssueNumber: row.github_issue_number ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type NewIssueDraft = Omit<
  IssueDraftRecord,
  "status" | "githubIssueUrl" | "githubIssueNumber" | "createdAt" | "updatedAt"
>;

export class IssueDraftRepository {
  constructor(private readonly db: Database) {}

  insertDraft(draft: NewIssueDraft): IssueDraftRecord {
    const now = new Date().toISOString();
    this.db
      .query(
        `INSERT INTO issue_drafts (
          id, discord_interaction_id, discord_user_id, discord_username,
          guild_id, channel_id, original_text, draft_json,
          status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?)`,
      )
      .run(
        draft.id,
        draft.discordInteractionId,
        draft.discordUserId,
        draft.discordUsername,
        draft.guildId,
        draft.channelId,
        draft.originalText,
        draft.draftJson,
        now,
        now,
      );
    const record = this.findById(draft.id);
    if (!record) {
      throw new Error(`Failed to insert draft ${draft.id}`);
    }
    return record;
  }

  findById(id: string): IssueDraftRecord | null {
    const row = this.db
      .query<IssueDraftRow, [string]>("SELECT * FROM issue_drafts WHERE id = ?")
      .get(id);
    return row ? rowToRecord(row) : null;
  }

  // Atomically claims a draft for issue creation. Returns false if the draft
  // is not in 'draft' status (already created, cancelled, or being created),
  // which makes duplicate Create clicks a no-op.
  claimForCreation(id: string): boolean {
    const result = this.db
      .query(
        `UPDATE issue_drafts
         SET status = 'created', updated_at = ?
         WHERE id = ? AND status = 'draft'`,
      )
      .run(new Date().toISOString(), id);
    return result.changes === 1;
  }

  saveGithubIssue(id: string, issueUrl: string, issueNumber: number): void {
    this.db
      .query(
        `UPDATE issue_drafts
         SET github_issue_url = ?, github_issue_number = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(issueUrl, issueNumber, new Date().toISOString(), id);
  }

  setStatus(id: string, status: IssueDraftStatus): void {
    this.db
      .query("UPDATE issue_drafts SET status = ?, updated_at = ? WHERE id = ?")
      .run(status, new Date().toISOString(), id);
  }
}
