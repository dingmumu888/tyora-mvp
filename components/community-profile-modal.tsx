"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BriefcaseBusiness, Camera, Check, CheckCircle2, ChevronDown, Loader2, MapPin, Search, X } from "lucide-react";
import CommunityAvatar from "@/components/community-avatar";
import { usePublicLanguage } from "@/components/public-language-provider";
import { countryCallingCodes } from "@/lib/country-calling-codes";
import { translateMyTyora, type MyTyoraKey } from "@/lib/my-tyora-i18n";
import { inferProfileCountryCode, profileIndustries } from "@/lib/profile-options";

export type CommunitySessionUser = {
  id: string;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  profileCompleted?: boolean;
  country?: string;
  countryCode?: string;
  industry?: string;
  occupation?: string;
};

type CommunityProfileModalProps = {
  open: boolean;
  user: CommunitySessionUser | null;
  mode?: "setup" | "edit";
  onClose: () => void;
  onSaved?: (user: CommunitySessionUser) => void;
};

const AVATAR_SIZE = 320;
const AVATAR_QUALITY = 0.84;
const quickEmojis = ["💡", "🔥", "👍", "❤️", "👀", "🙌"];

type Translator = (key: MyTyoraKey, values?: Record<string, string | number>) => string;

function fileToDataUrl(file: File, t: Translator) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(t("unableReadAvatar")));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string, t: Translator) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(t("unsupportedImage")));
    image.src = src;
  });
}

async function cropAvatar(file: File, t: Translator) {
  const source = await fileToDataUrl(file, t);
  const image = await loadImage(source, t);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error(t("unablePrepareAvatar"));

  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);

  canvas.width = AVATAR_SIZE;
  canvas.height = AVATAR_SIZE;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, AVATAR_SIZE, AVATAR_SIZE);

  return canvas.toDataURL("image/jpeg", AVATAR_QUALITY);
}

async function readJsonSafely(response: Response, t: Translator) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: response.ok ? t("unableReadProfile") : t("avatarTooLarge")
    };
  }
}

