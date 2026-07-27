"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  History,
  Loader2,
  LockKeyhole,
  Mail,
  MessageCircle,
  RefreshCcw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import AdminShell, { AdminSectionId } from "@/components/admin/admin-shell";
import {
  findWorkOrderByDetailTarget,
  workOrderDetailHref,
  WorkOrder,
  WorkOrderStatus,
  WorkOrderType
} from "@/lib/work-orders";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type QueueFilter = "All" | "Needs Reply" | WorkOrderType;

const queueFilters: QueueFilter[] = ["All", "Needs Reply", "Idea", "Custom", "Source", "Project"];

const statusTone: Record<WorkOrderStatus, string> = {
  "Needs Reply": "bg-amber-50 text-amber-800 ring-amber-200",
  New: "bg-slate-100 text-slate-700 ring-slate-200",
  Reviewing: "bg-blue-50 text-blue-800 ring-blue-200",
  Quoted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Sample: "bg-orange-50 text-orange-800 ring-orange-200",
  "Factory Introduced": "bg-violet-50 text-violet-800 ring-violet-200",
  Managed: "bg-sky-50 text-sky-800 ring-sky-200",
  Production: "bg-green-50 text-green-800 ring-green-200",
  Shipping: "bg-cyan-50 text-cyan-800 ring-cyan-200",
  Completed: "bg-slate-100 text-slate-700 ring-slate-200",
  Closed: "bg-rose-50 text-rose-800 ring-rose-200"
};

const typeTone: Record<WorkOrderType, string> = {
  Idea: "bg-[#eff6ff] text-[#1d4ed8]",
  Custom: "bg-[#eef4ff] text-[#3538cd]",
  Source: "bg-[#f5f3ff] text-[#6d28d9]",
  Project: "bg-[#ecfdf5] text-[#047857]"
};

