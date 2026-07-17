"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, FileText, Loader2, LockKeyhole, Upload, X } from "lucide-react";
import EmailLogin from "@/components/email-login";
import type { CommunityPageContent, CustomPageContent } from "@/lib/storage";

type EligibleIdea = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  assessment: Record<string, unknown>;
};

type Props = {
  content: CustomPageContent;
  communityContent: CommunityPageContent;
  categories: string[];
  eligibleIdea: EligibleIdea | null;
  signedIn: boolean;
  sessionEmail?: string;
};

export default function CustomInquiryClient({
  content,
  communityContent,
  categories,
  eligibleIdea,
  signedIn,
  sessionEmail = ""
}: Props) {
  const [form, setForm] = useState({
    productName: eligibleIdea?.title || "",
    productDescription: eligibleIdea?.description || "",
    category: eligibleIdea?.category || categories[0] || "",
    quantity: "",
    budget: "",
    targetMarket: "",
    timeline: "",
    contactEmail: sessionEmail,
    contactWhatsapp: ""
  });
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [submittedId, setSubmittedId] = useState("");
  const assessmentSummary = useMemo(() => {
    const assessment = eligibleIdea?.assessment;
    return [
      [communityContent.assessmentLabels.feasibility, assessment?.manufacturingFeasible],
      [communityContent.assessmentLabels.estimatedCostRange, assessment?.estimatedCostRange],
      [communityContent.assessmentLabels.estimatedMoq, assessment?.estimatedMoq],
      [communityContent.assessmentLabels.confidence, assessment?.confidence]
    ].filter((entry): entry is [string, string] => typeof entry[1] === "string" && Boolean(entry[1]));
  }, [eligibleIdea?.assessment, communityContent.assessmentLabels]);

  function selectFiles(nextFiles: FileList | null) {
    if (!nextFiles) return;
    const next = [...files, ...Array.from(nextFiles)].slice(0, 5);
    setFiles(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!signedIn) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/custom", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          ideaSlug: eligibleIdea?.slug || ""
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Unable to submit private Custom inquiry.");
      }
      const inquiryId = payload.data.id as string;
      for (const file of files) {
        const upload = new FormData();
        upload.set("file", file);
        const fileResponse = await fetch(`/api/community/custom/${encodeURIComponent(inquiryId)}/files`, {
          method: "POST",
          body: upload
        });
        const filePayload = await fileResponse.json();
        if (!fileResponse.ok || !filePayload.success) {
          throw new Error(filePayload.message || "The inquiry was saved, but a private file could not be uploaded.");
        }
      }
      setSubmittedId(inquiryId);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to submit private Custom inquiry.");
    } finally {
      setBusy(false);
    }
  }

  if (submittedId) {
    return (
      <section className="rounded-[24px] border border-[#b7eadb] bg-white p-5 shadow-sm sm:p-6">
        <CheckCircle2 className="text-[#0f766e]" size={28} />
        <h2 className="mt-4 text-2xl font-semibold">{content.successTitle}</h2>
        <p className="mt-2 text-sm leading-6 text-[#59616e]">{content.successBody}</p>
        <Link href="/me#custom-inquiries" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
          View in My TYORA
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[24px] border border-[#dfe6ef] bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.09)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf3ff] text-[#2563eb]"><LockKeyhole size={18} /></span>
        <div>
          <h2 className="text-2xl font-semibold">{content.formTitle}</h2>
          <p className="mt-1 text-sm leading-6 text-[#59616e]">{content.formDescription}</p>
        </div>
      </div>

      {eligibleIdea ? (
        <div className="mt-5 rounded-2xl border border-[#cfe2ff] bg-[#f5f9ff] p-4">
          <p className="text-xs font-semibold uppercase text-[#315fbd]">Approved Idea attached</p>
          <p className="mt-1 font-semibold">{eligibleIdea.title}</p>
          <dl className="mt-3 grid gap-2 sm:grid-cols-2">
            {assessmentSummary.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-white p-3">
                <dt className="text-xs font-semibold text-[#69707d]">{label}</dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs leading-5 text-[#69707d]">{String(eligibleIdea.assessment.disclaimer || communityContent.assessmentDisclaimer)}</p>
        </div>
      ) : null}

      {!signedIn ? (
        <div className="mt-5 rounded-2xl bg-[#f7f8fa] p-4">
          <p className="text-sm leading-6 text-[#59616e]">Email login is required so the private inquiry remains linked only to your account.</p>
          <EmailLogin refreshOnSuccess className="mt-3 inline-flex min-h-11 items-center justify-center rounded-full bg-[#101216] px-5 text-sm font-semibold text-white">
            Email Login
          </EmailLogin>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Product name
              <input required value={form.productName} onChange={(event) => setForm({ ...form, productName: event.target.value })} className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Category
              <select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="min-h-11 rounded-xl border border-[#dfe3e8] bg-white px-3 outline-none focus:border-[#2563eb]">
                <option value="">Choose a category</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
          </div>
          <label className="grid gap-2 text-sm font-semibold">Private product description
            <textarea required rows={6} value={form.productDescription} onChange={(event) => setForm({ ...form, productDescription: event.target.value })} className="min-h-36 resize-y rounded-xl border border-[#dfe3e8] p-3 outline-none focus:border-[#2563eb]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-semibold">Target quantity
              <input required value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} placeholder="500 units" className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Target market
              <input required value={form.targetMarket} onChange={(event) => setForm({ ...form, targetMarket: event.target.value })} placeholder="United States" className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Budget range <span className="font-normal text-[#8b93a1]">optional</span>
              <input value={form.budget} onChange={(event) => setForm({ ...form, budget: event.target.value })} className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Target timeline <span className="font-normal text-[#8b93a1]">optional</span>
              <input value={form.timeline} onChange={(event) => setForm({ ...form, timeline: event.target.value })} className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">Contact email
              <input type="email" value={form.contactEmail} onChange={(event) => setForm({ ...form, contactEmail: event.target.value })} className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
            <label className="grid gap-2 text-sm font-semibold">WhatsApp <span className="font-normal text-[#8b93a1]">optional</span>
              <input value={form.contactWhatsapp} onChange={(event) => setForm({ ...form, contactWhatsapp: event.target.value })} placeholder="+1 ..." className="min-h-11 rounded-xl border border-[#dfe3e8] px-3 outline-none focus:border-[#2563eb]" />
            </label>
          </div>
          <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#a8b9d4] bg-[#f8fbff] px-4 text-center">
            <Upload size={19} className="text-[#2563eb]" />
            <span className="mt-2 text-sm font-semibold">Add confidential files</span>
            <span className="mt-1 text-xs text-[#69707d]">Up to 5 JPG, PNG, WebP, or PDF files. Maximum 20MB each.</span>
            <input className="sr-only" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" multiple onChange={(event) => selectFiles(event.target.files)} />
          </label>
          {files.length ? (
            <div className="grid gap-2">
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex min-h-11 items-center gap-2 rounded-xl border border-[#e4e8ef] px-3 text-sm">
                  <FileText size={15} className="shrink-0 text-[#59616e]" />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  <button type="button" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="flex size-9 items-center justify-center rounded-full hover:bg-[#f3f4f6]"><X size={15} /></button>
                </div>
              ))}
            </div>
          ) : null}
          <p className="rounded-2xl bg-[#eef7f4] p-3 text-xs leading-5 text-[#315f56]">{content.privacyNote}</p>
          {message ? <p className="rounded-2xl bg-[#fff1f2] p-3 text-sm text-[#be123c]">{message}</p> : null}
          <button disabled={busy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-6 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? <Loader2 className="animate-spin" size={16} /> : <LockKeyhole size={16} />}
            {content.submitCtaText}
          </button>
        </form>
      )}
    </section>
  );
}
