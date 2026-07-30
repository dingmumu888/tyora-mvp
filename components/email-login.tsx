"use client";

import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import { usePublicLanguage } from "@/components/public-language-provider";
import {
  EMAIL_LOGIN_CODE_TTL_SECONDS,
  PENDING_EMAIL_LOGIN_STORAGE_KEY
} from "@/lib/email-login-constants";

type Step = "email" | "code" | "success";
type PendingEmailLogin = { email: string; expiresAt: number };

const loginSuccessEvent = "tyora:community-login";

function readPendingEmailLogin(): PendingEmailLogin | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(PENDING_EMAIL_LOGIN_STORAGE_KEY) || "null") as Partial<PendingEmailLogin> | null;
    if (
      !value ||
      typeof value.email !== "string" ||
      !value.email.includes("@") ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt <= Date.now()
    ) {
      window.localStorage.removeItem(PENDING_EMAIL_LOGIN_STORAGE_KEY);
      return null;
    }
    return { email: value.email, expiresAt: value.expiresAt };
  } catch {
    window.localStorage.removeItem(PENDING_EMAIL_LOGIN_STORAGE_KEY);
    return null;
  }
}

function savePendingEmailLogin(value: PendingEmailLogin) {
  window.localStorage.setItem(PENDING_EMAIL_LOGIN_STORAGE_KEY, JSON.stringify(value));
}

