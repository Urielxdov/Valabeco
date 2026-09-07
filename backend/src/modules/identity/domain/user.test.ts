import assert from "node:assert/strict";
import { test } from "node:test";

import { createNewUser, restoreUser } from "./user";

test("createNewUser normalizes and lowercases the email", () => {
  const user = createNewUser({
    email: "  Someone@Example.com ",
    passwordHash: "hash",
    name: "Someone",
  });

  assert.equal(user.email, "someone@example.com");
});

test("createNewUser rejects an invalid email", () => {
  assert.throws(() => createNewUser({ email: "not-an-email", passwordHash: "hash", name: "Someone" }));
});

test("createNewUser rejects a missing name", () => {
  assert.throws(() =>
    createNewUser({ email: "someone@example.com", passwordHash: "hash", name: "   " }),
  );
});

test("createNewUser rejects an empty password hash", () => {
  assert.throws(() =>
    createNewUser({ email: "someone@example.com", passwordHash: "", name: "Someone" }),
  );
});

test("restoreUser requires an id", () => {
  assert.throws(() =>
    restoreUser({
      idUser: "",
      email: "someone@example.com",
      passwordHash: "hash",
      name: "Someone",
      createdAt: new Date(),
    }),
  );
});
