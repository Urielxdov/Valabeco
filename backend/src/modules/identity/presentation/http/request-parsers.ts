import { LoginRequestSchema, RegisterRequestSchema } from "@valabeco/contracts";
import type { z } from "zod";

import { IdentityValidationError } from "../../application/errors";
import type { LoginUserInput } from "../../application/use-cases/login-user.use-case";
import type { RegisterUserInput } from "../../application/use-cases/register-user.use-case";

type JsonRecord = Record<string, unknown>;

export function parseRegisterInput(body: JsonRecord): RegisterUserInput {
  const result = parseContract(RegisterRequestSchema, body);

  return {
    email: result.email,
    password: result.password,
    name: result.name,
  };
}

export function parseLoginInput(body: JsonRecord): LoginUserInput {
  const result = parseContract(LoginRequestSchema, body);

  return {
    email: result.email,
    password: result.password,
  };
}

function parseContract<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  throw new IdentityValidationError(`${path}${issue?.message ?? "Invalid request body."}`);
}
