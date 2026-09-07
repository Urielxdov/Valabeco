import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateRefundUseCase } from "./application/use-cases/create-refund.use-case";
import { ListRefundsUseCase } from "./application/use-cases/list-refunds.use-case";
import { parseCreateRefundInput } from "./presentation/http/request-parsers";

@Controller("bi/refunds")
export class RefundsController {
  constructor(
    private readonly createRefundUseCase: CreateRefundUseCase,
    private readonly listRefundsUseCase: ListRefundsUseCase,
  ) {}

  @Get()
  async list() {
    return this.listRefundsUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateRefundInput(body);
    return this.createRefundUseCase.execute(input);
  }
}
