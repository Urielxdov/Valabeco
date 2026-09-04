import { AccountingValidationError } from "../../application/errors";
import type { CreateAccountInput } from "../../application/use-cases/create-account.use-case";
import type { CreateTransactionInput } from "../../application/use-cases/create-transaction.use-case";
import { isAccountType, isEntryType } from "../../domain/enums";

type JsonRecord = Record<string, unknown>;

const DECIMAL_STRING_PATTERN = /^\d+(\.\d{1,2})?$/;

export async function readJsonObject(request: Request): Promise<JsonRecord> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new AccountingValidationError("Request body must be valid JSON.");
  }

  if (!isRecord(body)) {
    throw new AccountingValidationError("Request body must be a JSON object.");
  }

  return body;
}

export function parseCreateAccountInput(body: JsonRecord): CreateAccountInput {
  const name = readRequiredString(body, "name");
  const description = readOptionalString(body, "description");
  const type = body["type"];

  if (!isAccountType(type)) {
    throw new AccountingValidationError(
      "Account type must be one of ASSET, LIABILITY, EQUITY, REVENUE or EXPENSE.",
    );
  }

  return {
    name,
    description,
    type,
  };
}

export function parseCreateTransactionInput(body: JsonRecord): CreateTransactionInput {
  const description = readRequiredString(body, "description");
  const entriesValue = body["entries"];

  if (!Array.isArray(entriesValue)) {
    throw new AccountingValidationError("Transaction entries must be an array.");
  }

  const dateValue = body["date"];
  const date =
    typeof dateValue === "string" && dateValue.trim()
      ? parseDate(dateValue)
      : undefined;

  return {
    date,
    description,
    entries: entriesValue.map((entry) => {
      if (!isRecord(entry)) {
        throw new AccountingValidationError("Each transaction entry must be an object.");
      }

      const idAccount = readRequiredString(entry, "idAccount", "id_account");
      const amount = readRequiredDecimalString(entry, "amount");
      const type = entry["type"];

      if (!isEntryType(type)) {
        throw new AccountingValidationError("Entry type must be DEBIT or CREDIT.");
      }

      return {
        idAccount,
        amount,
        type,
      };
    }),
  };
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new AccountingValidationError("Transaction date must be a valid ISO date.");
  }

  return date;
}

function readRequiredString(body: JsonRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = body[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  throw new AccountingValidationError(`${keys[0]} is required.`);
}

function readOptionalString(body: JsonRecord, key: string): string | null {
  const value = body[key];

  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new AccountingValidationError(`${key} must be a string.`);
  }

  return value;
}

function readRequiredDecimalString(body: JsonRecord, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || !DECIMAL_STRING_PATTERN.test(value.trim())) {
    throw new AccountingValidationError(`${key} must be a positive decimal string.`);
  }

  return value;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
