import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const FORBIDDEN: [RegExp, string][] = [
  [/dangerouslySetInnerHTML/, "dangerouslySetInnerHTML"],
  [/\.innerHTML\s*=/, "innerHTML assignment"],
  [/\beval\s*\(/, "eval()"],
  [/new\s+Function\s*\(/, "new Function()"],
  [/document\.write\s*\(/, "document.write()"],
];

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sources(p);
    return /\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
  });
}

test("the storefront source avoids APIs that execute or inject untrusted strings", () => {
  const offenders: string[] = [];
  for (const file of sources(join(process.cwd(), "src"))) {
    const text = readFileSync(file, "utf8");
    for (const [re, label] of FORBIDDEN) if (re.test(text)) offenders.push(`${file}: ${label}`);
  }
  assert.deepEqual(offenders, []);
});

test("tokens and personal data are not written to the console", () => {
  const offenders: string[] = [];
  for (const file of sources(join(process.cwd(), "src"))) {
    const text = readFileSync(file, "utf8");
    if (/console\.(log|info|debug)\([^)]*(token|password|email|phone)/i.test(text)) offenders.push(file);
  }
  assert.deepEqual(offenders, []);
});
