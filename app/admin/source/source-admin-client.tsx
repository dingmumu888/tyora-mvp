"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Eye, Loader2, RefreshCcw, Save, Search, ShieldCheck, Trash2 } from "lucide-react";
import { SourceRequest, SourceStatus, sourceStatuses } from "@/lib/source";
import AdminShell, { AdminSectionId } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminEmptyState, AdminMetricCard, adminSelectClass } from "@/components/admin/admin-ui";

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

function sourceImageGridClass(count: number) {
  if (count <= 1) return "grid-cols-1";
  if (count <= 4) return "grid-cols-2";
  return "grid-cols-3";
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
          internalNotes: formData.get("internalNotes"),
          publicShowcaseTitle: formData.get("publicShowcaseTitle"),
          publicShowcaseSummary: formData.get("publicShowcaseSummary"),
          publicShowcaseCountry: formData.get("publicShowcaseCountry"),
          publicShowcaseQuantity: formData.get("publicShowcaseQuantity"),
          publicShowcaseImageIndex: formData.get("publicShowcaseImageIndex"),
          publicSupplierCount: formData.get("publicSupplierCount"),
          publicQuoteCount: formData.get("publicQuoteCount"),
          publicShowcasePublished: formData.get("publicShowcasePublished") === "on"
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

  function navigateAdmin(section: AdminSectionId) {
    if (section === "sourceQueue") return;
    if (section === "inbox") {
      window.location.assign("/admin/work-orders");
      return;
    }
    window.location.assign(`/admin?section=${encodeURIComponent(section)}`);
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/admin");
  }

  return (
    <AdminShell
      activeSection="sourceQueue"
      pageTitle="Source Products Queue"
      pageDescription="Review supplier-check requests submitted through the public Source page."
      notificationCount={counts.New || 0}
      searchItems={requests.slice(0, 60).map((request) => ({
        id: `source-${request.id}`,
        label: request.productName,
        description: `${request.status} · ${request.destinationCountry}`,
        href: "/admin/source",
        keywords: [request.id, request.email, request.material, ...request.needTypes].join(" ")
      }))}
      canSave={false}
      languageLabel="EN"
      onNavigate={navigateAdmin}
      onNewProject={() => window.location.assign("/admin?section=submissions")}
      onSave={() => undefined}
      onToggleLanguage={() => undefined}
      onLogout={() => void logout()}
    >
      <div className="space-y-4">
        <AdminActionBar
          title="Supplier-check operations"
          description="Inspect product references, update sourcing status, and keep internal notes in the existing Source workflow."
          actions={(
            <>
            <Link href="/source" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] hover:bg-[#f9fafb]">
              View public page <ArrowUpRight size={15} />
            </Link>
            <button onClick={() => void loadRequests()} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-semibold text-white hover:bg-[#004eeb]">
              <RefreshCcw size={15} /> Refresh
            </button>
            </>
          )}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {summaryCards.map(([label, value]) => (
            <AdminMetricCard key={label} label={label} value={value} />
          ))}
        </div>

        <AdminActionBar className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(["All", ...sourceStatuses] as Filter[]).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`min-h-10 shrink-0 rounded-md px-3 py-2 text-sm font-semibold transition ${filter === status ? "bg-[#155eef] text-white" : "bg-[#f2f4f7] text-[#475467] hover:bg-[#eaecf0]"}`}
              >
                {status}
                {status !== "All" ? <span className="ml-2 opacity-70">{counts[status]}</span> : <span className="ml-2 opacity-70">{requests.length}</span>}
              </button>
            ))}
          </div>
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm focus-within:border-[#155eef] focus-within:ring-4 focus-within:ring-[#155eef]/10 sm:min-w-64">
            <Search size={16} className="text-[#8791a0]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search source requests" className="w-full bg-transparent outline-none" />
          </label>
        </AdminActionBar>

        {message ? <p className="rounded-2xl bg-white p-3 text-sm font-semibold text-[#2563eb] shadow-sm">{message}</p> : null}
        {loading ? (
          <div className="flex min-h-72 items-center justify-center rounded-md border border-[#e1e6ee] bg-white">
            <Loader2 className="animate-spin text-[#2563eb]" />
          </div>
        ) : visibleRequests.length === 0 ? (
          <AdminEmptyState title="No source requests found" description="New submissions from the public Source page will appear here." />
        ) : (
          <div className="grid gap-4">
            {visibleRequests.map((request) => (
              <article key={request.id} className="grid gap-4 rounded-md border border-[#e1e6ee] bg-white p-4 shadow-sm lg:grid-cols-[180px_1fr_340px]">
                <div className="overflow-hidden rounded-md bg-[#f4f6f9]">
                  {sourceImagesFor(request).length > 0 ? (
                    <div className={`grid aspect-square ${sourceImageGridClass(sourceImagesFor(request).length)} gap-1 p-1`}>
                      {sourceImagesFor(request).slice(0, 9).map((imageUrl, index) => (
                        <a key={`${request.id}-${index}`} href={imageUrl} target="_blank" rel="noreferrer" className="relative overflow-hidden rounded-xl bg-white">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imageUrl} alt={`${request.productName} reference ${index + 1}`} className="absolute inset-0 size-full object-contain p-1" />
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
                    <select name="status" defaultValue={request.status} className={adminSelectClass}>
                      {sourceStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-semibold">
                    Internal notes
                    <textarea name="internalNotes" defaultValue={request.internalNotes || ""} className="min-h-36 resize-none rounded-md border border-[#d0d5dd] bg-white p-3 text-sm leading-6 outline-none focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" placeholder="Supplier checked, quoted range, sample next step..." />
                  </label>
                  <div className="grid gap-3 rounded-md border border-[#dbe5f2] bg-[#f8fbff] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#155eef]"><Eye size={15} /> Public sourcing activity</p>
                        <p className="mt-1 text-xs leading-5 text-[#667085]">Only these reviewed fields can reach the public Source page.</p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${request.publicShowcaseConsent ? "bg-[#e8f7f4] text-[#06756f]" : "bg-[#f2f4f7] text-[#667085]"}`}>
                        <ShieldCheck size={12} /> {request.publicShowcaseConsent ? "Customer approved" : "No permission"}
                      </span>
                    </div>
                    <label className="grid gap-1.5 text-sm font-semibold">
                      Anonymous public title
                      <input name="publicShowcaseTitle" defaultValue={request.publicShowcaseTitle || ""} className={adminSelectClass} placeholder="Magnetic phone accessory" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-semibold">
                      Public summary
                      <textarea name="publicShowcaseSummary" defaultValue={request.publicShowcaseSummary || ""} className="min-h-24 resize-none rounded-md border border-[#d0d5dd] bg-white p-3 text-sm leading-6 outline-none focus:border-[#155eef] focus:ring-4 focus:ring-[#155eef]/10" placeholder="Comparing ready-made supplier options, MOQ, and packaging." />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Public buyer region
                        <input name="publicShowcaseCountry" defaultValue={request.publicShowcaseCountry || ""} className={adminSelectClass} placeholder="North America buyer" />
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Public quantity range
                        <input name="publicShowcaseQuantity" defaultValue={request.publicShowcaseQuantity || ""} className={adminSelectClass} placeholder="500–1,000 pcs" />
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Public reference image
                        <select name="publicShowcaseImageIndex" defaultValue={request.publicShowcaseImageIndex ?? ""} className={adminSelectClass}>
                          <option value="">No image</option>
                          {sourceImagesFor(request).map((_, index) => <option key={index} value={index}>Reference image {index + 1}</option>)}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Suppliers checked
                        <input name="publicSupplierCount" type="number" min="0" max="999" defaultValue={request.publicSupplierCount ?? ""} className={adminSelectClass} placeholder="4" />
                      </label>
                      <label className="grid gap-1.5 text-sm font-semibold">
                        Quotes compared
                        <input name="publicQuoteCount" type="number" min="0" max="999" defaultValue={request.publicQuoteCount ?? ""} className={adminSelectClass} placeholder="2" />
                      </label>
                    </div>
                    <label className={`flex items-start gap-2 rounded-md border p-3 text-sm ${request.publicShowcaseConsent ? "cursor-pointer border-[#b7e4d5] bg-white" : "cursor-not-allowed border-[#eaecf0] bg-[#f2f4f7] text-[#98a2b3]"}`}>
                      <input name="publicShowcasePublished" type="checkbox" defaultChecked={request.publicShowcasePublished} disabled={!request.publicShowcaseConsent} className="mt-0.5 size-4 accent-[#155eef]" />
                      <span>
                        <strong className="block">Publish anonymous activity</strong>
                        <span className="mt-1 block text-xs leading-5">Requires customer permission and a public title. Uncheck to remove it immediately.</span>
                      </span>
                    </label>
                    <p className="text-xs leading-5 text-[#667085]">Original links, contacts, exact target price, supplier details, and internal notes are excluded from the public response.</p>
                  </div>
                  <button disabled={savingId === request.id} className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#101828] px-4 text-sm font-semibold text-white hover:bg-[#1d2939] disabled:opacity-60">
                    {savingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save
                  </button>
                  <button type="button" disabled={deletingId === request.id} onClick={() => void deleteRequest(request.id)} className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-[#fecdca] bg-[#fffafa] px-4 text-sm font-semibold text-[#b42318] hover:bg-[#fef3f2] disabled:opacity-60">
                    {deletingId === request.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Delete test/spam
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
