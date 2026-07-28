#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

function run(label, cmd, args, env = {}) {
  console.log(`\n— ${label} —`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) {
    console.error(`\n${label} failed.`);
    process.exit(result.status ?? 1);
  }
}

run("Site consistency", "node", ["scripts/site-consistency-audit.mjs"]);

const base = process.env.SITE_BASE || "http://127.0.0.1:8080";
run("Case study layout", "node", ["scripts/cs-layout-audit.mjs"], { SITE_BASE: base });

console.log("\nPublish audit: all checks passed.");
