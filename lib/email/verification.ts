import { EmailCodeCard } from "@/lib/email/components/EmailCodeCard";
import { EmailFooter } from "@/lib/email/components/EmailFooter";
import { EmailHeader } from "@/lib/email/components/EmailHeader";
import { EmailLayout } from "@/lib/email/components/EmailLayout";

type VerificationEmailInput = {
  code: string;
};

export function renderVerificationEmail({ code }: VerificationEmailInput) {
  const subject = `TYORA code: ${code}`;
  const preheader = `Your TYORA login code is ${code}. Expires in 10 minutes.`;
  const html = EmailLayout({
    preheader,
    children: `${EmailHeader()}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td style="padding-top:34px;">
      <div class="tyora-muted" style="font-size:14px;line-height:22px;font-weight:700;color:#2563eb;">Every great product starts with one idea.</div>
      <h1 class="tyora-text" style="margin:14px 0 0;font-size:32px;line-height:40px;font-weight:800;letter-spacing:0;color:#101216;">Verify your email</h1>
      <p class="tyora-muted" style="margin:14px 0 0;font-size:16px;line-height:26px;color:#566172;">Use the verification code below to securely sign in to your TYORA account.</p>
    </td>
  </tr>
</table>
${EmailCodeCard({ code })}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:collapse;">
  <tr>
    <td>
      <p class="tyora-muted" style="margin:0;font-size:14px;line-height:23px;color:#566172;">This verification code expires in 10 minutes.</p>
      <p class="tyora-muted" style="margin:8px 0 0;font-size:14px;line-height:23px;color:#566172;">Never share this code with anyone. TYORA staff will never ask for your verification code.</p>
      <p class="tyora-muted" style="margin:24px 0 0;font-size:14px;line-height:23px;color:#566172;">Need help? <a href="mailto:support@tyora.io" style="color:#2563eb;text-decoration:none;">support@tyora.io</a></p>
    </td>
  </tr>
</table>
${EmailFooter()}`
  });
  const text = [
    `Your TYORA login code is ${code}.`,
    "This code expires in 10 minutes.",
    "If you did not request it, ignore this email.",
    "",
    "TYORA",
    "Product Creator Community",
    "",
    "Welcome back.",
    "Continue building your next great product.",
    "",
    "Verify your email",
    "",
    "Use this verification code to securely sign in to your TYORA account.",
    "",
    code,
    "",
    "This verification code expires in 10 minutes.",
    "Never share this code with anyone.",
    "TYORA staff will never ask for your verification code.",
    "",
    "Need help?",
    "support@tyora.io",
    "",
    "Didn't request this login?",
    "You can safely ignore this email.",
    "",
    "TYORA",
    "Helping founders build better products.",
    "https://tyora.io"
  ].join("\n");

  return { subject, preheader, html, text };
}
