#!/usr/bin/env bun

import { watch } from "fs/promises";
import { $ } from "bun";

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
} as const;

const BAR_LENGTH = 50;
const NOTIFICATION_TITLE = "Watch";
const SUCCESS_EMOJI = "🟩".repeat(8);
const TEST_FAILURE_EMOJI = "🟥".repeat(8);
const TYPE_CHECK_FAILURE_EMOJI = "🟨".repeat(8);

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

function displayStatus(result: {
  vetPassed: boolean;
  testPassed: boolean;
  errorOutput: string;
}) {
  let color: string;
  let status: string;

  if (result.vetPassed && result.testPassed) {
    color = COLORS.green;
    status = "OK";
  } else if (!result.vetPassed) {
    color = COLORS.yellow;
    status = "TYPE CHECK FAILED";
  } else {
    color = COLORS.red;
    status = "TESTS FAILED";
  }

  console.log(color + "█".repeat(BAR_LENGTH) + COLORS.reset);
  console.log(color + status + COLORS.reset);
}

async function sendNotification(result: {
  vetPassed: boolean;
  testPassed: boolean;
  errorOutput: string;
}) {
  let message: string;

  if (result.vetPassed && result.testPassed) {
    message = SUCCESS_EMOJI;
  } else if (!result.vetPassed) {
    message = `${TYPE_CHECK_FAILURE_EMOJI}\n${result.errorOutput}`;
  } else {
    message = `${TEST_FAILURE_EMOJI}\n${result.errorOutput}`;
  }

  await $`osascript -e "display notification \"${message}\" with title \"${NOTIFICATION_TITLE}\""`.nothrow();
}

async function runChecks() {
  const vetResult = await $`dum --silent vet`.nothrow();
  const vetPassed = vetResult.exitCode === 0;

  if (!vetPassed) {
    const errorOutput = await vetResult.text();
    return { vetPassed: false, testPassed: false, errorOutput };
  }

  const testResult = await $`dum --silent test`.nothrow();
  const testPassed = testResult.exitCode === 0;

  if (!testPassed) {
    const errorOutput = await testResult.text();
    return { vetPassed, testPassed, errorOutput };
  }

  return { vetPassed, testPassed, errorOutput: "" };
}

async function runCheckAndNotify() {
  const result = await runChecks();
  displayStatus(result);
  await sendNotification(result);
}

async function main() {
  await runCheckAndNotify();

  let testRunCounter = 0;
  let lastRunCounter = 0;
  let resolveWait: null | (() => void) = null;

  (async () => {
    for await (const event of watchFiles()) {
      console.log(`\nFile changed: ${event.filename}`);
      testRunCounter++;
      if (resolveWait) {
        const resolve: () => void = resolveWait;
        resolveWait = null;
        resolve();
      }
    }
  })();

  while (true) {
    if (testRunCounter > lastRunCounter) {
      lastRunCounter = testRunCounter;
      await runCheckAndNotify();
    } else {
      await new Promise<void>((resolve) => {
        resolveWait = resolve;
      });
    }
  }
}

process.on("SIGINT", () => {
  console.log("\nClosing watcher...");
  process.exit(0);
});

main();
