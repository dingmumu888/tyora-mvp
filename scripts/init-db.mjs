import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const databasePath = process.env.TYORA_SQLITE_PATH || path.join(process.cwd(), "prisma", "dev.db");

mkdirSync(path.dirname(databasePath), { recursive: true });

const db = new DatabaseSync(databasePath);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(`
  CREATE TABLE IF NOT EXISTS site_content (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    customer_name TEXT,
    company TEXT,
    email TEXT,
    country TEXT,
    category TEXT,
    product_idea TEXT NOT NULL,
    design_type TEXT NOT NULL,
    quantity TEXT NOT NULL,
    budget TEXT NOT NULL,
    timeline TEXT NOT NULL,
    sample_requirement TEXT NOT NULL,
    sample_review TEXT,
    additional_requirements TEXT NOT NULL,
    uploaded_file TEXT,
    uploaded_files_json TEXT NOT NULL DEFAULT '[]',
    submission_date TEXT NOT NULL,
    status TEXT NOT NULL,
    owner_id TEXT,
    priority TEXT,
    last_contact_date TEXT,
    next_follow_up_date TEXT,
    internal_notes TEXT,
    internal_note_entries_json TEXT NOT NULL DEFAULT '[]',
    status_history_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS leads_status_idx ON leads(status);
  CREATE INDEX IF NOT EXISTS leads_owner_idx ON leads(owner_id);
  CREATE INDEX IF NOT EXISTS leads_priority_idx ON leads(priority);
  CREATE INDEX IF NOT EXISTS leads_submission_date_idx ON leads(submission_date);

  CREATE TABLE IF NOT EXISTS media_assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS media_assets_type_idx ON media_assets(type);

  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS team_members_active_idx ON team_members(active);
  CREATE INDEX IF NOT EXISTS team_members_role_idx ON team_members(role);
`);
db.close();

console.log(`Initialized SQLite database at ${databasePath}`);