function formatDate(value?: string) {
  if (!value) return "Not recorded";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function localDateTimeInput(value = new Date()) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function whatsappHref(value?: string) {
  if (!value) return "";
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `https://wa.me/${normalized.replace(/^\+/, "")}` : "";
}

function statusOptions(order: WorkOrder): WorkOrderStatus[] {
  if (order.recordKind === "CustomInquiry") {
    return ["Needs Reply", "Reviewing", "Managed", "Closed"];
  }
  const options: WorkOrderStatus[] = order.type === "Idea" || order.type === "Custom"
    ? ["Reviewing", "Managed", "Production", "Shipping", "Completed"]
    : order.type === "Source"
      ? ["New", "Reviewing", "Quoted", "Sample", "Factory Introduced", "Managed", "Completed"]
      : ["New", "Reviewing", "Quoted", "Sample", "Production", "Shipping", "Completed", "Closed"];
  return options.includes(order.status) ? options : [order.status, ...options];
}

function canEditInternalNotes(order: WorkOrder) {
  return order.recordKind === "SourceRequest" || order.recordKind === "Lead";
}

function canEditCustomerUpdate(order: WorkOrder) {
  return order.recordKind === "CommunityIdea" || order.recordKind === "CustomInquiry";
}

function Section({
  title,
  icon,
  tone = "plain",
  children
}: {
  title: string;
  icon: React.ReactNode;
  tone?: "plain" | "internal" | "customer";
  children: React.ReactNode;
}) {
  const toneClass = tone === "internal"
    ? "border-amber-200 bg-amber-50/55"
    : tone === "customer"
      ? "border-blue-200 bg-blue-50/45"
      : "border-[#e4e7ec] bg-white";
  return (
    <section className={`rounded-md border ${toneClass}`}>
      <div className="flex min-h-11 items-center gap-2 border-b border-inherit px-3 text-sm font-bold">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}

function DetailList({ items }: { items: Array<{ label: string; value?: string }> }) {
  const visible = items.filter((item) => item.value?.trim());
  if (!visible.length) return <p className="text-sm text-[#667085]">No additional information recorded.</p>;
  return (
    <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
      {visible.map((item) => (
        <div key={`${item.label}-${item.value}`} className="min-w-0">
          <dt className="text-[11px] font-bold uppercase text-[#667085]">{item.label}</dt>
          <dd className="mt-1 break-words text-sm text-[#101828]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function WorkOrderWorkspace({
  order,
  onClose,
  onSaved
}: {
  order: WorkOrder;
  onClose: () => void;
  onSaved: (order: WorkOrder) => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState(order.status);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || "");
  const [customerVisibleUpdate, setCustomerVisibleUpdate] = useState(order.customerVisibleUpdate || "");
  const [contactChannel, setContactChannel] = useState("Email");
  const [contactedAt, setContactedAt] = useState(() => localDateTimeInput());
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const whatsApp = whatsappHref(order.contactWhatsapp);

  useEffect(() => {
    setStatus(order.status);
    setInternalNotes(order.internalNotes || "");
    setCustomerVisibleUpdate(order.customerVisibleUpdate || "");
    setFeedback("");
    closeRef.current?.focus();
  }, [order]);

  async function patch(body: Record<string, unknown>, successMessage: string) {
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, ...body })
      });
      const payload = await response.json() as ApiResponse<WorkOrder>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to update this item.");
      onSaved(payload.data);
      setStatus(payload.data.status);
      setInternalNotes(payload.data.internalNotes || "");
      setCustomerVisibleUpdate(payload.data.customerVisibleUpdate || "");
      setFeedback(successMessage);
      return true;
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to update this item.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function saveRecord() {
    await patch({
      status,
      ...(canEditInternalNotes(order) && internalNotes !== (order.internalNotes || "") ? { internalNotes } : {}),
      ...(canEditCustomerUpdate(order) && customerVisibleUpdate !== (order.customerVisibleUpdate || "") ? { customerVisibleUpdate } : {})
    }, "Changes saved");
  }

  async function recordContact() {
    const saved = await patch({
      contactEvent: {
        channel: contactChannel,
        contactedAt: new Date(contactedAt).toISOString(),
        nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : "",
        note: contactNote
      }
    }, "Contact recorded");
    if (saved) {
      setContactedAt(localDateTimeInput());
      setNextFollowUpAt("");
      setContactNote("");
    }
  }

  const assessmentItems = order.assessment ? [
    { label: "Feasibility", value: order.assessment.manufacturingFeasible },
    { label: "Estimated cost range", value: order.assessment.estimatedCostRange },
    { label: "Estimated MOQ", value: order.assessment.estimatedMoq },
    { label: "Confidence", value: order.assessment.confidence },
    { label: "Assessment status", value: order.assessment.assessmentStatus },
    { label: "Suggested material", value: order.assessment.suggestedMaterial },
    { label: "Suggested process", value: order.assessment.suggestedManufacturing },
    { label: "Mold requirement", value: order.assessment.moldRequirement },
    { label: "Assumptions", value: order.assessment.assumptions },
    { label: "Main risks", value: order.assessment.mainRisks },
    { label: "Recommended next step", value: order.assessment.recommendedNextStep },
    { label: "Custom eligible", value: order.assessment.customEligible === undefined ? undefined : order.assessment.customEligible ? "Yes" : "No" }
  ] : [];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f8fafc] xl:rounded-md xl:border xl:border-[#d0d5dd] xl:shadow-sm">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[#e4e7ec] bg-white p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-1 text-[11px] font-bold ${typeTone[order.type]}`}>{order.type}</span>
            <span className={`rounded px-2 py-1 text-[11px] font-bold ring-1 ${statusTone[order.status]}`}>{order.status}</span>
          </div>
          <h2 className="mt-2 break-words text-lg font-bold">{order.title}</h2>
          <p className="mt-1 break-all text-xs text-[#667085]">{order.sourceId}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
            <LockKeyhole size={13} aria-hidden="true" /> Private and confidential · {order.documents?.length || 0} file{order.documents?.length === 1 ? "" : "s"}
          </p>
        </div>
        <button ref={closeRef} type="button" onClick={onClose} className="grid size-11 shrink-0 place-items-center rounded-md border border-[#d0d5dd] bg-white hover:bg-[#f2f4f7]" aria-label="Close detail workspace">
          <X size={19} />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
        <Section title="Product information" icon={<FileText size={17} />}>
          <p className="mb-3 whitespace-pre-wrap text-sm leading-6 text-[#475467]">{order.description || "No description provided."}</p>
          <DetailList items={[
            { label: "Customer", value: order.customerName },
            { label: "Country / market", value: order.country },
            { label: "Category", value: order.category },
            { label: "Quantity", value: order.quantity },
            { label: "Budget", value: order.budget },
            { label: "Target price", value: order.targetPrice },
            { label: "Submitted", value: formatDate(order.submittedAt) },
            ...(order.detailItems || [])
          ]} />
        </Section>

        <Section title="Documents and private files" icon={<LockKeyhole size={17} />} tone="internal">
          <p className="mb-3 text-xs leading-5 text-amber-900">Access remains enforced by the existing owner/Admin private-file routes. This workspace never exposes Storage paths or signed URLs.</p>
          {order.documents?.length ? (
            <div className="grid gap-2">
              {order.documents.map((document) => (
                <a key={`${document.name}-${document.href}`} href={document.href} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-amber-200 bg-white px-3 text-sm font-semibold hover:border-amber-400">
                  <span className="min-w-0 truncate">{document.name}</span>
                  <span className="shrink-0 text-[10px] uppercase text-[#667085]">{document.access}</span>
                </a>
              ))}
            </div>
          ) : <p className="text-sm text-[#667085]">No private documents attached.</p>}
        </Section>

        <Section title="Qualification" icon={<ClipboardCheck size={17} />}>
          <p className="text-sm text-[#667085]">Qualification is not tracked as a structured field in the current system.</p>
        </Section>

        <Section title="Structured TYORA assessment" icon={<ShieldCheck size={17} />} tone="customer">
          {assessmentItems.length ? <DetailList items={assessmentItems} /> : <p className="text-sm text-[#667085]">No structured assessment recorded.</p>}
          {order.assessment?.disclaimer ? <p className="mt-3 rounded-md border border-blue-200 bg-white p-3 text-xs leading-5 text-[#344054]">{order.assessment.disclaimer}</p> : null}
        </Section>

        <Section title="Service model and fee status" icon={<CheckCircle2 size={17} />}>
          <DetailList items={[
            { label: "Service model", value: order.serviceMode || "Not recorded" },
            { label: "Fee / payment status", value: order.feeStatus || "Not tracked in the current system" },
            { label: "Owner", value: order.owner || "Unassigned" }
          ]} />
        </Section>

        <Section title="Internal notes" icon={<LockKeyhole size={17} />} tone="internal">
          <p className="mb-2 text-xs font-semibold text-amber-900">Internal only. Never shown on public pages or customer APIs.</p>
          {canEditInternalNotes(order) ? (
            <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={4} maxLength={3000} placeholder="Add internal progress or handoff notes" className="w-full resize-y rounded-md border border-[#d0d5dd] bg-white p-3 text-sm outline-none focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" />
          ) : order.internalContext ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-[#475467]">{order.internalContext}</p>
          ) : (
            <p className="text-sm text-[#667085]">This record type has no editable internal-notes field.</p>
          )}
        </Section>

        <Section title="Customer-visible update" icon={<MessageCircle size={17} />} tone="customer">
          <p className="mb-2 text-xs font-semibold text-blue-900">Visible to the customer through the existing Idea assessment or Custom inquiry flow.</p>
          {canEditCustomerUpdate(order) ? (
            <textarea value={customerVisibleUpdate} onChange={(event) => setCustomerVisibleUpdate(event.target.value)} rows={4} maxLength={3000} placeholder="Write the next step or customer-facing assessment note" className="w-full resize-y rounded-md border border-[#d0d5dd] bg-white p-3 text-sm outline-none focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" />
          ) : (
            <p className="text-sm text-[#667085]">No customer-visible update field exists for this record type.</p>
          )}
        </Section>

        <Section title="Status and follow-up" icon={<CalendarClock size={17} />} tone="internal">
          <div className="grid gap-3">
            <label className="grid gap-1 text-xs font-bold text-[#475467]">Status
              <select value={status} onChange={(event) => setStatus(event.target.value as WorkOrderStatus)} className="h-11 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal">
                {statusOptions(order).map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void saveRecord()} disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-bold text-white hover:bg-[#004eeb] disabled:opacity-50">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save changes
            </button>

            <div className="mt-1 border-t border-amber-200 pt-3">
              <p className="text-sm font-bold">Record customer contact</p>
              <p className="mt-1 text-xs text-[#667085]">Internal history only. Recording this does not send a message.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-bold text-[#475467]">Channel
                <select value={contactChannel} onChange={(event) => setContactChannel(event.target.value)} className="h-11 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal">
                  {['Email', 'WhatsApp', 'Phone', 'Other'].map((channel) => <option key={channel}>{channel}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-bold text-[#475467]">Contacted at
                <input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} className="h-11 min-w-0 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal" />
              </label>
              <label className="grid gap-1 text-xs font-bold text-[#475467] sm:col-span-2">Next follow-up
                <input type="datetime-local" value={nextFollowUpAt} min={contactedAt} onChange={(event) => setNextFollowUpAt(event.target.value)} className="h-11 min-w-0 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal" />
              </label>
            </div>
            <label className="grid gap-1 text-xs font-bold text-[#475467]">Contact note
              <textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} rows={2} maxLength={1000} className="resize-y rounded-md border border-[#d0d5dd] bg-white p-3 text-sm font-normal" placeholder="What was discussed?" />
            </label>
            <button type="button" onClick={() => void recordContact()} disabled={saving || !contactedAt} className="min-h-11 rounded-md border border-[#101828] bg-white px-4 text-sm font-bold disabled:opacity-50">Add contact record</button>
          </div>
        </Section>

        <Section title="Activity timeline" icon={<History size={17} />}>
          {order.timeline?.length ? (
            <ol className="grid gap-3">
              {order.timeline.map((item) => (
                <li key={item.id} className="grid grid-cols-[10px_minmax(0,1fr)] gap-3">
                  <span className="mt-1.5 size-2 rounded-full bg-[#155eef]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="mt-0.5 text-xs text-[#667085]">{formatDate(item.createdAt)} · {item.visibility}{item.actor ? ` · ${item.actor}` : ""}</p>
                    {item.detail ? <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#475467]">{item.detail}</p> : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : <p className="text-sm text-[#667085]">No activity recorded.</p>}
        </Section>

        {feedback ? <p role="status" className={`rounded-md p-3 text-sm font-semibold ${["Changes saved", "Contact recorded"].includes(feedback) ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800"}`}>{feedback}</p> : null}
      </div>

      <div className="grid gap-2 border-t border-[#e4e7ec] bg-white p-3 sm:grid-cols-2">
        {order.contactEmail ? <a href={`mailto:${order.contactEmail}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] text-sm font-bold"><Mail size={16} /> Email</a> : null}
        {whatsApp ? <a href={whatsApp} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] text-sm font-bold"><MessageCircle size={16} /> WhatsApp</a> : null}
        {order.publicHref ? <a href={order.publicHref} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] text-sm font-bold">Public page <ArrowUpRight size={16} /></a> : null}
        <Link href={order.adminHref} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#101828] px-3 text-center text-sm font-bold text-white">Advanced workspace <ArrowUpRight size={16} /></Link>
      </div>
    </div>
  );
}

function InboxContent({
  initialSubmissionId,
  initialRecordKind
}: {
  initialSubmissionId?: string;
  initialRecordKind?: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [selectionMissing, setSelectionMissing] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | WorkOrderStatus>("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/work-orders", { cache: "no-store" });
      const payload = await response.json() as ApiResponse<WorkOrder[]>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to load the unified Inbox.");
      setOrders(payload.data);
      setSelectedId((current) => current && payload.data?.some((order) => order.id === current) ? current : undefined);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load the unified Inbox.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadOrders(); }, []);
  useEffect(() => {
    if (loading || !initialSubmissionId) {
      if (!initialSubmissionId) setSelectionMissing(false);
      return;
    }
    const target = findWorkOrderByDetailTarget(orders, {
      submissionId: initialSubmissionId,
      recordKind: initialRecordKind
    });
    setSelectedId(target?.id);
    setSelectionMissing(!target);
  }, [initialRecordKind, initialSubmissionId, loading, orders]);

  const closeWorkspace = useCallback(() => {
    setSelectedId(undefined);
    setSelectionMissing(false);
    router.replace("/admin/work-orders", { scroll: false });
  }, [router]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") closeWorkspace();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [closeWorkspace]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(orders.map((order) => order.category).filter((value): value is string => Boolean(value)))).sort()], [orders]);
  const selected = orders.find((order) => order.id === selectedId);
  const counts = useMemo(() => Object.fromEntries(queueFilters.map((item) => [
    item,
    orders.filter((order) => {
      if (item === "All") return true;
      if (item === "Needs Reply") return order.needsReply;
      return order.type === item;
    }).length,
  ])), [orders]);
  const visibleOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesQueue = filter === "All" || (filter === "Needs Reply" ? order.needsReply : order.type === filter);
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      const matchesCategory = categoryFilter === "All" || order.category === categoryFilter;
      const haystack = [order.id, order.sourceId, order.type, order.status, order.title, order.description, order.customerName, order.contactEmail, order.country, order.category, order.quantity, order.budget, ...order.tags].join(" ").toLowerCase();
      return matchesQueue && matchesStatus && matchesCategory && (!normalized || haystack.includes(normalized));
    });
  }, [categoryFilter, filter, orders, query, statusFilter]);

  function saveWorkOrder(updated: WorkOrder) {
    setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
  }

  function openOrder(order: WorkOrder) {
    setSelectionMissing(false);
    setSelectedId(order.id);
    router.push(workOrderDetailHref(order), { scroll: false });
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="rounded-md border border-[#e4e7ec] bg-white p-3 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1fr)_auto_auto_auto]">
          <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-md border border-[#d0d5dd] px-3 focus-within:border-[#155eef] focus-within:ring-4 focus-within:ring-[#155eef]/10">
            <Search size={17} className="shrink-0 text-[#667085]" />
            <span className="sr-only">Search Inbox</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, customer, country, or ID" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
          <label className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-2 text-xs font-bold text-[#475467]">Status
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | WorkOrderStatus)} className="h-11 min-w-0 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal">
              <option>All</option>{Object.keys(statusTone).map((status) => <option key={status}>{status}</option>)}
            </select>
          </label>
          <label className="grid min-w-0 grid-cols-[auto_1fr] items-center gap-2 text-xs font-bold text-[#475467]">Category
            <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="h-11 min-w-0 max-w-52 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-normal">
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => void loadOrders()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-bold hover:bg-[#f9fafb]"><RefreshCcw size={16} /> Refresh</button>
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Inbox type filters">
          {queueFilters.map((item) => (
            <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-bold ${filter === item ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467] hover:bg-[#eaecf0]"}`}>
              {item} <span className="ml-1 opacity-70">{counts[item] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      {message ? <p className="rounded-md border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">{message}</p> : null}
      {selectionMissing && !loading ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <div><strong>Submission not found.</strong> It may have been removed or is no longer accessible to this Admin session.</div>
          <Link href="/admin/work-orders" onClick={() => setSelectionMissing(false)} className="rounded-md bg-white px-3 py-2 font-bold ring-1 ring-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155eef]">Return to Inbox</Link>
        </div>
      ) : null}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="min-w-0 overflow-hidden rounded-md border border-[#e4e7ec] bg-white shadow-sm" aria-label="Unified Inbox">
          <div className="flex min-h-12 items-center justify-between border-b border-[#e4e7ec] px-4">
            <div>
              <h2 className="text-sm font-bold">Unified Inbox</h2>
              <p className="text-xs text-[#667085]">{visibleOrders.length} real Preview record{visibleOrders.length === 1 ? "" : "s"}</p>
            </div>
          </div>
          {loading ? (
            <div className="grid min-h-72 place-items-center"><Loader2 className="animate-spin text-[#155eef]" aria-label="Loading Inbox" /></div>
          ) : visibleOrders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-bold">No matching submissions.</p>
              <p className="mt-1 text-sm text-[#667085]">This is an honest empty state. No sample records are shown.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#eaecf0]">
              {visibleOrders.map((order) => (
                <div
                  key={order.id}
                  role="link"
                  tabIndex={0}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a,button,input,select,textarea")) return;
                    openOrder(order);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget || (event.key !== "Enter" && event.key !== " ")) return;
                    event.preventDefault();
                    openOrder(order);
                  }}
                  className={`grid min-h-[112px] w-full cursor-pointer grid-cols-[52px_minmax(0,1fr)] gap-3 p-3 text-left hover:bg-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#155eef] sm:grid-cols-[60px_minmax(0,1fr)_150px] sm:p-4 ${selectedId === order.id ? "bg-[#eef4ff]" : ""}`}
                  aria-label={`Open ${order.title} submission`}
                >
                  <span className="grid size-[52px] place-items-center overflow-hidden rounded-md bg-[#f2f4f7] sm:size-[60px]">
                    {order.imageUrls[0] ? <img src={order.imageUrls[0]} alt="" className="size-full object-contain p-1" /> : <span className="text-xs font-bold text-[#667085]">{order.type.slice(0, 2).toUpperCase()}</span>}
                  </span>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ${typeTone[order.type]}`}>{order.type}</span>
                      <span className={`rounded px-2 py-1 text-[10px] font-bold ring-1 ${statusTone[order.status]}`}>{order.status}</span>
                    </span>
                    <Link
                      href={workOrderDetailHref(order)}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectionMissing(false);
                        setSelectedId(order.id);
                      }}
                      className="mt-1.5 block truncate text-sm font-bold text-[#101828] underline-offset-2 hover:underline focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#155eef] sm:text-base"
                    >
                      {order.title}
                    </Link>
                    <span className="mt-1 block truncate text-xs text-[#667085]">{order.customerName} · {order.country}</span>
                    <span className="mt-1 block truncate text-xs text-[#98a2b3]">{order.category || "Uncategorized"} · {formatDate(order.submittedAt)}</span>
                  </span>
                  <span className="hidden min-w-0 self-center text-xs text-[#667085] sm:block">
                    {order.nextFollowUpAt ? <><span className="block font-bold text-[#155eef]">Follow-up</span><span className="mt-1 block">{formatDate(order.nextFollowUpAt)}</span></> : <><span className="block font-bold text-[#475467]">Updated</span><span className="mt-1 block">{formatDate(order.updatedAt)}</span></>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="hidden min-h-0 xl:block">
          {selected ? (
            <div className="sticky top-[92px] h-[calc(100vh-116px)] min-h-[620px]">
              <WorkOrderWorkspace order={selected} onClose={closeWorkspace} onSaved={saveWorkOrder} />
            </div>
          ) : (
            <div className="sticky top-[92px] grid min-h-[420px] place-items-center rounded-md border border-dashed border-[#d0d5dd] bg-white p-8 text-center">
              <div><UserRound className="mx-auto text-[#98a2b3]" /><p className="mt-3 font-bold">Select an Inbox item</p><p className="mt-1 text-sm text-[#667085]">Product, private context, assessment, and follow-up details will open here.</p></div>
            </div>
          )}
        </aside>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={`${selected.title} detail workspace`}>
          <button type="button" className="absolute inset-0 bg-[#101828]/55" onClick={closeWorkspace} aria-label="Close detail overlay" />
          <aside className="absolute inset-y-0 right-0 w-[min(620px,100vw)] overflow-hidden shadow-2xl">
            <WorkOrderWorkspace order={selected} onClose={closeWorkspace} onSaved={saveWorkOrder} />
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default function WorkOrdersAdminClient({
  embedded = false,
  initialSubmissionId,
  initialRecordKind
}: {
  embedded?: boolean;
  initialSubmissionId?: string;
  initialRecordKind?: string;
}) {
  const [needsReplyCount, setNeedsReplyCount] = useState(0);

  useEffect(() => {
    void fetch("/api/admin/work-orders", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: ApiResponse<WorkOrder[]>) => setNeedsReplyCount(payload.data?.filter((order) => order.needsReply).length || 0))
      .catch(() => setNeedsReplyCount(0));
  }, []);

  if (embedded) return <InboxContent initialSubmissionId={initialSubmissionId} initialRecordKind={initialRecordKind} />;

  function navigateAdmin(section: AdminSectionId) {
    if (section === "inbox") return;
    window.location.assign(`/admin?section=${encodeURIComponent(section)}`);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/admin");
  }

  return (
    <AdminShell
      activeSection="inbox"
      pageTitle="Unified Inbox"
      pageDescription="One workspace for Ideas, private Custom inquiries, Source requests, and Projects."
      notificationCount={needsReplyCount}
      searchItems={[]}
      canSave={false}
      languageLabel="EN"
      onNavigate={navigateAdmin}
      onNewProject={() => window.location.assign("/admin?section=submissions")}
      onSave={() => undefined}
      onToggleLanguage={() => undefined}
      onLogout={() => void logout()}
    >
      <InboxContent initialSubmissionId={initialSubmissionId} initialRecordKind={initialRecordKind} />
    </AdminShell>
  );
}
