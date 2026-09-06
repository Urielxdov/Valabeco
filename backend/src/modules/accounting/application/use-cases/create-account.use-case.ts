import { createNewAccount } from "../../domain/account";
import type { AccountType } from "../../domain/enums";
import type { AccountDto } from "../dto/account.dto";
import { toAccountDto } from "../mappers/account.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

/**
 * Valores de entrada para crear una nueva cuenta contable.
 * @property name Nombre de la cuenta contable.
 * @property description Descripcion de la cuenta contable.
 * @property type Tipo de la cuenta contable.
 */
export type CreateAccountInput = Readonly<{
  name: string;
  description?: string | null;
  type: AccountType;
}>;


/**
 * Caso de uso para crear una nueva cuenta contable.
 * @param input Valores de entrada para crear una nueva cuenta contable.
 * @returns La cuenta contable creada.
 */
export class CreateAccountUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(input: CreateAccountInput): Promise<AccountDto> {
    const account = createNewAccount(input);
    const created = await this.repository.createAccount(account);

    return toAccountDto(created);
  }
}
