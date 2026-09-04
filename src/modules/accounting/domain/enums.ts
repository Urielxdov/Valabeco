export const ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "REVENUE",
  "EXPENSE",
] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const TRANSACTION_STATUSES = ["DRAFT", "POSTED", "VOIDED"] as const;

export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const ENTRY_TYPES = ["DEBIT", "CREDIT"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === "string" && ACCOUNT_TYPES.includes(value as AccountType);
}

export function isEntryType(value: unknown): value is EntryType {
  return typeof value === "string" && ENTRY_TYPES.includes(value as EntryType);
}
