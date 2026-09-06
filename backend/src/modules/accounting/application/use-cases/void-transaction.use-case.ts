import { calculateBalanceDeltas, reverseBalanceDeltas } from "../../domain/accounting-policy";
import { assertCanVoidTransaction } from "../../domain/transaction";
import { AccountingNotFoundError } from "../errors";
import type { TransactionDto } from "../dto/transaction.dto";
import { toTransactionDto } from "../mappers/transaction.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export class VoidTransactionUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(idTransaction: string): Promise<TransactionDto> {
    const transaction = await this.repository.findTransactionById(idTransaction);

    if (!transaction) {
      throw new AccountingNotFoundError("Transaction was not found.");
    }

    assertCanVoidTransaction(transaction);

    const balanceDeltas =
      transaction.status === "POSTED"
        ? reverseBalanceDeltas(
            calculateBalanceDeltas(
              transaction,
              await this.repository.findAccountsByIds(
                transaction.entries.map((entry) => entry.idAccount),
              ),
            ),
          )
        : [];

    const voided = await this.repository.voidTransaction({
      idTransaction,
      expectedStatus: transaction.status,
      balanceDeltas,
    });

    return toTransactionDto(voided);
  }
}
