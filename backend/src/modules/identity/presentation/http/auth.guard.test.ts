import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import type { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "./auth.guard";
import { restoreUser } from "../../domain/user";

test("a previously issued token stops working after user deactivation", async () => {
  const request = { headers: { authorization: "Bearer valid-token" } };
  const context = {
    getHandler: () => function handler() {}, getClass: () => class Controller {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const user = restoreUser({ idUser: "user", email: "user@example.com", passwordHash: "hash", name: "User", createdAt: new Date(), status: "INACTIVE" });
  const guard = new AuthGuard({ issue: () => "valid-token", verify: () => ({ idUser: user.idUser }) }, new Reflector(), {
    createUser: async () => user, findUserByEmail: async () => user, findUserById: async () => user,
    listUsers: async () => [user],
  });
  await assert.rejects(() => guard.canActivate(context), /inactive/);
});
