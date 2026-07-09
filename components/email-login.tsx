"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, Mail, X } from "lucide-react";

type Step = "email" | "code" | "success";

const loginSuccessEvent = "tyora:community-login";

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
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"info" | "error">("info");
  const emailInputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  function closeModal() {
    if (busy) return;
    setOpen(false);
  }

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
  }, [busy, open, step]);

  useEffect(() => {
    if (!open) return;
    if (step === "email") emailInputRef.current?.focus();
    if (step === "code") codeInputRef.current?.focus();
  }, [open, step]);

  useEffect(() => {
    if (!openSignal) return;
    setStep("email");
    setMessage("");
    setMessageType("info");
    setOpen(true);
  }, [openSignal]);

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to send code.");
      setStep("code");
      setMessageType("info");
      setMessage("Check your email for a 6-digit TYORA login code.");
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Unable to send code.");
    } finally {
      setBusy(false);
    }
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
      if (!response.ok || !payload.success) throw new Error(payload.message || "Invalid or expired code.");
      setStep("success");
      setMessage("Logged in successfully.");
      window.dispatchEvent(new CustomEvent(loginSuccessEvent, { detail: { user: payload.user } }));
      onSuccess?.();
      window.setTimeout(() => {
        setOpen(false);
        if (refreshOnSuccess) router.refresh();
      }, 900);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  }

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
          aria-label="Close login"
        >
          <X size={17} />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#101216] text-sm font-semibold text-white shadow-sm">
            TY
          </div>
          <div>
            <p className="text-sm font-semibold tracking-normal">TYORA</p>
            <p className="text-xs font-medium text-[#8b93a1]">Product creator community</p>
          </div>
        </div>

        <div className="mt-7">
          {step === "success" ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#e9f7f3] text-[#0f766e]">
                <CheckCircle2 size={26} />
              </div>
              <h2 id="tyora-email-login-title" className="mt-5 text-2xl font-semibold leading-tight">
                Logged in successfully.
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#59616e]">
                You can continue discussing and building product ideas.
              </p>
            </div>
          ) : (
            <>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-[#f2f7ff] text-[#2563eb]">
                <Mail size={20} />
              </div>
              <h2 id="tyora-email-login-title" className="mt-4 text-3xl font-semibold leading-tight tracking-normal">
                Log in to TYORA
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#59616e]">
                Continue discussing and building product ideas.
              </p>

              {step === "email" ? (
                <form onSubmit={sendCode} className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    Email
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
                    We'll send you a secure verification code.
                  </p>
                  <button
                    disabled={busy}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition duration-150 hover:bg-[#1f2329] disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                    {busy ? "Sending..." : "Continue"}
                    {!busy ? <ArrowRight size={16} /> : null}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyCode} className="mt-6 grid gap-4">
                  <label className="grid gap-2 text-sm font-medium">
                    6-digit code
                    <input
                      ref={codeInputRef}
                      required
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="h-12 rounded-xl border border-[#dfe3e8] bg-white px-3 text-center text-xl tracking-[0.28em] outline-none transition duration-150 focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                    />
                  </label>
                  <button
                    disabled={busy || code.length !== 6}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#101216] px-5 text-sm font-semibold text-white shadow-sm shadow-[#101216]/20 transition duration-150 hover:bg-[#1f2329] disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                    {busy ? "Verifying..." : "Verify & Continue"}
                  </button>
                  <button
                    type="button"
                    className="justify-self-center text-sm font-semibold text-[#2563eb]"
                    onClick={() => {
                      setStep("email");
                      setCode("");
                      setMessage("");
                    }}
                  >
                    Use a different email
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
          setStep("email");
          setMessage("");
          setMessageType("info");
          setOpen(true);
        }}
      >
        {children}
      </button>
      {modal}
    </>
  );
}
