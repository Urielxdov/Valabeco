import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateLoanUseCase } from "./application/use-cases/create-loan.use-case";
import { ListLoansUseCase } from "./application/use-cases/list-loans.use-case";
import { parseCreateLoanInput } from "./presentation/http/request-parsers";

@Controller("bi/loans")
export class LoansController {
  constructor(
    private readonly createLoanUseCase: CreateLoanUseCase,
    private readonly listLoansUseCase: ListLoansUseCase,
  ) {}

  @Get()
  async list() {
    return this.listLoansUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateLoanInput(body);
    return this.createLoanUseCase.execute(input);
  }
}
