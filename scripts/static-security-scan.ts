import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";

export interface SecurityFinding {
  readonly file: string;
  readonly line: number;
  readonly rule: string;
}

const RULES: readonly { readonly id: string; readonly pattern: RegExp }[] = [
  { id: "dangerous-eval", pattern: /\beval\s*\(/ },
  { id: "dynamic-function", pattern: /\bnew\s+Function\s*\(/ },
  { id: "tls-verification-disabled", pattern: /rejectUnauthorized\s*:\s*false/ },
  { id: "tls-env-disabled", pattern: /NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*["']?0/ },
  { id: "private-key-material", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

function sourceFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...sourceFiles(path));
    else if (path.endsWith(".ts") && !path.endsWith(".test.ts")) files.push(path);
  }
  return files;
}

export function scanStaticSecurity(repositoryRoot: string): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  for (const sourceRoot of [join(repositoryRoot, "src"), join(repositoryRoot, "scripts")]) {
    for (const file of sourceFiles(sourceRoot)) {
      if (file.endsWith("static-security-scan.ts")) continue;
      readFileSync(file, "utf8")
        .split(/\r?\n/)
        .forEach((line, index) => {
          for (const rule of RULES) {
            if (rule.pattern.test(line)) {
              findings.push({
                file: relative(repositoryRoot, file),
                line: index + 1,
                rule: rule.id,
              });
            }
          }
        });
    }
  }
  return findings;
}

function main(): void {
  const findings = scanStaticSecurity(process.cwd());
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(`${finding.file}:${finding.line} ${finding.rule}`);
    }
    process.exitCode = 2;
    return;
  }
  console.log("Static security invariants: PASS");
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href)
  main();
