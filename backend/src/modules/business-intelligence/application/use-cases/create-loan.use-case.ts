import { Money } from "../../../../shared/domain/money";
import { createNewLoan } from "../../domain/loan";
import type { LoanStatus } from "../../domain/enums";
import type { LoanDto } from "../dto/loan.dto";
import { toLoanDto } from "../mappers/loan.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateLoanInput = Readonly<{
  idLender: string;
  principal: string;
  interestRate: string;
  startDate: Date;
  maturityDate: Date;
  status: LoanStatus;
}>;

export class CreateLoanUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateLoanInput): Promise<LoanDto> {
    const loan = createNewLoan({
      idLender: input.idLender,
      principal: Money.fromDecimal(input.principal),
      interestRate: input.interestRate,
      startDate: input.startDate,
      maturityDate: input.maturityDate,
      status: input.status,
    });

    const created = await this.repository.createLoan(loan);

    return toLoanDto(created);
  }
}
