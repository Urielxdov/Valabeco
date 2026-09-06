import type { AccountDto } from "../dto/account.dto";
import { toAccountDto } from "../mappers/account.mapper";
import type { AccountingRepository } from "../ports/accounting-repository.port";

export class ListAccountsUseCase {
  constructor(private readonly repository: AccountingRepository) {}

  async execute(): Promise<AccountDto[]> {
    const accounts = await this.repository.listAccounts();

    return accounts.map(toAccountDto);
  }
}