function clearPendingEmailLogin() {
  window.localStorage.removeItem(PENDING_EMAIL_LOGIN_STORAGE_KEY);
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, "0")}`;
}

function formatLoginText(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template
  );
}

export default function EmailLogin({
  children = "Email Login",
  className,
  onSuccess,
  openSignal,
  refreshOnSuccess = false
}: {
  children?: ReactNode;
  className?: string;
  onSuccess?: () => void;
  openSignal?: number;
  refreshOnSuccess?: boolean;
}) {
  const router = useRouter();
  const { copy } = usePublicLanguage();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const openLogin = useCallback(() => {
    const pending = readPendingEmailLogin();
    setMessage("");
    setMessageType("info");
    setCode("");
    if (pending) {
      setEmail(pending.email);
      setExpiresAt(pending.expiresAt);
      setRemainingSeconds(Math.max(0, Math.ceil((pending.expiresAt - Date.now()) / 1000)));
      setStep("code");
    } else {
      setExpiresAt(null);
      setRemainingSeconds(0);
      setStep("email");
    }
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (busy || step === "success") return;
    setOpen(false);
  }, [busy, step]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => {
      if (step === "email") emailInputRef.current?.focus();
      if (step === "code") codeInputRef.current?.focus();
    }, 80);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeModal, open, step]);

  useEffect(() => {
    if (!open) return;
    if (step === "email") emailInputRef.current?.focus();
    if (step === "code") codeInputRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!openSignal) return;
    openLogin();
  }, [openLogin, openSignal]);

  useEffect(() => {
    if (step !== "code" || !expiresAt) return;
    const updateRemainingTime = () => {
      const next = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) clearPendingEmailLogin();
    };
    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt, step]);

  async function requestCode() {
    setBusy(true);
    setMessage("");
    setMessageType("info");
    try {
      const response = await fetch("/api/community/auth/email/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(copy.login.sendError);
      const expiresInSeconds = Number.isFinite(Number(payload.expiresInSeconds))
        ? Math.max(60, Math.min(3600, Number(payload.expiresInSeconds)))
        : EMAIL_LOGIN_CODE_TTL_SECONDS;
      const nextExpiresAt = Date.now() + expiresInSeconds * 1000;
      savePendingEmailLogin({ email, expiresAt: nextExpiresAt });
      setExpiresAt(nextExpiresAt);
      setRemainingSeconds(expiresInSeconds);
      setCode("");
      setStep("code");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : copy.login.sendError);
    } finally {
      setBusy(false);
    }
  }

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await requestCode();
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setMessageType("info");
    try {
      const response = await fetch("/api/community/auth/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(copy.login.invalidCode);
      clearPendingEmailLogin();
      setExpiresAt(null);
      setRemainingSeconds(0);
      setStep("success");
      window.dispatchEvent(new CustomEvent(loginSuccessEvent, { detail: { user: payload.user } }));
      onSuccess?.();
      window.setTimeout(() => {
        setOpen(false);
        if (refreshOnSuccess) {
          router.replace("/me");
          router.refresh();
        }
      }, 900);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : copy.login.invalidCode);
    } finally {
      setBusy(false);
    }
  }

  const codeExpired = step === "code" && expiresAt !== null && remainingSeconds <= 0;

  const modal = open ? createPortal(
    <div
      className="fixed inset-0 z-[9999] grid min-h-dvh place-items-center overflow-y-auto bg-[#101216]/42 p-4 text-[#101216] backdrop-blur-md transition-opacity duration-200"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeModal();
      }}
      role="presentation"
    >
      <section
        className="relative w-[calc(100vw-32px)] max-w-[500px] translate-y-0 rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_80px_rgba(16,18,22,0.22)] ring-1 ring-[#101216]/5 transition-all duration-200 sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tyora-email-login-title"
      >
        <button
          type="button"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#59616e] transition duration-150 hover:bg-[#f6f7fb]"
          onClick={closeModal}
          aria-label={copy.login.close}
        >
          <X size={17} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white shadow-sm">
            TY
          </div>
          <div>
            <p className="text-sm font-semibold tracking-normal">TYORA</p>
            <p className="text-xs font-medium text-[#8b93a1]">{copy.login.brandSubtitle}</p>
          </div>
        </div>

        <div className="mt-7">
          {step === "success" ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e9f7f3] text-[#0f766e]">
                <CheckCircle2 size={26} />
              </div>
              <h2 id="tyora-email-login-title" className="mt-5 text-2xl font-semibold leading-tight">
                {copy.login.successTitle}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#59616e]" aria-live="polite">
                {copy.login.openingProfile}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#f2f7ff] px-4 py-2 text-sm font-semibold text-[#2563eb]">
                <Loader2 className="animate-spin" size={16} />
                {copy.login.loadingProfile}
              </div>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f2f7ff] text-[#2563eb]">
                <Mail size={20} />
              </div>
              <h2 id="tyora-email-login-title" className="mt-4 text-3xl font-semibold leading-tight tracking-normal">
                {copy.login.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#59616e]">
                {copy.login.subtitle}
              </p>

              {step === "email" ? (
                <form onSubmit={sendCode} className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    {copy.login.emailLabel}
                    <input
                      ref={emailInputRef}
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="h-12 rounded-xl border border-[#dfe3e8] bg-white px-3 outline-none transition duration-150 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </label>
                  <p className="-mt-2 text-sm leading-6 text-[#69707d]">
                    {copy.login.emailHelp}
                  </p>
                  <p className="flex items-start gap-2 rounded-2xl bg-[#f2f7ff] px-3 py-2.5 text-sm leading-5 text-[#35537a]">
                    <ShieldCheck className="mt-0.5 shrink-0 text-[#2563eb]" size={16} aria-hidden="true" />
                    <span>{copy.common.rememberLogin}</span>
                  </p>
                  <button
                    disabled={busy}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition duration-150 hover:bg-[#1f2329] disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                    {busy ? copy.login.sending : copy.login.continue}
                    {!busy ? <ArrowRight size={16} /> : null}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    {copy.login.codeLabel}
                    <input
                      ref={codeInputRef}
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      disabled={codeExpired}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="h-12 rounded-xl border border-[#dfe3e8] bg-white px-3 text-center text-xl tracking-[0.28em] outline-none transition duration-150 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </label>
                  <div className={`rounded-2xl px-3 py-2.5 text-sm leading-5 ${
                    codeExpired ? "bg-[#fff7ed] text-[#9a3412]" : "bg-[#f2f7ff] text-[#35537a]"
                  }`}>
                    <p className="font-semibold">
                      {codeExpired
                        ? copy.login.codeExpired
                        : formatLoginText(copy.login.codeSent, {
                            email,
                            time: formatCountdown(remainingSeconds)
                          })}
                    </p>
                    {!codeExpired ? <p className="mt-1">{copy.login.resumeHint}</p> : null}
                  </div>
                  {codeExpired ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void requestCode()}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition duration-150 hover:bg-[#1f2329] disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                      {busy ? copy.login.resending : copy.login.sendAgain}
                    </button>
                  ) : (
                    <button
                      disabled={busy || code.length !== 6}
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition duration-150 hover:bg-[#1f2329] disabled:opacity-60"
                    >
                      {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                      {busy ? copy.login.verifying : copy.login.verify}
                    </button>
                  )}
                  <button
                    type="button"
                    className="justify-self-center text-sm font-semibold text-[#2563eb]"
                    onClick={() => {
                      setStep("email");
                      clearPendingEmailLogin();
                      setExpiresAt(null);
                      setRemainingSeconds(0);
                      setCode("");
                      setMessage("");
                    }}
                  >
                    {copy.login.differentEmail}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {message && step !== "success" ? (
          <p
            className={`mt-4 rounded-2xl px-3 py-2 text-sm leading-6 ${
              messageType === "error" ? "bg-[#fff1f2] text-[#be123c]" : "bg-[#f6f7fb] text-[#59616e]"
            }`}
          >
            {message}
          </p>
        ) : null}
      </section>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => {
          openLogin();
        }}
      >
        {children}
      </button>
      {modal}
    </>
  );
}
