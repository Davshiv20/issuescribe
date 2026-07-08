import { describe, expect, test } from "bun:test";
import { buildButtonId, parseButtonId } from "../src/utils/ids";

describe("button custom IDs", () => {
  test("round-trips create button IDs", () => {
    const id = buildButtonId("create", "draft-123");
    expect(id).toBe("issue_create:draft-123");
    expect(parseButtonId(id)).toEqual({ action: "create", draftId: "draft-123" });
  });

  test("round-trips cancel button IDs", () => {
    const id = buildButtonId("cancel", "draft-456");
    expect(id).toBe("issue_cancel:draft-456");
    expect(parseButtonId(id)).toEqual({ action: "cancel", draftId: "draft-456" });
  });

  test("returns null for unknown prefixes", () => {
    expect(parseButtonId("other_button:draft-123")).toBeNull();
  });

  test("returns null for missing separator", () => {
    expect(parseButtonId("issue_create")).toBeNull();
  });

  test("returns null for empty draft ID", () => {
    expect(parseButtonId("issue_create:")).toBeNull();
  });
});
