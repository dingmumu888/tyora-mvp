"use client";

import { ClipboardEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageCircle,
  PackageCheck,
  SearchCheck,
  Sparkles,
  Upload
} from "lucide-react";
import {
  communityQuestions,
  CommunityPostType,
  CommunityProductStage,
  CommunityQuestion
} from "@/lib/community";
import CommunityUserMenu from "@/components/community-user-menu";
import EmailLogin from "@/components/email-login";
import EditableIdeaImages from "@/components/editable-idea-images";
import PublicLanguageSwitcher from "@/components/public-language-switcher";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateNewIdea, type NewIdeaKey } from "@/lib/new-idea-i18n";
import {
  MAX_IDEA_IMAGES,
  summarizeUnsupportedFileNames,
  validateIdeaImageSelection
} from "@/lib/idea-image-selection";
import { PUBLIC_DISCLOSURE_NOTICE_VERSION } from "@/lib/public-disclosure";
import { preparePublicImage } from "@/lib/public-image-processing";
import { cn } from "@/lib/utils";

type SessionUser = { id: string; name: string; email: string; username: string; avatar?: string; bio?: string; profileCompleted?: boolean; country?: string };
type Step = 0 | 1 | 2 | 3;
type ImagePreview = { name: string; url: string };
type Translator = (key: NewIdeaKey, values?: Record<string, string | number>) => string;

const stepKeys: NewIdeaKey[] = ["stepYourIdea", "stepShowIt", "stepUnderstand", "stepSubmit"];
const mobileStepKeys: NewIdeaKey[] = ["mobileIdea", "mobileShow", "mobileUnderstand", "mobileLive"];
const questionTranslationKeys: Record<CommunityQuestion, NewIdeaKey> = {
  "Can this be manufactured?": "qManufactured",
  "Estimated Cost?": "qCost",
  "Material Suggestion?": "qMaterial",
  "MOQ Estimate?": "qMoq",
  "Factory Recommendation?": "qFactory",
  Other: "qOther"
};
const nextSteps = [
  ["foundersDiscuss", MessageCircle],
  ["tyoraReviews", SearchCheck],
  ["decideBuild", PackageCheck]
] as const;
const primaryButton = "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20 transition duration-[180ms] hover:-translate-y-0.5 hover:bg-[#1d4ed8] hover:shadow-md hover:shadow-[#2563eb]/25";
async function normalizeProductImage(file: File, t: Translator) {
  const prepared = await preparePublicImage(file, {
    maxDimension: 1280,
    quality: 0.8,
    maxDataUrlLength: 650000,
    minimumDimension: 480,
    errors: {
      read: t("unableReadImage"),
      unsupported: t("unsupportedImage"),
      prepare: t("unablePrepareImage")
    }
  });
  return prepared.dataUrl;
}

type NewIdeaClientProps = {
  brand: {
    brandName: string;
    logoImage: string;
    showBrandNameWithLogo: boolean;
  };
};

