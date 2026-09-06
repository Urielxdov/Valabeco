import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateAccountUseCase } from "./application/use-cases/create-account.use-case";
import { ListAccountsUseCase } from "./application/use-cases/list-accounts.use-case";
import { parseCreateAccountInput } from "./presentation/http/request-parsers";

@Controller("accounts")
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
  ) {}

  @Get()
  async list() {
    return this.listAccountsUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateAccountInput(body);
    return this.createAccountUseCase.execute(input);
  }
}
