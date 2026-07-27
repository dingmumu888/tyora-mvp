/* eslint-disable @typescript-eslint/no-require-imports -- This standalone QA runner intentionally uses CommonJS. */
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const baseUrl = (process.env.TYORA_QA_BASE_URL || "").replace(/\/$/, "");

const isSecurePreview = /^https:\/\//i.test(baseUrl);
const isLocalBuild = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseUrl);

if (!baseUrl || (!isSecurePreview && !isLocalBuild)) {
  console.error("Set TYORA_QA_BASE_URL to an HTTPS Preview URL or local build URL.");
  process.exit(1);
}

const outputDir = path.resolve("docs", "qa", "v1-rc");
const cases = [
  { name: "home-desktop-1440x900", route: "/", width: 1440, height: 900 },
  { name: "home-desktop-full", route: "/", width: 1440, height: 900, fullPage: true },
  { name: "home-tablet-768x1024", route: "/", width: 768, height: 1024 },
  { name: "home-mobile-390x844", route: "/", width: 390, height: 844 },
  { name: "home-mobile-390-full", route: "/", width: 390, height: 844, fullPage: true },
  { name: "idea-submit-desktop-1440x900", route: "/ask/new", width: 1440, height: 900 },
  { name: "source-mobile-390x844", route: "/source", width: 390, height: 844 },
  { name: "my-tyora-anonymous-mobile-390x844", route: "/me", width: 390, height: 844 },
];

async function inspectLayout(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const documentWidth = Math.max(root.scrollWidth, body?.scrollWidth || 0);
    const bottomNav = [...document.querySelectorAll("nav")].find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return (
        style.position === "fixed" &&
        rect.bottom >= window.innerHeight - 2 &&
        rect.top > window.innerHeight / 2
      );
    });
    const bottomNavRect = bottomNav?.getBoundingClientRect() || null;
    const visibleInteractive = [...document.querySelectorAll("a, button, input, select, textarea")]
      .filter((element) => !bottomNav?.contains(element))
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none"
        );
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return { bottom: rect.bottom, top: rect.top, left: rect.left, right: rect.right };
      });
    const coveredByBottomNav = bottomNavRect
      ? visibleInteractive.some(
          (rect) =>
            rect.top < bottomNavRect.bottom &&
            rect.bottom > bottomNavRect.top &&
            rect.left < bottomNavRect.right &&
            rect.right > bottomNavRect.left &&
            rect.top >= 0 &&
            rect.top < window.innerHeight,
        )
      : false;

    return {
      horizontalOverflow: documentWidth > viewportWidth + 1,
      viewportWidth,
      documentWidth,
      bottomNavigationDetected: Boolean(bottomNavRect),
      visibleControlCoveredByBottomNavigation: coveredByBottomNav,
    };
  });
}

(async () => {
  await fs.mkdir(outputDir, { recursive: true });
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const results = [];

  try {
    for (const testCase of cases) {
      const context = await browser.newContext({
        viewport: { width: testCase.width, height: testCase.height },
        deviceScaleFactor: 1,
        locale: "en-US",
      });
      const page = await context.newPage();
      const response = await page.goto(`${baseUrl}${testCase.route}`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForLoadState("load", { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1_500);
      await page.evaluate(async () => {
        if (document.fonts?.ready) await document.fonts.ready;
      });
      if (testCase.width < 768) {
        await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
        await page.waitForTimeout(150);
      }
      const layout = await inspectLayout(page);
      if (testCase.width < 768) {
        await page.evaluate(() => window.scrollTo(0, 0));
      }
      const file = path.join(outputDir, `${testCase.name}.png`);
      await page.screenshot({ path: file, fullPage: Boolean(testCase.fullPage) });
      results.push({
        name: testCase.name,
        route: testCase.route,
        status: response?.status() || null,
        ...layout,
      });
      await context.close();
    }

    if (isLocalBuild) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
        locale: "en-US",
      });
      const page = await context.newPage();
      await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.getByLabel("Password").fill("qa-placeholder-only");
      await Promise.all([
        page.waitForURL(`${baseUrl}/admin`, { timeout: 30_000 }),
        page.getByRole("button", { name: "Login" }).click(),
      ]);
      await page.waitForTimeout(750);
      await page.screenshot({ path: path.join(outputDir, "admin-dashboard-desktop-1440x900.png") });
      const dashboardLayout = await inspectLayout(page);
      results.push({
        name: "admin-dashboard-desktop-1440x900",
        route: "/admin",
        status: 200,
        ...dashboardLayout,
      });

      const inboxResponse = await page.goto(`${baseUrl}/admin/work-orders`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await page.waitForTimeout(750);
      await page.screenshot({ path: path.join(outputDir, "admin-unified-inbox-desktop-1440x900.png") });
      const inboxLayout = await inspectLayout(page);
      results.push({
        name: "admin-unified-inbox-desktop-1440x900",
        route: "/admin/work-orders",
        status: inboxResponse?.status() || 200,
        ...inboxLayout,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }

  const reportFile = path.join(outputDir, "public-layout-results.json");
  await fs.writeFile(reportFile, `${JSON.stringify(results, null, 2)}\n`, "utf8");

  const failures = results.filter(
    (result) =>
      result.status !== 200 ||
      result.horizontalOverflow ||
      result.visibleControlCoveredByBottomNavigation,
  );
  console.log(`Captured ${results.length} QA screenshots.`);
  console.log(`Layout failures: ${failures.length}.`);
  if (failures.length) process.exitCode = 1;
})();
