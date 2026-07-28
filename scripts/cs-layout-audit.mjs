#!/usr/bin/env node

import { chromium } from "playwright";

const BASE = process.env.SITE_BASE || "http://127.0.0.1:8080";
const PAGES = [
  "/projects/creator-delight/",
  "/projects/creator-delight/full/",
  "/projects/gamers_compete_with_ease/",
  "/projects/gamers_compete_with_ease/full/",
];
const WIDTHS = [1440, 2008];

let failures = 0;

function fail(path, message) {
  console.error(`ERROR ${path}: ${message}`);
  failures += 1;
}

function auditSectionAlignment() {
  const issues = [];
  document.querySelectorAll("section.cs-section").forEach((sec) => {
    const kids = [...sec.children].filter((el) => !el.classList.contains("cs-media--bleed"));
    if (kids.length < 2) return;
    const lefts = kids.map((el) => Math.round(el.getBoundingClientRect().left));
    const uniq = [...new Set(lefts)];
    if (uniq.length > 1) {
      issues.push({ lefts: uniq, count: kids.length });
    }
  });
  return issues;
}

function auditRelatedCards() {
  const cards = [...document.querySelectorAll(".cs-related .cs-related-card, .cs-related .article-card")];
  return cards.map((el) => ({
    flexDir: getComputedStyle(el).flexDirection,
    ok: getComputedStyle(el).flexDirection === "column",
  }));
}

const browser = await chromium.launch({ headless: true });

for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  for (const path of PAGES) {
    const page = await context.newPage();
    try {
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
      const data = await page.evaluate(() => {
        const hero = document.querySelector(".cs-section--hero");
        const overflow = document.documentElement.scrollWidth > innerWidth;
        const sectionIssues = (() => {
          const issues = [];
          document.querySelectorAll("section.cs-section").forEach((sec) => {
            const kids = [...sec.children].filter((el) => !el.classList.contains("cs-media--bleed"));
            if (kids.length < 2) return;
            const lefts = [...new Set(kids.map((el) => Math.round(el.getBoundingClientRect().left)))];
            if (lefts.length > 1) issues.push(lefts);
          });
          return issues;
        })();
        const related = [...document.querySelectorAll(".cs-related .cs-related-card, .cs-related .article-card")].map(
          (el) => getComputedStyle(el).flexDirection
        );
        return {
          overflow,
          sectionIssues,
          related,
          hasHero: !!hero,
        };
      });

      if (data.overflow) fail(path, `horizontal overflow at ${width}px`);
      if (data.sectionIssues.length) fail(path, `misaligned section columns at ${width}px: ${JSON.stringify(data.sectionIssues)}`);
      if (data.related.some((d) => d !== "column")) fail(path, `related cards not vertical at ${width}px`);
      if (!data.hasHero) fail(path, "missing hero section");
    } catch (e) {
      fail(path, String(e.message || e));
    }
    await page.close();
  }
  await context.close();
}

await browser.close();

console.log(failures ? `\nLayout audit: ${failures} error(s).` : "\nLayout audit: OK.");
process.exitCode = failures ? 1 : 0;
