import type { Account } from "../../domain/account";
import type { AccountDto } from "../dto/account.dto";

export function toAccountDto(account: Account): AccountDto {
  return {
    idAccount: account.idAccount,
    name: account.name,
    description: account.description,
    type: account.type,
    balance: account.balance.toDecimalString(),
  };
}
