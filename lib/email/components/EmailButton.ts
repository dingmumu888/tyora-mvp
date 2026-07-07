type EmailButtonProps = {
  href: string;
  label: string;
};

export function EmailButton({ href, label }: EmailButtonProps) {
  return `<a href="${href}" style="display:inline-block;border-radius:999px;background:#2563eb;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;padding:12px 18px;">${label}</a>`;
}
