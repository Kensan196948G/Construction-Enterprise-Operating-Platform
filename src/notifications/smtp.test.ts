/** Integration tests for the minimal SMTP client and email dispatch. */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer as netCreateServer } from "node:net";
import type { AddressInfo } from "node:net";

import { createInMemoryRepositories } from "../persistence/in-memory/index.ts";
import { createNotificationDelivery } from "../domain/notification.ts";
import { dispatchPendingDeliveries } from "./dispatcher.ts";
import { sendEmail } from "./smtp.ts";

const NOW = "2026-08-07T06:00:00.000Z";

async function startFakeSmtp(): Promise<{
  port: number;
  lines: string[];
  close(): Promise<void>;
}> {
  const lines: string[] = [];
  const server = netCreateServer((socket) => {
    socket.write("220 fake.example ESMTP\r\n");
    let dataMode = false;
    socket.on("data", (chunk) => {
      const text = chunk.toString("utf-8");
      for (const raw of text.split("\r\n")) {
        const line = raw.replace(/^\r?\n$/, "");
        if (line === "") continue;
        if (dataMode) {
          lines.push(`DATA:${line}`);
          if (line === ".") {
            dataMode = false;
            socket.write("250 OK queued\r\n");
          }
          continue;
        }
        lines.push(line);
        if (line.startsWith("EHLO")) {
          socket.write("250-fake.example\r\n250 AUTH PLAIN\r\n");
        } else if (line.startsWith("AUTH PLAIN")) {
          socket.write("235 2.7.0 Authentication successful\r\n");
        } else if (line.startsWith("MAIL FROM")) {
          socket.write("250 OK\r\n");
        } else if (line.startsWith("RCPT TO")) {
          socket.write("250 OK\r\n");
        } else if (line === "DATA") {
          dataMode = true;
          socket.write("354 End data with <CR><LF>.<CR><LF>\r\n");
        } else if (line === "QUIT") {
          socket.write("221 Bye\r\n");
          socket.end();
        } else {
          socket.write("250 OK\r\n");
        }
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    port,
    lines,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

test("sendEmail completes the SMTP transaction", async (t) => {
  const smtp = await startFakeSmtp();
  t.after(smtp.close);
  await sendEmail(
    {
      host: "127.0.0.1",
      port: smtp.port,
      secure: false,
      user: "ceop",
      password: "secret",
      from: "ceop@example.local",
      timeoutMs: 5000,
    },
    "user-1",
    "日報提出",
    "本文です",
  );
  assert.ok(smtp.lines.some((l) => l.startsWith("MAIL FROM:<ceop@example.local>")));
  assert.ok(smtp.lines.some((l) => l.startsWith("RCPT TO:<user-1>")));
  assert.ok(smtp.lines.includes("DATA"));
  assert.ok(smtp.lines.some((l) => l.startsWith("DATA:Subject: 日報提出")));
  assert.ok(smtp.lines.includes("DATA:."));
});

test("dispatcher sends email deliveries through SMTP", async (t) => {
  const smtp = await startFakeSmtp();
  t.after(smtp.close);
  const repositories = createInMemoryRepositories();
  const delivery = createNotificationDelivery({
    id: "notification-email-test",
    organizationId: "org-hq",
    userId: "user-1",
    eventKey: "test.email",
    channel: "email",
    subject: "subject",
    bodyPreview: "body",
    createdAt: NOW as never,
  });
  assert.ok(delivery.ok);
  await repositories.notificationDeliveries.save(delivery.value);

  const result = await dispatchPendingDeliveries(repositories, {
    smtp: {
      host: "127.0.0.1",
      port: smtp.port,
      secure: false,
      from: "ceop@example.local",
      timeoutMs: 5000,
    },
  });
  assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0 });
  const all = await repositories.notificationDeliveries.findAll();
  const sent = all[0];
  assert.ok(sent);
  assert.equal(sent.status, "sent");
});
