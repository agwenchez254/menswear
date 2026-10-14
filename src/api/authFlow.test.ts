import assert from "node:assert/strict";
import { test } from "node:test";
import { needsAuthHeader, shouldRefresh } from "./authFlow.ts";

test("only authenticated endpoints get an Authorization header", () => {
  assert.equal(needsAuthHeader("getMe"), true);
  assert.equal(needsAuthHeader("updateMe"), true);
  assert.equal(needsAuthHeader("getProducts"), false);
  assert.equal(needsAuthHeader("login"), false);
  assert.equal(needsAuthHeader(undefined), false);
});

test("a 401 on an authenticated endpoint with a refresh token triggers one refresh", () => {
  assert.equal(shouldRefresh(401, "getMe", true), true);
});

test("no refresh for other statuses, public endpoints, auth endpoints or without a refresh token", () => {
  assert.equal(shouldRefresh(500, "getMe", true), false);
  assert.equal(shouldRefresh(401, "getProducts", true), false);
  assert.equal(shouldRefresh(401, "login", true), false);
  assert.equal(shouldRefresh(401, "getMe", false), false);
  assert.equal(shouldRefresh(undefined, "getMe", true), false);
});
