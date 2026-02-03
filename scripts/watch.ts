#!/usr/bin/env bun

import { watch } from "fs/promises";
import { $ } from "bun";

async function* watchFiles() {
  const watcher = watch(".", { recursive: true });

  for await (const event of watcher) {
    if (event.filename?.startsWith(".git/") || event.filename === ".git") {
      continue;
    }

    yield event;
  }
}

async function main() {
  for await (const event of watchFiles()) {
    const result = await $`dum vet`.nothrow();

    if (result.exitCode === 0) {
      console.log("\x1b[32m" + "█".repeat(50) + "\x1b[0m");
      console.log("\x1b[32mOK\x1b[0m");
    } else {
      console.log("\x1b[31m" + "█".repeat(50) + "\x1b[0m");
      console.log("\x1b[31mFAILED\x1b[0m");
    }
  }
}

process.on("SIGINT", () => {
  console.log("\nClosing watcher...");
  process.exit(0);
});

main();
