import type { TransactionDto } from "../dto/transaction.dto";
import { toTransactionDto } from "../mappers/transaction.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export class ListTransactionsUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(): Promise<TransactionDto[]> {
    const transactions = await this.repository.listTransactions();

    return transactions.map(toTransactionDto);
  }
}
