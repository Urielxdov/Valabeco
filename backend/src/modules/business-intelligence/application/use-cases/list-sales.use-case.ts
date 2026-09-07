import type { SaleDto } from "../dto/sale.dto";
import { toSaleDto } from "../mappers/sale.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListSalesUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<SaleDto[]> {
    const sales = await this.repository.listSales();

    return sales.map(toSaleDto);
  }
}
