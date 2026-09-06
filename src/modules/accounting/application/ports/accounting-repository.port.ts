import type { Account, AccountBalanceDelta, NewAccount } from "../../domain/account";
import type {
  AccountingTransaction,
  NewAccountingTransaction,
} from "../../domain/transaction";
import type { TransactionStatus } from "../../domain/enums";

export type VoidTransactionInput = Readonly<{
  idTransaction: string;
  expectedStatus: TransactionStatus;
  balanceDeltas: AccountBalanceDelta[];
}>;

export interface AccountingRepository {
  createAccount(account: NewAccount): Promise<Account>;
  listAccounts(): Promise<Account[]>;
  findAccountsByIds(idAccounts: string[]): Promise<Account[]>;
  createTransaction(transaction: NewAccountingTransaction): Promise<AccountingTransaction>;
  listTransactions(): Promise<AccountingTransaction[]>;
  findTransactionById(idTransaction: string): Promise<AccountingTransaction | null>;
  postTransaction(
    idTransaction: string,
    balanceDeltas: AccountBalanceDelta[],
  ): Promise<AccountingTransaction>;
  voidTransaction(input: VoidTransactionInput): Promise<AccountingTransaction>;
}
