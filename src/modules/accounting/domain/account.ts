import type { AccountType, EntryType } from "./enums";
import { InvalidAccountError } from "./errors";
import { Money } from "./money";



/**
 * Representa una cuenta contable en el sistema.
 */
export type Account = Readonly<{
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType; // Tipo de cuenta contable (activo, pasivo, ingreso, gasto, etc.)
  balance: Money; 
}>;

/**
 * Representa los datos necesarios para crear una nueva cuenta contable en el sistema.
 */
export type NewAccount = Readonly<{
  name: string;
  description: string | null;
  type: AccountType;
  balance: Money;
}>;


/**
 * Representa un cambio en el saldo de una cuenta contable, incluyendo el identificador de la cuenta y la cantidad del cambio.
 */
export type AccountBalanceDelta = Readonly<{
  idAccount: string;
  delta: Money;
}>;

/**
 * Crea una nueva cuenta contable con los datos proporcionados.
 * @param input 
 * @returns 
 */
export function createNewAccount(input: {
  name: string;
  description?: string | null;
  type: AccountType;
}): NewAccount {
  const name = normalizeAccountName(input.name);

  return {
    name,
    description: normalizeOptionalText(input.description),
    type: input.type,
    balance: Money.zero(),
  };
}

/**
 * Restaura una cuenta contable existente con los datos proporcionados.
 * @param input 
 * @returns 
 */
export function restoreAccount(input: {
  idAccount: string;
  name: string;
  description: string | null;
  type: AccountType;
  balance: Money;
}): Account {
  if (!input.idAccount) {
    throw new InvalidAccountError("Account id is required.");
  }

  return {
    idAccount: input.idAccount,
    name: normalizeAccountName(input.name),
    description: normalizeOptionalText(input.description),
    type: input.type,
    balance: input.balance,
  };
}

/**
 * Calcula el cambio en el saldo de una cuenta contable basado en su tipo, el tipo de asiento y la cantidad.
 * Los activos y gastos aumentan con debitos y disminuyen con creditos
 * mientras que los pasivos e ingresos aumentan con creditos y disminuyen con debitos.
 * 
 * ¿Por que?
 * Porque los activos y gastos representan recursos que la empresa posee o consume
 * Activo: Cosas que la empresa posee y gastos: Cosas que la empresa consume para generar ingresos
 * Por otro lado, los pasivos e ingresos representan obligaciones y ganancias de la empresa
 * Pasivo: Cosas que la empresa debe a otros y Ingreso: Cosas que la empresa gana por sus operaciones
 * @param accountType 
 * @param entryType 
 * @param amount 
 * @returns 
 */
export function getBalanceDelta(
  accountType: AccountType,
  entryType: EntryType,
  amount: Money,
): Money {
  // Determina si un débito aumenta el saldo de la cuenta según su tipo.
  // Para cuentas de tipo activo y gasto, un débito aumenta el saldo; para cuentas de tipo pasivo e ingreso, un débito disminuye el saldo.
  const debitIncreases = accountType === "ASSET" || accountType === "EXPENSE";
  // Determina si el tipo de asiento es un débito o un crédito.
  const increases = entryType === "DEBIT" ? debitIncreases : !debitIncreases;
  // Devuelve la cantidad como un aumento o disminución del saldo según corresponda.
  return increases ? amount : amount.negate();
}

/**
 * Utileria para normalizar el nombre de una cuenta contable, asegurando que no esté vacío y que no exceda los 255 caracteres.
 * @param value 
 * @returns 
 */
function normalizeAccountName(value: string): string {
  const name = value.trim();

  if (!name) {
    throw new InvalidAccountError("Account name is required.");
  }

  if (name.length > 255) {
    throw new InvalidAccountError("Account name cannot exceed 255 characters.");
  }

  return name;
}

/**
 * Utileria para normalizar un texto opcional, asegurando que no esté vacío.
 * @param value 
 * @returns 
 */
function normalizeOptionalText(value?: string | null): string | null {
  const text = value?.trim() ?? "";

  return text.length > 0 ? text : null;
}
