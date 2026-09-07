import { Money } from "../../../shared/domain/money";
import type { BusinessDocumentStatus } from "./enums";
import { InvalidPurchaseError } from "./errors";
import { isZeroQuantity } from "./quantity";

export type PurchaseItem = Readonly<{
  idPurchaseItem: string;
  idPurchase: string;
  description: string;
  quantity: string;
  unitPrice: Money;
}>;

export type NewPurchaseItem = Readonly<{
  description: string;
  quantity: string;
  unitPrice: Money;
}>;

export type Purchase = Readonly<{
  idPurchase: string;
  idSupplier: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: PurchaseItem[];
}>;

export type NewPurchase = Readonly<{
  idSupplier: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: NewPurchaseItem[];
}>;

export function createDraftPurchase(input: {
  idSupplier: string;
  date?: Date;
  tax: Money;
  status: BusinessDocumentStatus;
  items: Array<{ description: string; quantity: string; unitPrice: Money }>;
}): NewPurchase {
  if (!input.idSupplier) {
    throw new InvalidPurchaseError("Purchase supplier id is required.");
  }

  if (input.items.length === 0) {
    throw new InvalidPurchaseError("A purchase requires at least one item.");
  }

  if (input.tax.isNegative()) {
    throw new InvalidPurchaseError("Purchase tax cannot be negative.");
  }

  const items = input.items.map(createNewPurchaseItem);
  const subtotal = items.reduce(
    (sum, item) => sum.add(item.unitPrice.multiplyByQuantity(item.quantity)),
    Money.zero(),
  );
  const total = subtotal.add(input.tax);

  return {
    idSupplier: input.idSupplier,
    date: input.date ?? new Date(),
    subtotal,
    tax: input.tax,
    total,
    status: input.status,
    items,
  };
}

export function restorePurchase(input: {
  idPurchase: string;
  idSupplier: string;
  date: Date;
  subtotal: Money;
  tax: Money;
  total: Money;
  status: BusinessDocumentStatus;
  items: PurchaseItem[];
}): Purchase {
  if (!input.idPurchase) {
    throw new InvalidPurchaseError("Purchase id is required.");
  }

  return input;
}

function createNewPurchaseItem(input: {
  description: string;
  quantity: string;
  unitPrice: Money;
}): NewPurchaseItem {
  const description = input.description.trim();

  if (!description) {
    throw new InvalidPurchaseError("Purchase item description is required.");
  }

  if (isZeroQuantity(input.quantity)) {
    throw new InvalidPurchaseError("Purchase item quantity must be greater than zero.");
  }

  if (input.unitPrice.isNegative()) {
    throw new InvalidPurchaseError("Purchase item unit price cannot be negative.");
  }

  return {
    description,
    quantity: input.quantity,
    unitPrice: input.unitPrice,
  };
}
