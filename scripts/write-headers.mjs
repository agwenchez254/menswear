import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { forbiddenEnvNames } from "./env-check.mjs";
import {
  apiOriginOf,
  buildHeadersFile,
  inlineScripts,
  scriptHash,
} from "./headers.mjs";

const bad = forbiddenEnvNames(process.env);
if (bad.length) {
  console.error(
    `Refusing to build: these VITE_ variables look like secrets and would be public: ${bad.join(", ")}`,
  );
  process.exit(1);
}

const strict =
  process.env.CONTEXT === "production" || process.env.STRICT_HEADERS === "1";
const apiUrl = process.env.VITE_API_URL ?? "https://fcxmdgkl-5000.eun1.devtunnels.ms/api/v1";
const dist = process.env.DIST_DIR ?? join(process.cwd(), "dist");

try {
  const apiOrigin = apiOriginOf(apiUrl, strict);
  const html = readFileSync(join(dist, "index.html"), "utf8");
  const hashes = inlineScripts(html).map(scriptHash);
  writeFileSync(
    join(dist, "_headers"),
    buildHeadersFile({ apiOrigin, scriptHashes: hashes, strict }),
  );
  console.log(
    `dist/_headers written (API ${apiOrigin}, ${hashes.length} inline script hash(es), ${strict ? "strict" : "relaxed"})`,
  );
  if (!strict)
    console.warn(
      "Not a production build: upgrade-insecure-requests is omitted and a non-https API origin is allowed.",
    );
} catch (e) {
  console.error(String(e instanceof Error ? e.message : e));
  process.exit(1);
}
