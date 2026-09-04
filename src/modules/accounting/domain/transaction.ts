import type { EntryType, TransactionStatus } from "./enums";
import { InvalidTransactionError } from "./errors";
import { Money } from "./money";

export type TransactionEntry = Readonly<{
  idTransactionEntry: string;
  idTransaction: string;
  idAccount: string;
  amount: Money;
  type: EntryType;
}>;

export type NewTransactionEntry = Readonly<{
  idAccount: string;
  amount: Money;
  type: EntryType;
}>;

export type AccountingTransaction = Readonly<{
  idTransaction: string;
  date: Date;
  description: string;
  status: TransactionStatus;
  entries: TransactionEntry[];
}>;

export type NewAccountingTransaction = Readonly<{
  date: Date;
  description: string;
  status: "DRAFT";
  entries: NewTransactionEntry[];
}>;

export function createDraftTransaction(input: {
  date?: Date;
  description: string;
  entries: Array<{
    idAccount: string;
    amount: Money;
    type: EntryType;
  }>;
}): NewAccountingTransaction {
  const entries = input.entries.map(createNewTransactionEntry);

  if (entries.length < 2) {
    throw new InvalidTransactionError("A transaction requires at least two entries.");
  }

  return {
    date: input.date ?? new Date(),
    description: normalizeTransactionDescription(input.description),
    status: "DRAFT",
    entries,
  };
}

export function restoreTransaction(input: {
  idTransaction: string;
  date: Date;
  description: string;
  status: TransactionStatus;
  entries: TransactionEntry[];
}): AccountingTransaction {
  if (!input.idTransaction) {
    throw new InvalidTransactionError("Transaction id is required.");
  }

  return {
    idTransaction: input.idTransaction,
    date: input.date,
    description: normalizeTransactionDescription(input.description),
    status: input.status,
    entries: input.entries.map(restoreTransactionEntry),
  };
}

export function assertCanPostTransaction(transaction: AccountingTransaction): void {
  if (transaction.status !== "DRAFT") {
    throw new InvalidTransactionError("Only draft transactions can be posted.");
  }

  if (transaction.entries.length < 2) {
    throw new InvalidTransactionError("A posted transaction requires at least two entries.");
  }

  const totals = getEntryTotals(transaction.entries);

  if (!totals.debit.equals(totals.credit)) {
    throw new InvalidTransactionError("Debit and credit totals must be equal.");
  }
}

export function assertCanVoidTransaction(transaction: AccountingTransaction): void {
  if (transaction.status === "VOIDED") {
    throw new InvalidTransactionError("Voided transactions cannot be voided again.");
  }
}

function createNewTransactionEntry(input: {
  idAccount: string;
  amount: Money;
  type: EntryType;
}): NewTransactionEntry {
  if (!input.idAccount) {
    throw new InvalidTransactionError("Transaction entry account id is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidTransactionError("Transaction entry amount must be positive.");
  }

  return {
    idAccount: input.idAccount,
    amount: input.amount,
    type: input.type,
  };
}

function restoreTransactionEntry(input: TransactionEntry): TransactionEntry {
  if (!input.idTransactionEntry) {
    throw new InvalidTransactionError("Transaction entry id is required.");
  }

  if (!input.idTransaction) {
    throw new InvalidTransactionError("Transaction entry transaction id is required.");
  }

  return {
    idTransactionEntry: input.idTransactionEntry,
    idTransaction: input.idTransaction,
    ...createNewTransactionEntry(input),
  };
}

function getEntryTotals(entries: TransactionEntry[]): { debit: Money; credit: Money } {
  return entries.reduce(
    (totals, entry) => {
      if (entry.type === "DEBIT") {
        return {
          ...totals,
          debit: totals.debit.add(entry.amount),
        };
      }

      return {
        ...totals,
        credit: totals.credit.add(entry.amount),
      };
    },
    { debit: Money.zero(), credit: Money.zero() },
  );
}

function normalizeTransactionDescription(value: string): string {
  const description = value.trim();

  if (!description) {
    throw new InvalidTransactionError("Transaction description is required.");
  }

  if (description.length > 500) {
    throw new InvalidTransactionError("Transaction description cannot exceed 500 characters.");
  }

  return description;
}
