"use client";

import { FormEvent, ReactNode, useState } from "react";
import { ArrowRight, Loader2, Mail, X } from "lucide-react";

type Step = "email" | "code";

export default function EmailLogin({
  children = "Email Login",
  className,
  onSuccess
}: {
  children?: ReactNode;
  className?: string;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/auth/email/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Unable to send code.");
      setStep("code");
      setMessage("Check your email for a 6-digit TYORA login code.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send code.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/community/auth/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Invalid or expired code.");
      setOpen(false);
      onSuccess?.();
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Invalid or expired code.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#101216]/40 p-4 backdrop-blur-sm">
          <section className="relative w-full max-w-md rounded-[22px] border border-[#e4e8ef] bg-white p-6 text-[#101216] shadow-2xl shadow-[#101216]/20">
            <button
              type="button"
              className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-[#e4e8ef] bg-white text-[#59616e] transition hover:bg-[#f6f7fb]"
              onClick={() => setOpen(false)}
              aria-label="Close login"
            >
              <X size={17} />
            </button>
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[#2563eb] text-white">
              <Mail size={18} />
            </div>
            <h2 className="mt-4 text-3xl font-semibold leading-tight">Log in to TYORA</h2>
            <p className="mt-3 text-sm leading-6 text-[#59616e]">
              Enter your email to continue discussing product ideas.
            </p>

            {step === "email" ? (
              <form onSubmit={sendCode} className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  Email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-12 rounded-xl border border-[#dfe3e8] bg-white px-3 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                  />
                </label>
                <button disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null} Send Code
                </button>
              </form>
            ) : (
              <form onSubmit={verifyCode} className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm font-medium">
                  Verification code
                  <input
                    required
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="h-12 rounded-xl border border-[#dfe3e8] bg-white px-3 text-center text-xl tracking-[0.35em] outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-[#2563eb]/10"
                  />
                </label>
                <button disabled={busy || code.length !== 6} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 text-sm font-semibold text-white shadow-sm shadow-[#2563eb]/20 transition hover:bg-[#1d4ed8] disabled:opacity-60">
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null} Verify & Continue <ArrowRight size={16} />
                </button>
                <button type="button" className="text-sm font-semibold text-[#2563eb]" onClick={() => setStep("email")}>
                  Use a different email
                </button>
              </form>
            )}
            {message ? <p className="mt-4 text-sm leading-6 text-[#59616e]">{message}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
