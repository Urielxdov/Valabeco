import type { EntryType, TransactionStatus } from "../../domain/enums";

export type TransactionEntryDto = Readonly<{
  idTransactionEntry: string;
  idTransaction: string;
  idAccount: string;
  amount: string;
  type: EntryType;
}>;

export type TransactionDto = Readonly<{
  idTransaction: string;
  date: string;
  description: string;
  status: TransactionStatus;
  entries: TransactionEntryDto[];
}>;
