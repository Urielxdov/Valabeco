import { Injectable } from "@nestjs/common";
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
import { getPrisma } from "../../accounting/infrastructure/prisma/prisma-client";
import { BusinessIntelligenceValidationError } from "./errors";

type JsonRecord = Record<string, unknown>;

type ItemInput = {
  description: string;
  quantity: string;
  unitPrice: string;
};

type BusinessPrisma = ReturnType<typeof getPrisma> & {
  sale: ModelDelegate;
  purchase: ModelDelegate;
  expense: ModelDelegate;
  loan: ModelDelegate;
  loanPayment: ModelDelegate;
  capitalContribution: ModelDelegate;
  ownerWithdrawal: ModelDelegate;
  refund: ModelDelegate;
};

type ModelDelegate = {
  findMany(args?: unknown): Promise<unknown[]>;
  create(args: unknown): Promise<unknown>;
};

@Injectable()
export class BusinessIntelligenceService {
  private readonly prisma = getPrisma() as BusinessPrisma;

  listSales() {
    return this.prisma.sale.findMany({
      orderBy: { date: "desc" },
      include: { items: true, refunds: true },
    });
  }

  createSale(body: JsonRecord) {
    const request = parseBiContract(CreateSaleRequestSchema, body);
    const items = request.items;
    const subtotal = calculateSubtotal(items);
    const tax = normalizeMoney(request.tax);
    const total = addMoney(subtotal, tax);

    return this.prisma.sale.create({
      data: {
        idCustomer: request.idCustomer,
        date: toDate(request.date),
        subtotal,
        tax,
        total,
        status: request.status,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: normalizeMoney(item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });
  }

  listPurchases() {
    return this.prisma.purchase.findMany({
      orderBy: { date: "desc" },
      include: { items: true },
    });
  }

  createPurchase(body: JsonRecord) {
    const request = parseBiContract(CreatePurchaseRequestSchema, body);
    const items = request.items;
    const subtotal = calculateSubtotal(items);
    const tax = normalizeMoney(request.tax);
    const total = addMoney(subtotal, tax);

    return this.prisma.purchase.create({
      data: {
        idSupplier: request.idSupplier,
        date: toDate(request.date),
        subtotal,
        tax,
        total,
        status: request.status,
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: normalizeMoney(item.unitPrice),
          })),
        },
      },
      include: { items: true },
    });
  }

  listExpenses() {
    return this.prisma.expense.findMany({ orderBy: { date: "desc" } });
  }

  createExpense(body: JsonRecord) {
    const request = parseBiContract(CreateExpenseRequestSchema, body);

    return this.prisma.expense.create({
      data: {
        idParty: request.idParty ?? null,
        date: toDate(request.date),
        description: request.description,
        amount: normalizeMoney(request.amount),
        status: request.status,
      },
    });
  }

  listLoans() {
    return this.prisma.loan.findMany({
      orderBy: { startDate: "desc" },
      include: { payments: true },
    });
  }

  createLoan(body: JsonRecord) {
    const request = parseBiContract(CreateLoanRequestSchema, body);

    return this.prisma.loan.create({
      data: {
        idLender: request.idLender,
        principal: normalizeMoney(request.principal),
        interestRate: request.interestRate,
        startDate: toDate(request.startDate),
        maturityDate: toDate(request.maturityDate),
        status: request.status,
      },
    });
  }

  createLoanPayment(body: JsonRecord) {
    const request = parseBiContract(CreateLoanPaymentRequestSchema, body);
    const principalAmount = normalizeMoney(request.principalAmount);
    const interestAmount = normalizeMoney(request.interestAmount);
    const amount = normalizeMoney(request.amount);

    if (addMoney(principalAmount, interestAmount) !== amount) {
      throw new BusinessIntelligenceValidationError(
        "Loan payment amount must equal principalAmount + interestAmount.",
      );
    }

    return this.prisma.loanPayment.create({
      data: {
        idLoan: request.idLoan,
        date: toDate(request.date),
        amount,
        principalAmount,
        interestAmount,
      },
    });
  }

  listCapitalContributions() {
    return this.prisma.capitalContribution.findMany({ orderBy: { date: "desc" } });
  }

  createCapitalContribution(body: JsonRecord) {
    const request = parseBiContract(CreateCapitalContributionRequestSchema, body);

    return this.prisma.capitalContribution.create({
      data: {
        idOwner: request.idOwner,
        date: toDate(request.date),
        amount: normalizeMoney(request.amount),
      },
    });
  }

  listOwnerWithdrawals() {
    return this.prisma.ownerWithdrawal.findMany({ orderBy: { date: "desc" } });
  }

  createOwnerWithdrawal(body: JsonRecord) {
    const request = parseBiContract(CreateOwnerWithdrawalRequestSchema, body);

    return this.prisma.ownerWithdrawal.create({
      data: {
        idOwner: request.idOwner,
        date: toDate(request.date),
        amount: normalizeMoney(request.amount),
        reason: request.reason || null,
      },
    });
  }

  listRefunds() {
    return this.prisma.refund.findMany({
      orderBy: { date: "desc" },
      include: { sale: true },
    });
  }

  createRefund(body: JsonRecord) {
    const request = parseBiContract(CreateRefundRequestSchema, body);

    return this.prisma.refund.create({
      data: {
        idSale: request.idSale,
        date: toDate(request.date),
        amount: normalizeMoney(request.amount),
        reason: request.reason,
        status: request.status,
      },
    });
  }
}

function calculateSubtotal(items: ItemInput[]): string {
  const cents = items.reduce((sum, item) => {
    return sum + Math.round(Number(item.quantity) * moneyToCents(item.unitPrice));
  }, 0);

  return centsToMoney(cents);
}

function addMoney(left: string, right: string): string {
  return centsToMoney(moneyToCents(left) + moneyToCents(right));
}

function moneyToCents(value: string): number {
  const [units, cents = ""] = value.split(".");
  return Number.parseInt(units, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
}

function centsToMoney(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function normalizeMoney(value: string): string {
  return centsToMoney(moneyToCents(value));
}

function toDate(value?: string): Date {
  return value ? new Date(value) : new Date();
}

function parseBiContract<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (result.success) {
    return result.data;
  }

  const issue = result.error.issues[0];
  const path = issue?.path.length ? `${issue.path.join(".")}: ` : "";
  throw new BusinessIntelligenceValidationError(`${path}${issue?.message ?? "Invalid request body."}`);
}
