import assert from "node:assert/strict";
import { test } from "node:test";

import { ScryptPasswordHasher } from "./scrypt-password-hasher";

test("ScryptPasswordHasher verifies a correct password and rejects a wrong one", async () => {
  const hasher = new ScryptPasswordHasher();
  const hash = await hasher.hash("correct-horse-battery-staple");

  assert.ok(await hasher.verify("correct-horse-battery-staple", hash));
  assert.equal(await hasher.verify("wrong-password", hash), false);
});

test("ScryptPasswordHasher produces a different salt (and hash) for the same password", async () => {
  const hasher = new ScryptPasswordHasher();
  const first = await hasher.hash("same-password");
  const second = await hasher.hash("same-password");

  assert.notEqual(first, second);
});

test("ScryptPasswordHasher.verify rejects a malformed stored hash instead of throwing", async () => {
  const hasher = new ScryptPasswordHasher();

  assert.equal(await hasher.verify("anything", "not-a-valid-hash"), false);
});
