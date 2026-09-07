import { Money } from "../../../shared/domain/money";
import type { RefundStatus } from "./enums";
import { InvalidRefundError } from "./errors";

export type Refund = Readonly<{
  idRefund: string;
  idSale: string;
  date: Date;
  amount: Money;
  reason: string;
  status: RefundStatus;
}>;

export type NewRefund = Readonly<{
  idSale: string;
  date: Date;
  amount: Money;
  reason: string;
  status: RefundStatus;
}>;

export function createNewRefund(input: {
  idSale: string;
  date?: Date;
  amount: Money;
  reason: string;
  status: RefundStatus;
}): NewRefund {
  if (!input.idSale) {
    throw new InvalidRefundError("Refund sale id is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidRefundError("Refund amount must be greater than zero.");
  }

  const reason = input.reason.trim();

  if (!reason) {
    throw new InvalidRefundError("Refund reason is required.");
  }

  return {
    idSale: input.idSale,
    date: input.date ?? new Date(),
    amount: input.amount,
    reason,
    status: input.status,
  };
}

export function restoreRefund(input: {
  idRefund: string;
  idSale: string;
  date: Date;
  amount: Money;
  reason: string;
  status: RefundStatus;
}): Refund {
  if (!input.idRefund) {
    throw new InvalidRefundError("Refund id is required.");
  }

  return input;
}
