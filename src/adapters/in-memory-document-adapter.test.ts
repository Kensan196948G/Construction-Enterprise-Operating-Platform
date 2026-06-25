import { test } from "node:test";
import assert from "node:assert/strict";

import { type IsoTimestamp, type Result, toIsoTimestamp } from "../domain/index.ts";
import { InMemoryDocumentAdapter, missingVariables } from "./in-memory-document-adapter.ts";
import { type DocumentSpec } from "./ports.ts";

function unwrap<T>(result: Result<T>): T {
  assert.ok(result.ok, `expected ok result, got: ${JSON.stringify(result)}`);
  return result.value;
}

const AT: IsoTimestamp = unwrap(toIsoTimestamp("2026-06-25T00:00:00.000Z"));
const fixedClock = (): IsoTimestamp => AT;

test("renders template variables and stamps the injected clock", async () => {
  const adapter = new InMemoryDocumentAdapter(fixedClock);
  const spec: DocumentSpec = {
    template: "Audit evidence for {{system}} on {{date}}.",
    title: "Audit Evidence",
    variables: { system: "Field OS", date: "2026-06-25" },
  };

  const artifact = await adapter.generate(spec);
  assert.equal(artifact.content, "Audit evidence for Field OS on 2026-06-25.");
  assert.equal(artifact.title, "Audit Evidence");
  assert.equal(artifact.generatedAt, AT);
});

test("assigns monotonically increasing ids", async () => {
  const adapter = new InMemoryDocumentAdapter(fixedClock);
  const spec: DocumentSpec = { template: "x", title: "t", variables: {} };
  const first = await adapter.generate(spec);
  const second = await adapter.generate(spec);
  assert.equal(first.id, "doc-1");
  assert.equal(second.id, "doc-2");
});

test("leaves unknown placeholders intact and reports them as missing", async () => {
  const adapter = new InMemoryDocumentAdapter(fixedClock);
  const spec: DocumentSpec = {
    template: "Hello {{name}}, ref {{ticket}}",
    title: "Greeting",
    variables: { name: "Alice" },
  };

  assert.deepEqual(missingVariables(spec), ["ticket"]);
  const artifact = await adapter.generate(spec);
  assert.equal(artifact.content, "Hello Alice, ref {{ticket}}");
});
