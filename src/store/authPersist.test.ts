import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_AUTH, fromStored, toStored } from "./authPersist.ts";

const user = { id: "c1", name: "Amina", email: "a@x.co", phone: "+254712345678" };

test("toStored never includes the access token", () => {
  const raw = toStored({ user, accessToken: "ACCESS-SECRET", refreshToken: "refresh" });
  assert.ok(raw);
  assert.ok(!raw.includes("ACCESS-SECRET"));
  assert.ok(!raw.includes("accessToken"));
});

test("toStored is null when signed out or half signed in", () => {
  assert.equal(toStored(EMPTY_AUTH), null);
  assert.equal(toStored({ user, accessToken: "a", refreshToken: null }), null);
  assert.equal(toStored({ user: null, accessToken: "a", refreshToken: "r" }), null);
});

test("fromStored restores the user and refresh token but no access token", () => {
  const raw = toStored({ user, accessToken: "a", refreshToken: "refresh" });
  assert.deepEqual(fromStored(raw), { user, accessToken: null, refreshToken: "refresh" });
});

test("fromStored treats garbage as signed out", () => {
  for (const raw of [null, "", "not json", "null", "[]", '{"user":{"id":1},"refreshToken":"r"}', '{"user":{"id":"c","name":"n","email":"e","phone":"p"}}']) {
    assert.deepEqual(fromStored(raw), EMPTY_AUTH, String(raw));
  }
});
