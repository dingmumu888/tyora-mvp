import type { Metadata } from "next";
import { AdminLanguageProvider } from "@/components/admin/admin-language-provider";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true
  }
};

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AdminLanguageProvider>{children}</AdminLanguageProvider>;
}
