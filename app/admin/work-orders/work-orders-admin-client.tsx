"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Mail, MessageCircle, RefreshCcw, Save, Search } from "lucide-react";
import { WorkOrder, WorkOrderStatus, WorkOrderType } from "@/lib/work-orders";
import { AdminViewCommunityLink } from "@/components/admin-view-community-link";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type Filter = "All" | "Needs Reply" | WorkOrderType | "In Progress";

const filters: Filter[] = ["Needs Reply", "All", "Source", "Custom", "Idea", "Project", "In Progress"];

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
  Idea: "bg-[#fff7ed] text-[#c2410c]",
  Custom: "bg-[#f4f6f8] text-[#394150]",
  Source: "bg-[#eff6ff] text-[#1d4ed8]",
  Project: "bg-[#ecfdf5] text-[#047857]"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function whatsappHref(value?: string) {
  if (!value) return "";
  const normalized = value.replace(/[^\d+]/g, "");
  return normalized ? `https://wa.me/${normalized.replace(/^\+/, "")}` : "";
}

function imageGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
}

function workOrderActionLabel(type: WorkOrderType) {
  if (type === "Source") return "Reply / Quote";
  if (type === "Idea") return "Reply to idea";
  if (type === "Custom") return "Review custom request";
  return "Follow up project";
}

function localDateTimeInput(value = new Date()) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function statusOptions(order: WorkOrder): WorkOrderStatus[] {
  const options: WorkOrderStatus[] = order.type === "Idea" || order.type === "Custom"
    ? ["Reviewing", "Managed", "Production", "Shipping", "Completed"]
    : order.type === "Source"
      ? ["New", "Reviewing", "Quoted", "Sample", "Factory Introduced", "Managed", "Completed"]
      : ["New", "Reviewing", "Quoted", "Sample", "Production", "Shipping", "Completed", "Closed"];
  return options.includes(order.status) ? options : [order.status, ...options];
}