export default function NewIdeaClient({ brand }: NewIdeaClientProps) {
  const { language, copy } = usePublicLanguage();
  const t: Translator = (key, values) => translateNewIdea(language, key, values);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [step, setStep] = useState<Step>(0);
  const [oneSentence, setOneSentence] = useState("");
  const [message, setMessage] = useState("");
  const [loginPrompt, setLoginPrompt] = useState(0);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);
  const [published, setPublished] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    postType: "Idea Feedback" as CommunityPostType,
    productStage: "Concept" as CommunityProductStage,
    country: "",
    imageUrls: [] as string[],
    questions: [] as CommunityQuestion[],
    otherQuestion: "",
    visibility: "Public" as "Public" | "Private",
    publicDisclosureConsent: false
  });

  useEffect(() => {
    function applyUser(nextUser: SessionUser | null) {
      setUser(nextUser);
      if (nextUser?.country) {
        setForm((current) => ({
          ...current,
          country: current.country.trim() ? current.country : nextUser.country || ""
        }));
      }
    }

    function refreshSession() {
      fetch("/api/community/session")
        .then((response) => response.json())
        .then((data) => applyUser(data.user || null))
        .catch(() => applyUser(null))
        .finally(() => setCheckingSession(false));
    }
    function clearSession() {
      applyUser(null);
      setCheckingSession(false);
    }

    refreshSession();
    window.addEventListener("tyora:community-login", refreshSession);
    window.addEventListener("tyora:community-logout", clearSession);
    function onProfileUpdated(event: Event) {
      applyUser((event as CustomEvent<{ user?: SessionUser }>).detail?.user || null);
    }
    window.addEventListener("tyora:community-profile-updated", onProfileUpdated);
    return () => {
      window.removeEventListener("tyora:community-login", refreshSession);
      window.removeEventListener("tyora:community-logout", clearSession);
      window.removeEventListener("tyora:community-profile-updated", onProfileUpdated);
    };
  }, []);

  const usedText = t("initialReview");
  const inputClass = "h-12 rounded-[16px] border border-transparent bg-[#f8fafc] px-4 text-sm outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10";
  const panelClass = "rounded-[26px] border border-[#e1e7f0] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]";

  function toggleQuestion(question: CommunityQuestion) {
    setForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  async function setImages(files: FileList | File[]) {
    const incoming = Array.from(files);
    if (!incoming.length) return false;
    const validation = validateIdeaImageSelection(incoming, imagePreviews.length);
    if (!validation.ok) {
      setMessage(validation.reason === "unsupported"
        ? t("unsupportedFiles", { files: summarizeUnsupportedFileNames(validation.unsupported) })
        : t("imageSelectionTooLarge", {
          selected: validation.selected,
          remaining: validation.remaining,
          excess: validation.excess
        }));
      return false;
    }
    try {
      const nextPreviews = await Promise.all(incoming.map(async (file) => ({ name: file.name, url: await normalizeProductImage(file, t) })));
      setImagePreviews((current) => [...current, ...nextPreviews].slice(0, MAX_IDEA_IMAGES));
      setForm((current) => ({ ...current, imageUrls: [...current.imageUrls, ...nextPreviews.map((image) => image.url)].slice(0, MAX_IDEA_IMAGES) }));
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("unablePrepareImage"));
      return false;
    }
  }

  function updateIdeaImages(imageUrls: string[]) {
    setForm((current) => ({ ...current, imageUrls }));
    setImagePreviews(imageUrls.map((url, index) => ({ name: `idea-image-${index + 1}`, url })));
  }

  async function onPaste(event: ClipboardEvent<HTMLFormElement>) {
    const imageFiles = Array.from(event.clipboardData.files);
    if (imageFiles.length === 0) return;
    event.preventDefault();
    if (await setImages(imageFiles)) {
      setMessage(t("screenshotPasted"));
      if (step !== 1) setStep(1);
    }
  }

  function validateStep(target = step) {
    setMessage("");
    if (target === 0) {
      if (!form.title.trim()) return setMessage(t("addProductName")), false;
      if (!oneSentence.trim()) return setMessage(t("describeOneSentence")), false;
    }
    if (target === 2) {
      if (form.questions.includes("Other") && !form.otherQuestion.trim()) {
        return setMessage(t("addCustomQuestion")), false;
      }
      return true;
    }
    return true;
  }

  function continueStep() {
    if (!validateStep()) return;
    setStep((current) => Math.min(current + 1, 3) as Step);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (imageUploading) return setMessage(t("uploadingImage"));
    const ideaSummary = form.description.trim() || oneSentence.trim();
    if (!form.title.trim()) return setMessage(t("addProductName"));
    if (!ideaSummary) return setMessage(t("describeIdea"));
    if (form.visibility === "Public" && !form.publicDisclosureConsent) {
      return setMessage(t("confirmPermissions"));
    }
    if (!user) {
      setMessage(t("loginToPublish"));
      setLoginPrompt((current) => current + 1);
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/ideas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          description: ideaSummary,
          category: form.category.trim() || "Concept",
          country: form.country.trim() || "Not specified",
          questions: form.questions,
          // Keep the server contract backward compatible while the UI presents one clear acknowledgement.
          publicContentConsent: form.publicDisclosureConsent,
          publicImageConsent: form.publicDisclosureConsent,
          publicAssessmentConsent: form.publicDisclosureConsent,
          publicConsentVersion: form.visibility === "Public" ? PUBLIC_DISCLOSURE_NOTICE_VERSION : undefined,
          publicConsentLocale: form.visibility === "Public" ? language : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(typeof payload?.message === "string" ? payload.message : t("unableSubmit"));
      }
      setPublished(true);
      window.setTimeout(() => {
        window.location.href = `/ask/${payload.data.slug}`;
      }, 1050);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("unableSubmit"));
    } finally {
      setSubmitting(false);
    }
  }

  function submissionPrivacyControls() {
    const isPublic = form.visibility === "Public";
    return (
      <section className="rounded-[20px] border border-[#dbe4f0] bg-[#f8fafc] p-4">
        <p className="text-sm font-semibold">{t("whoCanSee")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-[14px] bg-white p-1 ring-1 ring-[#e4e8ef]">
          {(["Public", "Private"] as const).map((visibility) => (
            <button
              key={visibility}
              type="button"
              aria-pressed={form.visibility === visibility}
              onClick={() => setForm((current) => ({ ...current, visibility }))}
              className={cn(
                "min-h-11 rounded-[11px] px-3 text-sm font-semibold transition",
                form.visibility === visibility ? "bg-[#101216] text-white" : "text-[#59616e] hover:bg-[#f4f6f8]"
              )}
            >
              {t(visibility === "Public" ? "public" : "private")}
            </button>
          ))}
        </div>
        {isPublic ? (
          <div className="mt-4 grid gap-3 text-sm leading-5 text-[#59616e]">
            <div className="rounded-[14px] border border-[#f5c58b] bg-[#fff8ed] p-3 text-xs leading-5 text-[#854d0e]">
              <p>{t("publicPending")}</p>
              <Link href="/terms" target="_blank" className="mt-2 inline-flex font-semibold text-[#155eef] underline-offset-4 hover:underline">
                {t("consentImages")}
              </Link>
            </div>
            <label className="flex cursor-pointer items-start gap-3 rounded-[14px] bg-white p-3.5 ring-1 ring-[#d5dce6] transition hover:ring-[#9dbcf7]">
              <input
                type="checkbox"
                checked={form.publicDisclosureConsent}
                onChange={(event) => setForm((current) => ({ ...current, publicDisclosureConsent: event.target.checked }))}
                className="mt-0.5 size-4 shrink-0 accent-[#2563eb]"
              />
              <span className="text-[#253247]">{t("consentContent")}</span>
            </label>
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-[#59616e]">{t("privateHelp")}</p>
        )}
      </section>
    );
  }

  if (checkingSession) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f6f7fb]"><Loader2 className="animate-spin text-[#2563eb]" /></div>;
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_42%,#f7f5f0_100%)] text-[#101216]">
        <header className="border-b border-[#e8ebef]/90 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6">
            <Link href="/ask" className="flex shrink-0 items-center gap-2" aria-label={`${brand.brandName} ideas`}>
              {brand.logoImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoImage}
                  alt={brand.showBrandNameWithLogo ? "" : brand.brandName}
                  className={brand.showBrandNameWithLogo ? "size-9 rounded-md object-contain" : "h-10 w-auto max-w-40 object-contain"}
                />
              ) : (
                <span className="grid size-8 place-items-center rounded-md bg-[#101828] text-white"><Sparkles size={16} /></span>
              )}
              {brand.showBrandNameWithLogo ? <span className="text-lg font-bold text-[#101828]">{brand.brandName}</span> : null}
            </Link>
            <div className="flex items-center gap-2">
              <PublicLanguageSwitcher compact />
              <Link href="/ask" className="inline-flex h-10 items-center rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#59616e]">
                {t("browseIdeas")}
              </Link>
            </div>
          </div>
        </header>

        <section data-auth-gate="new-discussion" className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[680px] place-items-center px-4 py-10">
          <div className="w-full rounded-[28px] border border-[#dfe6ef] bg-white p-7 text-center shadow-[0_22px_70px_rgba(15,23,42,0.10)] sm:p-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#2563eb]">
              <Sparkles size={24} />
            </div>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-4xl">{t("startDiscussion")}</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#59616e] sm:text-base">{t("loginToPublish")}</p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <EmailLogin
                openSignal={1}
                onSuccess={() => setMessage(t("loggedInDraft"))}
                className="inline-flex h-12 min-w-44 items-center justify-center rounded-full bg-[#101216] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f2937]"
              >
                {copy.common.emailLogin}
              </EmailLogin>
              <Link href="/ask" className="inline-flex h-12 min-w-44 items-center justify-center rounded-full border border-[#dfe3e8] bg-white px-6 text-sm font-semibold text-[#59616e] transition hover:bg-[#f6f7fb]">
                {t("browseIdeas")}
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#eaf3ff_0,#f6f7fb_34%,#f7f5f0_100%)] pb-28 text-[#101216] md:pb-12">
      <header className="hidden border-b border-[#e8ebef]/90 bg-white/86 backdrop-blur-xl md:sticky md:top-0 md:z-40 md:block">
        <div className="mx-auto flex h-16 max-w-[1560px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/ask" className="flex shrink-0 items-center gap-2 pr-4" aria-label={`${brand.brandName} ideas`}>
            {brand.logoImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoImage}
                alt={brand.showBrandNameWithLogo ? "" : brand.brandName}
                className={brand.showBrandNameWithLogo
                  ? "size-9 rounded-md object-contain"
                  : "h-10 w-auto max-w-40 object-contain"}
              />
            ) : (
              <span className="grid size-8 place-items-center rounded-md bg-[#101828] text-white"><Sparkles size={16} /></span>
            )}
            {brand.showBrandNameWithLogo ? (
              <span className="text-lg font-bold tracking-normal text-[#101828]">{brand.brandName}</span>
            ) : null}
          </Link>
          <div className="flex items-center gap-2">
            <PublicLanguageSwitcher compact />
            <CommunityUserMenu
              loginOpenSignal={loginPrompt}
              loginOnSuccess={() => setMessage(t("loggedInDraft"))}
              loginClassName="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb] sm:px-4"
            />
            <Link href="/ask" className="inline-flex h-10 shrink-0 items-center rounded-full border border-[#dfe3e8] bg-white px-3 text-sm font-semibold text-[#59616e] sm:px-4">
              <span className="sm:hidden">{t("browse")}</span>
              <span className="hidden sm:inline">{t("browseIdeas")}</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1560px] gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:grid-cols-[250px_minmax(0,1fr)_330px] lg:px-6">
        <aside className="hidden self-start rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)] lg:sticky lg:top-20 lg:block">
          <p className="text-xs font-semibold uppercase text-[#8b93a1]">{t("joinDiscussion")}</p>
          <h1 className="mt-2 text-xl font-semibold">{t("startDiscussion")}</h1>
          <p className="mt-2 text-sm leading-6 text-[#69707d]">{t("shareProductClearly")}</p>
          <div className="mt-5 grid gap-2">
            {stepKeys.map((item, index) => (
              <div key={item}>
                <button
                  type="button"
                  onClick={() => setStep(index as Step)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition duration-[180ms]",
                    step === index ? "bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/20" : "bg-[#f7f8fa] text-[#59616e] hover:bg-[#eef3ff]"
                  )}
                >
                  <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", step === index ? "bg-white/18 text-white" : "bg-white text-[#69707d]")}>
                    {index + 1}
                  </span>
                  {t(item)}
                </button>
                {index < stepKeys.length - 1 ? <p className="py-1 text-center text-xs text-[#b0b7c3]">↓</p> : null}
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-[#e9f7f3] p-3 text-sm font-semibold text-[#0f766e]">{t("initialReview")}</p>
        </aside>

        <form onSubmit={submit} onPaste={onPaste} className={`${panelClass} min-w-0 p-3.5 sm:p-6 lg:p-7`}>
          {published ? (
            <div className="grid min-h-[560px] place-items-center text-center">
              <div>
                <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#e9f7f3] text-[#0f766e] shadow-sm">
                  <Sparkles size={28} />
                </div>
                <h2 className="mt-5 text-3xl font-semibold leading-tight">{t("submittedTitle")}</h2>
                <p className="mt-3 text-sm font-medium text-[#69707d]">{t("openingSubmission")}</p>
              </div>
            </div>
          ) : (
          <>
          <section className="lg:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101216] shadow-sm ring-1 ring-[#e4e8ef]">
                <Sparkles size={14} className="text-[#2563eb]" />
                {t("quickPost")}
              </p>
              <p className="text-xs font-semibold text-[#8b93a1]">{t("oneMinute")}</p>
            </div>

            <div className="mb-5">
              <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-[11px] font-semibold text-[#315fbd]"><Sparkles size={14} /> {t("initialAssessment")}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight">{t("startDiscussion")}</h2>
              <p className="mt-2 text-sm leading-6 text-[#59616e]">{t("shareIdeaQuickly")}</p>
            </div>

            <div className="grid gap-4">
              <label className="grid gap-2 text-sm font-semibold">{t("productName")}
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t("productPlaceholder")} className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">{t("category")}
                <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={t("categoryPlaceholder")} className={inputClass} />
              </label>
              <label className="grid gap-2 text-sm font-semibold">{t("description")}
                <textarea
                  rows={8}
                  value={form.description}
                  onChange={(event) => {
                    setForm({ ...form, description: event.target.value });
                    setOneSentence(event.target.value);
                  }}
                  placeholder={t("quickDescriptionPlaceholder")}
                  className="min-h-48 resize-none rounded-[18px] border border-transparent bg-[#f8fafc] p-4 text-sm leading-6 outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                />
              </label>
              <EditableIdeaImages
                images={form.imageUrls}
                onChange={updateIdeaImages}
                addLabel={t("uploadImages")}
                preparingLabel={t("preparingImage")}
                uploadingLabel={t("uploadingImage")}
                retryLabel={t("retryUpload")}
                onBusyChange={setImageUploading}
                limitMessage={t("imageLimit")}
                reorderHint={t("reorderImages")}
                errorMessage={t("unablePrepareImage")}
                capacityErrorMessage={(selected, remaining, excess) => t("imageSelectionTooLarge", { selected, remaining, excess })}
                unsupportedFilesMessage={(files) => t("unsupportedFiles", { files })}
              />
              {submissionPrivacyControls()}
            </div>

            {message ? (
              <p className={cn("mt-5 rounded-2xl px-4 py-3 text-sm leading-6", message === t("ideaLive") || message === t("loggedInDraft") ? "bg-[#ecfdf5] text-[#0f766e]" : "bg-[#fff7ed] text-[#9a3412]")}>
                {message}
              </p>
            ) : null}

            <button disabled={submitting || imageUploading} className={`mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60 ${primaryButton}`}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
              {submitting ? t("submitting") : t(form.visibility === "Public" ? "publishIdea" : "submitReview")}
            </button>
          </section>

          <div className="hidden lg:block">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#101216] shadow-sm ring-1 ring-[#e4e8ef]">
              <Sparkles size={14} className="text-[#2563eb]" />
              {t("publishIdea")}
            </p>
          </div>

          <div className="mb-3 lg:hidden">
            <div className="flex items-center justify-between text-xs font-semibold text-[#69707d]">
              <span>{t("stepProgress", { current: step + 1, total: stepKeys.length })}</span>
              <span className="text-[#315fbd]">{t(mobileStepKeys[step])}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e8edf5]">
              <div className="h-full rounded-full bg-[#2563eb] transition-all duration-[180ms]" style={{ width: `${((step + 1) / stepKeys.length) * 100}%` }} />
            </div>
          </div>

          <p className="inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-3 py-1 text-[11px] font-semibold text-[#315fbd] sm:text-xs"><Sparkles size={14} /> {usedText}</p>

          {step === 0 ? (
            <section className="mt-4 sm:mt-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold leading-tight sm:text-4xl">{t("startDiscussion")}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[#59616e] sm:mt-3 sm:text-base sm:leading-7">
                    {t("shareAssessment")}
                  </p>
                </div>
                <p className="w-fit whitespace-nowrap rounded-2xl bg-[#f7f8fa] px-3 py-2 text-xs font-semibold text-[#59616e]">
                  {t("estimatedTime")} <span className="ml-1 text-[#101216]">{t("oneMinute")}</span>
                </p>
              </div>
              <div className="mt-5 grid gap-3 sm:mt-7 sm:gap-4">
                <label className="grid gap-2 text-sm font-semibold">{t("productName")}
                  <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder={t("productPlaceholder")} className={inputClass} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">{t("oneSentenceIdea")}
                  <input value={oneSentence} onChange={(event) => setOneSentence(event.target.value)} placeholder={t("oneSentencePlaceholder")} className={inputClass} />
                </label>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{t("showIdea")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">{t("showIdeaHelp")}</p>
              <div className="mt-6">
                <EditableIdeaImages
                  images={form.imageUrls}
                  onChange={updateIdeaImages}
                  addLabel={t("uploadImages")}
                  preparingLabel={t("preparingImage")}
                  uploadingLabel={t("uploadingImage")}
                  retryLabel={t("retryUpload")}
                  onBusyChange={setImageUploading}
                  limitMessage={t("imageLimit")}
                  reorderHint={t("reorderImages")}
                  errorMessage={t("unablePrepareImage")}
                  capacityErrorMessage={(selected, remaining, excess) => t("imageSelectionTooLarge", { selected, remaining, excess })}
                  unsupportedFilesMessage={(files) => t("unsupportedFiles", { files })}
                />
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{t("helpUnderstand")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">{t("addDetails")}</p>
              <div className="mt-6 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">{t("description")} <span className="font-normal text-[#8b93a1]">{t("optional")}</span>
                  <textarea rows={7} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder={t("descriptionPlaceholder")} className="min-h-44 resize-none rounded-[18px] border border-transparent bg-[#f8fafc] p-4 text-sm leading-6 outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10" />
                </label>
                <label className="grid gap-2 text-sm font-semibold sm:max-w-md">{t("category")} <span className="font-normal text-[#8b93a1]">{t("optional")}</span>
                  <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder={t("categoryPlaceholder")} className={inputClass} />
                </label>
                <div>
                  <p className="text-sm font-semibold">{t("questionType")} <span className="font-normal text-[#8b93a1]">{t("optional")}</span></p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {communityQuestions.map((question) => (
                      <label key={question} className={cn("flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-3 text-sm transition duration-[180ms]", form.questions.includes(question) ? "border-[#bfdbfe] bg-[#f2f7ff] text-[#1d4ed8]" : "border-[#e8ebef] bg-white text-[#59616e] hover:border-[#cbd5e1]")}>
                        <input type="checkbox" checked={form.questions.includes(question)} onChange={() => toggleQuestion(question)} className="size-4 accent-[#2563eb]" />
                        {t(questionTranslationKeys[question])}
                      </label>
                    ))}
                  </div>
                </div>
                {form.questions.includes("Other") ? (
                  <textarea
                    rows={3}
                    value={form.otherQuestion}
                    onChange={(event) => setForm({ ...form, otherQuestion: event.target.value })}
                    placeholder={t("otherQuestionPlaceholder")}
                    className="min-h-24 resize-y rounded-[16px] border border-transparent bg-[#f8fafc] p-4 text-sm leading-6 outline-none transition duration-[180ms] hover:bg-white hover:ring-1 hover:ring-[#e4e8ef] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                  />
                ) : null}
                <div className="rounded-[20px] border border-[#dbeafe] bg-[#eff6ff] p-4 text-sm leading-6 text-[#315fbd]">
                  <p className="font-semibold text-[#1d4ed8]">{t("publicDiscussion")}</p>
                  <p className="mt-1">{t("publicDiscussionHelp")}</p>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="mt-5">
              <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">{t("readySubmit")}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#59616e]">{t("readySubmitHelp")}</p>
              <div className="mt-6 rounded-[20px] border border-[#e4e8ef] bg-[#fbfcff] p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#69707d]">
                  {form.category ? <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{form.category}</span> : null}
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-[#e8ebef]">{t(form.visibility === "Public" ? "public" : "private")}</span>
                  <span className="rounded-full bg-[#e9f7f3] px-2.5 py-1 text-[#0f766e]">{t("initialAssessmentBadge")}</span>
                </div>
                <h3 className="mt-3 text-2xl font-semibold">{form.title || t("productName")}</h3>
                <p className="mt-2 text-sm leading-6 text-[#59616e]">{form.description || oneSentence || t("summaryPlaceholder")}</p>
                {imagePreviews.length > 0 ? (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {imagePreviews.map((image) => (
                      <Image key={image.name} src={image.url} alt={image.name} width={112} height={84} unoptimized className="aspect-[4/3] w-28 shrink-0 rounded-xl bg-[#f4f6f8] object-contain" />
                    ))}
                  </div>
                ) : null}
                {form.questions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {form.questions.map((question) => (
                      <span key={question} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#59616e] ring-1 ring-[#e8ebef]">
                        {question === "Other" && form.otherQuestion.trim()
                          ? form.otherQuestion.trim()
                          : t(questionTranslationKeys[question])}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
              <div className="mt-4">{submissionPrivacyControls()}</div>
            </section>
          ) : null}

          {message ? (
            <p className={cn("mt-5 rounded-2xl px-4 py-3 text-sm leading-6", message === t("ideaLive") || message === t("loggedInDraft") ? "bg-[#ecfdf5] text-[#0f766e]" : "bg-[#fff7ed] text-[#9a3412]")}>
              {message}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            {step > 0 ? (
              <button type="button" onClick={() => setStep((current) => Math.max(current - 1, 0) as Step)} className="h-11 rounded-full border border-[#dfe3e8] bg-white px-5 text-sm font-semibold text-[#59616e] transition duration-[180ms] hover:bg-[#f6f7fb]">
                {t("back")}
              </button>
            ) : <span className="hidden sm:block" />}
            {step < 3 ? (
              <button type="button" onClick={continueStep} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold ${primaryButton}`}>
                {t(step === 2 ? "continueCloser" : "next")} <ArrowRight size={16} />
              </button>
            ) : (
              <button disabled={submitting || imageUploading} className={`inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold disabled:opacity-60 ${primaryButton}`}>
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {submitting ? t("submitting") : t(form.visibility === "Public" ? "publishIdea" : "submitReview")}
              </button>
            )}
          </div>
          </div>
          </>
          )}
        </form>

        <aside className="hidden space-y-3 self-start xl:sticky xl:top-20 xl:block">
          <section className="rounded-[22px] border border-[#dfe6ef] bg-white p-4 shadow-[0_14px_44px_rgba(15,23,42,0.08)]">
            <h2 className="text-lg font-semibold">{t("afterPublish")}</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {nextSteps.map(([item, Icon]) => (
                <p key={item} className="flex gap-3 rounded-2xl bg-[#f7f8fa] p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] ring-1 ring-[#e4e8ef]"><Icon size={15} /></span>
                  {t(item)}
                </p>
              ))}
            </div>
          </section>
          <section className="rounded-[22px] border border-[#dbeafe] bg-[#eff6ff] p-4 shadow-sm shadow-[#2563eb]/8">
            <h2 className="text-lg font-semibold text-[#1d4ed8]">{t("initialReview")}</h2>
            <p className="mt-3 text-sm leading-6 text-[#315fbd]">{t("publicIdeasHelp")}</p>
          </section>
          <section className="rounded-[22px] border border-[#e4e8ef] bg-white p-4">
            <h2 className="text-lg font-semibold">{t("helpfulTips")}</h2>
            <div className="mt-4 grid gap-2 text-sm text-[#59616e]">
              {(["plainLanguage", "addImagesTip", "askCostTip"] as const).map((item) => (
                <span key={item} className="inline-flex items-center gap-2 rounded-2xl bg-[#f7f8fa] p-3"><CheckCircle2 size={15} className="text-[#2563eb]" /> {t(item)}</span>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}
