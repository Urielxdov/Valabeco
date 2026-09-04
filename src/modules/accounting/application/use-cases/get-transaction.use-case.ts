import { AccountingNotFoundError } from "../errors";
import type { TransactionDto } from "../dto/transaction.dto";
import { toTransactionDto } from "../mappers/transaction.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export class GetTransactionUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(idTransaction: string): Promise<TransactionDto> {
    const transaction = await this.repository.findTransactionById(idTransaction);

    if (!transaction) {
      throw new AccountingNotFoundError("Transaction was not found.");
    }

    return toTransactionDto(transaction);
  }
}
