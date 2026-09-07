import { Money } from "../../../../shared/domain/money";
import { createDraftPurchase } from "../../domain/purchase";
import type { BusinessDocumentStatus } from "../../domain/enums";
import type { PurchaseDto } from "../dto/purchase.dto";
import { toPurchaseDto } from "../mappers/purchase.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreatePurchaseInput = Readonly<{
  idSupplier: string;
  date?: Date;
  tax: string;
  status: BusinessDocumentStatus;
  items: Array<{
    description: string;
    quantity: string;
    unitPrice: string;
  }>;
}>;

export class CreatePurchaseUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreatePurchaseInput): Promise<PurchaseDto> {
    const purchase = createDraftPurchase({
      idSupplier: input.idSupplier,
      date: input.date,
      tax: Money.fromDecimal(input.tax),
      status: input.status,
      items: input.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Money.fromDecimal(item.unitPrice),
      })),
    });

    const created = await this.repository.createPurchase(purchase);

    return toPurchaseDto(created);
  }
}
