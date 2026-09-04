import { createNewAccount } from "../../domain/account";
import type { AccountType } from "../../domain/enums";
import type { AccountDto } from "../dto/account.dto";
import { toAccountDto } from "../mappers/account.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export type CreateAccountInput = Readonly<{
  name: string;
  description?: string | null;
  type: AccountType;
}>;

export class CreateAccountUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(input: CreateAccountInput): Promise<AccountDto> {
    const account = createNewAccount(input);
    const created = await this.repository.createAccount(account);

    return toAccountDto(created);
  }
}
