import type { BusinessDocumentStatus } from "../../domain/enums";

export type PurchaseItemDto = Readonly<{
  idPurchaseItem: string;
  idPurchase: string;
  description: string;
  quantity: string;
  unitPrice: string;
}>;

export type PurchaseDto = Readonly<{
  idPurchase: string;
  idSupplier: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  status: BusinessDocumentStatus;
  items: PurchaseItemDto[];
}>;
