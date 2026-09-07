import { Money } from "../../../../shared/domain/money";
import { createDraftSale } from "../../domain/sale";
import type { BusinessDocumentStatus } from "../../domain/enums";
import type { SaleDto } from "../dto/sale.dto";
import { toSaleDto } from "../mappers/sale.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateSaleInput = Readonly<{
  idCustomer: string;
  date?: Date;
  tax: string;
  status: BusinessDocumentStatus;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
}>;

export class CreateSaleUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateSaleInput): Promise<SaleDto> {
    const sale = createDraftSale({
      idCustomer: input.idCustomer,
      date: input.date,
      tax: Money.fromDecimal(input.tax),
      status: input.status,
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Money.fromDecimal(item.unitPrice),
      })),
    });

    const created = await this.repository.createSale(sale);

    return toSaleDto(created);
  }
}
