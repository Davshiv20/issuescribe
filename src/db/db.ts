import { Database } from "bun:sqlite";
import { CREATE_ISSUE_DRAFTS_TABLE } from "./schema";

export function openDatabase(path: string): Database {
  const db = new Database(path, { create: true });
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(CREATE_ISSUE_DRAFTS_TABLE);
  return db;
}
