import { Money } from "../../../shared/domain/money";
import type { LoanStatus } from "./enums";
import { InvalidLoanError, InvalidLoanPaymentError } from "./errors";

export type LoanPayment = Readonly<{
  idLoanPayment: string;
  idLoan: string;
  date: Date;
  amount: Money;
  principalAmount: Money;
  interestAmount: Money;
}>;

export type NewLoanPayment = Readonly<{
  idLoan: string;
  date: Date;
  amount: Money;
  principalAmount: Money;
  interestAmount: Money;
}>;

export type Loan = Readonly<{
  idLoan: string;
  idLender: string;
  principal: Money;
  interestRate: string;
  startDate: Date;
  maturityDate: Date;
  status: LoanStatus;
  payments: LoanPayment[];
}>;

export type NewLoan = Readonly<{
  idLender: string;
  principal: Money;
  interestRate: string;
  startDate: Date;
  maturityDate: Date;
  status: LoanStatus;
}>;

export function createNewLoan(input: {
  idLender: string;
  principal: Money;
  interestRate: string;
  startDate: Date;
  maturityDate: Date;
  status: LoanStatus;
}): NewLoan {
  if (!input.idLender) {
    throw new InvalidLoanError("Loan lender id is required.");
  }

  if (!input.principal.isPositive()) {
    throw new InvalidLoanError("Loan principal must be greater than zero.");
  }

  if (input.maturityDate.getTime() < input.startDate.getTime()) {
    throw new InvalidLoanError("Loan maturity date cannot be before its start date.");
  }

  return {
    idLender: input.idLender,
    principal: input.principal,
    interestRate: input.interestRate,
    startDate: input.startDate,
    maturityDate: input.maturityDate,
    status: input.status,
  };
}

export function restoreLoan(input: {
  idLoan: string;
  idLender: string;
  principal: Money;
  interestRate: string;
  startDate: Date;
  maturityDate: Date;
  status: LoanStatus;
  payments: LoanPayment[];
}): Loan {
  if (!input.idLoan) {
    throw new InvalidLoanError("Loan id is required.");
  }

  return input;
}

/**
 * Valida `amount = principalAmount + interestAmount` usando `Money`, tal
 * como se documenta en `docs/decisions/domains/BI_model.md` para
 * `loan_payment`.
 */
export function createNewLoanPayment(input: {
  idLoan: string;
  date?: Date;
  amount: Money;
  principalAmount: Money;
  interestAmount: Money;
}): NewLoanPayment {
  if (!input.idLoan) {
    throw new InvalidLoanPaymentError("Loan payment loan id is required.");
  }

  if (!input.amount.isPositive()) {
    throw new InvalidLoanPaymentError("Loan payment amount must be greater than zero.");
  }

  if (input.principalAmount.isNegative() || input.interestAmount.isNegative()) {
    throw new InvalidLoanPaymentError("Loan payment components cannot be negative.");
  }

  if (!input.principalAmount.add(input.interestAmount).equals(input.amount)) {
    throw new InvalidLoanPaymentError(
      "Loan payment amount must equal principalAmount + interestAmount.",
    );
  }

  return {
    idLoan: input.idLoan,
    date: input.date ?? new Date(),
    amount: input.amount,
    principalAmount: input.principalAmount,
    interestAmount: input.interestAmount,
  };
}

export function restoreLoanPayment(input: {
  idLoanPayment: string;
  idLoan: string;
  date: Date;
  amount: Money;
  principalAmount: Money;
  interestAmount: Money;
}): LoanPayment {
  if (!input.idLoanPayment) {
    throw new InvalidLoanPaymentError("Loan payment id is required.");
  }

  return input;
}
