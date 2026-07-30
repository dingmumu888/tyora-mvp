"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarClock, EyeOff, Loader2, Plus, RefreshCcw, Save, Trash2, TrendingUp } from "lucide-react";
import { useAdminLanguage } from "@/components/admin/admin-language-provider";
import { AdminSourceWeeklyProduct } from "@/lib/source-weekly";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

function dateTime(value: string | undefined, language: "en" | "zh") {
  if (!value) return "—";
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function displayStatus(product: AdminSourceWeeklyProduct) {
  if (product.status === "LIVE" && product.expiresAt && new Date(product.expiresAt) <= new Date()) {
    return "EXPIRED";
  }
  return product.status;
}

function remainingLabel(product: AdminSourceWeeklyProduct) {
  if (!product.expiresAt) return "Not published";
  const remaining = new Date(product.expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "Expired";
  const days = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return `${days} day${days === 1 ? "" : "s"} remaining`;
}

export default function SourceWeeklyAdmin() {
  const { language, t } = useAdminLanguage();
  const [products, setProducts] = useState<AdminSourceWeeklyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/source-weekly", { cache: "no-store" });
      const payload = await response.json() as ApiResponse<AdminSourceWeeklyProduct[]>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(t(payload.message || "Unable to load weekly products."));
      }
      setProducts(payload.data);
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : "Unable to load weekly products."));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const liveCount = useMemo(() => products.filter((product) => displayStatus(product) === "LIVE").length, [products]);

  async function createProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("publishNow", formData.get("publishNow") === "on" ? "true" : "false");
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/source-weekly", { method: "POST", body: formData });
      const payload = await response.json() as ApiResponse<AdminSourceWeeklyProduct>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(t(payload.message || "Unable to create weekly product."));
      }
      setProducts((current) => [payload.data!, ...current]);
      form.reset();
      setMessage(t("Weekly product created."));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : "Unable to create weekly product."));
    } finally {
      setCreating(false);
    }
  }

  async function updateText(event: FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/source-weekly/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });
      const payload = await response.json() as ApiResponse<AdminSourceWeeklyProduct>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(t(payload.message || "Unable to update weekly product."));
      }
      setProducts((current) => current.map((product) => product.id === id ? payload.data! : product));
      setMessage(t("Saved."));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : "Unable to update weekly product."));
    } finally {
      setBusyId("");
    }
  }

  async function runAction(id: string, action: "publish" | "unpublish" | "extend") {
    setBusyId(id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/source-weekly/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action })
      });
      const payload = await response.json() as ApiResponse<AdminSourceWeeklyProduct>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(t(payload.message || "Unable to update weekly product."));
      }
      setProducts((current) => current.map((product) => product.id === id ? payload.data! : product));
      setMessage(t(action === "extend" ? "Display extended by 7 days." : action === "publish" ? "Published for 7 days." : "Product unpublished."));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : "Unable to update weekly product."));
    } finally {
      setBusyId("");
    }
  }

  async function removeProduct(product: AdminSourceWeeklyProduct) {
    const confirmation = language === "zh"
      ? `确定删除 ${product.productCode} 吗？商品图片和详细资料将被删除。`
      : `Delete ${product.productCode}? The image and product details will be removed.`;
    if (!window.confirm(confirmation)) return;
    setBusyId(product.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/source-weekly/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      const payload = await response.json() as ApiResponse<{ id: string }>;
      if (!response.ok || !payload.success) {
        throw new Error(t(payload.message || "Unable to delete weekly product."));
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage(t("Deleted."));
    } catch (error) {
      setMessage(t(error instanceof Error ? error.message : "Unable to delete weekly product."));
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#d0d5dd] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#eaecf0] bg-[#f8faff] p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-[#155eef]"><TrendingUp size={16} /> {t("Weekly hot products")}</p>
          <h2 className="mt-1 text-xl font-bold text-[#101828]">{t("Source storefront")}</h2>
          <p className="mt-1 text-sm text-[#667085]">{t("Products hide automatically after 7 days and are permanently cleaned after 30 days.")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#ecfdf3] px-3 py-1.5 text-xs font-semibold text-[#067647]">{liveCount} {t("live")}</span>
          <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold">
            <RefreshCcw size={14} /> {t("Refresh")}
          </button>
        </div>
      </div>

      <form onSubmit={createProduct} className="grid gap-3 border-b border-[#eaecf0] p-4 lg:grid-cols-2">
        <div className="grid gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            {t("Product image")}
            <input required name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="rounded-md border border-[#d0d5dd] bg-white p-2 text-sm" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              {t("English product name")}
              <input required name="title" maxLength={140} className="min-h-11 rounded-md border border-[#d0d5dd] px-3" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t("Chinese product name")}
              <input name="titleZh" maxLength={140} className="min-h-11 rounded-md border border-[#d0d5dd] px-3" />
            </label>
          </div>
          <label className="grid gap-1 text-sm font-semibold">
            {t("English opportunity summary")}
            <textarea name="summary" maxLength={320} className="min-h-20 rounded-md border border-[#d0d5dd] p-3" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t("Chinese opportunity summary")}
            <textarea name="summaryZh" maxLength={320} className="min-h-20 rounded-md border border-[#d0d5dd] p-3" />
          </label>
        </div>
        <div className="grid content-start gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold">
              {t("Estimated factory price")}
              <input name="factoryPrice" maxLength={80} placeholder="US$6.20–8.90" className="min-h-11 rounded-md border border-[#d0d5dd] px-3" />
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              {t("MOQ")}
              <input name="moq" maxLength={80} placeholder="300 pcs" className="min-h-11 rounded-md border border-[#d0d5dd] px-3" />
            </label>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-[#b2ccff] bg-[#eff4ff] p-3 text-sm">
            <input name="publishNow" type="checkbox" defaultChecked className="mt-0.5 size-4 accent-[#155eef]" />
            <span><strong className="block">{t("Publish immediately for 7 days")}</strong><span className="text-[#475467]">{t("The product will stay hidden after expiry even if the cleanup job is delayed.")}</span></span>
          </label>
          <button disabled={creating} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#155eef] px-4 text-sm font-semibold text-white disabled:opacity-60">
            {creating ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} {t("Add weekly product")}
          </button>
        </div>
      </form>

      {message ? <p className="m-4 rounded-md bg-[#f2f4f7] px-3 py-2 text-sm font-semibold text-[#344054]">{message}</p> : null}

      {loading ? (
        <div className="flex min-h-32 items-center justify-center text-sm text-[#667085]"><Loader2 size={18} className="mr-2 animate-spin" /> {t("Loading")}</div>
      ) : products.length === 0 ? (
        <div className="p-8 text-center text-sm text-[#667085]">{t("No weekly products yet.")}</div>
      ) : (
        <div className="grid gap-4 p-4 xl:grid-cols-2">
          {products.map((product) => {
            const status = displayStatus(product);
            return (
              <form key={product.id} onSubmit={(event) => void updateText(event, product.id)} className="overflow-hidden rounded-xl border border-[#d0d5dd] bg-[#fcfcfd]">
                <div className="grid sm:grid-cols-[180px_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.imageUrl} alt={product.title} className="aspect-square size-full bg-white object-cover" />
                  <div className="grid gap-2 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold tracking-wide text-[#155eef]">{product.productCode}</p>
                        <p className="mt-1 text-xs text-[#667085]">{t(status)} · {t(remainingLabel(product))}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-[#d0d5dd]">{product.interestCount} {t("interested")}</span>
                    </div>
                    <input required name="title" defaultValue={product.title} maxLength={140} aria-label={t("English product name")} className="min-h-10 rounded-md border border-[#d0d5dd] px-3 text-sm font-semibold" />
                    <input name="titleZh" defaultValue={product.titleZh || ""} maxLength={140} aria-label={t("Chinese product name")} className="min-h-10 rounded-md border border-[#d0d5dd] px-3 text-sm" />
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input name="factoryPrice" defaultValue={product.factoryPrice || ""} maxLength={80} aria-label={t("Estimated factory price")} className="min-h-10 rounded-md border border-[#d0d5dd] px-3 text-sm" />
                      <input name="moq" defaultValue={product.moq || ""} maxLength={80} aria-label={t("MOQ")} className="min-h-10 rounded-md border border-[#d0d5dd] px-3 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="grid gap-2 border-t border-[#eaecf0] p-3">
                  <textarea name="summary" defaultValue={product.summary || ""} maxLength={320} aria-label={t("English opportunity summary")} className="min-h-16 rounded-md border border-[#d0d5dd] p-2 text-sm" />
                  <textarea name="summaryZh" defaultValue={product.summaryZh || ""} maxLength={320} aria-label={t("Chinese opportunity summary")} className="min-h-16 rounded-md border border-[#d0d5dd] p-2 text-sm" />
                  <div className="grid grid-cols-2 gap-2 text-xs text-[#667085]">
                    <span>{t("Published")}: {dateTime(product.publishedAt, language)}</span>
                    <span>{t("Auto delete")}: {dateTime(product.purgeAt, language)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button disabled={busyId === product.id} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#155eef] px-3 text-sm font-semibold text-white disabled:opacity-60">
                      <Save size={14} /> {t("Save")}
                    </button>
                    {status === "LIVE" ? (
                      <button type="button" disabled={busyId === product.id} onClick={() => void runAction(product.id, "unpublish")} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold">
                        <EyeOff size={14} /> {t("Unpublish now")}
                      </button>
                    ) : (
                      <button type="button" disabled={busyId === product.id} onClick={() => void runAction(product.id, "publish")} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#b2ccff] bg-[#eff4ff] px-3 text-sm font-semibold text-[#155eef]">
                        <TrendingUp size={14} /> {t("Publish for 7 days")}
                      </button>
                    )}
                    <button type="button" disabled={busyId === product.id} onClick={() => void runAction(product.id, "extend")} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#d0d5dd] bg-white px-3 text-sm font-semibold">
                      <CalendarClock size={14} /> {t("Extend 7 days")}
                    </button>
                    <button type="button" disabled={busyId === product.id} onClick={() => void removeProduct(product)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#fecdca] bg-[#fff5f4] px-3 text-sm font-semibold text-[#b42318]">
                      <Trash2 size={14} /> {t("Delete")}
                    </button>
                  </div>
                </div>
              </form>
            );
          })}
        </div>
      )}
    </section>
  );
}
