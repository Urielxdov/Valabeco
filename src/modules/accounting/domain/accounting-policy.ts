import type { Account, AccountBalanceDelta } from "./account";
import { getBalanceDelta } from "./account";
import { InvalidTransactionError } from "./errors";
import { Money } from "./money";
import type { AccountingTransaction } from "./transaction";

export function calculateBalanceDeltas(
  transaction: AccountingTransaction,
  accounts: Account[],
): AccountBalanceDelta[] {
  const accountsById = new Map(accounts.map((account) => [account.idAccount, account]));
  const deltasByAccount = new Map<string, Money>();

  for (const entry of transaction.entries) {
    const account = accountsById.get(entry.idAccount);

    if (!account) {
      throw new InvalidTransactionError(`Account ${entry.idAccount} was not found.`);
    }

    const entryDelta = getBalanceDelta(account.type, entry.type, entry.amount);
    const currentDelta = deltasByAccount.get(account.idAccount) ?? Money.zero();
    deltasByAccount.set(account.idAccount, currentDelta.add(entryDelta));
  }

  return Array.from(deltasByAccount.entries()).map(([idAccount, delta]) => ({
    idAccount,
    delta,
  }));
}

export function reverseBalanceDeltas(deltas: AccountBalanceDelta[]): AccountBalanceDelta[] {
  return deltas.map((delta) => ({
    idAccount: delta.idAccount,
    delta: delta.delta.negate(),
  }));
}
