import assert from "node:assert/strict";
import { test } from "node:test";

import { restoreUser } from "../../domain/user";
import type { NewUser, User } from "../../domain/user";
import type { PasswordHasher } from "../ports/password-hasher.port";
import type { TokenPayload, TokenService } from "../ports/token-service.port";
import type { UserRepository } from "../ports/user-repository.port";
import { RegisterUserUseCase } from "./register-user.use-case";

class FakeUserRepository implements UserRepository {
  usersByEmail = new Map<string, User>();
  nextId = 1;

  async createUser(user: NewUser): Promise<User> {
    const created = restoreUser({
      idUser: `user-${this.nextId++}`,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      createdAt: new Date("2026-09-07"),
    });
    this.usersByEmail.set(created.email, created);

    return created;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async findUserById(idUser: string): Promise<User | null> {
    return Array.from(this.usersByEmail.values()).find((user) => user.idUser === idUser) ?? null;
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed:${plainPassword}`;
  }

  async verify(plainPassword: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed:${plainPassword}`;
  }
}

class FakeTokenService implements TokenService {
  issue(payload: TokenPayload): string {
    return `token-for-${payload.idUser}`;
  }

  verify(): TokenPayload | null {
    throw new Error("not needed for this test");
  }
}

test("RegisterUserUseCase hashes the password before persisting the user", async () => {
  const repository = new FakeUserRepository();
  const useCase = new RegisterUserUseCase(repository, new FakePasswordHasher(), new FakeTokenService());

  const result = await useCase.execute({
    email: "founder@valabeco.test",
    password: "super-secret",
    name: "Founder",
  });

  const stored = repository.usersByEmail.get("founder@valabeco.test");
  assert.equal(stored?.passwordHash, "hashed:super-secret");
  assert.equal(result.user.email, "founder@valabeco.test");
  assert.equal(result.token, `token-for-${stored?.idUser}`);
});

test("RegisterUserUseCase rejects an email that is already registered", async () => {
  const repository = new FakeUserRepository();
  const useCase = new RegisterUserUseCase(repository, new FakePasswordHasher(), new FakeTokenService());

  await useCase.execute({ email: "dup@valabeco.test", password: "super-secret", name: "First" });

  await assert.rejects(() =>
    useCase.execute({ email: "dup@valabeco.test", password: "another-secret", name: "Second" }),
  );
});
