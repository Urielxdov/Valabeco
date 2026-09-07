import { Money } from "../../../../shared/domain/money";
import { createNewOwnerWithdrawal } from "../../domain/capital";
import type { OwnerWithdrawalDto } from "../dto/capital.dto";
import { toOwnerWithdrawalDto } from "../mappers/capital.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateOwnerWithdrawalInput = Readonly<{
  idOwner: string;
  date?: Date;
  amount: string;
  reason?: string | null;
}>;

export class CreateOwnerWithdrawalUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateOwnerWithdrawalInput): Promise<OwnerWithdrawalDto> {
    const withdrawal = createNewOwnerWithdrawal({
      idOwner: input.idOwner,
      date: input.date,
      amount: Money.fromDecimal(input.amount),
      reason: input.reason,
    });

    const created = await this.repository.createOwnerWithdrawal(withdrawal);

    return toOwnerWithdrawalDto(created);
  }
}
