export type IssueKind = "generic" | "bug" | "feature" | "task" | "clarification";

export type IssuePriority = "low" | "medium" | "high";

export type IssueDraft = {
  kind: IssueKind;
  title: string;
  summary: string;
  description: string;
  acceptanceCriteria: string[];
  reproductionSteps: string[];
  expectedBehavior: string;
  actualBehavior: string;
  labels: string[];
  priority: IssuePriority;
  missingInformation: string[];
};

export type IssueSource = {
  discordUserId: string;
  discordUsername: string;
  guildId: string;
  channelId: string;
  commandName: string;
  createdAt: string;
};

export type IssueDraftInput = {
  text: string;
  source: IssueSource;
};

export type IssueDraftStatus = "draft" | "created" | "cancelled" | "failed";

export type IssueDraftRecord = {
  id: string;
  discordInteractionId: string;
  discordUserId: string;
  discordUsername: string;
  guildId: string;
  channelId: string;
  originalText: string;
  draftJson: string;
  status: IssueDraftStatus;
  githubIssueUrl?: string;
  githubIssueNumber?: number;
  createdAt: string;
  updatedAt: string;
};
