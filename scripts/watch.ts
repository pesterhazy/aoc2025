#!/usr/bin/env bun

import { watch } from "fs/promises";
import { $ } from "bun";

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  reset: "\x1b[0m",
} as const;

const BAR_LENGTH = 50;
const NOTIFICATION_TITLE = "Watch";
const SUCCESS_EMOJI = "🟩".repeat(8);
const FAILURE_EMOJI = "🟥".repeat(8);

const IGNORED_PATHS = [".git", "node_modules"];

async function* watchFiles() {
  const watcher = watch(".", { recursive: true });

  for await (const event of watcher) {
    const shouldIgnore = IGNORED_PATHS.some(
      (path) =>
        event.filename === path || event.filename?.startsWith(`${path}/`)
    );

    if (shouldIgnore) {
      continue;
    }

    yield event;
  }
}

function displayStatus(success: boolean) {
  const color = success ? COLORS.green : COLORS.red;
  const status = success ? "OK" : "FAILED";

  console.log(color + "█".repeat(BAR_LENGTH) + COLORS.reset);
  console.log(color + status + COLORS.reset);
}

async function sendNotification(success: boolean) {
  const message = success ? SUCCESS_EMOJI : FAILURE_EMOJI;
  await $`osascript -e "display notification \"${message}\" with title \"${NOTIFICATION_TITLE}\""`.nothrow();
}

async function runChecks() {
  const vetResult = await $`dum vet`.nothrow();
  if (vetResult.exitCode !== 0) {
    return false;
  }

  const testResult = await $`dum test`.nothrow();
  return testResult.exitCode === 0;
}

async function runCheckAndNotify() {
  const success = await runChecks();
  displayStatus(success);
  await sendNotification(success);
}

async function main() {
  // Run checks immediately on startup
  console.log("\nInitial check...");
  await runCheckAndNotify();

  // Watch for file changes
  for await (const event of watchFiles()) {
    console.log(`\nFile changed: ${event.filename}`);
    await runCheckAndNotify();
  }
}

process.on("SIGINT", () => {
  console.log("\nClosing watcher...");
  process.exit(0);
});

main();
