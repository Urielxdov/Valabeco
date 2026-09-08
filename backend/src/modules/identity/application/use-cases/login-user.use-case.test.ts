import assert from "node:assert/strict";
import { test } from "node:test";
import { restoreUser } from "../../domain/user";
import { LoginUserUseCase } from "./login-user.use-case";

test("an inactive user cannot receive a new token", async () => {
  const user = restoreUser({ idUser: "user", email: "user@example.com", passwordHash: "hash", name: "User", createdAt: new Date(), status: "INACTIVE" });
  const useCase = new LoginUserUseCase({
    createUser: async () => user, findUserByEmail: async () => user, findUserById: async () => user,
    listUsers: async () => [user],
  }, { hash: async () => "hash", verify: async () => true }, {
    issue: () => { assert.fail("An inactive user must never receive a token"); }, verify: () => null,
  });
  await assert.rejects(() => useCase.execute({ email: user.email, password: "secret" }), /incorrect/);
});
