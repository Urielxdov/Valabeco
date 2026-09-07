import { Money } from "../../../shared/domain/money";
import type { BusinessDocumentStatus } from "./enums";
import { InvalidSaleError } from "./errors";
import { isZeroQuantity } from "./quantity";

export type SaleItem = Readonly<{
  idSaleItem: string;
  idSale: string;
  description: string;
  quantity: string;
  unitPrice: Money;
}>;

export type NewSaleItem = Readonly<{
  description: string;
  quantity: string;
  unitPrice: Money;
}>;

export type Sale = Readonly<{
  idSale: string;
  idCustomer: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: SaleItem[];
}>;

export type NewSale = Readonly<{
  idCustomer: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: NewSaleItem[];
}>;

/**
 * Crea una venta calculando `subtotal` y `total` a partir de sus partidas,
 * tal como lo exige `docs/decisions/domains/BI_model.md`: "subtotal debe
 * corresponder a la suma de los importes de sus partidas" y "total debe
 * corresponder a subtotal + tax".
 */
export function createDraftSale(input: {
  idCustomer: string;
  date?: Date;
  tax: Money;
  status: BusinessDocumentStatus;
  items: Array<{ description: string; quantity: string; unitPrice: Money }>;
}): NewSale {
  if (!input.idCustomer) {
    throw new InvalidSaleError("Sale customer id is required.");
  }

  if (input.items.length === 0) {
    throw new InvalidSaleError("A sale requires at least one item.");
  }

  if (input.tax.isNegative()) {
    throw new InvalidSaleError("Sale tax cannot be negative.");
  }

  const items = input.items.map(createNewSaleItem);
  const subtotal = items.reduce(
    (sum, item) => sum.add(item.unitPrice.multiplyByQuantity(item.quantity)),
    Money.zero(),
  );
  const total = subtotal.add(input.tax);

  return {
    idCustomer: input.idCustomer,
    date: input.date ?? new Date(),
    subtotal,
    tax: input.tax,
    total,
    status: input.status,
    items,
  };
}

export function restoreSale(input: {
  idSale: string;
  idCustomer: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: SaleItem[];
}): Sale {
  if (!input.idSale) {
    throw new InvalidSaleError("Sale id is required.");
  }

  return input;
}

function createNewSaleItem(input: {
  description: string;
  quantity: string;
  unitPrice: Money;
}): NewSaleItem {
  const description = input.description.trim();

  if (!description) {
    throw new InvalidSaleError("Sale item description is required.");
  }

  if (isZeroQuantity(input.quantity)) {
    throw new InvalidSaleError("Sale item quantity must be greater than zero.");
  }

  if (input.unitPrice.isNegative()) {
    throw new InvalidSaleError("Sale item unit price cannot be negative.");
  }

  return {
    description,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
  };
}
