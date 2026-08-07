/**
 * Minimal zero-dependency SMTP client (E-11 email delivery).
 *
 * Supports implicit TLS (`secure: true`, port 465) and plain SMTP (port 25),
 * with optional AUTH PLAIN. STARTTLS is not implemented yet.
 */

import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";

export interface SmtpConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user?: string | undefined;
  readonly password?: string | undefined;
  readonly from: string;
  readonly timeoutMs?: number | undefined;
}

/** Send an email via the minimal SMTP client. Throws on any non-2xx reply. */
export function sendEmail(
  config: SmtpConfig,
  to: string,
  subject: string,
  body: string,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeoutMs = config.timeoutMs ?? 15_000;
    const socket = config.secure
      ? tlsConnect({ host: config.host, port: config.port })
      : netConnect({ host: config.host, port: config.port });
    let buffer = "";

    const fail = (message: string): void => {
      socket.destroy();
      reject(new Error(message));
    };
    const writeLine = (line: string): void => {
      socket.write(`${line}\r\n`);
    };
    const readReply = (): Promise<string> =>
      new Promise<string>((resolveReply, rejectReply) => {
        const timer = setTimeout(() => {
          socket.off("data", onData);
          rejectReply(new Error("SMTP reply timeout"));
        }, timeoutMs);
        const onData = (data: Buffer) => {
          buffer += data.toString("utf-8");
          const lines = buffer.split("\r\n");
          const last = lines[lines.length - 2];
          if (last !== undefined && last.length >= 3) {
            clearTimeout(timer);
            resolveReply(last);
          }
        };
        socket.on("data", onData);
      });
    const expect = async (codePrefix: string): Promise<boolean> => {
      const reply = await readReply();
      return reply.startsWith(codePrefix);
    };

    socket.on("error", (e) => fail(`SMTP connection error: ${e.message}`));
    socket.on("connect", () => {
      void (async () => {
        try {
          if (!(await expect("220"))) {
            fail("SMTP server did not greet with 220");
            return;
          }
          writeLine("EHLO ceop.local");
          if (!(await expect("250"))) {
            fail("EHLO rejected");
            return;
          }
          if (config.user !== undefined && config.password !== undefined) {
            const auth = Buffer.from(`\0${config.user}\0${config.password}`).toString("base64");
            writeLine(`AUTH PLAIN ${auth}`);
            if (!(await expect("235"))) {
              fail("AUTH PLAIN rejected");
              return;
            }
          }
          writeLine(`MAIL FROM:<${config.from}>`);
          if (!(await expect("250"))) {
            fail("MAIL FROM rejected");
            return;
          }
          writeLine(`RCPT TO:<${to}>`);
          if (!(await expect("250"))) {
            fail("RCPT TO rejected");
            return;
          }
          writeLine("DATA");
          if (!(await expect("354"))) {
            fail("DATA not accepted");
            return;
          }
          const safeBody = body.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
          writeLine(`Subject: ${subject.replace(/[\r\n]/g, " ")}`);
          writeLine("Content-Type: text/plain; charset=utf-8");
          writeLine("");
          writeLine(safeBody);
          writeLine(".");
          if (!(await expect("250"))) {
            fail("message not accepted");
            return;
          }
          writeLine("QUIT");
          socket.end();
          resolve();
        } catch (e) {
          fail(e instanceof Error ? e.message : String(e));
        }
      })();
    });
  });
}
