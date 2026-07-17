"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Save, Settings2, Trash2, X } from "lucide-react";
import { CommunityIdea, CommunityModerationStatus } from "@/lib/community";
import { AdminViewCommunityLink } from "@/components/admin-view-community-link";
import { CommunityPageContent, CustomPageContent, defaultContent, SiteContent } from "@/lib/storage";

type QueueFilter = "pending" | "needs-reply" | "replied" | "featured" | "pinned" | "hidden" | "all";

const buckets: Array<[QueueFilter, string]> = [
  ["pending", "Pending Approval"],
  ["needs-reply", "Needs Reply"],
  ["replied", "Replied"],
  ["featured", "Homepage Featured"],
  ["pinned", "Pinned"],
  ["hidden", "Hidden"],
  ["all", "All"]
];

const reviewFields = [
  ["manufacturingFeasible", "Manufacturing feasible"],
  ["estimatedCostRange", "Estimated cost range"],
  ["estimatedMoq", "Estimated MOQ"],
  ["assumptions", "Assumptions"],
  ["confidence", "Confidence"],
  ["suggestedMaterial", "Suggested material"],
  ["suggestedManufacturing", "Suggested manufacturing process"],
  ["moldRequirement", "Mold requirement"],
  ["mainRisks", "Main risks"],
  ["recommendedNextStep", "Recommended next step"],
  ["factoriesMatched", "Factories matched"],
  ["additionalNotes", "Additional notes"]
] as const;

const assessmentLabelFields = Object.keys(defaultContent.communityPage.assessmentLabels) as Array<keyof CommunityPageContent["assessmentLabels"]>;
const customPageFields = Object.keys(defaultContent.customPage) as Array<keyof CustomPageContent>;

function listFromTextarea(value: FormDataEntryValue | null) {
  return String(value || "").split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
}

function normalizeCommunityIdea(value: unknown): CommunityIdea {
  const idea = value && typeof value === "object" && !Array.isArray(value) ? (value as Partial<CommunityIdea>) : {};
  return {
    ...(idea as CommunityIdea),
    id: idea.id || "",
    slug: idea.slug || "",
    title: idea.title || "Untitled idea",
    description: idea.description || "",
    category: idea.category || "General",
    country: idea.country || "Not specified",
    imageUrls: Array.isArray(idea.imageUrls) ? idea.imageUrls : [],
    questions: Array.isArray(idea.questions) ? idea.questions : [],
    moderationStatus: idea.moderationStatus || "Pending",
    hidden: Boolean(idea.hidden),
    locked: Boolean(idea.locked),
    pinned: Boolean(idea.pinned),
    homepageFeatured: Boolean(idea.homepageFeatured),
    comments: Array.isArray(idea?.comments) ? idea.comments : [],
    likeCount: Number(idea?.likeCount || 0),
    interestedCount: Number(idea?.interestedCount || 0),
    hotScore: Number(idea.hotScore || 0),
    isHot: Boolean(idea.isHot),
    createdAt: idea.createdAt || new Date().toISOString(),
    updatedAt: idea.updatedAt || new Date().toISOString()
  };
}

function existingReply(idea: CommunityIdea) {
  if (!idea.review) return "";
  if (idea.review.additionalNotes) return idea.review.additionalNotes;
  return reviewFields
    .map(([key, label]) => {
      const value = idea.review?.[key];
      return value ? `${label}: ${value}` : "";
    })
    .filter(Boolean)
    .join("\n\n");
}

