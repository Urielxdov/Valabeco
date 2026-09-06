import { z } from "zod";
import {
  MoneyStringSchema,
  PositiveMoneyStringSchema,
} from "../accounting/account.schema";
import {
  BusinessDocumentStatusSchema,
  BusinessItemRequestSchema,
  LoanStatusSchema,
  RefundStatusSchema,
} from "./common.schema";

const DateStringSchema = z.string().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  {
    message: "Date must be a valid ISO date.",
  },
);

const DecimalStringSchema = z.string().regex(/^\d+(\.\d{1,4})?$/, {
  message: "Value must be a decimal string with up to 4 decimals.",
});

export const CreateSaleRequestSchema = z.object({
  idCustomer: z.string().uuid(),
  date: DateStringSchema.optional(),
  tax: MoneyStringSchema,
  status: BusinessDocumentStatusSchema.default("DRAFT"),
  items: z.array(BusinessItemRequestSchema).min(1),
});

export const CreatePurchaseRequestSchema = z.object({
  idSupplier: z.string().uuid(),
  date: DateStringSchema.optional(),
  tax: MoneyStringSchema,
  status: BusinessDocumentStatusSchema.default("DRAFT"),
  items: z.array(BusinessItemRequestSchema).min(1),
});

export const CreateExpenseRequestSchema = z.object({
  idParty: z.string().uuid().nullable().optional(),
  date: DateStringSchema.optional(),
  description: z.string().trim().min(1).max(500),
  amount: PositiveMoneyStringSchema,
  status: BusinessDocumentStatusSchema.default("DRAFT"),
});

export const CreateLoanRequestSchema = z.object({
  idLender: z.string().uuid(),
  principal: PositiveMoneyStringSchema,
  interestRate: DecimalStringSchema,
  startDate: DateStringSchema,
  maturityDate: DateStringSchema,
  status: LoanStatusSchema.default("ACTIVE"),
});

export const CreateLoanPaymentRequestSchema = z.object({
  idLoan: z.string().uuid(),
  date: DateStringSchema.optional(),
  amount: PositiveMoneyStringSchema,
  principalAmount: PositiveMoneyStringSchema,
  interestAmount: PositiveMoneyStringSchema,
});

export const CreateCapitalContributionRequestSchema = z.object({
  idOwner: z.string().uuid(),
  date: DateStringSchema.optional(),
  amount: PositiveMoneyStringSchema,
});

export const CreateOwnerWithdrawalRequestSchema = z.object({
  idOwner: z.string().uuid(),
  date: DateStringSchema.optional(),
  amount: PositiveMoneyStringSchema,
  reason: z.string().trim().max(500).nullable().optional(),
});

export const CreateRefundRequestSchema = z.object({
  idSale: z.string().uuid(),
  date: DateStringSchema.optional(),
  amount: PositiveMoneyStringSchema,
  reason: z.string().trim().min(1).max(500),
  status: RefundStatusSchema.default("PENDING"),
});

export const SaleItemSchema = z.object({
  idSaleItem: z.string().uuid(),
  idSale: z.string().uuid(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: MoneyStringSchema,
});

export const PurchaseItemSchema = z.object({
  idPurchaseItem: z.string().uuid(),
  idPurchase: z.string().uuid(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: MoneyStringSchema,
});

export const LoanPaymentSchema = z.object({
  idLoanPayment: z.string().uuid(),
  idLoan: z.string().uuid(),
  date: z.string().datetime(),
  amount: MoneyStringSchema,
  principalAmount: MoneyStringSchema,
  interestAmount: MoneyStringSchema,
});

export const SaleSchema = z.object({
  idSale: z.string().uuid(),
  idCustomer: z.string().uuid(),
  date: z.string().datetime(),
  subtotal: MoneyStringSchema,
  tax: MoneyStringSchema,
  total: MoneyStringSchema,
  status: BusinessDocumentStatusSchema,
  items: z.array(SaleItemSchema).optional(),
});

export const PurchaseSchema = z.object({
  idPurchase: z.string().uuid(),
  idSupplier: z.string().uuid(),
  date: z.string().datetime(),
  subtotal: MoneyStringSchema,
  tax: MoneyStringSchema,
  total: MoneyStringSchema,
  status: BusinessDocumentStatusSchema,
  items: z.array(PurchaseItemSchema).optional(),
});

export const ExpenseSchema = z.object({
  idExpense: z.string().uuid(),
  idParty: z.string().uuid().nullable(),
  date: z.string().datetime(),
  description: z.string(),
  amount: MoneyStringSchema,
  status: BusinessDocumentStatusSchema,
});

export const LoanSchema = z.object({
  idLoan: z.string().uuid(),
  idLender: z.string().uuid(),
  principal: MoneyStringSchema,
  interestRate: DecimalStringSchema,
  startDate: z.string().datetime(),
  maturityDate: z.string().datetime(),
  status: LoanStatusSchema,
  payments: z.array(LoanPaymentSchema).optional(),
});

export const CapitalContributionSchema = z.object({
  idContribution: z.string().uuid(),
  idOwner: z.string().uuid(),
  date: z.string().datetime(),
  amount: MoneyStringSchema,
});

export const OwnerWithdrawalSchema = z.object({
  idWithdrawal: z.string().uuid(),
  idOwner: z.string().uuid(),
  date: z.string().datetime(),
  amount: MoneyStringSchema,
  reason: z.string().nullable(),
});

export const RefundSchema = z.object({
  idRefund: z.string().uuid(),
  idSale: z.string().uuid(),
  date: z.string().datetime(),
  amount: MoneyStringSchema,
  reason: z.string(),
  status: RefundStatusSchema,
  sale: SaleSchema.optional(),
});

export type CreateSaleRequest = z.infer<typeof CreateSaleRequestSchema>;
export type CreatePurchaseRequest = z.infer<typeof CreatePurchaseRequestSchema>;
export type CreateExpenseRequest = z.infer<typeof CreateExpenseRequestSchema>;
export type CreateLoanRequest = z.infer<typeof CreateLoanRequestSchema>;
export type CreateLoanPaymentRequest = z.infer<typeof CreateLoanPaymentRequestSchema>;
export type CreateCapitalContributionRequest = z.infer<
  typeof CreateCapitalContributionRequestSchema
>;
export type CreateOwnerWithdrawalRequest = z.infer<typeof CreateOwnerWithdrawalRequestSchema>;
export type CreateRefundRequest = z.infer<typeof CreateRefundRequestSchema>;
export type Sale = z.infer<typeof SaleSchema>;
export type SaleItem = z.infer<typeof SaleItemSchema>;
export type Purchase = z.infer<typeof PurchaseSchema>;
export type PurchaseItem = z.infer<typeof PurchaseItemSchema>;
export type Expense = z.infer<typeof ExpenseSchema>;
export type Loan = z.infer<typeof LoanSchema>;
export type LoanPayment = z.infer<typeof LoanPaymentSchema>;
export type CapitalContribution = z.infer<typeof CapitalContributionSchema>;
export type OwnerWithdrawal = z.infer<typeof OwnerWithdrawalSchema>;
export type Refund = z.infer<typeof RefundSchema>;
