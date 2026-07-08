type LogFields = {
  event: string;
  draftId?: string;
  discordUserId?: string;
  guildId?: string;
  channelId?: string;
  githubIssueNumber?: number;
  error?: string;
  [key: string]: string | number | boolean | undefined;
};

function emit(level: "info" | "warn" | "error", fields: LogFields): void {
  const line = JSON.stringify({
    level,
    timestamp: new Date().toISOString(),
    ...fields,
  });
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (fields: LogFields) => emit("info", fields),
  warn: (fields: LogFields) => emit("warn", fields),
  error: (fields: LogFields) => emit("error", fields),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
