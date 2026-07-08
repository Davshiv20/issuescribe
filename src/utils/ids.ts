export function newDraftId(): string {
  return crypto.randomUUID();
}

export type ButtonAction = "create" | "cancel";

export type ParsedButtonId = {
  action: ButtonAction;
  draftId: string;
};

const BUTTON_PREFIXES: Record<string, ButtonAction> = {
  issue_create: "create",
  issue_cancel: "cancel",
};

export function buildButtonId(action: ButtonAction, draftId: string): string {
  return `issue_${action}:${draftId}`;
}

export function parseButtonId(customId: string): ParsedButtonId | null {
  const separatorIndex = customId.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }
  const prefix = customId.slice(0, separatorIndex);
  const draftId = customId.slice(separatorIndex + 1);
  const action = BUTTON_PREFIXES[prefix];
  if (!action || draftId.length === 0) {
    return null;
  }
  return { action, draftId };
}
