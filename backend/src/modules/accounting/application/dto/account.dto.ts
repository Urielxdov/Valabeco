import type { AccountType } from "../../domain/enums";

export type AccountDto = Readonly<{
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType;
  balance: string;
}>;
