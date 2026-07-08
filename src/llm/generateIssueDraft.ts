import OpenAI from "openai";
import { createFallbackDraft } from "../domain/fallbackDraft";
import type { IssueDraft, IssueDraftInput } from "../domain/types";
import { errorMessage, logger } from "../utils/logger";
import { buildIssueUserPrompt, ISSUE_SYSTEM_PROMPT } from "./issuePrompt";
import { parseIssueDraftJson } from "./schemas";

export type GeneratedDraft = {
  draft: IssueDraft;
  usedFallback: boolean;
};

export type LlmConfig = {
  apiKey: string;
  model: string;
  baseUrl?: string;
};

// All LLM-provider-specific code lives in this module. Swapping providers
// means changing only this file.
export async function generateIssueDraft(
  input: IssueDraftInput,
  llm: LlmConfig,
): Promise<GeneratedDraft> {
  logger.info({
    event: "llm_draft_generation_started",
    discordUserId: input.source.discordUserId,
  });

  try {
    const client = new OpenAI({ apiKey: llm.apiKey, baseURL: llm.baseUrl });
    const response = await client.chat.completions.create({
      model: llm.model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: ISSUE_SYSTEM_PROMPT },
        { role: "user", content: buildIssueUserPrompt(input.text) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("LLM returned an empty response");
    }

    const draft = parseIssueDraftJson(content);
    if (!draft) {
      throw new Error("LLM response failed JSON parsing or schema validation");
    }

    logger.info({
      event: "llm_draft_generation_succeeded",
      discordUserId: input.source.discordUserId,
    });
    return { draft, usedFallback: false };
  } catch (error) {
    logger.error({
      event: "llm_draft_generation_failed",
      discordUserId: input.source.discordUserId,
      error: errorMessage(error),
    });
    return { draft: createFallbackDraft(input), usedFallback: true };
  }
}
