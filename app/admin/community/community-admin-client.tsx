"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, MessageSquare, Save, Settings2, Trash2, X } from "lucide-react";
import {
  communityPostTypes,
  communityProductStages,
  CommunityIdea,
  CommunityModerationStatus
} from "@/lib/community";
import AdminShell, { AdminSectionId } from "@/components/admin/admin-shell";
import { AdminActionBar, AdminEmptyState, AdminMetricCard } from "@/components/admin/admin-ui";
import { useAdminLanguage } from "@/components/admin/admin-language-provider";
import { CommunityPageContent, CustomPageContent, defaultContent, SiteContent } from "@/lib/storage";

type QueueFilter = "pending" | "unanswered" | "needs-reply" | "replied" | "featured" | "pinned" | "hidden" | "all";

const buckets: Array<[QueueFilter, string]> = [
  ["pending", "Pending Approval"],
  ["unanswered", "Awaiting First Answer"],
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
const encouragementLanguages = [
  ["en", "English"],
  ["zh-CN", "简体中文"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["pt", "Português"]
] as const;

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
    postType: idea.postType || "Idea Feedback",
    productStage: idea.productStage || "Concept",
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
    helpfulCount: Number(idea?.helpfulCount ?? idea?.likeCount ?? 0),
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
  const { t } = useAdminLanguage();
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
      unanswered: ideas.filter((idea) => idea.moderationStatus === "Approved" && !idea.hidden && idea.comments.length === 0 && idea.review?.assessmentStatus !== "Published").length,
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
      postType: form.get("postType"),
      productStage: form.get("productStage"),
      moderationStatus: form.get("moderationStatus"),
      authorExpertRole: form.get("authorExpertRole"),
      authorExpertVerified: form.get("authorExpertVerified") === "on",
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
      window.alert(t(error instanceof Error ? error.message : "Unable to save idea."));
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
      profileEncouragements: encouragementLanguages.reduce<CommunityPageContent["profileEncouragements"]>(
        (result, [code]) => {
          result[code] = listFromTextarea(form.get(`profileEncouragements-${code}`));
          return result;
        },
        { ...current.profileEncouragements }
      ),
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
      window.alert(t(error instanceof Error ? error.message : "Unable to save Community settings."));
    } finally {
      setSettingsSaving(false);
    }
  }

  async function deleteIdea(idea: CommunityIdea) {
    const confirmed = window.confirm(t(`Permanently delete "${idea.title}"?\n\nThis cannot be undone.`));
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
      window.alert(t(error instanceof Error ? error.message : "Unable to delete post."));
    } finally {
      setDeleting("");
    }
  }

  const filtered = ideas.filter((idea) => {
    if (active === "pending") return idea.moderationStatus === "Pending";
    if (active === "unanswered") return idea.moderationStatus === "Approved" && !idea.hidden && idea.comments.length === 0 && idea.review?.assessmentStatus !== "Published";
    if (active === "needs-reply") return !idea.review && !idea.hidden;
    if (active === "replied") return Boolean(idea.review) && !idea.hidden;
    if (active === "featured") return idea.homepageFeatured && !idea.hidden;
    if (active === "pinned") return idea.pinned && !idea.hidden;
    if (active === "hidden") return idea.hidden;
    return true;
  });
  const communitySettings = siteContent?.communityPage || defaultContent.communityPage;
  const labels = communitySettings.assessmentLabels;

  function navigateAdmin(section: AdminSectionId) {
    if (section === "community") return;
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
      activeSection="community"
      pageTitle="Ideas Moderation"
      pageDescription="Moderate public Ideas and publish structured TYORA assessments."
      notificationCount={counts.unanswered + counts.pending}
      searchItems={ideas.slice(0, 60).map((idea) => ({
        id: `idea-${idea.id}`,
        label: t(idea.title),
        description: `${t(idea.moderationStatus)} · ${idea.author.name}`,
        href: "/admin/community",
        keywords: [idea.category, idea.visibility, idea.hidden ? "hidden" : ""].join(" ")
      }))}
      canSave={false}
      onNavigate={navigateAdmin}
      onNewProject={() => window.location.assign("/admin?section=submissions")}
      onSave={() => undefined}
      onLogout={() => void logout()}
    >
      <div className="space-y-4">
        <AdminActionBar
          title={t("Moderation controls")}
          description={t("Review founder submissions, manage publication status, and keep public assessments clear and consistent.")}
          actions={(
            <>
              <Link href="/admin/custom-inquiries" className="inline-flex min-h-11 items-center rounded-md border border-[#d0d5dd] bg-white px-4 text-sm font-semibold text-[#344054] hover:bg-[#f9fafb]">{t("Private Custom Queue")}</Link>
              <button type="button" onClick={() => setSettingsOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-semibold text-white hover:bg-[#004eeb]">
              <Settings2 size={15} /> {t("Community Settings")}
              </button>
            </>
          )}
        />

        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8">
          {buckets.map(([status, label]) => (
            <AdminMetricCard key={status} label={t(label)} value={counts[status] || 0} detail={t("posts")} active={active === status} onClick={() => setActive(status)} />
          ))}
        </div>

        {loading ? <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin" /></div> : (
          <div className="space-y-4">
            {filtered.length === 0 ? <AdminEmptyState title={t("No posts in this section")} description={t("Posts will appear here when they match the selected moderation state.")} /> : null}
            {filtered.map((idea) => (
              <article key={idea.id} className="rounded-md border border-[#e4e7ec] bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-6 lg:grid-cols-[1fr_440px]">
                  <div>
                    <p className="text-xs text-[#69707d]">{idea.id} · {t(idea.visibility)} · {idea.author.name}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="rounded-full bg-[#fff7d6] px-2.5 py-1 text-[#8a5a00]">{t(idea.moderationStatus)}</span>
                      <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[#2563eb]">{t(idea.postType)}</span>
                      <span className="rounded-full bg-[#f3f0ff] px-2.5 py-1 text-[#6d28d9]">{t(idea.productStage)}</span>
                      {idea.homepageFeatured ? (
                        <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[#2563eb]">{t(`Homepage #${idea.homepageFeaturedOrder || "?"}`)}</span>
                      ) : null}
                      {idea.pinned ? <span className="rounded-full bg-[#ecfdf5] px-2.5 py-1 text-[#0f766e]">{t("Pinned")}</span> : null}
                      {idea.hidden ? <span className="rounded-full bg-[#fff1f2] px-2.5 py-1 text-[#be123c]">{t("Hidden")}</span> : null}
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold">{t(idea.title)}</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{t(idea.description)}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#69707d]">
                      <span>{t(`${idea.comments.length} comments`)}</span>
                      <span>{t(`${idea.helpfulCount} helpful`)}</span>
                      <span>{t(`${idea.interestedCount} interested`)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-start justify-between rounded-md border border-[#eef1f4] bg-[#f9fafb] p-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">{t("TYORA Reply")}</p>
                      {idea.review ? (
                        <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-[#59616e]">{t(existingReply(idea))}</p>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-[#69707d]">{t("No TYORA reply yet. Open the reply box and write one clear, helpful response.")}</p>
                      )}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setReplyingTo(idea)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-semibold text-white transition hover:bg-[#004eeb]">
                        <MessageSquare size={15} /> {t("Reply")}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteIdea(idea)}
                        disabled={deleting === idea.slug}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[#fecdca] bg-[#fffafa] px-4 text-sm font-semibold text-[#b42318] transition hover:bg-[#fef3f2] disabled:opacity-60"
                      >
                        {deleting === idea.slug ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                        {t("Delete spam / violation")}
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
          <form onSubmit={(event) => void save(event, replyingTo)} className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-md border border-[#e8ebef] bg-white p-4 shadow-2xl shadow-[#101216]/20 sm:p-6">
            <input type="hidden" name="status" value={replyingTo.status} />
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#69707d]">{replyingTo.id}</p>
                <h2 className="mt-1 text-2xl font-semibold">{t("Review")} {t(replyingTo.title)}</h2>
                <p className="mt-2 text-sm leading-6 text-[#69707d]">{t("Moderate the post, save a structured initial assessment, and publish it only when every required field is ready.")}</p>
              </div>
              <button type="button" onClick={() => setReplyingTo(null)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e8ebef] text-[#69707d] transition hover:bg-[#f5f6f8]" aria-label={t("Close reply dialog")}>
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="grid gap-2 text-sm font-semibold">{t("Moderation status")}
                <select name="moderationStatus" defaultValue={replyingTo.moderationStatus} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  {(["Pending", "Approved", "Rejected"] as CommunityModerationStatus[]).map((status) => <option key={status} value={status}>{t(status)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">{t("Assessment status")}
                <select name="assessmentStatus" defaultValue={replyingTo.review?.assessmentStatus || "Draft"} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  <option value="Draft">{t("Draft")}</option>
                  <option value="Published">{t("Published")}</option>
                </select>
              </label>
              <label className="flex min-h-11 items-center gap-2 self-end rounded-[14px] border border-[#dbeafe] bg-[#eff6ff] px-3 text-sm font-semibold text-[#315fbd]">
                <input name="customEligible" type="checkbox" defaultChecked={Boolean(replyingTo.review?.customEligible)} /> {t("Eligible for Custom")}
              </label>
            </div>
            <div className="mt-4 grid gap-4 rounded-[18px] border border-[#e4e7ec] bg-[#f9fafb] p-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 text-sm font-semibold">{t("Post type")}
                <select name="postType" defaultValue={replyingTo.postType} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  {communityPostTypes.map((postType) => <option key={postType} value={postType}>{t(postType)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">{t("Product stage")}
                <select name="productStage" defaultValue={replyingTo.productStage} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm">
                  {communityProductStages.map((productStage) => <option key={productStage} value={productStage}>{t(productStage)}</option>)}
                </select>
              </label>
              <label className="grid gap-2 text-sm font-semibold">{t("Author expert role")}
                <input name="authorExpertRole" defaultValue={replyingTo.author.expertRole || ""} placeholder={t("Manufacturing engineer")} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
              </label>
              <label className="flex min-h-11 items-center gap-2 self-end rounded-[14px] border border-[#a8ddd7] bg-[#f1fbf9] px-3 text-sm font-semibold text-[#06756f]">
                <input name="authorExpertVerified" type="checkbox" defaultChecked={replyingTo.author.expertVerified} /> {t("Verified expert")}
              </label>
            </div>
            <label className="mt-4 grid gap-2 text-sm font-semibold">{t("Internal moderation note")}
              <textarea name="moderationNote" defaultValue={replyingTo.moderationNote || ""} rows={2} className="resize-y rounded-[14px] border border-[#dfe3e8] p-3 text-sm leading-6" placeholder={t("Internal only. Never shown publicly.")} />
            </label>
            <div className="mt-5 rounded-[20px] border border-[#dbeafe] bg-[#f8fbff] p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2 text-sm font-semibold">{t(labels.feasibility)}
                  <input name="manufacturingFeasible" list="feasibility-options" defaultValue={replyingTo.review?.manufacturingFeasible || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                  <datalist id="feasibility-options">{communitySettings.feasibilityOptions.map((option) => <option key={option} value={option} />)}</datalist>
                </label>
                  <label className="grid gap-2 text-sm font-semibold">{t(labels.confidence)}
                  <input name="confidence" list="confidence-options" defaultValue={replyingTo.review?.confidence || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                  <datalist id="confidence-options">{communitySettings.confidenceOptions.map((option) => <option key={option} value={option} />)}</datalist>
                </label>
                <label className="grid gap-2 text-sm font-semibold">{t(labels.estimatedCostRange)}
                  <input name="estimatedCostRange" defaultValue={replyingTo.review?.estimatedCostRange || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" placeholder={t("Example: USD 8,000-12,000")} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">{t(labels.estimatedMoq)}
                  <input name="estimatedMoq" defaultValue={replyingTo.review?.estimatedMoq || ""} className="h-11 rounded-[14px] border border-[#dfe3e8] bg-white px-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{t(labels.assumptions)}
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
                  <label key={name} className="grid gap-2 text-sm font-semibold">{t(label)}
                    <textarea name={name} defaultValue={value || ""} rows={3} className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                  </label>
                ))}
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{t("Public assessment summary")}
                  <textarea name="additionalNotes" defaultValue={replyingTo.review?.additionalNotes || ""} rows={5} autoFocus className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{t(labels.disclaimer)}
                  <textarea name="disclaimer" defaultValue={replyingTo.review?.disclaimer || communitySettings.assessmentDisclaimer} rows={3} className="resize-y rounded-[14px] border border-[#dfe3e8] bg-white p-3 text-sm leading-6" />
                </label>
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-[18px] bg-[#f7f8fa] p-4 text-sm sm:grid-cols-3">
              <label className="flex items-center gap-2"><input name="hidden" type="checkbox" defaultChecked={replyingTo.hidden} /> {t("Hide Post")}</label>
              <label className="flex items-center gap-2"><input name="locked" type="checkbox" defaultChecked={replyingTo.locked} /> {t("Lock Comments")}</label>
              <label className="flex items-center gap-2"><input name="pinned" type="checkbox" defaultChecked={replyingTo.pinned} /> {t("Pin Post")}</label>
            </div>
            <div className="mt-3 grid gap-3 rounded-md border border-[#dbeafe] bg-[#f2f7ff] p-4 text-sm sm:grid-cols-[1fr_180px] sm:items-center">
              <label className="flex items-center gap-2 font-semibold text-[#315fbd]">
                <input name="homepageFeatured" type="checkbox" defaultChecked={replyingTo.homepageFeatured} />
                {t("Feature on homepage")}
              </label>
              <label className="grid gap-1 text-xs font-semibold uppercase tracking-normal text-[#536174]">
                {t("Showcase slot")}
                <select name="homepageFeaturedOrder" defaultValue={replyingTo.homepageFeaturedOrder || 1} className="h-11 rounded-md border border-[#bfdbfe] bg-white px-3 text-sm font-semibold normal-case text-[#101216] focus:border-[#155eef] focus:outline-none focus:ring-4 focus:ring-[#155eef]/10">
                  <option value="1">{t("Homepage #1")}</option>
                  <option value="2">{t("Homepage #2")}</option>
                  <option value="3">{t("Homepage #3")}</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setReplyingTo(null)} className="inline-flex h-11 items-center justify-center rounded-md border border-[#d0d5dd] px-5 text-sm font-semibold">{t("Cancel")}</button>
              <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-[#155eef] px-5 text-sm font-semibold text-white hover:bg-[#004eeb]">
                {saving === replyingTo.slug ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} {t("Save Review")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
      {settingsOpen && siteContent ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/35 px-3 py-3 backdrop-blur-sm" role="dialog" aria-modal="true">
          <form onSubmit={(event) => void saveCommunitySettings(event)} className="max-h-[calc(100vh-24px)] w-full max-w-5xl overflow-y-auto rounded-md bg-white p-4 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm text-[#69707d]">{t("Admin / CMS")}</p><h2 className="mt-1 text-2xl font-semibold">{t("Community Settings")}</h2></div>
              <button type="button" onClick={() => setSettingsOpen(false)} className="flex size-10 items-center justify-center rounded-full border border-[#e8ebef]" aria-label={t("Close settings")}><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(["eyebrow", "title", "description"] as const).map((key) => (
                <label key={key} className={key === "description" ? "grid gap-2 text-sm font-semibold sm:col-span-2" : "grid gap-2 text-sm font-semibold"}>{t(key)}
                  <textarea name={key} defaultValue={communitySettings[key]} rows={key === "description" ? 3 : 2} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" />
                </label>
              ))}
              {(["startIdeaCtaText", "startIdeaCtaHref", "privateCustomCtaText", "privateCustomCtaHref", "continueWithTyoraText", "continueWithTyoraHref", "startCustomProjectText", "startCustomProjectHref", "likeText", "commentText", "shareText", "interestedText"] as const).map((key) => (
                <label key={key} className="grid gap-2 text-sm font-semibold">{t(key)}<input name={key} defaultValue={communitySettings[key]} className="h-11 rounded-[14px] border border-[#dfe3e8] px-3 text-sm" /></label>
              ))}
              <label className="grid gap-2 text-sm font-semibold sm:col-span-2">{t("Default assessment disclaimer")}<textarea name="assessmentDisclaimer" defaultValue={communitySettings.assessmentDisclaimer} rows={3} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
              <section className="sm:col-span-2">
                <h3 className="text-lg font-semibold">{t("Profile encouragements")}</h3>
                <p className="mt-1 text-xs leading-5 text-[#69707d]">{t("One message per line. Each customer sees one stable message per day based on their account.")}</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {encouragementLanguages.map(([code, label]) => (
                    <label key={code} className="grid gap-2 text-sm font-semibold">
                      {label}
                      <textarea
                        name={`profileEncouragements-${code}`}
                        defaultValue={communitySettings.profileEncouragements[code].join("\n")}
                        rows={8}
                        className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm leading-6"
                      />
                    </label>
                  ))}
                </div>
              </section>
              <label className="grid gap-2 text-sm font-semibold">{t("Feasibility options, one per line")}<textarea name="feasibilityOptions" defaultValue={communitySettings.feasibilityOptions.join("\n")} rows={5} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
              <label className="grid gap-2 text-sm font-semibold">{t("Confidence options, one per line")}<textarea name="confidenceOptions" defaultValue={communitySettings.confidenceOptions.join("\n")} rows={5} className="rounded-[14px] border border-[#dfe3e8] p-3 text-sm" /></label>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t("Assessment labels")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assessmentLabelFields.map((key) => <label key={key} className="grid gap-1 text-xs font-semibold">{t(key)}<input name={`label-${key}`} defaultValue={communitySettings.assessmentLabels[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" /></label>)}
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t("Limits, ranking, and visibility")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(["dailyAssessmentLimit", "hotScoreThreshold", "hotWindowDays", "hotProtectionHours", "commentRateLimit", "reactionRateLimit", "shareRateLimit", "rateWindowMinutes", "caseLimit"] as const).map((key) => <label key={key} className="grid gap-1 text-xs font-semibold">{t(key)}<input type="number" min="0" name={key} defaultValue={communitySettings[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" /></label>)}
              <label className="flex items-center gap-2 rounded-[12px] border border-[#dfe3e8] px-3 text-sm font-semibold"><input name="showCasesInFeed" type="checkbox" defaultChecked={communitySettings.showCasesInFeed} /> {t("Show TYORA cases in feed")}</label>
            </div>
            <h3 className="mt-6 text-lg font-semibold">{t("Private Custom page copy")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {customPageFields.map((key) => (
                <label key={key} className={key === "subtitle" || key === "formDescription" || key === "successBody" || key === "privacyNote" ? "grid gap-1 text-xs font-semibold sm:col-span-2" : "grid gap-1 text-xs font-semibold"}>
                  {t(key)}
                  {key === "subtitle" || key === "formDescription" || key === "successBody" || key === "privacyNote" ? (
                    <textarea name={`custom-${key}`} defaultValue={siteContent.customPage[key]} rows={3} className="rounded-[12px] border border-[#dfe3e8] p-3 text-sm" />
                  ) : (
                    <input name={`custom-${key}`} defaultValue={siteContent.customPage[key]} className="h-10 rounded-[12px] border border-[#dfe3e8] px-3 text-sm" />
                  )}
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#69707d]">{t("Categories, campaign content, case images/content, ordering, and homepage visibility remain managed in the main Content and Homepage editors.")}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setSettingsOpen(false)} className="h-11 rounded-md border border-[#d0d5dd] px-5 text-sm font-semibold">{t("Cancel")}</button><button className="inline-flex h-11 items-center gap-2 rounded-md bg-[#155eef] px-5 text-sm font-semibold text-white hover:bg-[#004eeb]">{settingsSaving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} {t("Save Settings")}</button></div>
          </form>
        </div>
      ) : null}
    </AdminShell>
  );
}
