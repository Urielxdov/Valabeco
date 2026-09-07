import { Body, Controller, Post } from "@nestjs/common";
import { CreateLoanPaymentUseCase } from "./application/use-cases/create-loan-payment.use-case";
import { parseCreateLoanPaymentInput } from "./presentation/http/request-parsers";

@Controller("bi/loan-payments")
export class LoanPaymentsController {
  constructor(private readonly createLoanPaymentUseCase: CreateLoanPaymentUseCase) {}

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateLoanPaymentInput(body);
    return this.createLoanPaymentUseCase.execute(input);
  }
}
