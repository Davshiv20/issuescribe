import { describe, expect, test } from "bun:test";
import { parseIssueDraftJson } from "../src/llm/schemas";

const validDraft = {
  kind: "feature",
  title: "Add dark mode",
  summary: "Add dark mode with system theme detection.",
  description: "Users want dark mode.",
  acceptanceCriteria: ["Theme follows system preference."],
  reproductionSteps: [],
  expectedBehavior: "",
  actualBehavior: "",
  labels: ["Enhancement", "UX"],
  priority: "medium",
  missingInformation: [],
};

describe("parseIssueDraftJson", () => {
  test("parses a valid draft and lowercases labels", () => {
    const draft = parseIssueDraftJson(JSON.stringify(validDraft));
    expect(draft).not.toBeNull();
    expect(draft?.labels).toEqual(["enhancement", "ux"]);
  });

  test("returns null for invalid JSON", () => {
    expect(parseIssueDraftJson("not json {")).toBeNull();
  });

  test("returns null for JSON missing required fields", () => {
    expect(parseIssueDraftJson(JSON.stringify({ title: "x" }))).toBeNull();
  });

  test("returns null for invalid enum values", () => {
    expect(
      parseIssueDraftJson(JSON.stringify({ ...validDraft, priority: "urgent" })),
    ).toBeNull();
  });

  test("caps labels at 5 and acceptance criteria at 8", () => {
    const draft = parseIssueDraftJson(
      JSON.stringify({
        ...validDraft,
        labels: ["a", "b", "c", "d", "e", "f", "g"],
        acceptanceCriteria: Array.from({ length: 12 }, (_, i) => `criterion ${i}`),
      }),
    );
    expect(draft?.labels).toHaveLength(5);
    expect(draft?.acceptanceCriteria).toHaveLength(8);
  });

  test("truncates titles longer than 90 characters", () => {
    const draft = parseIssueDraftJson(
      JSON.stringify({ ...validDraft, title: "x".repeat(200) }),
    );
    expect(draft?.title.length).toBeLessThanOrEqual(90);
  });
});
