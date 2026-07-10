"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Loader2, RefreshCcw, Save, Search, Trash2 } from "lucide-react";
import { SourceRequest, SourceStatus, sourceStatuses } from "@/lib/source";
import { AdminViewCommunityLink } from "@/components/admin-view-community-link";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

type Filter = SourceStatus | "All";

const statusTone: Record<SourceStatus, string> = {
  New: "bg-yellow-50 text-yellow-800 ring-yellow-200",
  "Checking Supplier": "bg-blue-50 text-blue-800 ring-blue-200",
  Quoted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "Sample Requested": "bg-orange-50 text-orange-800 ring-orange-200",
  "Factory Introduced": "bg-violet-50 text-violet-800 ring-violet-200",
  "Managed Sourcing": "bg-sky-50 text-sky-800 ring-sky-200",
  Completed: "bg-slate-100 text-slate-700 ring-slate-200"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function sourceImagesFor(request: SourceRequest) {
  return request.imageUrls && request.imageUrls.length > 0
    ? request.imageUrls
    : request.imageUrl
      ? [request.imageUrl]
      : [];
}

export default function SourceAdminClient() {
  const [requests, setRequests] = useState<SourceRequest[]>([]);
  const [filter, setFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [message, setMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/source", { cache: "no-store" });
      const payload = (await response.json()) as ApiResponse<SourceRequest[]>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to load source requests.");
      setRequests(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load source requests.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, []);

  const counts = useMemo(() => {
    return sourceStatuses.reduce<Record<SourceStatus, number>>((acc, status) => {
      acc[status] = requests.filter((request) => request.status === status).length;
      return acc;
    }, {} as Record<SourceStatus, number>);
  }, [requests]);

  const summaryCards = useMemo(() => {
    return [
      ["Total", requests.length],
      ["New", counts.New || 0],
      ["Checking", counts["Checking Supplier"] || 0],
      ["Quoted", counts.Quoted || 0],
      ["Samples", counts["Sample Requested"] || 0],
      ["Completed", counts.Completed || 0]
    ] as const;
  }, [counts, requests.length]);

  const visibleRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return requests.filter((request) => {
      const matchesFilter = filter === "All" || request.status === filter;
      const searchable = [
        request.id,
        request.productName,
        request.description,
        request.destinationCountry,
        request.email,
        request.whatsapp,
        request.material
      ].join(" ").toLowerCase();
      return matchesFilter && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [filter, query, requests]);

  async function saveRequest(event: FormEvent<HTMLFormElement>, requestId: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSavingId(requestId);
    setMessage("");
    try {
      const response = await fetch(`/api/source/${requestId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: formData.get("status"),
          internalNotes: formData.get("internalNotes")
        })
      });
      const payload = (await response.json()) as ApiResponse<SourceRequest>;
      if (!payload.success || !payload.data) throw new Error(payload.message || "Unable to save source request.");
      setRequests((current) => current.map((request) => (request.id === requestId ? payload.data! : request)));
      setMessage("Saved.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save source request.");
    } finally {
      setSavingId("");
    }
  }

  async function deleteRequest(requestId: string) {
    if (!window.confirm("Delete this source request? This is intended for test or spam records only.")) return;
    setDeletingId(requestId);
    setMessage("");
    try {
      const response = await fetch(`/api/source/${requestId}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ id: string }>;
      if (!payload.success) throw new Error(payload.message || "Unable to delete source request.");
      setRequests((current) => current.filter((request) => request.id !== requestId));
      setMessage("Deleted.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete source request.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] text-[#111318]">
      <header className="sticky top-0 z-30 border-b border-[#e3e7ee] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <Link href="/admin" className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687284]">TYORA OS</Link>
            <h1 className="mt-1 text-2xl font-semibold tracking-normal">Source Products Queue</h1>
            <p className="mt-1 text-sm text-[#687284]">Review supplier-check leads from /source.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminViewCommunityLink />
            <Link href="/source" className="inline-flex h-10 items-center gap-2 rounded-full border border-[#dfe5ee] bg-white px-4 text-sm font-semibold">
              View public page <ArrowUpRight size={15} />
            </Link>
            <button onClick={() => void loadRequests()} className="inline-flex h-10 items-center gap-2 rounded-full bg-[#111318] px-4 text-sm font-semibold text-white">
              <RefreshCcw size={15} /> Refresh
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {summaryCards.map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-[#e1e6ee] bg-white p-4 shadow-sm">
              <p className="text-2xl font-semibold">{value}</p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#687284]">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-3 rounded-3xl border border-[#e1e6ee] bg-white p-4 shadow-sm lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["All", ...sourceStatuses] as Filter[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${filter === status ? "bg-[#2563eb] text-white" : "bg-[#f4f6f9] text-[#59616e] hover:bg-[#edf2f8]"}`}
              >
                {status}
                {status !== "All" ? <span className="ml-2 opacity-70">{counts[status]}</span> : <span className="ml-2 opacity-70">{requests.length}</span>}
              </button>
            ))}
          </div>
          <label className="flex h-11 min-w-64 items-center gap-2 rounded-full border border-[#dfe5ee] bg-white px-3 text-sm">
            <Search size={16} className="text-[#8791a0]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search source requests" className="w-full bg-transparent outline-none" />
          </label>
        </div>

        {message ? <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-[#2563eb] shadow-sm">{message}</p> : null}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-3xl border border-[#e1e6ee] bg-white">
            <Loader2 className="animate-spin text-[#2563eb]" />
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#cfd8e6] bg-white p-10 text-center">
            <p className="text-lg font-semibold">No source requests found.</p>
            <p className="mt-1 text-sm text-[#687284]">New submissions from /source will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleRequests.map((request) => (
              <article key={request.id} className="grid gap-4 rounded-3xl border border-[#e1e6ee] bg-white p-4 shadow-sm lg:grid-cols-[180px_1fr_340px]">
                <div className="overflow-hidden rounded-2xl bg-[#f4f6f9]">
                  {sourceImagesFor(request).length > 0 ? (
                    <div className="grid aspect-square grid-cols-3 gap-1 p-1">
                      {sourceImagesFor(request).slice(0, 9).map((imageUrl, index) => (
                        <a key={`${request.id}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-xl bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={`${request.productName} reference ${index + 1}`} className="absolute inset-0 size-full object-cover" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-3xl font-semibold text-[#8a94a3]">{request.productName.slice(0, 2).toUpperCase()}</div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#687284]">
                    <span>{request.id}</span>
                    <span>{formatDate(request.createdAt)}</span>
                    <span className={`rounded-full px-2 py-1 ring-1 ${statusTone[request.status]}`}>{request.status}</span>
                  </div>
                  <h2 className="mt-2 text-xl font-semibold">{request.productName}</h2>
                  <p className="mt-1 text-xs font-semibold text-[#687284]">Reference images: {sourceImagesFor(request).length || 0}</p>
                  <p className="mt-2 text-sm leading-6 text-[#59616e]">{request.description || "No description provided."}</p>
                  <div className="mt-3 grid gap-2 text-sm text-[#394150] sm:grid-cols-2">
                    <p><span className="font-semibold">Quantity:</span> {request.quantity}</p>
                    <p><span className="font-semibold">Country:</span> {request.destinationCountry}</p>
                    <p><span className="font-semibold">Material:</span> {request.material || "Not specified"}</p>
                    <p><span className="font-semibold">Target:</span> {request.targetPrice || "Not specified"}</p>
                    <p><span className="font-semibold">Email:</span> {request.email || "-"}</p>
                    <p><span className="font-semibold">WhatsApp:</span> {request.whatsapp || "-"}</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.needTypes.map((type) => (
                      <span key={type} className="rounded-full border border-[#dfe5ee] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#59616e]">{type}</span>
                    ))}
                    {request.productLink ? (
                      <a href={request.productLink} target="_blank" rel="noreferrer" className="rounded-full bg-[#111318] px-2.5 py-1 text-xs font-semibold text-white">Open link</a>
                    ) : null}
                  </div>
                </div>

                <form onSubmit={(event) => void saveRequest(event, request.id)} className="grid gap-3">
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Status
                    <select name="status" defaultValue={request.status} className="h-11 rounded-2xl border border-[#dfe5ee] bg-white px-3 outline-none focus:border-[#2563eb]">
                      {sourceStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Internal notes
                    <textarea name="internalNotes" defaultValue={request.internalNotes || ""} className="min-h-36 resize-none rounded-2xl border border-[#dfe5ee] bg-white p-3 text-sm leading-6 outline-none focus:border-[#2563eb]" placeholder="Supplier checked, quoted range, sample next step..." />
                  </label>
                  <button disabled={savingId === request.id} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#111318] px-4 text-sm font-semibold text-white disabled:opacity-60">
                    {savingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                  </button>
                  <button type="button" disabled={deletingId === request.id} onClick={() => void deleteRequest(request.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#fee2e2] bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c] disabled:opacity-60">
                    {deletingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete test/spam
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
