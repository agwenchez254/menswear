import assert from "node:assert/strict";
import { test } from "node:test";
import reducer, { sessionStarted, signedOut, tokensRotated, userUpdated } from "./authSlice.ts";

const user = { id: "c1", name: "Amina", email: "a@x.co", phone: "+254712345678" };
const empty = { user: null, accessToken: null, refreshToken: null };

test("sessionStarted stores the user and both tokens", () => {
  const s = reducer(empty, sessionStarted({ user, accessToken: "a", refreshToken: "r" }));
  assert.deepEqual(s, { user, accessToken: "a", refreshToken: "r" });
});

test("tokensRotated replaces the tokens and keeps the user", () => {
  const s = reducer({ user, accessToken: "a", refreshToken: "r" }, tokensRotated({ accessToken: "a2", refreshToken: "r2" }));
  assert.deepEqual(s, { user, accessToken: "a2", refreshToken: "r2" });
});

test("userUpdated changes only the user", () => {
  const s = reducer({ user, accessToken: "a", refreshToken: "r" }, userUpdated({ ...user, name: "New" }));
  assert.equal(s.user?.name, "New");
  assert.equal(s.refreshToken, "r");
});

test("signedOut clears everything", () => {
  assert.deepEqual(reducer({ user, accessToken: "a", refreshToken: "r" }, signedOut()), empty);
});
