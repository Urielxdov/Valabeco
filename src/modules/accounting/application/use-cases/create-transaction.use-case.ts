import type { EntryType } from "../../domain/enums";
import { Money } from "../../domain/money";
import { createDraftTransaction } from "../../domain/transaction";
import type { TransactionDto } from "../dto/transaction.dto";
import { toTransactionDto } from "../mappers/transaction.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

/**
 * Valores de entrada para crear una nueva transacción contable.
 * @property date Fecha de la transacción contable.
 * @property description Descripción de la transacción contable.
 * @property entries Entradas de la transacción contable.
 * @property entries.idAccount Identificador de la cuenta contable asociada a la entrada de transacción.
 */
export type CreateTransactionInput = Readonly<{
  date?: Date;
  description: string;
  entries: Array<{
    idAccount: string;
    amount: string;
    type: EntryType;
  }>;
}>;


/**
 * Caso de uso para crear una nueva transacción contable.
 * @param input Valores de entrada para crear una nueva transacción contable.
 * @returns La transacción contable creada.
 */
export class CreateTransactionUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(input: CreateTransactionInput): Promise<TransactionDto> {
    const transaction = createDraftTransaction({
      date: input.date,
      description: input.description,
      entries: input.entries.map((entry) => ({
        idAccount: entry.idAccount,
        amount: Money.fromDecimal(entry.amount),
        type: entry.type,
      })),
    });

    const created = await this.repository.createTransaction(transaction);

    return toTransactionDto(created);
  }
}
