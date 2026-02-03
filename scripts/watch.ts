#!/usr/bin/env bun

import { watch } from "fs/promises";

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
    console.log(`Detected ${event.eventType} in ${event.filename}`);
  }
}

process.on("SIGINT", () => {
  console.log("\nClosing watcher...");
  process.exit(0);
});

main();
