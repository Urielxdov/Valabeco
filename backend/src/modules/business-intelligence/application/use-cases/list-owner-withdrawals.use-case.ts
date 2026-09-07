import type { OwnerWithdrawalDto } from "../dto/capital.dto";
import { toOwnerWithdrawalDto } from "../mappers/capital.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListOwnerWithdrawalsUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<OwnerWithdrawalDto[]> {
    const withdrawals = await this.repository.listOwnerWithdrawals();

    return withdrawals.map(toOwnerWithdrawalDto);
  }
}
