import { test } from "node:test";
import assert from "node:assert/strict";
import { apiErrorCode, cleanCode, formatCountdown, isCompleteCode, verifyErrorMessage } from "./otp.ts";

test("cleanCode keeps digits only and caps at six", () => {
  assert.equal(cleanCode("123 456"), "123456");
  assert.equal(cleanCode("12a-3"), "123");
  assert.equal(cleanCode("12345678"), "123456");
  assert.equal(cleanCode(""), "");
});

test("isCompleteCode needs exactly six digits", () => {
  assert.equal(isCompleteCode("12345"), false);
  assert.equal(isCompleteCode("123456"), true);
});

test("apiErrorCode reads the problem+json code", () => {
  assert.equal(apiErrorCode({ status: 403, data: { code: "email_not_verified" } }), "email_not_verified");
  assert.equal(apiErrorCode({ status: 500 }), undefined);
  assert.equal(apiErrorCode(undefined), undefined);
});

test("verifyErrorMessage reports attempts left for a wrong code", () => {
  const wrong = (n: unknown) => ({ data: { code: "invalid_code", remainingAttempts: n } });
  assert.equal(verifyErrorMessage(wrong(3), "x"), "That code is not right. 3 attempts left.");
  assert.equal(verifyErrorMessage(wrong(1), "x"), "That code is not right. 1 attempt left.");
  assert.equal(verifyErrorMessage(wrong(undefined), "x"), "That code is not right.");
  assert.equal(verifyErrorMessage({ data: { code: "code_expired" } }, "expired, ask again"), "expired, ask again");
});

test("formatCountdown formats m:ss and never goes negative", () => {
  assert.equal(formatCountdown(65), "1:05");
  assert.equal(formatCountdown(9), "0:09");
  assert.equal(formatCountdown(-3), "0:00");
});
