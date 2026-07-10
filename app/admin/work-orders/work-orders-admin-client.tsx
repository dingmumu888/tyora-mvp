"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, Mail, MessageCircle, RefreshCcw, Search } from "lucide-react";
import { WorkOrder, WorkOrderStatus, WorkOrderType } from "@/lib/work-orders";

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
                <article key={order.id} className="grid gap-4 rounded-3xl border border-[#e1e6ee] bg-white p-4 shadow-sm lg:grid-cols-[150px_1fr_240px]">
                  <div className="overflow-hidden rounded-2xl bg-[#f4f6f9]">
                    {order.imageUrls.length ? (
                      <div className="grid aspect-square grid-cols-2 gap-1 p-1">
                        {order.imageUrls.slice(0, 4).map((imageUrl, index) => (
                          <a key={`${order.id}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-xl bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={`${order.title} ${index + 1}`} className="absolute inset-0 size-full object-cover" />
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
                    <Link href={order.adminHref} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
                      Open original <ArrowUpRight size={15} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
