#!/usr/bin/env bun

import { watch } from "fs";

const watcher = watch(".", { recursive: true }, (event, filename) => {
  if (filename?.startsWith(".git/") || filename === ".git") {
    return;
  }
  console.log(`Detected ${event} in ${filename}`);
});

process.on("SIGINT", () => {
  console.log("\nClosing watcher...");
  watcher.close();
  process.exit(0);
});
