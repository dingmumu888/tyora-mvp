"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ExternalLink, FileText, Loader2, Save } from "lucide-react";
import { CustomInquiry, customInquiryStatuses } from "@/lib/community";
import { AdminViewCommunityLink } from "@/components/admin-view-community-link";

export default function CustomInquiriesAdminClient() {
  const [items, setItems] = useState<CustomInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch("/api/admin/custom-inquiries", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => setItems(Array.isArray(payload.data) ? payload.data : []))
      .finally(() => setLoading(false));
  }, []);

  const visibleItems = useMemo(() => filter === "All" ? items : items.filter((item) => item.status === filter), [filter, items]);

  async function save(event: FormEvent<HTMLFormElement>, item: CustomInquiry) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(item.id);
    try {
      const response = await fetch(`/api/admin/custom-inquiries/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: form.get("status"), nextStep: form.get("nextStep") })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to update inquiry.");
      setItems((current) => current.map((entry) => entry.id === item.id ? payload.data : entry));
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to update inquiry.");
    } finally {
      setSaving("");
    }
  }

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-[#101216] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[24px] border border-[#e8ebef] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-sm text-[#69707d]">TYORA OS / Confidential</p><h1 className="mt-1 text-3xl font-semibold">Private Custom Queue</h1><p className="mt-2 text-sm text-[#69707d]">Customer details and files remain private. File access is authorized per request and never exposes Storage paths.</p></div>
            <div className="flex flex-wrap gap-2"><Link href="/admin/community" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Ideas Queue</Link><AdminViewCommunityLink /></div>
          </div>
        </header>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {["All", ...customInquiryStatuses].map((status) => <button key={status} onClick={() => setFilter(status)} className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${filter === status ? "bg-[#101216] text-white" : "border border-[#dfe3e8] bg-white"}`}>{status}</button>)}
        </div>

        {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div> : (
          <div className="mt-5 grid gap-4">
            {visibleItems.length === 0 ? <p className="rounded-[20px] border border-[#e8ebef] bg-white p-6 text-sm text-[#69707d]">No private Custom inquiries in this section.</p> : null}
            {visibleItems.map((item) => (
              <form key={item.id} onSubmit={(event) => void save(event, item)} className="rounded-[22px] border border-[#e8ebef] bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#69707d]"><span className="rounded-full bg-[#e9f2ff] px-2.5 py-1 font-semibold text-[#1d4ed8]">Private Custom</span><span>{item.id}</span><span>{new Date(item.createdAt).toLocaleString()}</span></div>
                    <h2 className="mt-3 text-2xl font-semibold">{item.productName}</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{item.productDescription}</p>
                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                      <div><dt className="font-semibold">Category</dt><dd className="text-[#59616e]">{item.category}</dd></div>
                      <div><dt className="font-semibold">Quantity</dt><dd className="text-[#59616e]">{item.quantity}</dd></div>
                      <div><dt className="font-semibold">Budget</dt><dd className="text-[#59616e]">{item.budget || "Not specified"}</dd></div>
                      <div><dt className="font-semibold">Target market</dt><dd className="text-[#59616e]">{item.targetMarket}</dd></div>
                      <div><dt className="font-semibold">Timeline</dt><dd className="text-[#59616e]">{item.timeline || "Not specified"}</dd></div>
                      <div><dt className="font-semibold">Contact</dt><dd className="break-all text-[#59616e]">{item.contactEmail || item.contactWhatsapp || "Session account"}</dd></div>
                    </dl>
                    {item.ideaSnapshot?.id ? <p className="mt-4 rounded-[14px] bg-[#f8fafc] p-3 text-sm text-[#59616e]">Linked Idea: {item.ideaSnapshot.title || item.ideaSnapshot.id}</p> : null}
                    {item.fileCount > 0 ? <div className="mt-4 flex flex-wrap gap-2">{Array.from({ length: item.fileCount }, (_, index) => <a key={index} href={`/api/community/custom/${encodeURIComponent(item.id)}/files/${index}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#dfe3e8] px-4 text-sm font-semibold"><FileText size={15} /> Private file {index + 1}<ExternalLink size={13} /></a>)}</div> : null}
                  </div>
                  <div className="rounded-[18px] border border-[#e8ebef] bg-[#fbfcff] p-4">
                    <label className="grid gap-2 text-sm font-semibold">Status<select name="status" defaultValue={item.status} className="h-11 rounded-[12px] border border-[#dfe3e8] bg-white px-3">{customInquiryStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
                    <label className="mt-4 grid gap-2 text-sm font-semibold">Customer-visible next step<textarea name="nextStep" defaultValue={item.nextStep || ""} rows={7} className="resize-y rounded-[12px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" /></label>
                    <button disabled={saving === item.id} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white disabled:opacity-60">{saving === item.id ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save</button>
                  </div>
                </div>
              </form>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
