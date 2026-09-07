import assert from "node:assert/strict";
import { test } from "node:test";

import { HmacTokenService } from "./hmac-token-service";

test("HmacTokenService issues a token that verifies back to the same payload", () => {
  const tokenService = new HmacTokenService("test-secret", 3600);
  const token = tokenService.issue({ idUser: "user-1" });

  const payload = tokenService.verify(token);

  assert.equal(payload?.idUser, "user-1");
});

test("HmacTokenService rejects a token signed with a different secret", () => {
  const issued = new HmacTokenService("secret-a", 3600).issue({ idUser: "user-1" });
  const verifier = new HmacTokenService("secret-b", 3600);

  assert.equal(verifier.verify(issued), null);
});

test("HmacTokenService rejects a tampered payload", () => {
  const tokenService = new HmacTokenService("test-secret", 3600);
  const token = tokenService.issue({ idUser: "user-1" });
  const [, signature] = token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ idUser: "someone-else", exp: 9999999999 }), "utf8").toString(
    "base64url",
  );

  assert.equal(tokenService.verify(`${tamperedPayload}.${signature}`), null);
});

test("HmacTokenService rejects an expired token", () => {
  const tokenService = new HmacTokenService("test-secret", -1);
  const token = tokenService.issue({ idUser: "user-1" });

  assert.equal(tokenService.verify(token), null);
});

test("HmacTokenService rejects malformed tokens", () => {
  const tokenService = new HmacTokenService("test-secret", 3600);

  assert.equal(tokenService.verify("not-a-token"), null);
  assert.equal(tokenService.verify(""), null);
});
