#!/usr/bin/env node

/**
 * Ensures Supabase migrations are deployed to the linked project.
 * Uses the Supabase CLI binary installed in node_modules/.bin.
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const binName = process.platform === "win32" ? "supabase.cmd" : "supabase";
const supabaseBinary = join(__dirname, "..", "node_modules", ".bin", binName);

if (!existsSync(supabaseBinary)) {
  console.error("Supabase CLI binary not found. Run `npm install` first.");
  process.exit(1);
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  console.warn(
    [
      "Warning: SUPABASE_ACCESS_TOKEN is not set.",
      "The Supabase CLI requires this token to deploy migrations.",
      "Set it in your environment or CI secrets before running this script.",
    ].join(" ")
  );
}

const envFile = process.env.SUPABASE_ENV_FILE ?? ".env";
const args = ["db", "migrate", "deploy", "--env-file", envFile];

const child = spawn(supabaseBinary, args, {
  stdio: "inherit",
  env: process.env,
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});

