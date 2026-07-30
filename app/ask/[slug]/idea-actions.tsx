"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, MessageCircle, Pencil, Share2, Star, ThumbsUp, Trash2, X } from "lucide-react";
import { CommunityIdea, communityQuestions, CommunityQuestion } from "@/lib/community";
import EmailLogin from "@/components/email-login";
import PublicUploadImagePreview from "@/components/public-upload-image-preview";
import IdeaSharePanel from "./idea-share-panel";
import { communityActionHeaders } from "@/lib/client/community-action";
import { preparePublicImage } from "@/lib/public-image-processing";
import { usePublicLanguage } from "@/components/public-language-provider";
import { translateNewIdea, type NewIdeaKey } from "@/lib/new-idea-i18n";

type SessionUser = { id: string; name: string; email: string; username: string };
type IdeaActionMode = "bar" | "comment";
type IdeaActionLabels = { likeText: string; commentText: string; interestedText: string; shareText: string };
const quickEmojis = ["💡", "🔥", "👍", "❤️", "👀", "🙌"];
const questionTranslationKeys: Record<CommunityQuestion, NewIdeaKey> = {
  "Can this be manufactured?": "qManufactured",
  "Estimated Cost?": "qCost",
  "Material Suggestion?": "qMaterial",
  "MOQ Estimate?": "qMoq",
  "Factory Recommendation?": "qFactory",
  Other: "qOther"
};
type EditImagePreview = { name: string; url: string };