function WorkOrderEditor({ order, onSaved }: { order: WorkOrder; onSaved: (order: WorkOrder) => void }) {
  const [status, setStatus] = useState<WorkOrderStatus>(order.status);
  const [internalNotes, setInternalNotes] = useState(order.internalNotes || "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [contactChannel, setContactChannel] = useState("Email");
  const [contactedAt, setContactedAt] = useState(() => localDateTimeInput());
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [contactNote, setContactNote] = useState("");
  const isCommunity = order.type === "Idea" || order.type === "Custom";

  useEffect(() => {
    setStatus(order.status);
    setInternalNotes(order.internalNotes || "");
    setFeedback("");
  }, [order.status, order.internalNotes]);

  async function submit() {
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: order.id, status, internalNotes })
      });
      const payload = await response.json() as ApiResponse<WorkOrder>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to save changes.");
      onSaved(payload.data);
      setStatus(payload.data.status);
      setInternalNotes(payload.data.internalNotes || "");
      setFeedback("Saved");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function recordContact() {
    setSaving(true);
    setFeedback("");
    try {
      const response = await fetch("/api/admin/work-orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          contactEvent: {
            channel: contactChannel,
            contactedAt: new Date(contactedAt).toISOString(),
            nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : "",
            note: contactNote
          }
        })
      });
      const payload = await response.json() as ApiResponse<WorkOrder>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to record contact.");
      onSaved(payload.data);
      setContactedAt(localDateTimeInput());
      setNextFollowUpAt("");
      setContactNote("");
      setFeedback("Contact recorded");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to record contact.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <details className="group rounded-2xl border border-[#dfe5ee] bg-[#f8fafc]">
      <summary className="flex h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold">
        Handle work order <span className="text-[#687284] transition group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-3 border-t border-[#dfe5ee] p-3">
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">
        Status
        <select value={status} onChange={(event) => setStatus(event.target.value as WorkOrderStatus)} className="h-10 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#101216] outline-none focus:border-[#2563eb]">
          {statusOptions(order).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">
        {isCommunity ? "TYORA reply" : "Internal notes"}
        <textarea value={internalNotes} onChange={(event) => setInternalNotes(event.target.value)} rows={4} placeholder={isCommunity ? "Write the helpful reply shown to the customer." : "Add progress, quote, or follow-up notes."} className="resize-y rounded-xl border border-[#dfe5ee] bg-white p-3 text-sm font-normal leading-5 text-[#101216] outline-none focus:border-[#2563eb]" />
      </label>
      <button type="button" onClick={() => void submit()} disabled={saving || (isCommunity && !order.hasReview && !internalNotes.trim())} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#101216] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
      </button>
      {isCommunity && !order.hasReview && !internalNotes.trim() ? <p className="text-xs text-[#687284]">Write a TYORA reply before marking this request handled.</p> : null}
      <div className="mt-1 border-t border-[#dfe5ee] pt-3">
        <p className="text-sm font-semibold">Record customer contact</p>
        <p className="mt-1 text-xs leading-5 text-[#687284]">Internal history only. This does not send a message to the customer.</p>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">Contact channel
        <select value={contactChannel} onChange={(event) => setContactChannel(event.target.value)} className="h-10 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#101216]">
          {["Email", "WhatsApp", "Phone", "Other"].map((channel) => <option key={channel}>{channel}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">Contacted at
        <input type="datetime-local" value={contactedAt} onChange={(event) => setContactedAt(event.target.value)} className="h-10 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#101216]" />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">Next follow-up
        <input type="datetime-local" value={nextFollowUpAt} min={contactedAt} onChange={(event) => setNextFollowUpAt(event.target.value)} className="h-10 rounded-xl border border-[#dfe5ee] bg-white px-3 text-sm text-[#101216]" />
      </label>
      <label className="grid gap-1 text-xs font-semibold text-[#59616e]">Contact note
        <textarea value={contactNote} onChange={(event) => setContactNote(event.target.value)} rows={2} maxLength={1000} placeholder="What was discussed?" className="resize-y rounded-xl border border-[#dfe5ee] bg-white p-3 text-sm font-normal text-[#101216]" />
      </label>
      <button type="button" onClick={() => void recordContact()} disabled={saving || !contactedAt} className="inline-flex h-10 items-center justify-center rounded-xl border border-[#101216] bg-white px-4 text-sm font-semibold disabled:opacity-45">Add contact record</button>
      {order.contactHistory.length > 0 ? (
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl bg-white p-3 text-xs text-[#59616e]">
          {order.contactHistory.map((event) => (
            <div key={event.id} className="border-b border-[#eef1f4] pb-2 last:border-0 last:pb-0">
              <p><span className="font-semibold text-[#101216]">{event.channel}</span> · {formatDate(event.contactedAt)}{event.note ? ` · ${event.note}` : ""}</p>
              {event.nextFollowUpAt ? <p className="mt-1 text-[#315fbd]">Follow-up: {formatDate(event.nextFollowUpAt)}</p> : null}
            </div>
          ))}
        </div>
      ) : null}
      {feedback ? <p className={`text-xs font-semibold ${["Saved", "Contact recorded"].includes(feedback) ? "text-[#047857]" : "text-[#be123c]"}`}>{feedback}</p> : null}
      </div>
    </details>
  );
}

export default function WorkOrdersAdminClient() {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [filter, setFilter] = useState<Filter>("Needs Reply");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadOrders() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/work-orders", { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<WorkOrder[]>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to load work orders.");
      setOrders(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load work orders.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  function saveWorkOrder(updated: WorkOrder) {
    setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
  }

  const counts = useMemo(() => {
    return {
      All: orders.length,
      "Needs Reply": orders.filter((order) => order.needsReply).length,
      Source: orders.filter((order) => order.type === "Source").length,
      Custom: orders.filter((order) => order.type === "Custom").length,
      Idea: orders.filter((order) => order.type === "Idea").length,
      Project: orders.filter((order) => order.type === "Project").length,
      "In Progress": orders.filter((order) => !["Completed", "Closed"].includes(order.status)).length
    };
  }, [orders]);

  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesFilter =
        filter === "All" ||
        (filter === "Needs Reply" && order.needsReply) ||
        (filter === "In Progress" && !["Completed", "Closed"].includes(order.status)) ||
        order.type === filter;
      const searchable = [
        order.id,
        order.sourceId,
        order.type,
        order.status,
        order.title,
        order.description,
        order.customerName,
        order.contactEmail,
        order.contactWhatsapp,
        order.country,
        order.category,
        order.quantity,
        order.budget,
        order.targetPrice,
        order.internalNotes,
        ...order.tags
      ].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, orders, query]);

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#101216]">
      <header className="sticky top-0 z-30 border-b border-[#e3e7ee] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/admin" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687284]">TYORA OS</Link>
            <h1 className="mt-1 text-2xl font-semibold">Work Orders</h1>
            <p className="mt-1 text-sm text-[#687284]">Ideas, private custom projects, source requests, and active projects in one queue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminViewCommunityLink />
            <Link href="/admin/community" className="rounded-full border border-[#dfe5ee] bg-white px-4 py-2 text-sm font-semibold">Advanced ideas</Link>
            <Link href="/admin/source" className="rounded-full border border-[#dfe5ee] bg-white px-4 py-2 text-sm font-semibold">Advanced source</Link>
            <button onClick={() => void loadOrders()} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
              <RefreshCcw size={15} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-3xl border border-[#e1e6ee] bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${filter === item ? "bg-[#2563eb] text-white" : "bg-[#f4f6f9] text-[#59616e] hover:bg-[#edf2f8]"}`}
              >
                {item}
                <span className="ml-2 opacity-70">{counts[item] || 0}</span>
              </button>
            ))}
          </div>
          <label className="flex h-11 min-w-72 items-center gap-2 rounded-full border border-[#dfe5ee] bg-white px-3 text-sm">
            <Search size={16} className="text-[#8791a0]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, customer, country, ID" className="w-full bg-transparent outline-none" />
          </label>
        </div>

        {message ? <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-[#be123c] shadow-sm">{message}</p> : null}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-[#e1e6ee] bg-white">
            <Loader2 className="animate-spin text-[#2563eb]" />
          </div>
        ) : visibleOrders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cfd8e6] bg-white p-10 text-center">
            <p className="text-lg font-semibold">No work orders found.</p>
            <p className="mt-1 text-sm text-[#687284]">Try another filter or search term.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleOrders.map((order) => {
              const whatsApp = whatsappHref(order.contactWhatsapp);
              return (
                <details key={order.id} className="group overflow-hidden rounded-3xl border border-[#e1e6ee] bg-white shadow-sm">
                  <summary className="grid cursor-pointer list-none grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 p-3 sm:grid-cols-[72px_minmax(0,1fr)_220px_auto] sm:p-4">
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-[#f4f6f9]">
                      {order.imageUrls[0] ? <img src={order.imageUrls[0]} alt="" className="size-full object-contain p-1" /> : <span className="font-semibold text-[#8a94a3]">{order.type.slice(0, 2).toUpperCase()}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold"><span className={`rounded-full px-2 py-1 ${typeTone[order.type]}`}>{order.type}</span><span className={`rounded-full px-2 py-1 ring-1 ${statusTone[order.status]}`}>{order.status}</span></div>
                      <h2 className="mt-1 truncate text-base font-semibold sm:text-lg">{order.title}</h2>
                      <p className="truncate text-xs text-[#687284]">{order.customerName} · {formatDate(order.submittedAt)}</p>
                    </div>
                    <div className="hidden text-xs text-[#59616e] sm:block">
                      {order.lastContactAt ? <p><span className="font-semibold">Latest contact:</span> {order.lastContactChannel} · {formatDate(order.lastContactAt)}</p> : <p className="text-[#8a94a3]">No contact recorded</p>}
                      {order.nextFollowUpAt ? <p className="mt-1 text-[#315fbd]"><span className="font-semibold">Next follow-up:</span> {formatDate(order.nextFollowUpAt)}</p> : null}
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#315fbd]">Expand work order <span className="text-lg transition group-open:rotate-45">+</span></span>
                  </summary>
                  <div className="grid gap-4 border-t border-[#e1e6ee] p-4 lg:grid-cols-[190px_1fr_240px]">
                  <div className="overflow-hidden rounded-2xl bg-[#f4f6f9]">
                    {order.imageUrls.length ? (
                      <div className={`grid aspect-square ${imageGridClass(order.imageUrls.length)} gap-1 p-1`}>
                        {order.imageUrls.slice(0, 9).map((imageUrl, index) => (
                          <a key={`${order.id}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-xl bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={`${order.title} ${index + 1}`} className="absolute inset-0 size-full object-contain p-1" />
                            {index === 8 && order.imageUrls.length > 9 ? (
                              <span className="absolute inset-0 flex items-center justify-center bg-[#101216]/70 text-sm font-semibold text-white">
                                +{order.imageUrls.length - 9} more images
                              </span>
                            ) : null}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex aspect-square items-center justify-center text-3xl font-semibold text-[#8a94a3]">{order.type.slice(0, 2).toUpperCase()}</div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className={`rounded-full px-2.5 py-1 ${typeTone[order.type]}`}>{order.type}</span>
                      <span className={`rounded-full px-2.5 py-1 ring-1 ${statusTone[order.status]}`}>{order.status}</span>
                      <span className="text-[#687284]">{order.sourceId}</span>
                      <span className="text-[#687284]">{formatDate(order.submittedAt)}</span>
                    </div>
                    <h2 className="mt-2 text-xl font-semibold">{order.title}</h2>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#59616e]">{order.description || "No description provided."}</p>
                    <div className="mt-3 grid gap-2 text-sm text-[#394150] sm:grid-cols-2">
                      <p><span className="font-semibold">Customer:</span> {order.customerName}</p>
                      <p><span className="font-semibold">Country:</span> {order.country || "-"}</p>
                      <p><span className="font-semibold">Quantity:</span> {order.quantity || "-"}</p>
                      <p><span className="font-semibold">Budget / target:</span> {order.budget || order.targetPrice || "-"}</p>
                    </div>
                    {order.internalNotes ? (
                      <p className="mt-3 rounded-2xl bg-[#f8fafc] p-3 text-sm leading-6 text-[#59616e]">internalNotes: {order.internalNotes}</p>
                    ) : null}
                    {order.lastContactAt ? (
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-2xl bg-[#eff6ff] p-3 text-xs text-[#315fbd]">
                        <p><span className="font-semibold">Latest contact:</span> {order.lastContactChannel} · {formatDate(order.lastContactAt)}</p>
                        {order.nextFollowUpAt ? <p><span className="font-semibold">Next follow-up:</span> {formatDate(order.nextFollowUpAt)}</p> : null}
                      </div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {order.tags.slice(0, 6).map((tag) => (
                        <span key={`${order.id}-${tag}`} className="rounded-full border border-[#dfe5ee] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#59616e]">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:items-stretch">
                    {order.contactEmail ? (
                      <a href={`mailto:${order.contactEmail}`} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe5ee] px-4 text-sm font-semibold">
                        <Mail size={15} /> Email
                      </a>
                    ) : null}
                    {whatsApp ? (
                      <a href={whatsApp} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe5ee] px-4 text-sm font-semibold">
                        <MessageCircle size={15} /> WhatsApp
                      </a>
                    ) : null}
                    {order.publicHref ? (
                      <a href={order.publicHref} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe5ee] px-4 text-sm font-semibold">
                        Public link <ArrowUpRight size={15} />
                      </a>
                    ) : null}
                    <WorkOrderEditor order={order} onSaved={saveWorkOrder} />
                    <Link href={order.adminHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe5ee] bg-white px-4 text-sm font-semibold">
                      Advanced: {workOrderActionLabel(order.type)} <ArrowUpRight size={15} />
                    </Link>
                  </div>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
