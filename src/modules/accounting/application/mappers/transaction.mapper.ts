import type { AccountingTransaction } from "../../domain/transaction";
import type { TransactionDto } from "../dto/transaction.dto";

export function toTransactionDto(transaction: AccountingTransaction): TransactionDto {
  return {
    idTransaction: transaction.idTransaction,
    date: transaction.date.toISOString(),
    description: transaction.description,
    status: transaction.status,
    entries: transaction.entries.map((entry) => ({
      idTransactionEntry: entry.idTransactionEntry,
      idTransaction: entry.idTransaction,
      idAccount: entry.idAccount,
      amount: entry.amount.toDecimalString(),
      type: entry.type,
    })),
  };
}
