import { calculateBalanceDeltas } from "../../domain/accounting-policy";
import { assertCanPostTransaction } from "../../domain/transaction";
import { AccountingNotFoundError } from "../errors";
import type { TransactionDto } from "../dto/transaction.dto";
import { toTransactionDto } from "../mappers/transaction.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export class PostTransactionUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(idTransaction: string): Promise<TransactionDto> {
    const transaction = await this.repository.findTransactionById(idTransaction);

    if (!transaction) {
      throw new AccountingNotFoundError("Transaction was not found.");
    }

    assertCanPostTransaction(transaction);

    const idAccounts = transaction.entries.map((entry) => entry.idAccount);
    const accounts = await this.repository.findAccountsByIds(idAccounts);
    const balanceDeltas = calculateBalanceDeltas(transaction, accounts);
    const posted = await this.repository.postTransaction(idTransaction, balanceDeltas);

    return toTransactionDto(posted);
  }
}
