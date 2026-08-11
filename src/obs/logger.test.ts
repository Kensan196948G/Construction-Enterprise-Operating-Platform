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

test("default level emits info, warn, and error", () => {
  const logger = createLogger("test-default");
  const out = captureStderr(() => {
    logger.info("info-msg");
    logger.warn("warn-msg");
    logger.error("error-msg");
  });
  assert.match(out, /\[test-default\] info-msg/);
  assert.match(out, /warn-msg/);
  assert.match(out, /error-msg/);
});

test("debug is suppressed at the default info level", () => {
  const logger = createLogger("test-debug");
  const out = captureStderr(() => {
    logger.debug("debug-msg");
  });
  assert.equal(out, "");
});

test("error is always emitted even when the level would suppress it", () => {
  const logger = createLogger("test-error");
  const out = captureStderr(() => {
    logger.error("fatal-msg");
  });
  assert.match(out, /fatal-msg/);
});
