import { z } from "zod";
import { MAX_ACCEPTANCE_CRITERIA, MAX_LABELS, MAX_TITLE_CHARS } from "../config";
import type { IssueDraft } from "../domain/types";
import { truncate } from "../utils/truncate";

export const issueDraftSchema = z.object({
  kind: z.enum(["generic", "bug", "feature", "task", "clarification"]),
  title: z
    .string()
    .min(1)
    .transform((title) => truncate(title, MAX_TITLE_CHARS)),
  summary: z.string(),
  description: z.string(),
  acceptanceCriteria: z
    .array(z.string().min(1))
    .transform((criteria) => criteria.slice(0, MAX_ACCEPTANCE_CRITERIA)),
  reproductionSteps: z.array(z.string().min(1)),
  expectedBehavior: z.string(),
  actualBehavior: z.string(),
  labels: z
    .array(z.string().min(1))
    .transform((labels) => labels.map((label) => label.toLowerCase().trim()).slice(0, MAX_LABELS)),
  priority: z.enum(["low", "medium", "high"]),
  missingInformation: z.array(z.string().min(1)),
});

export function parseIssueDraftJson(raw: string): IssueDraft | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const result = issueDraftSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
