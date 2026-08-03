import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const i18n = read("lib/public-i18n.ts");
const provider = read("components/public-language-provider.tsx");
const switcher = read("components/public-language-switcher.tsx");
const layout = read("app/layout.tsx");
const home = read("app/home-client.tsx");
const mobileTabs = read("components/mobile-bottom-tabs.tsx");
const source = read("app/source/source-client.tsx");
const communityText = read("components/community-text.tsx");
const communityPage = read("app/ask/page.tsx");
const failures = [];

function requireCheck(pass, message) {
  if (!pass) failures.push(message);
}

for (const code of ["en", "zh-CN", "es", "fr", "de", "pt"]) {
  requireCheck(i18n.includes(`code: "${code}"`), `Public language ${code} is missing.`);
}

requireCheck(
  provider.includes("URLSearchParams(window.location.search)")
    && provider.includes("window.localStorage.setItem(publicLanguageStorageKey")
    && provider.includes("document.documentElement.lang = language")
    && provider.includes("max-age=31536000")
    && provider.includes('return "en";')
    && !provider.includes("window.navigator")
    && !provider.includes("detectBrowserLanguage"),
  "Language selection is not URL-aware, persistent, or reflected in the document language."
);
requireCheck(
  switcher.includes("publicLanguages.map")
    && switcher.includes("aria-label={copy.common.chooseLanguage}"),
  "The language switcher is not complete or accessible."
);
requireCheck(
  layout.includes("<PublicLanguageProvider>")
    && layout.indexOf("<PublicLanguageProvider>") < layout.indexOf("{children}"),
  "The public language provider does not wrap the public application."
);
requireCheck(
  layout.includes('translate="no"')
    && /className=["'][^"']*\bnotranslate\b[^"']*["']/.test(layout)
    && layout.includes('<meta name="google" content="notranslate" />'),
  "Browser auto-translation is not disabled and can override TYORA's language selector."
);
requireCheck(
  home.includes("localizeHomepage(content.homepage, language)")
    && home.includes("<PublicLanguageSwitcher")
    && home.includes("copy.home.postIdea")
    && home.includes("copy.home.sourceProduct"),
  "The content-first homepage is not connected to the public language system."
);
requireCheck(
  mobileTabs.includes("language === \"en\" ? content.mobileTabs")
    && mobileTabs.includes("copy.common.publicIdea"),
  "Mobile navigation is not localized."
);
requireCheck(
  source.includes("copy.home.source.title")
    && source.includes("<PublicLanguageSwitcher compact"),
  "The Source acquisition page is not connected to the language system."
);
requireCheck(
  !i18n.includes("提奥拉") && !i18n.includes("提拉"),
  "The TYORA brand name must never be translated."
);
requireCheck(
  communityPage.includes("<CommunityText text={title} />")
    && communityPage.includes("<CommunityText text={description} />"),
  "Community card titles and descriptions are not connected to the language system."
);
for (const title of ["Magnetic Phone Stand", "Capybara Night Light", "Pet Grooming Tool"]) {
  requireCheck(
    (communityText.match(new RegExp(`\"${title}\"`, "g")) || []).length >= 5,
    `Curated community case translations are incomplete for ${title}.`
  );
}

if (failures.length) {
  console.error("Public i18n checks failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log("Public i18n checks passed.");
