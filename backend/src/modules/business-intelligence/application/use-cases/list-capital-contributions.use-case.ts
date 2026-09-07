import type { CapitalContributionDto } from "../dto/capital.dto";
import { toCapitalContributionDto } from "../mappers/capital.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListCapitalContributionsUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<CapitalContributionDto[]> {
    const contributions = await this.repository.listCapitalContributions();

    return contributions.map(toCapitalContributionDto);
  }
}
