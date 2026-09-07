import { Money } from "../../../shared/domain/money";
import type { BusinessDocumentStatus } from "./enums";
import { InvalidExpenseError } from "./errors";

export type Expense = Readonly<{
  idExpense: string;
  idParty: string | null;
  date: Date;
  description: string;
  amount: Money;
  status: BusinessDocumentStatus;
}>;

export type NewExpense = Readonly<{
  idParty: string | null;
  date: Date;
  description: string;
  amount: Money;
  status: BusinessDocumentStatus;
}>;

export function createDraftExpense(input: {
  idParty?: string | null;
  date?: Date;
  description: string;
  amount: Money;
  status: BusinessDocumentStatus;
}): NewExpense {
  const description = input.description.trim();

  if (!description) {
    throw new InvalidExpenseError("Expense description is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidExpenseError("Expense amount must be greater than zero.");
  }

  return {
    idParty: input.idParty ?? null,
    date: input.date ?? new Date(),
    description,
    amount: input.amount,
    status: input.status,
  };
}

export function restoreExpense(input: {
  idExpense: string;
  idParty: string | null;
  date: Date;
  description: string;
  amount: Money;
  status: BusinessDocumentStatus;
}): Expense {
  if (!input.idExpense) {
    throw new InvalidExpenseError("Expense id is required.");
  }

  return input;
}
