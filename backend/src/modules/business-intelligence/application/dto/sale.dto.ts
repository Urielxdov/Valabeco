import type { BusinessDocumentStatus } from "../../domain/enums";

export type SaleItemDto = Readonly<{
  idSaleItem: string;
  idSale: string;
  description: string;
  quantity: string;
  unitPrice: string;
}>;

export type SaleDto = Readonly<{
  idSale: string;
  idCustomer: string;
  date: string;
  subtotal: string;
  tax: string;
  total: string;
  status: BusinessDocumentStatus;
  items: SaleItemDto[];
}>;
