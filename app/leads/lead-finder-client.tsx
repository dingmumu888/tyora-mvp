"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Filter,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  UserRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";

type LeadStatus =
  | "New"
  | "Contacted"
  | "Connected"
  | "Replied"
  | "Interested"
  | "Meeting"
  | "Won"
  | "Lost";

type Lead = {
  id: string;
  companyName: string;
  website: string;
  founderName: string;
  linkedInUrl: string;
  source: string;
  country: string;
  productCategory: string;
  notes: string;
  status: LeadStatus;
  score: number;
  createdAt: string;
  lastContacted: string;
  nextFollowUp: string;
};

type LeadDraft = Omit<Lead, "id" | "score" | "createdAt">;

const storageKey = "tyora-lead-finder-v1";

const statuses: LeadStatus[] = [
  "New",
  "Contacted",
  "Connected",
  "Replied",
  "Interested",
  "Meeting",
  "Won",
  "Lost"
];

const emptyDraft: LeadDraft = {
  companyName: "",
  website: "",
  founderName: "",
  linkedInUrl: "",
  source: "",
  country: "",
  productCategory: "",
  notes: "",
  status: "New",
  lastContacted: "",
  nextFollowUp: ""
};

function id() {
  return `lead-${Date.now()}-${Math.round(Math.random() * 100000)}`;
}

