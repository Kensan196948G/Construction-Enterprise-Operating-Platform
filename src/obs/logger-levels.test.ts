// LOG_LEVEL must be set before the first log call resolves the level.
process.env.LOG_LEVEL = "warn";

import assert from "node:assert/strict";
import { test } from "node:test";
import { createLogger } from "./logger.ts";

function captureStderr(fn: () => void): string {
  const chunks: string[] = [];
  const stderr = process.stderr as unknown as {
    write: (chunk: string | Uint8Array) => boolean;
  };
  const original = stderr.write;
  stderr.write = (chunk) => {
    chunks.push(String(chunk));
    return true;
  };
  try {
    fn();
  } finally {
    stderr.write = original;
  }
  return chunks.join("");
}

test("LOG_LEVEL=warn suppresses info but emits warn and error", () => {
  const logger = createLogger("test-warn");
  const out = captureStderr(() => {
    logger.info("info-msg");
    logger.warn("warn-msg");
    logger.error("error-msg");
  });
  assert.doesNotMatch(out, /info-msg/);
  assert.match(out, /warn-msg/);
  assert.match(out, /error-msg/);
});
