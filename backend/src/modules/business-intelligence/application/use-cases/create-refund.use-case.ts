import { Money } from "../../../../shared/domain/money";
import { createNewRefund } from "../../domain/refund";
import type { RefundStatus } from "../../domain/enums";
import type { RefundDto } from "../dto/refund.dto";
import { toRefundDto } from "../mappers/refund.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateRefundInput = Readonly<{
  idSale: string;
  date?: Date;
  amount: string;
  reason: string;
  status: RefundStatus;
}>;

export class CreateRefundUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateRefundInput): Promise<RefundDto> {
    const refund = createNewRefund({
      idSale: input.idSale,
      date: input.date,
      amount: Money.fromDecimal(input.amount),
      reason: input.reason,
      status: input.status,
    });

    const created = await this.repository.createRefund(refund);

    return toRefundDto(created);
  }
}
