import { InvalidUserError } from "./errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type User = Readonly<{
  idUser: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  status: "ACTIVE" | "INACTIVE";
}>;

export type NewUser = Readonly<{
  email: string;
  passwordHash: string;
  name: string;
}>;

/**
 * Crea un usuario a partir de un `passwordHash` ya calculado: el dominio
 * nunca ve la contrasena en texto plano ni conoce el algoritmo de hashing,
 * eso vive detras de `PasswordHasher` en `application`/`infrastructure`.
 */
export function createNewUser(input: {
  email: string;
  passwordHash: string;
  name: string;
}): NewUser {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();

  if (!name) {
    throw new InvalidUserError("User name is required.");
  }

  if (!input.passwordHash) {
    throw new InvalidUserError("User password hash is required.");
  }

  return {
    email,
    passwordHash: input.passwordHash,
    name,
  };
}

export function restoreUser(input: {
  idUser: string;
  email: string;
  passwordHash: string;
  name: string;
  createdAt: Date;
  status?: "ACTIVE" | "INACTIVE";
}): User {
  if (!input.idUser) {
    throw new InvalidUserError("User id is required.");
  }

  return {
    idUser: input.idUser,
    email: normalizeEmail(input.email),
    passwordHash: input.passwordHash,
    name: input.name.trim(),
    createdAt: input.createdAt,
    status: input.status ?? "ACTIVE",
  };
}

function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    throw new InvalidUserError("User email must be a valid email address.");
  }

  return email;
}