function scoreLead(lead: Pick<LeadDraft, "founderName" | "source" | "productCategory" | "notes">) {
  const text = [
    lead.founderName,
    lead.source,
    lead.productCategory,
    lead.notes
  ].join(" ").toLowerCase();

  let score = 0;
  if (/\bfounder\b|\bco-founder\b|\bcofounder\b/.test(text)) score += 20;
  if (/consumer product|consumer goods|cpg|dtc|ecommerce|e-commerce/.test(text)) score += 20;
  if (/hardware|physical product|device|electronics|iot|consumer electronic/.test(text)) score += 20;
  if (/kickstarter|indiegogo|crowdfunding/.test(text)) score += 20;
  if (/amazon brand|amazon seller|fba/.test(text)) score += 20;
  if (/supply chain|sourcing|factory|manufacturer|manufacturing|procurement/.test(text)) score += 10;
  if (/saas|software only|app only|mobile app|web app/.test(text)) score -= 30;
  if (/agency|marketing agency|creative agency|advertising/.test(text)) score -= 20;
  if (/consultant|consulting|advisor|fractional/.test(text)) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function addDays(dateValue: string, days: number) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function isFollowUpDue(lead: Lead) {
  if (lead.status !== "Contacted") return false;
  if (!lead.lastContacted) return false;
  const dueDate = addDays(lead.lastContacted, 3);
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${dueDate}T00:00:00`).getTime() <= today.getTime();
}

function effectiveStatus(lead: Lead) {
  return isFollowUpDue(lead) ? "Follow-up Due" : lead.status;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export default function LeadFinderClient() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [draft, setDraft] = useState<LeadDraft>(emptyDraft);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/session")
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((payload) => setAuthenticated(Boolean(payload.authenticated)))
      .catch(() => setAuthenticated(false))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) setLeads(JSON.parse(saved));
    } catch {
      setLeads([]);
    }
  }, [authenticated]);

  useEffect(() => {
    if (!authenticated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(leads));
  }, [authenticated, leads]);

  const draftScore = useMemo(() => scoreLead(draft), [draft]);
  const sources = useMemo(() => uniqueValues(leads.map((lead) => lead.source)), [leads]);

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const searchable = [
        lead.companyName,
        lead.founderName,
        lead.source,
        lead.country,
        lead.productCategory,
        lead.notes
      ].join(" ").toLowerCase();

      if (normalizedQuery && !searchable.includes(normalizedQuery)) return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (sourceFilter !== "all" && lead.source !== sourceFilter) return false;
      if (scoreFilter && lead.score < 70) return false;
      if (followUpFilter && !isFollowUpDue(lead)) return false;
      return true;
    });
  }, [followUpFilter, leads, query, scoreFilter, sourceFilter, statusFilter]);

  function updateDraft<K extends keyof LeadDraft>(key: K, value: LeadDraft[K]) {
    setDraft((current) => {
      const next = { ...current, [key]: value };
      if (key === "status" && value === "Contacted" && !next.lastContacted) {
        next.lastContacted = new Date().toISOString().slice(0, 10);
      }
      if ((key === "status" || key === "lastContacted") && next.status === "Contacted") {
        next.nextFollowUp = addDays(next.lastContacted, 3);
      }
      if (key === "status" && value === "Replied") {
        next.nextFollowUp = "";
      }
      return next;
    });
  }

  function addLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.companyName.trim() || !draft.founderName.trim()) return;

    const nextLead: Lead = {
      ...draft,
      id: id(),
      companyName: draft.companyName.trim(),
      founderName: draft.founderName.trim(),
      score: draftScore,
      createdAt: new Date().toISOString()
    };
    setLeads((current) => [nextLead, ...current]);
    setDraft(emptyDraft);
  }

  function updateLead(idValue: string, patch: Partial<Lead>) {
    setLeads((current) => current.map((lead) => {
      if (lead.id !== idValue) return lead;
      const next = { ...lead, ...patch };
      if (patch.status === "Contacted" && !next.lastContacted) {
        next.lastContacted = new Date().toISOString().slice(0, 10);
      }
      if (patch.status === "Replied") {
        next.nextFollowUp = "";
      } else if (next.status === "Contacted") {
        next.nextFollowUp = addDays(next.lastContacted, 3);
      }
      next.score = scoreLead(next);
      return next;
    }));
  }

  function deleteLead(idValue: string) {
    setLeads((current) => current.filter((lead) => lead.id !== idValue));
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <p className="text-sm text-[#69707d]">Checking internal access...</p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f8] px-4">
        <Card className="w-full max-w-md p-6 text-center soft-shadow">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-lg bg-[#101216] text-white">
            <UserRound size={22} />
          </div>
          <h1 className="text-2xl font-semibold">TYORA Lead Finder</h1>
          <p className="mt-2 text-sm leading-6 text-[#69707d]">
            This internal page uses the existing TYORA admin session.
          </p>
          <Link
            href="/admin"
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#101216] bg-[#101216] px-4 text-sm font-medium text-white transition hover:bg-[#252a31]"
          >
            Log in through admin
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-[#101216]">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#59616e] hover:text-[#101216]">
              <ArrowLeft size={16} />
              Back to admin
            </Link>
            <h1 className="text-3xl font-semibold tracking-normal">TYORA Lead Finder</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#69707d]">
              Internal lead management for US product founders, physical product brands, and manufacturing-ready opportunities.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Total" value={leads.length} />
            <Metric label="70+" value={leads.filter((lead) => lead.score >= 70).length} />
            <Metric label="Due" value={leads.filter(isFollowUpDue).length} />
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <Card className="p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Add lead</h2>
                <p className="mt-1 text-sm text-[#69707d]">Score preview: <span className="font-semibold text-[#101216]">{draftScore}</span></p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#ecfdf5] text-[#0f766e]">
                <Sparkles size={19} />
              </div>
            </div>

            <form className="grid gap-4" onSubmit={addLead}>
              <Field label="Company name">
                <Input required value={draft.companyName} onChange={(event) => updateDraft("companyName", event.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Website">
                  <Input value={draft.website} onChange={(event) => updateDraft("website", event.target.value)} placeholder="https://" />
                </Field>
                <Field label="Founder name">
                  <Input required value={draft.founderName} onChange={(event) => updateDraft("founderName", event.target.value)} placeholder="Founder / Co-Founder" />
                </Field>
              </div>
              <Field label="LinkedIn URL">
                <Input value={draft.linkedInUrl} onChange={(event) => updateDraft("linkedInUrl", event.target.value)} placeholder="https://linkedin.com/in/..." />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source">
                  <Input value={draft.source} onChange={(event) => updateDraft("source", event.target.value)} placeholder="Kickstarter, Amazon, LinkedIn" />
                </Field>
                <Field label="Country">
                  <Input value={draft.country} onChange={(event) => updateDraft("country", event.target.value)} placeholder="United States" />
                </Field>
              </div>
              <Field label="Product category">
                <Input value={draft.productCategory} onChange={(event) => updateDraft("productCategory", event.target.value)} placeholder="Consumer products, hardware, supply chain" />
              </Field>
              <Field label="Status">
                <select className="min-h-11 w-full rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm outline-none focus:border-[#101216] focus:ring-4 focus:ring-[#101216]/5" value={draft.status} onChange={(event) => updateDraft("status", event.target.value as LeadStatus)}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Last contacted">
                  <Input type="date" value={draft.lastContacted} onChange={(event) => updateDraft("lastContacted", event.target.value)} />
                </Field>
                <Field label="Next follow-up">
                  <Input type="date" value={draft.nextFollowUp} onChange={(event) => updateDraft("nextFollowUp", event.target.value)} disabled={draft.status === "Replied"} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea value={draft.notes} onChange={(event) => updateDraft("notes", event.target.value)} placeholder="Amazon brand, hardware founder, Kickstarter launch, supply chain pain..." />
              </Field>
              <Button type="submit">
                <Plus size={16} />
                Add lead
              </Button>
            </form>
          </Card>

          <section className="min-w-0 space-y-5">
            <Card className="p-4">
              <div className="grid gap-3 lg:grid-cols-[1fr_160px_180px_auto_auto]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c94a1]" size={17} />
                  <Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, founder, category, notes" />
                </div>
                <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | LeadStatus)}>
                  <option value="all">All statuses</option>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
                <select className="min-h-11 rounded-lg border border-[#e1e5ea] bg-white px-3 text-sm" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                  <option value="all">All sources</option>
                  {sources.map((source) => <option key={source} value={source}>{source}</option>)}
                </select>
                <Toggle active={scoreFilter} onClick={() => setScoreFilter((current) => !current)}>
                  <Target size={15} />
                  Score 70+
                </Toggle>
                <Toggle active={followUpFilter} onClick={() => setFollowUpFilter((current) => !current)}>
                  <CalendarClock size={15} />
                  Follow-up Due
                </Toggle>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-[#e8ebef] p-4">
                <div>
                  <h2 className="font-semibold">Lead table</h2>
                  <p className="mt-1 text-sm text-[#69707d]">{filteredLeads.length} visible leads</p>
                </div>
                <Filter size={18} className="text-[#69707d]" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                  <thead className="bg-[#fbfbfc] text-xs uppercase text-[#69707d]">
                    <tr>
                      <Th>Company</Th>
                      <Th>Founder</Th>
                      <Th>Source</Th>
                      <Th>Country</Th>
                      <Th>Category</Th>
                      <Th>Score</Th>
                      <Th>Status</Th>
                      <Th>Last contacted</Th>
                      <Th>Next follow-up</Th>
                      <Th></Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="border-t border-[#eef1f4] align-top">
                        <Td>
                          <div className="font-medium">{lead.companyName}</div>
                          {lead.website ? <a className="mt-1 block text-xs text-[#0f766e] hover:underline" href={lead.website} target="_blank" rel="noreferrer">{lead.website}</a> : null}
                        </Td>
                        <Td>
                          <div>{lead.founderName}</div>
                          {lead.linkedInUrl ? <a className="mt-1 block text-xs text-[#0f766e] hover:underline" href={lead.linkedInUrl} target="_blank" rel="noreferrer">LinkedIn</a> : null}
                        </Td>
                        <Td>{lead.source || "-"}</Td>
                        <Td>{lead.country || "-"}</Td>
                        <Td>{lead.productCategory || "-"}</Td>
                        <Td><ScoreBadge score={lead.score} /></Td>
                        <Td>
                          <select className="min-h-9 rounded-lg border border-[#e1e5ea] bg-white px-2 text-xs" value={lead.status} onChange={(event) => updateLead(lead.id, { status: event.target.value as LeadStatus })}>
                            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                          </select>
                          {isFollowUpDue(lead) ? <p className="mt-2 text-xs font-semibold text-[#b45309]">Follow-up Due</p> : null}
                        </Td>
                        <Td>
                          <Input className="min-h-9 text-xs" type="date" value={lead.lastContacted} onChange={(event) => updateLead(lead.id, { lastContacted: event.target.value })} />
                        </Td>
                        <Td>
                          <Input className="min-h-9 text-xs" type="date" value={lead.nextFollowUp} onChange={(event) => updateLead(lead.id, { nextFollowUp: event.target.value })} disabled={lead.status === "Replied"} />
                          <p className="mt-1 text-xs text-[#69707d]">{effectiveStatus(lead) === "Follow-up Due" ? "Due now" : formatDate(lead.nextFollowUp)}</p>
                        </Td>
                        <Td>
                          <Button variant="ghost" className="min-h-9 px-2 text-red-700 hover:bg-red-50" onClick={() => deleteLead(lead.id)} aria-label={`Delete ${lead.companyName}`}>
                            <Trash2 size={15} />
                          </Button>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLeads.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle2 className="mx-auto mb-3 text-[#0f766e]" size={28} />
                  <p className="font-medium">No leads match the current filters.</p>
                  <p className="mt-1 text-sm text-[#69707d]">Add a lead or clear filters to see the table.</p>
                </div>
              ) : null}
            </Card>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#e8ebef] bg-white px-4 py-3 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs font-medium uppercase text-[#69707d]">{label}</p>
    </div>
  );
}

function Toggle({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
        active
          ? "border-[#101216] bg-[#101216] text-white"
          : "border-[#e1e5ea] bg-white text-[#101216] hover:bg-[#f5f6f8]"
      }`}
    >
      {children}
    </button>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-semibold">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-4">{children}</td>;
}

function ScoreBadge({ score }: { score: number }) {
  const className = score >= 70
    ? "bg-[#dcfce7] text-[#166534]"
    : score >= 40
      ? "bg-[#fef3c7] text-[#92400e]"
      : "bg-[#f3f4f6] text-[#4b5563]";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{score}</span>;
}
