#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const routes = [
  "index.html",
  "projects.html",
  "about.html",
  "contact.html",
  "projects/creator-delight/index.html",
  "projects/creator-delight/full/index.html",
  "projects/gamers_compete_with_ease/index.html",
  "projects/gamers_compete_with_ease/full/index.html",
];

let failures = 0;
let warnings = 0;

function report(level, file, message) {
  const symbol = level === "error" ? "ERROR" : "WARN ";
  console.log(`${symbol} ${file}: ${message}`);
  if (level === "error") failures += 1;
  else warnings += 1;
}

function count(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

for (const route of routes) {
  const absolute = path.join(root, route);
  const html = fs.readFileSync(absolute, "utf8");
  const base = path.dirname(absolute);

  if (count(html, /<header\b[^>]*class="[^"]*site-nav-section/g) !== 1) {
    report("error", route, "expected exactly one shared site header");
  }
  if (count(html, /<footer\b[^>]*class="[^"]*site-footer/g) !== 1) {
    report("error", route, "expected exactly one shared footer");
  }
  if (count(html, /<h1\b/g) !== 1) {
    report("error", route, "expected exactly one h1");
  }
  if (!/<main\b[^>]*id="main-content"/.test(html)) {
    report("error", route, "missing main landmark with id=main-content");
  }
  if (!/<a\b[^>]*class="skip-link"[^>]*href="#main-content"/.test(html)) {
    report("error", route, "missing skip link");
  }
  if (!/floating-nav__badge-text">Available</.test(html)) {
    report("error", route, "missing availability badge");
  }

  const ids = [...html.matchAll(/(?<!\bdata-w-)id="([^"]+)"/g)].map((m) => m[1]);
  const idCounts = new Map();
  for (const id of ids) idCounts.set(id, (idCounts.get(id) || 0) + 1);
  for (const [id, n] of idCounts) {
    if (n <= 1) continue;
    if (/^w-node-/.test(id)) continue;
    if (id === "show-more-less") {
      report("warning", route, `duplicate id: ${id} (${n}x)`);
      continue;
    }
    report("error", route, `duplicate id: ${id} (${n}x)`);
  }

  for (const match of html.matchAll(/<(?:img|script)\b[^>]*\bsrc="([^"]+)"/g)) {
    const target = match[1];
    if (/^(?:https?:|data:|\/\/)/.test(target)) continue;
    const clean = target.split(/[?#]/)[0];
    if (!fs.existsSync(path.resolve(base, clean))) {
      report("error", route, `broken local asset: ${target}`);
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>/g)) {
    const attributes = match[1];
    if (/target="_blank"/.test(attributes) && !/rel="[^"]*(?:noopener|noreferrer)/.test(attributes)) {
      report("error", route, "target=_blank link missing rel=noopener/noreferrer");
    }
  }

  for (const match of html.matchAll(/<iframe\b([\s\S]*?)<\/iframe>/g)) {
    const iframe = match[0];
    if (!/\btitle="[^"]+"/.test(iframe)) report("error", route, "video iframe missing title");
    if (!/\bloading="lazy"/.test(iframe)) report("error", route, "video iframe missing lazy loading");
    if (!/youtube-nocookie\.com/.test(iframe)) report("warning", route, "video is not using privacy-enhanced YouTube");
  }

  const inlineLayouts = [...html.matchAll(/\bstyle="([^"]+)"/g)].filter((match) =>
    /(?:display|grid|flex|width|height|margin|padding|gap|position)\s*:/.test(match[1])
  );
  if (inlineLayouts.length) {
    report("warning", route, `${inlineLayouts.length} deprecated inline layout declaration(s) remain`);
  }
}

const cssFiles = ["css/site-chrome.css", "css/case-study.css"];
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(root, file), "utf8");
  if (/width\s*:\s*100vw/.test(css)) {
    report("warning", file, "100vw can introduce horizontal overflow");
  }
}

console.log(`\nAudit complete: ${failures} error(s), ${warnings} warning(s).`);
process.exitCode = failures ? 1 : 0;
