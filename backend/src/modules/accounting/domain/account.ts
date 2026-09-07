import { Money } from "../../../shared/domain/money";
import type { AccountType, EntryType } from "./enums";
import { InvalidAccountError } from "./errors";

export type Account = Readonly<{
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType;
  balance: Money;
}>;

export type NewAccount = Readonly<{
  name: string;
  description: string | null;
  type: AccountType;
  balance: Money;
}>;

export type AccountBalanceDelta = Readonly<{
  idAccount: string;
  delta: Money;
}>;

export function createNewAccount(input: {
  name: string;
  description?: string | null;
  type: AccountType;
}): NewAccount {
  const name = normalizeAccountName(input.name);

  return {
    name,
    description: normalizeOptionalText(input.description),
    type: input.type,
    balance: Money.zero(),
  };
}

export function restoreAccount(input: {
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType;
  balance: Money;
}): Account {
  if (!input.idAccount) {
    throw new InvalidAccountError("Account id is required.");
  }

  return {
    idAccount: input.idAccount,
    name: normalizeAccountName(input.name),
    description: normalizeOptionalText(input.description),
    type: input.type,
    balance: input.balance,
  };
}

export function getBalanceDelta(
  accountType: AccountType,
  entryType: EntryType,
  amount: Money,
): Money {
  const debitIncreases = accountType === "ASSET" || accountType === "EXPENSE";
  const increases = entryType === "DEBIT" ? debitIncreases : !debitIncreases;

  return increases ? amount : amount.negate();
}

function normalizeAccountName(value: string): string {
  const name = value.trim();

  if (!name) {
    throw new InvalidAccountError("Account name is required.");
  }

  if (name.length > 255) {
    throw new InvalidAccountError("Account name cannot exceed 255 characters.");
  }

  return name;
}

function normalizeOptionalText(value?: string | null): string | null {
  const text = value?.trim() ?? "";

  return text.length > 0 ? text : null;
}
