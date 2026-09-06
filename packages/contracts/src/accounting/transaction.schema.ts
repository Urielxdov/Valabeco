import { z } from "zod";
import { PositiveMoneyStringSchema } from "./account.schema";

export const EntryTypeSchema = z.enum(["DEBIT", "CREDIT"]);
export const TransactionStatusSchema = z.enum(["DRAFT", "POSTED", "VOIDED"]);

export const TransactionEntrySchema = z.object({
  idTransactionEntry: z.string().uuid(),
  idTransaction: z.string().uuid(),
  idAccount: z.string().uuid(),
  amount: PositiveMoneyStringSchema,
  type: EntryTypeSchema,
});

export const TransactionSchema = z.object({
  idTransaction: z.string().uuid(),
  date: z.string().datetime(),
  description: z.string().min(1),
  status: TransactionStatusSchema,
  entries: z.array(TransactionEntrySchema),
});

export const CreateTransactionEntryRequestSchema = z.object({
  idAccount: z.string().uuid(),
  amount: PositiveMoneyStringSchema,
  type: EntryTypeSchema,
});

export const CreateTransactionRequestSchema = z.object({
  date: z
    .string()
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
      message: "Transaction date must be a valid ISO date.",
    })
    .optional(),
  description: z.string().trim().min(1),
  entries: z.array(CreateTransactionEntryRequestSchema).min(2),
});

export type EntryType = z.infer<typeof EntryTypeSchema>;
export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;
export type TransactionEntry = z.infer<typeof TransactionEntrySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type CreateTransactionRequest = z.infer<typeof CreateTransactionRequestSchema>;
