import { Money } from "../../../shared/domain/money";
import { InvalidCapitalContributionError, InvalidOwnerWithdrawalError } from "./errors";

export type CapitalContribution = Readonly<{
  idContribution: string;
  idOwner: string;
  date: Date;
  amount: Money;
}>;

export type NewCapitalContribution = Readonly<{
  idOwner: string;
  date: Date;
  amount: Money;
}>;

export function createNewCapitalContribution(input: {
  idOwner: string;
  date?: Date;
  amount: Money;
}): NewCapitalContribution {
  if (!input.idOwner) {
    throw new InvalidCapitalContributionError("Capital contribution owner id is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidCapitalContributionError(
      "Capital contribution amount must be greater than zero.",
    );
  }

  return {
    idOwner: input.idOwner,
    date: input.date ?? new Date(),
    amount: input.amount,
  };
}

export function restoreCapitalContribution(input: {
  idContribution: string;
  idOwner: string;
  date: Date;
  amount: Money;
}): CapitalContribution {
  if (!input.idContribution) {
    throw new InvalidCapitalContributionError("Capital contribution id is required.");
  }

  return input;
}

export type OwnerWithdrawal = Readonly<{
  idWithdrawal: string;
  idOwner: string;
  date: Date;
  amount: Money;
  reason: string | null;
}>;

export type NewOwnerWithdrawal = Readonly<{
  idOwner: string;
  date: Date;
  amount: Money;
  reason: string | null;
}>;

export function createNewOwnerWithdrawal(input: {
  idOwner: string;
  date?: Date;
  amount: Money;
  reason?: string | null;
}): NewOwnerWithdrawal {
  if (!input.idOwner) {
    throw new InvalidOwnerWithdrawalError("Owner withdrawal owner id is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidOwnerWithdrawalError("Owner withdrawal amount must be greater than zero.");
  }

  const reason = input.reason?.trim() ?? "";

  return {
    idOwner: input.idOwner,
    date: input.date ?? new Date(),
    amount: input.amount,
    reason: reason.length > 0 ? reason : null,
  };
}

export function restoreOwnerWithdrawal(input: {
  idWithdrawal: string;
  idOwner: string;
  date: Date;
  amount: Money;
  reason: string | null;
}): OwnerWithdrawal {
  if (!input.idWithdrawal) {
    throw new InvalidOwnerWithdrawalError("Owner withdrawal id is required.");
  }

  return input;
}
