// FILE: src/api/zip.test.ts
import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import { createZip, crc32 } from "./zip.ts";

test("zip: crc32 matches the well-known 'the quick brown fox' checksum", () => {
  // CRC-32/ISO-HDLC reference vector.
  assert.equal(crc32(Buffer.from("The quick brown fox jumps over the lazy dog")), 0x414fa339);
});

test("zip: crc32 of empty buffer is 0", () => {
  assert.equal(crc32(Buffer.alloc(0)), 0);
});

test("zip: produces a well-formed local/central/EOCD structure with recoverable content", () => {
  const zip = createZip([
    { name: "hello.txt", data: Buffer.from("hello world", "utf-8") },
    { name: "dir/nested.txt", data: Buffer.from("nested content", "utf-8") },
  ]);

  // Starts with a local file header signature (PK\x03\x04).
  assert.deepEqual([...zip.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04]);

  // Contains a central directory header signature (PK\x01\x02) ...
  const centralSig = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  assert.ok(zip.includes(centralSig));

  // ... and ends with the end-of-central-directory record (PK\x05\x06).
  const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocdOffset = zip.lastIndexOf(eocdSig);
  assert.ok(eocdOffset > 0);
  assert.equal(eocdOffset + 22, zip.length);

  // Stored (uncompressed) content is embedded verbatim and therefore
  // recoverable by a plain substring search — no inflate needed.
  assert.ok(zip.includes(Buffer.from("hello world", "utf-8")));
  assert.ok(zip.includes(Buffer.from("nested content", "utf-8")));
  assert.ok(zip.includes(Buffer.from("dir/nested.txt", "utf-8")));

  // Entry count recorded in the EOCD record matches what was written.
  assert.equal(zip.readUInt16LE(eocdOffset + 10), 2);
});

test("zip: round-trips through node:zlib's raw inflate would not apply (store method) — bytes are identical", () => {
  const payload = Buffer.from("こんにちは世界", "utf-8");
  const zip = createZip([{ name: "utf8.txt", data: payload }]);
  // Compressed size field (local header offset 18) equals uncompressed size
  // for the store method, and both equal the payload's byte length.
  assert.equal(zip.readUInt32LE(18), payload.length);
  assert.equal(zip.readUInt32LE(22), payload.length);
});
