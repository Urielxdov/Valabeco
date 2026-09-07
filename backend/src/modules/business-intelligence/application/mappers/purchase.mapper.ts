import type { Purchase } from "../../domain/purchase";
import type { PurchaseDto } from "../dto/purchase.dto";

export function toPurchaseDto(purchase: Purchase): PurchaseDto {
  return {
    idPurchase: purchase.idPurchase,
    idSupplier: purchase.idSupplier,
    date: purchase.date.toISOString(),
    subtotal: purchase.subtotal.toDecimalString(),
    tax: purchase.tax.toDecimalString(),
    total: purchase.total.toDecimalString(),
    status: purchase.status,
    items: purchase.items.map((item) => ({
      idPurchaseItem: item.idPurchaseItem,
      idPurchase: item.idPurchase,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toDecimalString(),
    })),
  };
}
