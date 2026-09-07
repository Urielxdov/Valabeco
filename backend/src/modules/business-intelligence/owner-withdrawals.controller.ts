import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateOwnerWithdrawalUseCase } from "./application/use-cases/create-owner-withdrawal.use-case";
import { ListOwnerWithdrawalsUseCase } from "./application/use-cases/list-owner-withdrawals.use-case";
import { parseCreateOwnerWithdrawalInput } from "./presentation/http/request-parsers";

@Controller("bi/owner-withdrawals")
export class OwnerWithdrawalsController {
  constructor(
    private readonly createOwnerWithdrawalUseCase: CreateOwnerWithdrawalUseCase,
    private readonly listOwnerWithdrawalsUseCase: ListOwnerWithdrawalsUseCase,
  ) {}

  @Get()
  async list() {
    return this.listOwnerWithdrawalsUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateOwnerWithdrawalInput(body);
    return this.createOwnerWithdrawalUseCase.execute(input);
  }
}