export default function IdeaActions({ idea, mode = "bar", compact = false, labels }: { idea: CommunityIdea; mode?: IdeaActionMode; compact?: boolean; labels: IdeaActionLabels }) {
  const { language } = usePublicLanguage();
  const isChinese = language === "zh-CN";
  const [user, setUser] = useState<SessionUser | null>(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [body, setBody] = useState("");
  const [reactionState, setReactionState] = useState({ helpful: false, liked: false, interested: false });
  const [editOpen, setEditOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: idea.title,
    category: idea.category,
    description: idea.description,
    country: idea.country,
    questions: idea.questions,
    otherQuestion: idea.otherQuestion || ""
  });
  const [editImages, setEditImages] = useState<EditImagePreview[]>(
    idea.imageUrls.map((url, index) => ({ name: `Image ${index + 1}`, url }))
  );
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const isOwner = Boolean(user && user.id === idea.author.id);

  useEffect(() => {
    function refreshSession() {
      fetch("/api/community/session")
        .then((response) => response.json())
        .then((data) => setUser(data.user || null))
        .catch(() => setUser(null))
        .finally(() => setSessionChecked(true));
    }

    refreshSession();
    window.addEventListener("tyora:community-login", refreshSession);
    return () => window.removeEventListener("tyora:community-login", refreshSession);
  }, []);

  useEffect(() => {
    fetch(`/api/community/ideas/${idea.slug}/reaction`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success) setReactionState(data.data);
      })
      .catch(() => setReactionState({ helpful: false, liked: false, interested: false }));
  }, [idea.slug, user?.id]);

  function appendCommentEmoji(emoji: string) {
    setBody((current) => `${current}${current ? " " : ""}${emoji}`);
    window.setTimeout(() => commentRef.current?.focus(), 0);
  }

  function appendEditEmoji(emoji: string) {
    setEditForm((current) => ({ ...current, description: `${current.description}${current.description ? " " : ""}${emoji}` }));
  }

  function toggleEditQuestion(question: CommunityQuestion) {
    setEditForm((current) => ({
      ...current,
      questions: current.questions.includes(question)
        ? current.questions.filter((item) => item !== question)
        : [...current.questions, question]
    }));
  }

  async function addEditImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    const remaining = Math.max(0, 5 - editImages.length);
    if (!remaining) {
      setMessage(isChinese ? "每个帖子最多上传 5 张图片。" : "You can upload up to 5 images.");
      return;
    }
    setBusy("edit-images");
    setMessage("");
    try {
      const prepared = await Promise.all(
        files.slice(0, remaining).map(async (file, index) => {
          const image = await preparePublicImage(file, {
            maxDimension: 1600,
            quality: 0.86,
            maxDataUrlLength: 880000,
            errors: {
              read: isChinese ? "无法读取这张图片。" : "Unable to read this image.",
              unsupported: isChinese ? "浏览器不支持这张图片的格式。" : "This image format is not supported by your browser.",
              prepare: isChinese ? "无法处理这张图片。" : "Unable to prepare this image.",
              tooLarge: isChinese ? "图片处理后仍然过大，请选择尺寸更小的图片。" : "This image is still too large after processing. Please choose a smaller image."
            }
          });
          return {
            name: `${Date.now()}-${index}-${image.file.name}`,
            url: image.dataUrl
          };
        })
      );
      setEditImages((current) => [...current, ...prepared].slice(0, 5));
      if (files.length > remaining) {
        setMessage(isChinese ? "每个帖子最多保留 5 张图片，多余图片未添加。" : "Only the first 5 images were kept.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : (isChinese ? "无法处理图片。" : "Unable to prepare images."));
    } finally {
      setBusy("");
    }
  }

  async function postComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!sessionChecked) return;
    if (!user) {
      setMessage("Email login is required to comment.");
      return;
    }
    setBusy("comment");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}/comments`, {
        method: "POST",
        headers: communityActionHeaders(`comment:${idea.id}`),
        body: JSON.stringify({ body })
      });
      if (!response.ok) throw new Error("Unable to comment.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to comment.");
    } finally {
      setBusy("");
    }
  }

  async function react(type: "Helpful" | "Interested") {
    if (!sessionChecked) return;
    if (!user) {
      setMessage("Email login is required.");
      return;
    }
    setBusy(type);
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}/reaction`, {
        method: "POST",
        headers: communityActionHeaders(`reaction:${idea.id}:${type}`),
        body: JSON.stringify({ type })
      });
      if (!response.ok) throw new Error("Unable to update.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update.");
    } finally {
      setBusy("");
    }
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isOwner) return;
    if (editForm.questions.includes("Other") && !editForm.otherQuestion.trim()) {
      setMessage(isChinese ? "请填写你希望 TYORA 回答的自定义问题。" : "Please enter your custom question for TYORA.");
      return;
    }
    setBusy("edit");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          imageUrls: editImages.map((image) => image.url)
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to edit discussion.");
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to edit discussion.");
    } finally {
      setBusy("");
    }
  }

  async function withdrawIdea() {
    if (!isOwner) return;
    const confirmed = window.confirm("Withdraw this discussion?\n\nIt will no longer appear publicly. This is not reversible from the public page.");
    if (!confirmed) return;
    setBusy("withdraw");
    setMessage("");
    try {
      const response = await fetch(`/api/community/ideas/${idea.slug}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to withdraw discussion.");
      window.location.href = "/ask";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to withdraw discussion.");
    } finally {
      setBusy("");
    }
  }

  function editDialog() {
    if (!editOpen) return null;
    return (
      <div className="fixed inset-0 z-50 grid place-items-center bg-[#101216]/45 px-3 py-4 backdrop-blur-sm">
        <form onSubmit={saveEdit} className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-2xl shadow-[#101216]/25 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8b93a1]">
                {isChinese ? "编辑帖子" : "Edit discussion"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-[#101216]">
                {isChinese ? "更新你的创意" : "Update your idea"}
              </h2>
              <p className="mt-1 text-xs leading-5 text-[#69707d]">
                {isChinese ? "修改后将重新提交 TYORA 审核。" : "Saving changes sends the discussion back to TYORA review."}
              </p>
            </div>
            <button type="button" onClick={() => setEditOpen(false)} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#69707d]">
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-semibold text-[#101216]">
              {isChinese ? "产品名称" : "Product name"}
              <input required value={editForm.title} onChange={(event) => setEditForm({ ...editForm, title: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#101216]">
              {isChinese ? "分类" : "Category"}
              <input required value={editForm.category} onChange={(event) => setEditForm({ ...editForm, category: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
            </label>
            <label className="grid gap-2 text-sm font-semibold text-[#101216]">
              {isChinese ? "详细描述" : "Description"}
              <textarea required value={editForm.description} onChange={(event) => setEditForm({ ...editForm, description: event.target.value })} rows={6} className="min-h-32 resize-y rounded-2xl border border-[#dfe3e8] p-3 text-sm leading-6 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
            </label>
            <div className="flex flex-wrap gap-2">
              {quickEmojis.map((emoji) => (
                <button key={emoji} type="button" onClick={() => appendEditEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                  {emoji}
                </button>
              ))}
            </div>

            <label className="grid gap-2 text-sm font-semibold text-[#101216]">
              {isChinese ? "国家" : "Country"}
              <input required value={editForm.country} onChange={(event) => setEditForm({ ...editForm, country: event.target.value })} className="h-11 rounded-2xl border border-[#dfe3e8] px-3 text-sm outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#101216]">{isChinese ? "创意图片" : "Idea images"}</p>
                <span className="text-xs text-[#8b93a1]">{editImages.length}/5</span>
              </div>
              <label className="mt-2 flex min-h-24 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-[#93b4f8] bg-[#f8fbff] px-4 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eef6ff]">
                {busy === "edit-images" ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
                {busy === "edit-images"
                  ? (isChinese ? "正在处理图片…" : "Preparing images…")
                  : (isChinese ? "添加或更换图片" : "Add or replace images")}
                <input disabled={busy === "edit-images"} type="file" accept="image/*" multiple className="sr-only" onChange={addEditImages} />
              </label>
              {editImages.length ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {editImages.map((image, index) => (
                    <PublicUploadImagePreview
                      key={`${image.name}-${index}`}
                      src={image.url}
                      alt={image.name}
                      index={index}
                      onRemove={() => setEditImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      removeLabel={isChinese ? `删除第 ${index + 1} 张图片` : `Remove image ${index + 1}`}
                    />
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-[#8b93a1]">{isChinese ? "当前帖子没有图片。" : "This discussion has no images."}</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-[#101216]">
                {isChinese ? "你希望 TYORA 回答什么问题？" : "What would you like TYORA to answer?"}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {communityQuestions.map((question) => (
                  <label key={question} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition ${editForm.questions.includes(question) ? "border-[#bfdbfe] bg-[#f2f7ff] text-[#1d4ed8]" : "border-[#e8ebef] bg-white text-[#59616e]"}`}>
                    <input type="checkbox" checked={editForm.questions.includes(question)} onChange={() => toggleEditQuestion(question)} className="size-4 accent-[#2563eb]" />
                    {translateNewIdea(language, questionTranslationKeys[question])}
                  </label>
                ))}
              </div>
              {editForm.questions.includes("Other") ? (
                <textarea
                  rows={3}
                  value={editForm.otherQuestion}
                  onChange={(event) => setEditForm({ ...editForm, otherQuestion: event.target.value })}
                  placeholder={translateNewIdea(language, "otherQuestionPlaceholder")}
                  className="mt-2 w-full resize-y rounded-2xl border border-[#dfe3e8] p-3 text-sm leading-6 outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                />
              ) : null}
            </div>
          </div>

          {message ? <p className="mt-3 rounded-2xl bg-[#fff7ed] px-4 py-3 text-sm text-[#9a3412]">{message}</p> : null}
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setEditOpen(false)} className="h-11 rounded-full border border-[#dfe3e8] px-5 text-sm font-semibold text-[#59616e]">
              {isChinese ? "取消" : "Cancel"}
            </button>
            <button disabled={busy === "edit" || busy === "edit-images"} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white disabled:opacity-60">
              {busy === "edit" ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />}
              {isChinese ? "保存修改" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (mode === "comment") {
    return (
      <form onSubmit={postComment} className="rounded-[20px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4">
        <p className="text-sm font-semibold">Leave a reply</p>
        <textarea
          ref={commentRef}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder={user ? "Add a manufacturing question, answer, or practical note." : "Email login required to comment."}
          className="mt-3 w-full resize-none rounded-2xl border border-[#dfe3e8] p-3 outline-none focus:border-[#101216]"
        />
        {user ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {quickEmojis.map((emoji) => (
              <button key={emoji} type="button" onClick={() => appendCommentEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                {emoji}
              </button>
            ))}
          </div>
        ) : null}
        {!sessionChecked ? (
          <button disabled className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white opacity-60">
            <Loader2 className="animate-spin" size={15} /> Checking login
          </button>
        ) : user ? (
          <button className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
            {busy === "comment" ? <Loader2 className="animate-spin" size={15} /> : <MessageCircle size={15} />} {labels.commentText}
          </button>
        ) : (
          <EmailLogin className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-[#101216] px-4 text-sm font-semibold text-white">
            <MessageCircle size={15} /> Email Login to {labels.commentText}
          </EmailLogin>
        )}
        {message ? <p className="mt-2 text-sm text-[#8a5a00]">{message}</p> : null}
      </form>
    );
  }

  if (compact) {
    return (
      <div data-testid="compact-action-bar" className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#edf0f4] pt-3 text-sm font-semibold text-[#59616e]">
        {isOwner ? (
          <>
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#dfe3e8] bg-white px-3 text-xs transition hover:bg-[#f7f8fa]">
              <Pencil size={14} /> Edit
            </button>
            <button type="button" disabled={busy === "withdraw"} onClick={() => void withdrawIdea()} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#fee2e2] bg-[#fff8f9] px-3 text-xs text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
              {busy === "withdraw" ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} Withdraw
            </button>
          </>
        ) : null}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs opacity-60">
            <Loader2 className="animate-spin" size={14} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Helpful")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${reactionState.helpful || reactionState.liked ? "bg-[#e8f0ff] text-[#155eef]" : "bg-[#f6f7fb] hover:bg-[#eef2f7]"}`}>
            {busy === "Helpful" ? <Loader2 className="animate-spin" size={14} /> : <ThumbsUp size={14} />} {idea.helpfulCount} Helpful
          </button>
        ) : (
          <EmailLogin className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
            <ThumbsUp size={14} /> {idea.helpfulCount} Helpful
          </EmailLogin>
        )}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs opacity-60">
            <Loader2 className="animate-spin" size={14} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Interested")} className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs transition ${reactionState.interested ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-[#f6f7fb] hover:bg-[#eef2f7]"}`}>
            {busy === "Interested" ? <Loader2 className="animate-spin" size={14} /> : <Star size={14} />} {idea.interestedCount} {labels.interestedText}
          </button>
        ) : (
          <EmailLogin className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
            <Star size={14} /> {idea.interestedCount} {labels.interestedText}
          </EmailLogin>
        )}
        <button type="button" onClick={() => setShareOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#f6f7fb] px-3 text-xs transition hover:bg-[#eef2f7]">
          <Share2 size={14} /> {idea.shareCount} {labels.shareText}
        </button>

        {editDialog()}
        <IdeaSharePanel open={shareOpen} ideaId={idea.id} ideaSlug={idea.slug} ideaTitle={idea.title} onClose={() => setShareOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isOwner ? (
        <section className="rounded-[24px] border border-[#e8ebef] bg-white p-4 shadow-sm shadow-[#101216]/4">
          <p className="text-sm font-semibold">Your discussion</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setEditOpen(true)} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
              <Pencil size={15} /> Edit
            </button>
            <button type="button" disabled={busy === "withdraw"} onClick={() => void withdrawIdea()} className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#fee2e2] bg-[#fff1f2] px-4 text-sm font-semibold text-[#be123c] transition hover:bg-[#ffe4e6] disabled:opacity-60">
              {busy === "withdraw" ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />} Withdraw
            </button>
          </div>
        </section>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-3">
        {!sessionChecked ? (
          <button disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold opacity-60">
            <Loader2 className="animate-spin" size={16} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Helpful")} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${reactionState.helpful || reactionState.liked ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dfe3e8] bg-white hover:bg-[#f7f8fa]"}`}>
            {busy === "Helpful" ? <Loader2 className="animate-spin" size={16} /> : <ThumbsUp size={16} />} {idea.helpfulCount} Helpful
          </button>
        ) : (
          <EmailLogin className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            <ThumbsUp size={16} /> {idea.helpfulCount} Helpful
          </EmailLogin>
        )}
        {!sessionChecked ? (
          <button disabled className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold opacity-60">
            <Loader2 className="animate-spin" size={16} /> Checking
          </button>
        ) : user ? (
          <button onClick={() => void react("Interested")} className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${reactionState.interested ? "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]" : "border-[#dfe3e8] bg-white hover:bg-[#f7f8fa]"}`}>
            {busy === "Interested" ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} />} {idea.interestedCount} {labels.interestedText}
          </button>
        ) : (
          <EmailLogin className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
            <Star size={16} /> {idea.interestedCount} {labels.interestedText}
          </EmailLogin>
        )}
        <button type="button" onClick={() => setShareOpen(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold transition hover:bg-[#f7f8fa]">
          <Share2 size={16} /> {idea.shareCount} {labels.shareText}
        </button>
      </div>

      {editDialog()}
      <IdeaSharePanel open={shareOpen} ideaId={idea.id} ideaSlug={idea.slug} ideaTitle={idea.title} onClose={() => setShareOpen(false)} />
    </div>
  );
}
