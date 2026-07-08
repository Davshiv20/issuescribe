# IssueScribe

Create GitHub issues from plain text inside Discord.

Type `/issue text:"..."` in your work Discord server. IssueScribe turns the text into a structured GitHub issue draft (title, summary, acceptance criteria, labels), shows you a preview, and creates the issue in your configured repository when you click **Create Issue**.

```txt
/issue text:"Export transcript fails for conversations with more than 500 messages"
        ↓
Bot shows preview → you click Create Issue → GitHub issue is created
        ↓
✅ Created GitHub issue: https://github.com/<owner>/<repo>/issues/<number>
```

One Discord server, one GitHub repository, no dashboard. Discord is the UI.

## Tech Stack

- **Runtime:** Bun
- **Language:** TypeScript (strict)
- **Discord:** discord.js v14 (slash command + buttons)
- **GitHub:** @octokit/rest
- **LLM:** OpenAI (isolated behind one module — `src/llm/generateIssueDraft.ts`)
- **Database:** SQLite via `bun:sqlite` (draft persistence + duplicate-click protection)
- **Validation:** zod (env config and LLM output)

Note: `.env` is loaded automatically by Bun — no `dotenv` dependency needed.

## Setup

### 1. Create the Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. Name it (e.g. `IssueScribe`).
3. Under **Bot**, click **Reset Token** and copy the token → `DISCORD_BOT_TOKEN`.
4. Under **General Information**, copy the **Application ID** → `DISCORD_CLIENT_ID`.
5. In Discord, enable Developer Mode (Settings → Advanced), right-click your server → **Copy Server ID** → `DISCORD_GUILD_ID`.

### 2. Invite the bot to your server

Build an invite URL (replace `CLIENT_ID`):

```txt
https://discord.com/oauth2/authorize?client_id=CLIENT_ID&scope=bot%20applications.commands&permissions=2048
```

`permissions=2048` is **Send Messages**. Open the URL, pick your server, authorize.

### 3. Required Discord permissions

- Use slash commands (`applications.commands` scope)
- Send messages
- View the channels where it is used

The bot does **not** read channel history.

### 4. Create a GitHub token

1. GitHub → Settings → Developer settings → [Fine-grained personal access tokens](https://github.com/settings/personal-access-tokens/new).
2. Limit it to your single target repository.
3. Grant **Issues: Read and write**.
4. Copy the token → `GITHUB_TOKEN`.

(A classic token with the `repo` scope also works, but is broader than needed.)

### 5. Configure environment variables

```sh
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `DISCORD_BOT_TOKEN` | Bot token from the Developer Portal |
| `DISCORD_CLIENT_ID` | Application ID |
| `DISCORD_GUILD_ID` | Your server ID (commands are registered guild-only) |
| `GITHUB_TOKEN` | GitHub token with issue write access |
| `GITHUB_OWNER` | Repo owner, e.g. `acme` |
| `GITHUB_REPO` | Repo name, e.g. `app` |
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_MODEL` | Model name (default: `gpt-4o-mini`) |
| `DATABASE_URL` | SQLite path (default: `file:./issuescribe.db`) |
| `NODE_ENV` | `development` or `production` |

Secrets are only ever read from the environment and are never logged.

### 6. Register the slash command

```sh
bun install
bun run register:commands
```

This registers `/issue` in your configured guild only (guild commands update instantly; global commands would take up to an hour and are not used).

### 7. Run the bot

```sh
bun run dev
```

You should see a `bot_ready` log line.

## Usage

```txt
/issue text:"Add dark mode with system theme detection and persisted preference"

/issue text:"Export transcript fails when a conversation has more than 500 messages"

/issue text:"Allow users to download transcript as JSONL"
```

The bot replies (ephemerally, only you see it) with an issue preview and two buttons:

- **Create Issue** — creates the GitHub issue and replies with the link.
- **Cancel** — discards the draft. Nothing is created.

Guarantees:

- No issue is created without explicit confirmation.
- Clicking **Create Issue** twice never creates two issues.
- Only the user who ran `/issue` can confirm or cancel the draft.
- If the LLM fails, a basic draft is built directly from your text — the flow still works.

## Development

```sh
bun run dev                # run the bot
bun run typecheck          # tsc --noEmit
bun test                   # unit tests
bun run build              # compile to dist/
bun run start              # run compiled output
```

## Troubleshooting

**`/issue` doesn't appear in Discord**
Run `bun run register:commands` and check that `DISCORD_GUILD_ID` matches the server you're typing in. Re-open Discord (Ctrl/Cmd+R) to refresh the command list.

**Bot exits immediately with `bot_startup_failed`**
The error lists which env vars are missing or invalid. Fill them in `.env`.

**"I could not create the GitHub issue."**
Check `GITHUB_TOKEN` has Issues write access to `GITHUB_OWNER/GITHUB_REPO`, and that the repo exists and has issues enabled. The real error is in the bot's logs (`github_issue_creation_failed`).

**Preview says "The LLM failed, so I created a basic draft from your text."**
The OpenAI call, JSON parsing, or validation failed. Check `OPENAI_API_KEY` / `OPENAI_MODEL` and the `llm_draft_generation_failed` log line. You can still create the issue from the fallback draft.

**"This request is too long."**
Input is capped at 4000 characters. Shorten it.

**Buttons do nothing after a restart with a fresh DB file**
Drafts live in SQLite. If you delete `issuescribe.db`, old previews reference drafts that no longer exist — run `/issue` again.
