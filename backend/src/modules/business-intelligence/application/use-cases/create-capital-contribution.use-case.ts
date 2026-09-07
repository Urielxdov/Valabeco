import { Money } from "../../../../shared/domain/money";
import { createNewCapitalContribution } from "../../domain/capital";
import type { CapitalContributionDto } from "../dto/capital.dto";
import { toCapitalContributionDto } from "../mappers/capital.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateCapitalContributionInput = Readonly<{
  idOwner: string;
  date?: Date;
  amount: string;
}>;

export class CreateCapitalContributionUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateCapitalContributionInput): Promise<CapitalContributionDto> {
    const contribution = createNewCapitalContribution({
      idOwner: input.idOwner,
      date: input.date,
      amount: Money.fromDecimal(input.amount),
    });

    const created = await this.repository.createCapitalContribution(contribution);

    return toCapitalContributionDto(created);
  }
}
