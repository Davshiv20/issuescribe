import { z } from "zod";

export const MAX_INPUT_CHARS = 4000;
export const MAX_TITLE_CHARS = 90;
export const MAX_LABELS = 5;
export const MAX_ACCEPTANCE_CRITERIA = 8;

const envSchema = z.object({
  DISCORD_BOT_TOKEN: z.string().min(1, "DISCORD_BOT_TOKEN is required"),
  DISCORD_CLIENT_ID: z.string().min(1, "DISCORD_CLIENT_ID is required"),
  DISCORD_GUILD_ID: z.string().min(1, "DISCORD_GUILD_ID is required"),
  GITHUB_TOKEN: z.string().min(1, "GITHUB_TOKEN is required"),
  GITHUB_OWNER: z.string().min(1, "GITHUB_OWNER is required"),
  GITHUB_REPO: z.string().min(1, "GITHUB_REPO is required"),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  DATABASE_URL: z.string().min(1).default("file:./issuescribe.db"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Config = {
  discord: {
    botToken: string;
    clientId: string;
    guildId: string;
  };
  github: {
    token: string;
    owner: string;
    repo: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  databasePath: string;
  nodeEnv: "development" | "production" | "test";
};

function databaseUrlToPath(databaseUrl: string): string {
  return databaseUrl.startsWith("file:") ? databaseUrl.slice("file:".length) : databaseUrl;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const missing = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n  ");
    throw new Error(`Invalid environment configuration:\n  ${missing}`);
  }

  const raw = parsed.data;
  return {
    discord: {
      botToken: raw.DISCORD_BOT_TOKEN,
      clientId: raw.DISCORD_CLIENT_ID,
      guildId: raw.DISCORD_GUILD_ID,
    },
    github: {
      token: raw.GITHUB_TOKEN,
      owner: raw.GITHUB_OWNER,
      repo: raw.GITHUB_REPO,
    },
    openai: {
      apiKey: raw.OPENAI_API_KEY,
      model: raw.OPENAI_MODEL,
    },
    databasePath: databaseUrlToPath(raw.DATABASE_URL),
    nodeEnv: raw.NODE_ENV,
  };
}
