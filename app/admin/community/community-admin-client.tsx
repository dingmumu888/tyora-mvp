"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { communityStatuses, CommunityIdea, CommunityStatus } from "@/lib/community";

const buckets: Array<[CommunityStatus, string]> = [
  ["Discussing", "Waiting Reply"],
  ["TYORA Reviewing", "Answered"],
  ["Project Started", "Project Started"],
  ["Manufacturing", "Manufacturing"],
  ["Shipping", "Shipping"],
  ["Completed", "Completed"]
];

export default function CommunityAdminClient() {
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [active, setActive] = useState<CommunityStatus>("Discussing");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");

  useEffect(() => {
    fetch("/api/admin/community")
      .then((response) => response.json())
      .then((payload) => setIdeas(payload.data || []))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return communityStatuses.reduce<Record<string, number>>((acc, status) => {
      acc[status] = ideas.filter((idea) => idea.status === status).length;
      return acc;
    }, {});
  }, [ideas]);

  async function save(event: FormEvent<HTMLFormElement>, idea: CommunityIdea) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(idea.slug);
    const body = {
      status: form.get("status"),
      hidden: form.get("hidden") === "on",
      locked: form.get("locked") === "on",
      pinned: form.get("pinned") === "on",
      review: {
        manufacturingFeasible: form.get("manufacturingFeasible"),
        estimatedCostRange: form.get("estimatedCostRange"),
        suggestedMaterial: form.get("suggestedMaterial"),
        estimatedMoq: form.get("estimatedMoq"),
        suggestedManufacturing: form.get("suggestedManufacturing"),
        factoriesMatched: form.get("factoriesMatched"),
        additionalNotes: form.get("additionalNotes")
      }
    };
    try {
      const response = await fetch(`/api/admin/community/${idea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (payload.success) {
        setIdeas((current) => current.map((item) => item.id === idea.id ? payload.data : item));
      }
    } finally {
      setSaving("");
    }
  }

  const filtered = ideas.filter((idea) => idea.status === active);

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-[#101216] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[24px] border border-[#e8ebef] bg-white p-6 shadow-sm shadow-[#101216]/4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69707d]">TYORA OS · Community</p>
            <h1 className="mt-2 text-3xl font-semibold">Ideas Work Queue</h1>
            <p className="mt-2 text-sm text-[#69707d]">Reply to waiting ideas, edit TYORA reviews, change status, pin, hide and lock discussions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Back to Today</Link>
            <Link href="/ask" className="rounded-full bg-[#101216] px-4 py-2 text-sm font-semibold text-white">View Community</Link>
          </div>
          </div>
        </header>

        <div className="mt-6 grid gap-2 md:grid-cols-3 lg:grid-cols-6">
          {buckets.map(([status, label]) => (
            <button key={status} onClick={() => setActive(status)} className={`rounded-2xl border p-3 text-left shadow-sm shadow-[#101216]/4 ${active === status ? "border-[#101216] bg-[#101216] text-white" : "border-[#e8ebef] bg-white"}`}>
              <span className="block text-sm font-semibold">{label}</span>
              <span className="text-xs opacity-70">{counts[status] || 0} posts</span>
            </button>
          ))}
        </div>

        {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div> : (
          <div className="mt-6 space-y-5">
            {filtered.length === 0 ? <p className="rounded-[22px] border border-[#e8ebef] bg-white p-6 text-sm text-[#69707d]">No posts in this section.</p> : null}
            {filtered.map((idea) => (
              <article key={idea.id} className="rounded-[22px] border border-[#e8ebef] bg-white p-5 shadow-sm shadow-[#101216]/4">
                <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
                  <div>
                    <p className="text-xs text-[#69707d]">{idea.id} · {idea.visibility} · {idea.author.name}</p>
                    <h2 className="mt-2 text-2xl font-semibold">{idea.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#69707d]">
                      <span>{idea.comments.length} comments</span>
                      <span>{idea.likeCount} likes</span>
                      <span>{idea.interestedCount} interested</span>
                    </div>
                  </div>
                  <form onSubmit={(event) => void save(event, idea)} className="grid gap-3">
                    <select name="status" defaultValue={idea.status} className="h-10 rounded-[6px] border border-[#dfe3e8] bg-white px-3">
                      {communityStatuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    {[
                      ["manufacturingFeasible", "Manufacturing Feasible"],
                      ["estimatedCostRange", "Estimated Cost Range"],
                      ["suggestedMaterial", "Suggested Material"],
                      ["estimatedMoq", "Estimated MOQ"],
                      ["suggestedManufacturing", "Suggested Manufacturing Process"],
                      ["factoriesMatched", "Factories Matched"],
                      ["additionalNotes", "Additional Notes"]
                    ].map(([name, label]) => (
                      <label key={name} className="grid gap-1 text-sm font-medium">{label}
                        <textarea name={name} defaultValue={(idea.review as any)?.[name] || ""} rows={name === "additionalNotes" ? 4 : 2} className="resize-none rounded-[6px] border border-[#dfe3e8] bg-white p-2 text-sm" />
                      </label>
                    ))}
                    <div className="grid gap-2 text-sm sm:grid-cols-3">
                      <label><input name="hidden" type="checkbox" defaultChecked={idea.hidden} /> Hide Post</label>
                      <label><input name="locked" type="checkbox" defaultChecked={idea.locked} /> Lock Comments</label>
                      <label><input name="pinned" type="checkbox" defaultChecked={idea.pinned} /> Pin Post</label>
                    </div>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
                      {saving === idea.slug ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Reply / Save
                    </button>
                  </form>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
