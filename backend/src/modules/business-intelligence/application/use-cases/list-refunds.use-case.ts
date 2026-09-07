import type { RefundDto } from "../dto/refund.dto";
import { toRefundDto } from "../mappers/refund.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListRefundsUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<RefundDto[]> {
    const refunds = await this.repository.listRefunds();

    return refunds.map(toRefundDto);
  }
}
