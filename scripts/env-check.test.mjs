import assert from "node:assert/strict";
import { test } from "node:test";
import { forbiddenEnvNames } from "./env-check.mjs";

test("flags VITE_ variables that look like secrets", () => {
  const env = { VITE_API_URL: "https://x", VITE_STRIPE_SECRET_KEY: "s", VITE_DB_PASSWORD: "p", VITE_PRIVATE_KEY: "k", OTHER_SECRET: "fine, not exposed to the client" };
  assert.deepEqual(forbiddenEnvNames(env).sort(), ["VITE_DB_PASSWORD", "VITE_PRIVATE_KEY", "VITE_STRIPE_SECRET_KEY"]);
});

test("passes a clean environment", () => {
  assert.deepEqual(forbiddenEnvNames({ VITE_API_URL: "https://x" }), []);
});
