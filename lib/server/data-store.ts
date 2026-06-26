import { mkdirSync } from "fs";
import path from "path";
import { DatabaseSync } from "node:sqlite";
import {
  defaultContent,
  defaultTeamMembers,
  Lead,
  MediaAsset,
  normalizeContent,
  normalizeLead,
  normalizeMedia,
  normalizeTeamMembers,
  SiteContent,
  TeamMember
} from "@/lib/storage";

type Row = Record<string, unknown>;

const databasePath =
  process.env.TYORA_SQLITE_PATH || path.join(process.cwd(), "prisma", "dev.db");

let database: DatabaseSync | null = null;

function db() {
  if (database) return database;
  mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec(`
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
  return database;
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== "string" || !value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function rowToLead(row: Row): Lead {
  return normalizeLead({
    id: row.id,
    customerName: row.customer_name,
    company: row.company,
    email: row.email,
    country: row.country,
    category: row.category,
    productIdea: row.product_idea,
    designType: row.design_type,
    quantity: row.quantity,
    budget: row.budget,
    timeline: row.timeline,
    sampleRequirement: row.sample_requirement,
    sampleReview: row.sample_review,
    additionalRequirements: row.additional_requirements,
    uploadedFile: row.uploaded_file,
    uploadedFiles: parseJson(row.uploaded_files_json, []),
    submissionDate: row.submission_date,
    status: row.status,
    ownerId: row.owner_id,
    priority: row.priority,
    lastContactDate: row.last_contact_date,
    nextFollowUpDate: row.next_follow_up_date,
    internalNotes: row.internal_notes,
    internalNoteEntries: parseJson(row.internal_note_entries_json, []),
    statusHistory: parseJson(row.status_history_json, [])
  });
}

function upsertLead(lead: Lead) {
  db().prepare(`
    INSERT INTO leads (
      id, customer_name, company, email, country, category, product_idea, design_type,
      quantity, budget, timeline, sample_requirement, sample_review, additional_requirements,
      uploaded_file, uploaded_files_json, submission_date, status, owner_id, priority,
      last_contact_date, next_follow_up_date, internal_notes, internal_note_entries_json,
      status_history_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      customer_name = excluded.customer_name,
      company = excluded.company,
      email = excluded.email,
      country = excluded.country,
      category = excluded.category,
      product_idea = excluded.product_idea,
      design_type = excluded.design_type,
      quantity = excluded.quantity,
      budget = excluded.budget,
      timeline = excluded.timeline,
      sample_requirement = excluded.sample_requirement,
      sample_review = excluded.sample_review,
      additional_requirements = excluded.additional_requirements,
      uploaded_file = excluded.uploaded_file,
      uploaded_files_json = excluded.uploaded_files_json,
      submission_date = excluded.submission_date,
      status = excluded.status,
      owner_id = excluded.owner_id,
      priority = excluded.priority,
      last_contact_date = excluded.last_contact_date,
      next_follow_up_date = excluded.next_follow_up_date,
      internal_notes = excluded.internal_notes,
      internal_note_entries_json = excluded.internal_note_entries_json,
      status_history_json = excluded.status_history_json,
      updated_at = CURRENT_TIMESTAMP
  `).run(
    lead.id,
    lead.customerName || null,
    lead.company || null,
    lead.email || null,
    lead.country || null,
    lead.category || null,
    lead.productIdea,
    lead.designType,
    lead.quantity,
    lead.budget,
    lead.timeline,
    lead.sampleRequirement,
    lead.sampleReview || null,
    lead.additionalRequirements,
    lead.uploadedFile || null,
    JSON.stringify(lead.uploadedFiles || []),
    lead.submissionDate,
    lead.status,
    lead.ownerId || "unassigned",
    lead.priority || "Medium",
    lead.lastContactDate || null,
    lead.nextFollowUpDate || null,
    lead.internalNotes || null,
    JSON.stringify(lead.internalNoteEntries || []),
    JSON.stringify(lead.statusHistory || [])
  );
}

export async function getContent(): Promise<SiteContent> {
  const row = db().prepare("SELECT data FROM site_content WHERE id = ?").get("default") as Row | undefined;
  return row ? normalizeContent(parseJson(row.data, defaultContent)) : defaultContent;
}

export async function putContent(content: unknown): Promise<SiteContent> {
  const normalized = normalizeContent(content);
  db().prepare(`
    INSERT INTO site_content (id, data, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP
  `).run("default", JSON.stringify(normalized));
  return normalized;
}

export async function resetStoredContent(): Promise<SiteContent> {
  return putContent(defaultContent);
}

export async function getLeads(): Promise<Lead[]> {
  const rows = db().prepare("SELECT * FROM leads ORDER BY submission_date DESC").all() as Row[];
  return rows.map(rowToLead);
}

export async function createLead(lead: unknown): Promise<Lead> {
  const normalized = normalizeLead(lead);
  upsertLead(normalized);
  return normalized;
}

export async function putLeads(leads: unknown): Promise<Lead[]> {
  const normalized = Array.isArray(leads) ? leads.map(normalizeLead) : [];
  const databaseInstance = db();
  databaseInstance.exec("BEGIN TRANSACTION;");
  try {
    databaseInstance.prepare("DELETE FROM leads").run();
    normalized.forEach(upsertLead);
    databaseInstance.exec("COMMIT;");
  } catch (error) {
    databaseInstance.exec("ROLLBACK;");
    throw error;
  }
  return normalized;
}

export async function getMedia(): Promise<MediaAsset[]> {
  const rows = db().prepare("SELECT id, name, url, type, mime_type, size, created_at FROM media_assets ORDER BY created_at DESC").all() as Row[];
  return normalizeMedia(rows.map((row) => ({
    id: row.id,
    name: row.name,
    url: row.url,
    type: row.type,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at
  })));
}

export async function putMedia(media: unknown): Promise<MediaAsset[]> {
  const normalized = normalizeMedia(media);
  const databaseInstance = db();
  databaseInstance.exec("BEGIN TRANSACTION;");
  try {
    databaseInstance.prepare("DELETE FROM media_assets").run();
    normalized.forEach((asset) => {
      databaseInstance.prepare(`
        INSERT INTO media_assets (id, name, url, type, mime_type, size, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(asset.id, asset.name, asset.url, asset.type, asset.mimeType, asset.size, asset.createdAt);
    });
    databaseInstance.exec("COMMIT;");
  } catch (error) {
    databaseInstance.exec("ROLLBACK;");
    throw error;
  }
  return normalized;
}

export async function createMediaAsset(asset: unknown): Promise<MediaAsset> {
  const [normalized] = normalizeMedia([asset]);
  db().prepare(`
    INSERT INTO media_assets (id, name, url, type, mime_type, size, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(normalized.id, normalized.name, normalized.url, normalized.type, normalized.mimeType, normalized.size, normalized.createdAt);
  return normalized;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  const rows = db().prepare("SELECT id, name, avatar, email, role, active FROM team_members ORDER BY created_at ASC").all() as Row[];
  if (rows.length === 0) {
    return putTeamMembers(defaultTeamMembers);
  }
  return normalizeTeamMembers(rows.map((row) => ({ ...row, active: Boolean(row.active) })));
}

export async function putTeamMembers(members: unknown): Promise<TeamMember[]> {
  const normalized = normalizeTeamMembers(members);
  const databaseInstance = db();
  databaseInstance.exec("BEGIN TRANSACTION;");
  try {
    databaseInstance.prepare("DELETE FROM team_members").run();
    normalized.forEach((member) => {
      databaseInstance.prepare(`
        INSERT INTO team_members (id, name, avatar, email, role, active, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).run(member.id, member.name, member.avatar, member.email, member.role, member.active ? 1 : 0);
    });
    databaseInstance.exec("COMMIT;");
  } catch (error) {
    databaseInstance.exec("ROLLBACK;");
    throw error;
  }
  return normalized;
}
