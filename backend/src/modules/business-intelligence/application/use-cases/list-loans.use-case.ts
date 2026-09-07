import type { LoanDto } from "../dto/loan.dto";
import { toLoanDto } from "../mappers/loan.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListLoansUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<LoanDto[]> {
    const loans = await this.repository.listLoans();

    return loans.map(toLoanDto);
  }
}
