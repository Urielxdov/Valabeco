import { Money } from "../../../../shared/domain/money";
import { createNewLoanPayment } from "../../domain/loan";
import type { LoanPaymentDto } from "../dto/loan.dto";
import { toLoanPaymentDto } from "../mappers/loan.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateLoanPaymentInput = Readonly<{
  idLoan: string;
  date?: Date;
  amount: string;
  principalAmount: string;
  interestAmount: string;
}>;

export class CreateLoanPaymentUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateLoanPaymentInput): Promise<LoanPaymentDto> {
    const payment = createNewLoanPayment({
      idLoan: input.idLoan,
      date: input.date,
      amount: Money.fromDecimal(input.amount),
      principalAmount: Money.fromDecimal(input.principalAmount),
      interestAmount: Money.fromDecimal(input.interestAmount),
    });

    const created = await this.repository.createLoanPayment(payment);

    return toLoanPaymentDto(created);
  }
}
