export const CREATE_ISSUE_DRAFTS_TABLE = `
CREATE TABLE IF NOT EXISTS issue_drafts (
  id TEXT PRIMARY KEY,
  discord_interaction_id TEXT NOT NULL,
  discord_user_id TEXT NOT NULL,
  discord_username TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  original_text TEXT NOT NULL,
  draft_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'created', 'cancelled', 'failed')),
  github_issue_url TEXT,
  github_issue_number INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;
