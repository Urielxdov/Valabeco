import "server-only";

import { getPrisma } from "@/src/modules/accounting/infrastructure/prisma/prisma-client";
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

const MONEY_PATTERN = /^\d+(\.\d{1,2})?$/;
const QUANTITY_PATTERN = /^\d+(\.\d{1,4})?$/;

export class BusinessIntelligenceService {
  private readonly prisma = getPrisma() as BusinessPrisma;

  listSales() {
    return this.prisma.sale.findMany({
      orderBy: { date: "desc" },
      include: { items: true, refunds: true },
    });
  }

  createSale(body: JsonRecord) {
    const items = readItems(body, "items");
    const subtotal = calculateSubtotal(items);
    const tax = readMoney(body, "tax", true);
    const total = addMoney(subtotal, tax);

    return this.prisma.sale.create({
      data: {
        idCustomer: readUuid(body, "idCustomer", "id_customer"),
        date: readDate(body),
        subtotal,
        tax,
        total,
        status: readDocumentStatus(body),
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
    const items = readItems(body, "items");
    const subtotal = calculateSubtotal(items);
    const tax = readMoney(body, "tax", true);
    const total = addMoney(subtotal, tax);

    return this.prisma.purchase.create({
      data: {
        idSupplier: readUuid(body, "idSupplier", "id_supplier"),
        date: readDate(body),
        subtotal,
        tax,
        total,
        status: readDocumentStatus(body),
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
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
    return this.prisma.expense.create({
      data: {
        idParty: readOptionalUuid(body, "idParty", "id_party"),
        date: readDate(body),
        description: readText(body, "description", 500),
        amount: readMoney(body, "amount"),
        status: readDocumentStatus(body),
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
    return this.prisma.loan.create({
      data: {
        idLender: readUuid(body, "idLender", "id_lender"),
        principal: readMoney(body, "principal"),
        interestRate: readDecimal(body, "interestRate", "interest_rate"),
        startDate: readRequiredDate(body, "startDate", "start_date"),
        maturityDate: readRequiredDate(body, "maturityDate", "maturity_date"),
        status: readLoanStatus(body),
      },
    });
  }

  createLoanPayment(body: JsonRecord) {
    const principalAmount = readMoney(body, "principalAmount", false, "principal_amount");
    const interestAmount = readMoney(body, "interestAmount", false, "interest_amount");
    const amount = readMoney(body, "amount");

    if (addMoney(principalAmount, interestAmount) !== amount) {
      throw new BusinessIntelligenceValidationError(
        "Loan payment amount must equal principalAmount + interestAmount.",
      );
    }

    return this.prisma.loanPayment.create({
      data: {
        idLoan: readUuid(body, "idLoan", "id_loan"),
        date: readDate(body),
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
    return this.prisma.capitalContribution.create({
      data: {
        idOwner: readUuid(body, "idOwner", "id_owner"),
        date: readDate(body),
        amount: readMoney(body, "amount"),
      },
    });
  }

  listOwnerWithdrawals() {
    return this.prisma.ownerWithdrawal.findMany({ orderBy: { date: "desc" } });
  }

  createOwnerWithdrawal(body: JsonRecord) {
    return this.prisma.ownerWithdrawal.create({
      data: {
        idOwner: readUuid(body, "idOwner", "id_owner"),
        date: readDate(body),
        amount: readMoney(body, "amount"),
        reason: readOptionalText(body, "reason", 500),
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
    return this.prisma.refund.create({
      data: {
        idSale: readUuid(body, "idSale", "id_sale"),
        date: readDate(body),
        amount: readMoney(body, "amount"),
        reason: readText(body, "reason", 500),
        status: readRefundStatus(body),
      },
    });
  }
}

export async function readJsonObject(request: Request): Promise<JsonRecord> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new BusinessIntelligenceValidationError("Request body must be valid JSON.");
  }

  if (!isRecord(body)) {
    throw new BusinessIntelligenceValidationError("Request body must be a JSON object.");
  }

  return body;
}

function readItems(body: JsonRecord, key: string): ItemInput[] {
  const value = body[key];

  if (!Array.isArray(value) || value.length === 0) {
    throw new BusinessIntelligenceValidationError(`${key} must contain at least one item.`);
  }

  return value.map((item) => {
    if (!isRecord(item)) {
      throw new BusinessIntelligenceValidationError("Each item must be an object.");
    }

    return {
      description: readText(item, "description", 255),
      quantity: readQuantity(item, "quantity"),
      unitPrice: readMoney(item, "unitPrice", true, "unit_price"),
    };
  });
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

function readDate(body: JsonRecord): Date {
  const value = body["date"];

  return typeof value === "string" && value.trim() ? parseDate(value) : new Date();
}

function readRequiredDate(body: JsonRecord, ...keys: string[]): Date {
  return parseDate(readString(body, ...keys));
}

function parseDate(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new BusinessIntelligenceValidationError("Date must be a valid ISO date.");
  }

  return date;
}

function readUuid(body: JsonRecord, ...keys: string[]): string {
  const value = readString(body, ...keys);

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new BusinessIntelligenceValidationError(`${keys[0]} must be a valid UUID.`);
  }

  return value;
}

function readOptionalUuid(body: JsonRecord, ...keys: string[]): string | null {
  const value = keys.map((key) => body[key]).find((item) => item !== undefined && item !== null);

  if (value === undefined || value === null || value === "") {
    return null;
  }

  return readUuid(body, ...keys);
}

function readText(body: JsonRecord, key: string, maxLength: number): string {
  const value = readString(body, key);

  if (value.length > maxLength) {
    throw new BusinessIntelligenceValidationError(`${key} cannot exceed ${maxLength} characters.`);
  }

  return value;
}

function readOptionalText(body: JsonRecord, key: string, maxLength: number): string | null {
  const value = body[key];

  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new BusinessIntelligenceValidationError(`${key} must be a string.`);
  }

  const text = value.trim();

  if (text.length > maxLength) {
    throw new BusinessIntelligenceValidationError(`${key} cannot exceed ${maxLength} characters.`);
  }

  return text || null;
}

function readString(body: JsonRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = body[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  throw new BusinessIntelligenceValidationError(`${keys[0]} is required.`);
}

function readMoney(
  body: JsonRecord,
  key: string,
  allowZero = false,
  alternateKey?: string,
): string {
  const value = body[key] ?? (alternateKey ? body[alternateKey] : undefined);

  if (typeof value !== "string" || !MONEY_PATTERN.test(value.trim())) {
    throw new BusinessIntelligenceValidationError(`${key} must be a decimal string.`);
  }

  if (!allowZero && moneyToCents(value) <= 0) {
    throw new BusinessIntelligenceValidationError(`${key} must be greater than zero.`);
  }

  return centsToMoney(moneyToCents(value));
}

function readQuantity(body: JsonRecord, key: string): string {
  const value = body[key];

  if (typeof value !== "string" || !QUANTITY_PATTERN.test(value.trim()) || Number(value) <= 0) {
    throw new BusinessIntelligenceValidationError(`${key} must be a positive decimal string.`);
  }

  return value.trim();
}

function readDecimal(body: JsonRecord, key: string, alternateKey?: string): string {
  const value = body[key] ?? (alternateKey ? body[alternateKey] : undefined);

  if (typeof value !== "string" || !/^\d+(\.\d{1,4})?$/.test(value.trim())) {
    throw new BusinessIntelligenceValidationError(`${key} must be a decimal string.`);
  }

  return value.trim();
}

function readDocumentStatus(body: JsonRecord) {
  return readEnum(body["status"], ["DRAFT", "CONFIRMED", "CANCELLED"] as const, "DRAFT");
}

function readLoanStatus(body: JsonRecord) {
  return readEnum(body["status"], ["ACTIVE", "PAID", "DEFAULTED", "CANCELLED"] as const, "ACTIVE");
}

function readRefundStatus(body: JsonRecord) {
  return readEnum(body["status"], ["PENDING", "COMPLETED", "CANCELLED"] as const, "PENDING");
}

function readEnum<const T extends string>(
  value: unknown,
  options: readonly T[],
  fallback: T,
): T {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  if (typeof value === "string" && options.includes(value as T)) {
    return value as T;
  }

  throw new BusinessIntelligenceValidationError(`Invalid status value.`);
}

function moneyToCents(value: string): number {
  const [units, cents = ""] = value.split(".");
  return Number.parseInt(units, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
}

function centsToMoney(cents: number): string {
  return `${Math.trunc(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
