import { z } from "zod";

export const AccountTypeSchema = z.enum([
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
]);

export const SignedMoneyStringSchema = z.string().regex(/^-?\d+(\.\d{1,2})?$/, {
  message: "Value must be a decimal string with up to 2 decimals.",
});

export const MoneyStringSchema = z.string().regex(/^\d+(\.\d{1,2})?$/, {
  message: "Value must be a non-negative decimal string with up to 2 decimals.",
});

export const PositiveMoneyStringSchema = MoneyStringSchema.refine(
  (value) => moneyToCents(value) > 0,
  {
    message: "Value must be greater than zero.",
  },
);

export const AccountSchema = z.object({
  idAccount: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  type: AccountTypeSchema,
  balance: SignedMoneyStringSchema,
});

export const CreateAccountRequestSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  type: AccountTypeSchema,
});

export type AccountType = z.infer<typeof AccountTypeSchema>;
export type Account = z.infer<typeof AccountSchema>;
export type CreateAccountRequest = z.infer<typeof CreateAccountRequestSchema>;

function moneyToCents(value: string): number {
  const [units, cents = ""] = value.split(".");
  return Number.parseInt(units, 10) * 100 + Number.parseInt(cents.padEnd(2, "0"), 10);
}
