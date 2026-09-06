import { AccountingValidationError } from "../../application/errors";
import type { CreateAccountInput } from "../../application/use-cases/create-account.use-case";
import type { CreateTransactionInput } from "../../application/use-cases/create-transaction.use-case";
import {
  CreateAccountRequestSchema,
  CreateTransactionRequestSchema,
} from "@valabeco/contracts";
import type { z } from "zod";

type JsonRecord = Record<string, unknown>;

export function parseCreateAccountInput(body: JsonRecord): CreateAccountInput {
  const result = parseContract(CreateAccountRequestSchema, body);

  return {
    name: result.name,
    description: result.description ?? null,
    type: result.type,
  };
}

export function parseCreateTransactionInput(body: JsonRecord): CreateTransactionInput {
  const result = parseContract(CreateTransactionRequestSchema, body);

  return {
    date: result.date ? parseDate(result.date) : undefined,
    description: result.description,
    entries: result.entries,
  };
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AccountingValidationError("Transaction date must be a valid ISO date.");
  }

  return date;
}

function parseContract<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  throw new AccountingValidationError(`${path}${issue?.message ?? "Invalid request body."}`);
}
