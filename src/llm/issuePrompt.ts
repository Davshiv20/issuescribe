export const ISSUE_SYSTEM_PROMPT = `You convert messy internal Discord work messages into structured GitHub issue drafts.

Return only valid JSON. Do not wrap the JSON in markdown. Do not include comments.

The issue should be practical, concise, and engineering-friendly.

Rules:
- Preserve the user's intent.
- Do not invent product requirements that are not implied.
- If something is unclear, add it to missingInformation.
- Keep the title specific and under 90 characters.
- Acceptance criteria should be testable.
- Labels should be lowercase and generic, such as bug, enhancement, frontend, backend, ux, infra, docs, clarification, task, export.
- Do not include sensitive information unless the user explicitly provided it.
- Do not create fake reproduction steps.
- Only include reproduction steps if they are inferable from the text.
- Include all fields, even if empty.`;

export function buildIssueUserPrompt(text: string): string {
  return `Discord text:
${text}

Return JSON matching this shape:

{
  "kind": "generic" | "bug" | "feature" | "task" | "clarification",
  "title": string,
  "summary": string,
  "description": string,
  "acceptanceCriteria": string[],
  "reproductionSteps": string[],
  "expectedBehavior": string,
  "actualBehavior": string,
  "labels": string[],
  "priority": "low" | "medium" | "high",
  "missingInformation": string[]
}`;
}
