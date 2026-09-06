import { z } from "zod";
import { MoneyStringSchema } from "../accounting/account.schema";

export const BusinessDocumentStatusSchema = z.enum(["DRAFT", "CONFIRMED", "CANCELLED"]);
export const LoanStatusSchema = z.enum(["ACTIVE", "PAID", "DEFAULTED", "CANCELLED"]);
export const RefundStatusSchema = z.enum(["PENDING", "COMPLETED", "CANCELLED"]);

export const BusinessItemRequestSchema = z.object({
  description: z.string().trim().min(1).max(255),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/),
  unitPrice: MoneyStringSchema,
});

export const ApiUnknownRecordSchema = z.record(z.string(), z.unknown());

export type BusinessDocumentStatus = z.infer<typeof BusinessDocumentStatusSchema>;
export type LoanStatus = z.infer<typeof LoanStatusSchema>;
export type RefundStatus = z.infer<typeof RefundStatusSchema>;
