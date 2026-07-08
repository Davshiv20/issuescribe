import { MAX_TITLE_CHARS } from "../config";
import { truncate } from "../utils/truncate";
import type { IssueDraft, IssueDraftInput } from "./types";

export function createFallbackDraft(input: IssueDraftInput): IssueDraft {
  return {
    kind: "generic",
    title: truncate(input.text, MAX_TITLE_CHARS),
    summary: input.text,
    description: input.text,
    acceptanceCriteria: [],
    reproductionSteps: [],
    expectedBehavior: "",
    actualBehavior: "",
    labels: [],
    priority: "medium",
    missingInformation: [],
  };
}
