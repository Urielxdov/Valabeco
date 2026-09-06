import type { Account, AccountBalanceDelta } from "./account";
import { getBalanceDelta } from "./account";
import { InvalidTransactionError } from "./errors";
import { Money } from "./money";
import type { AccountingTransaction } from "./transaction";

export function calculateBalanceDeltas(
  transaction: AccountingTransaction,
  accounts: Account[],
): AccountBalanceDelta[] {
  // Genera un listado para tener acceso rapido a las cuentas por su id
  const accountsById = new Map(accounts.map((account) => [account.idAccount, account]));
  // Agrupa los deltas de balance por cuenta contable
  const deltasByAccount = new Map<string, Money>();

  for (const entry of transaction.entries) {
    // Busca en el repositorio la cuenta contable asociada a la entrada de transaccion
    const account = accountsById.get(entry.idAccount);

    if (!account) {
      throw new InvalidTransactionError(`Account ${entry.idAccount} was not found.`);
    }
    // Evalua el delta de balance de la cuenta contable asociada a la entrada de transaccion
    const entryDelta = getBalanceDelta(account.type, entry.type, entry.amount);
    // Suma el delta de balance de la entrada de transaccion al delta de balance acumulado de la cuenta contable
    const currentDelta = deltasByAccount.get(account.idAccount) ?? Money.zero();
    // Actualiza el delta de balance acumulado de la cuenta contable
    deltasByAccount.set(account.idAccount, currentDelta.add(entryDelta));
  }
  // Convierte el mapa de deltas de balance por cuenta contable en un arreglo de deltas de balance por cuenta contable
  return Array.from(deltasByAccount.entries()).map(([idAccount, delta]) => ({
    idAccount,
    delta,
  }));
}


/**
 * Regresa un arreglo de deltas de balance de cuenta contable con los valores negados.
 * @param deltas 
 * @returns 
 */
export function reverseBalanceDeltas(deltas: AccountBalanceDelta[]): AccountBalanceDelta[] {
  return deltas.map((delta) => ({
    idAccount: delta.idAccount,
    delta: delta.delta.negate(),
  }));
}
