"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Heart, MessageCircle, PackageSearch, TrendingUp } from "lucide-react";
import { usePublicLanguage } from "@/components/public-language-provider";
import {
  localizedWeeklyProduct,
  PublicSourceWeeklyProduct,
  sourceWeeklyCopy
} from "@/lib/source-weekly";

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

function localeFor(language: string) {
  if (language === "zh-CN") return "zh-CN";
  if (language === "es") return "es";
  if (language === "fr") return "fr";
  if (language === "de") return "de";
  if (language === "pt") return "pt";
  return "en";
}

export default function SourceWeeklyShowcase() {
  const { language } = usePublicLanguage();
  const copy = sourceWeeklyCopy[language];
  const [products, setProducts] = useState<PublicSourceWeeklyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingId, setOpeningId] = useState("");
  const [message, setMessage] = useState("");
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(localeFor(language), {
    month: "short",
    day: "numeric"
  }), [language]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetch("/api/source/weekly", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as ApiResponse<PublicSourceWeeklyProduct[]>;
        if (!response.ok || !payload.success || !payload.data) {
          throw new Error(payload.message || "Unable to load weekly products.");
        }
        if (active) setProducts(payload.data);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function openWhatsApp(product: PublicSourceWeeklyProduct) {
    setOpeningId(product.id);
    setMessage("");
    try {
      const response = await fetch(`/api/source/weekly/${encodeURIComponent(product.id)}/interest`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ language })
      });
      const payload = await response.json() as ApiResponse<{ interestCount: number; whatsappUrl: string }>;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || copy.unableToOpen);
      }
      setProducts((current) => current.map((item) => (
        item.id === product.id
          ? { ...item, interestCount: payload.data!.interestCount }
          : item
      )));
      window.location.assign(payload.data.whatsappUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.unableToOpen);
      setOpeningId("");
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8">
      <div className="overflow-hidden rounded-[28px] border border-[#dfe6ef] bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.09)] sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[#2563eb]">
              <TrendingUp size={15} /> {copy.eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59616e] sm:text-base">{copy.description}</p>
          </div>
          <Link
            href="#source-form"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#d9e1ec] bg-white px-5 text-sm font-semibold text-[#101216] transition hover:border-[#93b4f8] hover:bg-[#f5f8ff]"
          >
            {copy.specificProduct} <ArrowRight size={15} />
          </Link>
        </div>

        {loading ? (
          <div className="mt-5 flex min-h-44 items-center justify-center rounded-3xl bg-[#f7f9fc] text-sm font-semibold text-[#69707d]">
            {copy.loading}
          </div>
        ) : products.length === 0 ? (
          <div className="mt-5 flex min-h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-[#cfd8e6] bg-[#f8fafc] px-5 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-[#2563eb] shadow-sm"><PackageSearch size={22} /></span>
            <h2 className="mt-3 text-lg font-semibold">{copy.emptyTitle}</h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[#69707d]">{copy.emptyDescription}</p>
          </div>
        ) : (
          <div className="-mx-4 mt-5 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 xl:mx-0 xl:grid xl:grid-cols-4 xl:overflow-visible xl:px-0">
            {products.map((product) => {
              const localized = localizedWeeklyProduct(product, language);
              return (
                <article
                  key={product.id}
                  className="min-w-[82vw] snap-start overflow-hidden rounded-3xl border border-[#dfe6ef] bg-[#fbfcfe] sm:min-w-[360px] xl:min-w-0"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#eef4ff] to-[#f7f9fc]">
                    <Image
                      src={product.imageUrl}
                      alt={localized.title}
                      fill
                      sizes="(max-width: 639px) 82vw, (max-width: 1279px) 360px, 25vw"
                      className="object-cover"
                    />
                    <span className="absolute left-3 top-3 rounded-full bg-[#e8f7ee] px-2.5 py-1 text-[11px] font-bold text-[#087a45]">
                      {copy.title}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold tracking-wide text-[#64748b]">{product.productCode}</p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-semibold leading-6">{localized.title}</h2>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-[#69707d]">
                      {localized.summary || copy.description}
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#e6ebf2] pt-3">
                      <div>
                        <p className="text-[11px] text-[#7a8493]">{copy.estimatedFactoryPrice}</p>
                        <p className="mt-1 text-sm font-bold">{product.factoryPrice || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-[#7a8493]">{copy.moq}</p>
                        <p className="mt-1 text-sm font-bold">{product.moq || "—"}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[#69707d]">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays size={13} />
                        {copy.updated} {product.publishedAt ? dateFormatter.format(new Date(product.publishedAt)) : ""}
                      </span>
                      <span className="inline-flex items-center gap-1 font-semibold text-[#315fbd]">
                        <Heart size={13} /> {product.interestCount} {copy.interested}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={openingId === product.id}
                      onClick={() => void openWhatsApp(product)}
                      className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#2563eb] px-3 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60"
                    >
                      <MessageCircle size={16} />
                      {openingId === product.id ? "..." : copy.cta}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        {message ? <p className="mt-3 rounded-2xl bg-[#fff1f2] p-3 text-sm font-semibold text-[#be123c]">{message}</p> : null}
      </div>
    </section>
  );
}
