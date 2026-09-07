import type { Sale } from "../../domain/sale";
import type { SaleDto } from "../dto/sale.dto";

export function toSaleDto(sale: Sale): SaleDto {
  return {
    idSale: sale.idSale,
    idCustomer: sale.idCustomer,
    date: sale.date.toISOString(),
    subtotal: sale.subtotal.toDecimalString(),
    tax: sale.tax.toDecimalString(),
    total: sale.total.toDecimalString(),
    status: sale.status,
    items: sale.items.map((item) => ({
      idSaleItem: item.idSaleItem,
      idSale: item.idSale,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toDecimalString(),
    })),
  };
}
