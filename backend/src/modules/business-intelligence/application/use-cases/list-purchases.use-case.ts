import type { PurchaseDto } from "../dto/purchase.dto";
import { toPurchaseDto } from "../mappers/purchase.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListPurchasesUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<PurchaseDto[]> {
    const purchases = await this.repository.listPurchases();

    return purchases.map(toPurchaseDto);
  }
}
