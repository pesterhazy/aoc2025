#!/usr/bin/env bun

import { watch } from "fs/promises";
import { $ } from "bun";
import { existsSync, readFileSync, rmSync } from "fs";

const COLORS = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  reset: "\x1b[0m",
} as const;

const BAR_LENGTH = 50;
const SUCCESS_EMOJI = "🟩".repeat(8);
const TEST_FAILURE_EMOJI = "🟥".repeat(8);
const TYPE_CHECK_FAILURE_EMOJI = "🟨".repeat(8);

const IGNORED_PATHS = [".git", "node_modules", "test-output.json"];

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
  let title: string;
  let message: string;

  if (result.vetPassed && result.testPassed) {
    title = SUCCESS_EMOJI;
    message = "";
  } else if (!result.vetPassed) {
    title = TYPE_CHECK_FAILURE_EMOJI;
    message = result.errorOutput;
  } else {
    title = TEST_FAILURE_EMOJI;
    message = result.errorOutput;
  }

  const script = `display notification "${message.replace(
    /"/g,
    '\\"'
  )}" with title "${title.replace(/"/g, '\\"')}"`;
  await Bun.spawn(["osascript", "-e", script], {
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
}

async function runChecks() {
  const vetResult = await $`dum --silent vet`.nothrow();
  const vetPassed = vetResult.exitCode === 0;

  if (!vetPassed) {
    const errorOutput = await vetResult.text();
    return { vetPassed: false, testPassed: false, errorOutput };
  }

  rmSync("test-output.json", { force: true });

  const testResult =
    await $`dum --silent test -- --reporter=json --outputFile=./test-output.json --reporter=default`.nothrow();
  const testPassed = testResult.exitCode === 0;

  if (!testPassed) {
    let errorOutput = "";
    if (existsSync("test-output.json")) {
      const testOutput = JSON.parse(readFileSync("test-output.json", "utf8"));
      errorOutput = `failed=${testOutput.numFailedTests} (total=${testOutput.numTotalTests})`;
    }
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
