import {
  CreateCapitalContributionRequestSchema,
  CreateExpenseRequestSchema,
  CreateLoanPaymentRequestSchema,
  CreateLoanRequestSchema,
  CreateOwnerWithdrawalRequestSchema,
  CreatePurchaseRequestSchema,
  CreateRefundRequestSchema,
  CreateSaleRequestSchema,
} from "@valabeco/contracts";
import type { z } from "zod";

import { BusinessIntelligenceValidationError } from "../../application/errors";
import type { CreateCapitalContributionInput } from "../../application/use-cases/create-capital-contribution.use-case";
import type { CreateExpenseInput } from "../../application/use-cases/create-expense.use-case";
import type { CreateLoanInput } from "../../application/use-cases/create-loan.use-case";
import type { CreateLoanPaymentInput } from "../../application/use-cases/create-loan-payment.use-case";
import type { CreateOwnerWithdrawalInput } from "../../application/use-cases/create-owner-withdrawal.use-case";
import type { CreatePurchaseInput } from "../../application/use-cases/create-purchase.use-case";
import type { CreateRefundInput } from "../../application/use-cases/create-refund.use-case";
import type { CreateSaleInput } from "../../application/use-cases/create-sale.use-case";

type JsonRecord = Record<string, unknown>;

export function parseCreateSaleInput(body: JsonRecord): CreateSaleInput {
  const result = parseContract(CreateSaleRequestSchema, body);

  return {
    idCustomer: result.idCustomer,
    date: result.date ? parseDate(result.date) : undefined,
    tax: result.tax,
    status: result.status,
    items: result.items,
  };
}

export function parseCreatePurchaseInput(body: JsonRecord): CreatePurchaseInput {
  const result = parseContract(CreatePurchaseRequestSchema, body);

  return {
    idSupplier: result.idSupplier,
    date: result.date ? parseDate(result.date) : undefined,
    tax: result.tax,
    status: result.status,
    items: result.items,
  };
}

export function parseCreateExpenseInput(body: JsonRecord): CreateExpenseInput {
  const result = parseContract(CreateExpenseRequestSchema, body);

  return {
    idParty: result.idParty ?? null,
    date: result.date ? parseDate(result.date) : undefined,
    description: result.description,
    amount: result.amount,
    status: result.status,
  };
}

export function parseCreateLoanInput(body: JsonRecord): CreateLoanInput {
  const result = parseContract(CreateLoanRequestSchema, body);

  return {
    idLender: result.idLender,
    principal: result.principal,
    interestRate: result.interestRate,
    startDate: parseDate(result.startDate),
    maturityDate: parseDate(result.maturityDate),
    status: result.status,
  };
}

export function parseCreateLoanPaymentInput(body: JsonRecord): CreateLoanPaymentInput {
  const result = parseContract(CreateLoanPaymentRequestSchema, body);

  return {
    idLoan: result.idLoan,
    date: result.date ? parseDate(result.date) : undefined,
    amount: result.amount,
    principalAmount: result.principalAmount,
    interestAmount: result.interestAmount,
  };
}

export function parseCreateCapitalContributionInput(
  body: JsonRecord,
): CreateCapitalContributionInput {
  const result = parseContract(CreateCapitalContributionRequestSchema, body);

  return {
    idOwner: result.idOwner,
    date: result.date ? parseDate(result.date) : undefined,
    amount: result.amount,
  };
}

export function parseCreateOwnerWithdrawalInput(body: JsonRecord): CreateOwnerWithdrawalInput {
  const result = parseContract(CreateOwnerWithdrawalRequestSchema, body);

  return {
    idOwner: result.idOwner,
    date: result.date ? parseDate(result.date) : undefined,
    amount: result.amount,
    reason: result.reason ?? null,
  };
}

export function parseCreateRefundInput(body: JsonRecord): CreateRefundInput {
  const result = parseContract(CreateRefundRequestSchema, body);

  return {
    idSale: result.idSale,
    date: result.date ? parseDate(result.date) : undefined,
    amount: result.amount,
    reason: result.reason,
    status: result.status,
  };
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BusinessIntelligenceValidationError("Date must be a valid ISO date.");
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
  throw new BusinessIntelligenceValidationError(`${path}${issue?.message ?? "Invalid request body."}`);
}
