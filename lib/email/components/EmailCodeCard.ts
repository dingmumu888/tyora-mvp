type EmailCodeCardProps = {
  code: string;
};

export function EmailCodeCard({ code }: EmailCodeCardProps) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;margin:30px 0;">
  <tr>
    <td class="tyora-card" align="center" style="background:#f8fafc;border:1px solid #e6ebf2;border-radius:22px;padding:30px 18px;">
      <div class="tyora-muted" style="font-size:12px;line-height:18px;letter-spacing:1.8px;text-transform:uppercase;color:#7a8493;">Verification code</div>
      <div class="tyora-code" aria-label="Your verification code is ${code}" style="margin-top:12px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:48px;line-height:58px;font-weight:800;letter-spacing:10px;color:#101216;">${code}</div>
    </td>
  </tr>
</table>`;
}