export default function CommunityAdminClient() {
  const [ideas, setIdeas] = useState<CommunityIdea[]>([]);
  const [active, setActive] = useState<QueueFilter>("needs-reply");
  const [replyingTo, setReplyingTo] = useState<CommunityIdea | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [deleting, setDeleting] = useState("");
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/community").then((response) => response.json()),
      fetch("/api/content").then((response) => response.json())
    ])
      .then(([ideasPayload, contentPayload]) => {
        setIdeas((ideasPayload.data || []).map(normalizeCommunityIdea));
        setSiteContent(contentPayload.data || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    return {
      pending: ideas.filter((idea) => idea.moderationStatus === "Pending").length,
      "needs-reply": ideas.filter((idea) => !idea.review && !idea.hidden).length,
      replied: ideas.filter((idea) => idea.review && !idea.hidden).length,
      featured: ideas.filter((idea) => idea.homepageFeatured && !idea.hidden).length,
      pinned: ideas.filter((idea) => idea.pinned && !idea.hidden).length,
      hidden: ideas.filter((idea) => idea.hidden).length,
      all: ideas.length
    };
  }, [ideas]);

  async function save(event: FormEvent<HTMLFormElement>, idea: CommunityIdea) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(idea.slug);
    const body = {
      status: form.get("status"),
      moderationStatus: form.get("moderationStatus"),
      hidden: form.get("hidden") === "on",
      locked: form.get("locked") === "on",
      pinned: form.get("pinned") === "on",
      homepageFeatured: form.get("homepageFeatured") === "on",
      homepageFeaturedOrder: Number(form.get("homepageFeaturedOrder") || 0) || null,
      moderationNote: form.get("moderationNote"),
      review: {
        manufacturingFeasible: form.get("manufacturingFeasible"),
        estimatedCostRange: form.get("estimatedCostRange"),
        estimatedMoq: form.get("estimatedMoq"),
        assumptions: form.get("assumptions"),
        confidence: form.get("confidence"),
        disclaimer: form.get("disclaimer"),
        suggestedMaterial: form.get("suggestedMaterial"),
        suggestedManufacturing: form.get("suggestedManufacturing"),
        moldRequirement: form.get("moldRequirement"),
        mainRisks: form.get("mainRisks"),
        recommendedNextStep: form.get("recommendedNextStep"),
        factoriesMatched: form.get("factoriesMatched"),
        additionalNotes: form.get("additionalNotes"),
        assessmentStatus: form.get("assessmentStatus"),
        customEligible: form.get("customEligible") === "on"
      }
    };
    try {
      const response = await fetch(`/api/admin/community/${idea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body)
      });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || "Unable to save idea.");
      if (payload.success) {
        const updated = normalizeCommunityIdea(payload.data);
        setIdeas((current) => current.map((item) => {
          if (item.id === updated.id) return updated;
          if (updated.homepageFeatured && item.homepageFeaturedOrder === updated.homepageFeaturedOrder) {
            return { ...item, homepageFeatured: false, homepageFeaturedOrder: undefined };
          }
          return item;
        }));
        setReplyingTo(null);
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save idea.");
    } finally {
      setSaving("");
    }
  }

  async function saveCommunitySettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!siteContent) return;
    const form = new FormData(event.currentTarget);
    const current = siteContent.communityPage;
    const currentCustom = siteContent.customPage;
    const numberField = (key: keyof CommunityPageContent) => Number(form.get(String(key)) || current[key]);
    const labels = { ...current.assessmentLabels };
    assessmentLabelFields.forEach((key) => {
      labels[key] = String(form.get(`label-${key}`) || labels[key]).trim();
    });
    const communityPage: CommunityPageContent = {
      ...current,
      eyebrow: String(form.get("eyebrow") || "").trim(),
      title: String(form.get("title") || "").trim(),
      description: String(form.get("description") || "").trim(),
      startIdeaCtaText: String(form.get("startIdeaCtaText") || "").trim(),
      startIdeaCtaHref: String(form.get("startIdeaCtaHref") || "").trim(),
      privateCustomCtaText: String(form.get("privateCustomCtaText") || "").trim(),
      privateCustomCtaHref: String(form.get("privateCustomCtaHref") || "").trim(),
      continueWithTyoraText: String(form.get("continueWithTyoraText") || "").trim(),
      continueWithTyoraHref: String(form.get("continueWithTyoraHref") || "").trim(),
      startCustomProjectText: String(form.get("startCustomProjectText") || "").trim(),
      startCustomProjectHref: String(form.get("startCustomProjectHref") || "").trim(),
      likeText: String(form.get("likeText") || "").trim(),
      commentText: String(form.get("commentText") || "").trim(),
      shareText: String(form.get("shareText") || "").trim(),
      interestedText: String(form.get("interestedText") || "").trim(),
      assessmentDisclaimer: String(form.get("assessmentDisclaimer") || "").trim(),
      assessmentLabels: labels,
      feasibilityOptions: listFromTextarea(form.get("feasibilityOptions")),
      confidenceOptions: listFromTextarea(form.get("confidenceOptions")),
      assessmentStatusOptions: ["Draft", "Published"],
      hotScoreThreshold: numberField("hotScoreThreshold"),
      hotWindowDays: numberField("hotWindowDays"),
      hotProtectionHours: numberField("hotProtectionHours"),
      commentRateLimit: numberField("commentRateLimit"),
      reactionRateLimit: numberField("reactionRateLimit"),
      shareRateLimit: numberField("shareRateLimit"),
      rateWindowMinutes: numberField("rateWindowMinutes"),
      dailyAssessmentLimit: numberField("dailyAssessmentLimit"),
      showCasesInFeed: form.get("showCasesInFeed") === "on",
      caseLimit: numberField("caseLimit")
    };
    const customPage = customPageFields.reduce<CustomPageContent>((result, key) => {
      result[key] = String(form.get(`custom-${key}`) || currentCustom[key]).trim();
      return result;
    }, { ...currentCustom });
    setSettingsSaving(true);
    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...siteContent, communityPage, customPage })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to save Community settings.");
      setSiteContent(payload.data);
      setSettingsOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to save Community settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function deleteIdea(idea: CommunityIdea) {
    const confirmed = window.confirm(`Permanently delete "${idea.title}"?\n\nThis cannot be undone.`);
    if (!confirmed) return;
    const secondConfirmation = window.prompt(`Type DELETE to permanently delete "${idea.title}".`);
    if (secondConfirmation !== "DELETE") return;

    setDeleting(idea.slug);
    try {
      const response = await fetch(`/api/admin/community/${idea.slug}`, { method: "DELETE" });
      const payload = await response.json();
      if (!payload.success) throw new Error(payload.message || "Unable to delete post.");
      setIdeas((current) => current.filter((item) => item.id !== idea.id));
      if (replyingTo?.id === idea.id) setReplyingTo(null);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to delete post.");
    } finally {
      setDeleting("");
    }
  }

  const filtered = ideas.filter((idea) => {
    if (active === "pending") return idea.moderationStatus === "Pending";
    if (active === "needs-reply") return !idea.review && !idea.hidden;
    if (active === "replied") return Boolean(idea.review) && !idea.hidden;
    if (active === "featured") return idea.homepageFeatured && !idea.hidden;
    if (active === "pinned") return idea.pinned && !idea.hidden;
    if (active === "hidden") return idea.hidden;
    return true;
  });
  const communitySettings = siteContent?.communityPage || defaultContent.communityPage;
  const labels = communitySettings.assessmentLabels;

  return (
    <main className="min-h-screen bg-[#f6f7f9] px-4 py-6 text-[#101216] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[24px] border border-[#e8ebef] bg-white p-6 shadow-sm shadow-[#101216]/4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#69707d]">TYORA OS · Community</p>
            <h1 className="mt-2 text-3xl font-semibold">Ideas Work Queue</h1>
            <p className="mt-2 text-sm text-[#69707d]">Read founder ideas and publish natural TYORA replies. Keep community management simple and conversational.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Back to Today</Link>
            <Link href="/admin/custom-inquiries" className="rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">Private Custom Queue</Link>
            <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-[#dfe3e8] px-4 py-2 text-sm font-semibold">
              <Settings2 size={15} /> Community Settings
            </button>
            <AdminViewCommunityLink />
          </div>
          </div>
        </header>

        <div className="mt-6 grid gap-2 md:grid-cols-3 lg:grid-cols-7">
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
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[#fff7d6] px-2.5 py-1 text-[#8a5a00]">{idea.moderationStatus}</span>
                      {idea.homepageFeatured ? (
                        <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[#2563eb]">Homepage #{idea.homepageFeaturedOrder || "?"}</span>
                      ) : null}
                      {idea.pinned ? <span className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[#0f766e]">Pinned</span> : null}
                      {idea.hidden ? <span className="rounded-full bg-[#fff1f2] px-2.5 py-1 text-[#be123c]">Hidden</span> : null}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">{idea.title}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#69707d]">
                      <span>{idea.comments.length} comments</span>
                      <span>{idea.likeCount} likes</span>
                      <span>{idea.interestedCount} interested</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between rounded-[20px] border border-[#eef1f4] bg-[#fbfbfc] p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">TYORA Reply</p>
                      {idea.review ? (
                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{existingReply(idea)}</p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-[#69707d]">No TYORA reply yet. Open the reply box and write one clear, helpful response.</p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setReplyingTo(idea)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white transition hover:bg-[#24272d]">
                        <MessageSquare size={15} /> Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteIdea(idea)}
                        disabled={deleting === idea.slug}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#fecdd3] bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60"
                      >
                        {deleting === idea.slug ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                        Delete spam / violation
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      {replyingTo ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/35 px-3 py-3 backdrop-blur-sm sm:px-4" role="dialog" aria-modal="true">
          <form onSubmit={(event) => void save(event, replyingTo)} className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-[#e8ebef] bg-white p-4 shadow-2xl shadow-[#101216]/20 sm:p-6">
            <input type="hidden" name="status" value={replyingTo.status} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#69707d]">{replyingTo.id}</p>
                <h2 className="mt-1 text-2xl font-semibold">Review {replyingTo.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">Moderate the post, save a structured initial assessment, and publish it only when every required field is ready.</p>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e8ebef] text-[#69707d] transition hover:bg-[#f5f6f8]" aria-label="Close reply dialog">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">Moderation status
                <select name="moderationStatus" defaultValue={replyingTo.moderationStatus} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  {(["Pending", "Approved", "Rejected"] as CommunityModerationStatus[]).map((status) => <option key={status} value={status}>{status}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">Assessment status
                <select name="assessmentStatus" defaultValue={replyingTo.review?.assessmentStatus || "Draft"} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 self-end rounded-[14px] border border-[#dbeafe] bg-[#eff6ff] px-3 text-sm font-semibold text-[#315fbd]">
                <input name="customEligible" type="checkbox" defaultChecked={Boolean(replyingTo.review?.customEligible)} /> Eligible for Custom
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold">Internal moderation note
              <textarea name="moderationNote" defaultValue={replyingTo.moderationNote || ""} rows={2} className="resize-y rounded-[14px] border border-[#dfe3e8] p-3 text-sm leading-6" placeholder="Internal only. Never shown publicly." />
            </label>
            <div className="mt-5 rounded-[20px] border border-[#dbeafe] bg-[#f8fbff] p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">{labels.feasibility}
                  <input name="manufacturingFeasible" list="feasibility-options" defaultValue={replyingTo.review?.manufacturingFeasible || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                  <datalist id="feasibility-options">{communitySettings.feasibilityOptions.map((option) => <option key={option} value={option} />)}</datalist>
                </label>
                <label className="grid gap-2 text-sm font-semibold">{labels.confidence}
                  <input name="confidence" list="confidence-options" defaultValue={replyingTo.review?.confidence || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                  <datalist id="confidence-options">{communitySettings.confidenceOptions.map((option) => <option key={option} value={option} />)}</datalist>
                </label>
                <label className="grid gap-2 text-sm font-semibold">{labels.estimatedCostRange}
                  <input name="estimatedCostRange" defaultValue={replyingTo.review?.estimatedCostRange || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" placeholder="Example: USD 8,000-12,000" />
                </label>
                <label className="grid gap-2 text-sm font-semibold">{labels.estimatedMoq}
                  <input name="estimatedMoq" defaultValue={replyingTo.review?.estimatedMoq || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{labels.assumptions}
                  <textarea name="assumptions" defaultValue={replyingTo.review?.assumptions || ""} rows={3} className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                </label>
                {([
                  ["suggestedMaterial", labels.suggestedMaterial, replyingTo.review?.suggestedMaterial],
                  ["suggestedManufacturing", labels.suggestedProcess, replyingTo.review?.suggestedManufacturing],
                  ["moldRequirement", labels.moldRequirement, replyingTo.review?.moldRequirement],
                  ["factoriesMatched", "Factory feedback", replyingTo.review?.factoriesMatched],
                  ["mainRisks", labels.mainRisks, replyingTo.review?.mainRisks],
                  ["recommendedNextStep", labels.recommendedNextStep, replyingTo.review?.recommendedNextStep]
                ] as const).map(([name, label, value]) => (
                  <label key={name} className="grid gap-2 text-sm font-semibold">{label}
                    <textarea name={name} defaultValue={value || ""} rows={3} className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Public assessment summary
                  <textarea name="additionalNotes" defaultValue={replyingTo.review?.additionalNotes || ""} rows={5} autoFocus className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{labels.disclaimer}
                  <textarea name="disclaimer" defaultValue={replyingTo.review?.disclaimer || communitySettings.assessmentDisclaimer} rows={3} className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                </label>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-[18px] bg-[#f7f8fa] p-4 text-sm sm:grid-cols-3">
              <label className="flex items-center gap-2"><input name="hidden" type="checkbox" defaultChecked={replyingTo.hidden} /> Hide Post</label>
              <label className="flex items-center gap-2"><input name="locked" type="checkbox" defaultChecked={replyingTo.locked} /> Lock Comments</label>
              <label className="flex items-center gap-2"><input name="pinned" type="checkbox" defaultChecked={replyingTo.pinned} /> Pin Post</label>
            </div>
            <div className="mt-3 grid gap-3 rounded-[18px] border border-[#dbeafe] bg-[#f2f7ff] p-4 text-sm sm:grid-cols-[1fr_180px] sm:items-center">
              <label className="flex items-center gap-2 font-semibold text-[#315fbd]">
                <input name="homepageFeatured" type="checkbox" defaultChecked={replyingTo.homepageFeatured} />
                Feature on homepage
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-normal text-[#536174]">
                Showcase slot
                <select name="homepageFeaturedOrder" defaultValue={replyingTo.homepageFeaturedOrder || 1} className="h-10 rounded-full border border-[#bfdbfe] bg-white px-3 text-sm font-semibold normal-case text-[#101216]">
                  <option value="1">Homepage #1</option>
                  <option value="2">Homepage #2</option>
                  <option value="3">Homepage #3</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setReplyingTo(null)} className="inline-flex h-11 items-center justify-center rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold">Cancel</button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
                {saving === replyingTo.slug ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save Review
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {settingsOpen && siteContent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/35 px-3 py-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={(event) => void saveCommunitySettings(event)} className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-[24px] bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm text-[#69707d]">Admin / CMS</p><h2 className="mt-1 text-2xl font-semibold">Community Settings</h2></div>
              <button type="button" onClick={() => setSettingsOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#e8ebef]" aria-label="Close settings"><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(["eyebrow", "title", "description"] as const).map((key) => (
                <label key={key} className={key === "description" ? "grid gap-2 text-sm font-semibold sm:col-span-2" : "grid gap-2 text-sm font-semibold"}>{key}
                  <textarea name={key} defaultValue={communitySettings[key]} rows={key === "description" ? 3 : 2} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" />
                </label>
              ))}
              {(["startIdeaCtaText", "startIdeaCtaHref", "privateCustomCtaText", "privateCustomCtaHref", "continueWithTyoraText", "continueWithTyoraHref", "startCustomProjectText", "startCustomProjectHref", "likeText", "commentText", "shareText", "interestedText"] as const).map((key) => (
                <label key={key} className="grid gap-2 text-sm font-semibold">{key}<input name={key} defaultValue={communitySettings[key]} className="h-11 rounded-[14px] border border-[#dfe3e8] px-3 text-sm" /></label>
              ))}
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">Default assessment disclaimer<textarea name="assessmentDisclaimer" defaultValue={communitySettings.assessmentDisclaimer} rows={3} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
              <label className="grid gap-2 text-sm font-semibold">Feasibility options, one per line<textarea name="feasibilityOptions" defaultValue={communitySettings.feasibilityOptions.join("\n")} rows={5} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
              <label className="grid gap-2 text-sm font-semibold">Confidence options, one per line<textarea name="confidenceOptions" defaultValue={communitySettings.confidenceOptions.join("\n")} rows={5} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
            </div>
            <h3 className="mt-6 text-lg font-semibold">Assessment labels</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assessmentLabelFields.map((key) => <label key={key} className="grid gap-1 text-xs font-semibold">{key}<input name={`label-${key}`} defaultValue={communitySettings.assessmentLabels[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" /></label>)}
            </div>
            <h3 className="mt-6 text-lg font-semibold">Limits, ranking, and visibility</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["dailyAssessmentLimit", "hotScoreThreshold", "hotWindowDays", "hotProtectionHours", "commentRateLimit", "reactionRateLimit", "shareRateLimit", "rateWindowMinutes", "caseLimit"] as const).map((key) => <label key={key} className="grid gap-1 text-xs font-semibold">{key}<input type="number" min="0" name={key} defaultValue={communitySettings[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" /></label>)}
              <label className="flex items-center gap-2 rounded-[12px] border border-[#dfe3e8] px-3 text-sm font-semibold"><input name="showCasesInFeed" type="checkbox" defaultChecked={communitySettings.showCasesInFeed} /> Show TYORA cases in feed</label>
            </div>
            <h3 className="mt-6 text-lg font-semibold">Private Custom page copy</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {customPageFields.map((key) => (
                <label key={key} className={key === "subtitle" || key === "formDescription" || key === "successBody" || key === "privacyNote" ? "grid gap-1 text-xs font-semibold sm:col-span-2" : "grid gap-1 text-xs font-semibold"}>
                  {key}
                  {key === "subtitle" || key === "formDescription" || key === "successBody" || key === "privacyNote" ? (
                    <textarea name={`custom-${key}`} defaultValue={siteContent.customPage[key]} rows={3} className="rounded-[12px] border border-[#dfe3e8] p-3 text-sm" />
                  ) : (
                    <input name={`custom-${key}`} defaultValue={siteContent.customPage[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" />
                  )}
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#69707d]">Categories, campaign content, case images/content, ordering, and homepage visibility remain managed in the main Content and Homepage editors.</p>
            <div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setSettingsOpen(false)} className="h-11 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold">Cancel</button><button className="inline-flex h-11 items-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">{settingsSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Save Settings</button></div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
