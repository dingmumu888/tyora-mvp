import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";

const baseDirectory = fileURLToPath(new URL("./", import.meta.url));
const compat = new FlatCompat({ baseDirectory });

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["app/admin/page.tsx"],
    rules: {
      "@next/next/no-html-link-for-pages": "off"
    }
  },
  {
    files: [
      "app/home-client.tsx",
      "app/me/activity-summary.tsx",
      "app/me/page.tsx",
      "components/email-login.tsx"
    ],
    rules: {
      "react/no-unescaped-entities": "off"
    }
  },
  {
    files: ["lib/server/community-store.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "prefer-const": "off"
    }
  }
];

export default config;