function ProfileCountrySelect({
  value,
  language,
  onChange,
  t
}: {
  value: string;
  language: string;
  onChange: (value: string) => void;
  t: Translator;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const options = useMemo(() => {
    const displayNames = new Intl.DisplayNames([language], { type: "region" });
    return countryCallingCodes.map((country) => ({
      ...country,
      localizedName: displayNames.of(country.iso) || country.name
    }));
  }, [language]);
  const selected = options.find((country) => country.iso === value);
  const normalizedSearch = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!normalizedSearch) return options;
    return options.filter((country) =>
      [country.localizedName, country.name, country.iso, ...(country.aliases || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [normalizedSearch, options]);

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative grid gap-2 text-sm font-medium">
      <span>{t("country")}</span>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((current) => !current)}
        className="flex h-12 items-center justify-between rounded-2xl border border-[#dfe3e8] bg-white px-3 text-left outline-none transition hover:border-[#b8c5d8] focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
      >
        <span className={selected ? "text-[#101216]" : "text-[#8b93a1]"}>
          {selected ? `${selected.flag} ${selected.localizedName}` : t("selectCountry")}
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-[#dfe6ef] bg-white p-2 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
          <label className="flex h-10 items-center gap-2 rounded-xl border border-[#dfe6ef] px-3 text-[#69707d] focus-within:border-[#2563eb] focus-within:ring-4 focus-within:ring-[#2563eb]/10">
            <Search size={15} aria-hidden="true" />
            <span className="sr-only">{t("searchCountry")}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#101216] outline-none"
              placeholder={t("searchCountry")}
            />
          </label>
          <div role="listbox" aria-label={t("country")} className="mt-2 max-h-52 overflow-y-auto overscroll-contain">
            {filtered.length ? filtered.map((country) => (
              <button
                key={country.iso}
                type="button"
                role="option"
                aria-selected={country.iso === value}
                onClick={() => {
                  onChange(country.iso);
                  setSearch("");
                  setOpen(false);
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-[#f2f7ff]"
              >
                <span aria-hidden="true">{country.flag}</span>
                <span className="min-w-0 flex-1 truncate">{country.localizedName}</span>
                <span className="text-xs font-semibold text-[#8b93a1]">{country.iso}</span>
                {country.iso === value ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            )) : <p className="px-3 py-4 text-center text-sm text-[#69707d]">{t("noCountryFound")}</p>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CommunityProfileModal({ open, user, mode = "setup", onClose, onSaved }: CommunityProfileModalProps) {
  const { language } = usePublicLanguage();
  const t: Translator = (key, values) => translateMyTyora(language, key, values);
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [industry, setIndustry] = useState("");
  const [occupation, setOccupation] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const titleId = useMemo(() => `tyora-profile-${mode}`, [mode]);
  const canDismiss = mode === "edit";

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open || !user) return;
    setName(user.name || "");
    setBio(user.bio || "");
    setAvatar(user.avatar || "");
    setIndustry(user.industry || "");
    setOccupation(user.occupation || "");
    setCountryCode(inferProfileCountryCode(user.countryCode, user.country));
    setMessage("");
    window.setTimeout(() => nameRef.current?.focus(), 80);
  }, [open, user]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body?.style.overflow || "";
    if (document.body) document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && canDismiss && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      if (document.body) document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [busy, canDismiss, onClose, open]);

  async function onAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      setAvatar(await cropAvatar(file, t));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("unablePrepareAvatar"));
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!industry || !countryCode) {
      setMessage(t("completeIndustryCountry"));
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/session", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, bio, avatar, industry, occupation, countryCode })
      });
      const payload = await readJsonSafely(response, t);
      if (!response.ok || !payload.success) throw new Error(payload.message || t("unableSaveProfile"));
      window.dispatchEvent(new CustomEvent("tyora:community-profile-updated", { detail: { user: payload.user } }));
      onSaved?.(payload.user);
      onClose();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("unableSaveProfile"));
    } finally {
      setBusy(false);
    }
  }

  function appendBioEmoji(emoji: string) {
    setBio((current) => `${current}${current ? " " : ""}${emoji}`.slice(0, 180));
  }

  if (!mounted || !open || !user || typeof document === "undefined" || !document.body) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] grid min-h-dvh place-items-center overflow-y-auto bg-[#101216]/42 p-4 text-[#101216] backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && canDismiss && !busy) onClose();
      }}
      role="presentation"
    >
      <section className="relative w-[calc(100vw-32px)] max-w-[620px] rounded-[30px] border border-white/70 bg-white p-6 shadow-[0_24px_90px_rgba(16,18,22,0.24)] ring-1 ring-[#101216]/5 sm:p-7" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        {canDismiss ? (
          <button type="button" onClick={onClose} disabled={busy} className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#59616e] transition hover:bg-[#f6f7fb]" aria-label={t("closeProfile")}>
            <X size={17} />
          </button>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white">TY</div>
          <div>
            <p className="text-sm font-semibold">TYORA</p>
            <p className="text-xs font-medium text-[#8b93a1]">{t("community")}</p>
          </div>
        </div>

        <div className="mt-7">
          <h2 id={titleId} className="text-3xl font-semibold tracking-normal">{t(mode === "edit" ? "editProfileTitle" : "setupProfileTitle")}</h2>
          <p className="mt-3 text-sm leading-6 text-[#59616e]">{t("profileHelp")}</p>
        </div>

        <form onSubmit={saveProfile} className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 sm:col-span-2">
            <CommunityAvatar name={name || user.email} src={avatar} className="size-16 text-lg" />
            <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-[#dfe3e8] bg-white px-4 text-sm font-semibold text-[#59616e] transition hover:bg-[#f6f7fb]">
              <Camera size={16} /> {t("uploadAvatar")}
              <input type="file" className="sr-only" onChange={onAvatarChange} />
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            {t("websiteName")}
            <input ref={nameRef} required value={name} onChange={(event) => setName(event.target.value)} className="h-12 rounded-2xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder="Adam Chen" />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2"><BriefcaseBusiness size={15} /> {t("industry")}</span>
            <select required value={industry} onChange={(event) => setIndustry(event.target.value)} className="h-12 rounded-2xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10">
              <option value="">{t("selectIndustry")}</option>
              {profileIndustries.map((option) => (
                <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm font-medium">
            {t("occupation")} <span className="font-normal text-[#8b93a1]">{t("optional")}</span>
            <input value={occupation} maxLength={80} onChange={(event) => setOccupation(event.target.value)} className="h-12 rounded-2xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder={t("occupationPlaceholder")} />
          </label>

          <div className="flex items-start gap-2 sm:col-span-2">
            <MapPin className="mt-9 shrink-0 text-[#315fbd]" size={16} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <ProfileCountrySelect value={countryCode} language={language} onChange={setCountryCode} t={t} />
            </div>
          </div>

          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            {t("shortBio")} <span className="font-normal text-[#8b93a1]">{t("optional")}</span>
            <textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} maxLength={180} className="resize-none rounded-2xl border border-[#dfe3e8] bg-white px-3 py-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10" placeholder={t("bioPlaceholder")} />
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            {quickEmojis.map((emoji) => (
              <button key={emoji} type="button" onClick={() => appendBioEmoji(emoji)} className="flex size-8 items-center justify-center rounded-full bg-[#f4f6f8] text-sm transition hover:bg-[#e8edf5]">
                {emoji}
              </button>
            ))}
          </div>

          {message ? <p className="rounded-2xl bg-[#fff7ed] px-3 py-2 text-sm text-[#9a3412] sm:col-span-2">{message}</p> : null}

          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <button disabled={busy} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition hover:bg-[#1f2329] disabled:opacity-60">
              {busy ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              {t("saveProfile")}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body
  );
}
