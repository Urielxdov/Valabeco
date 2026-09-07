import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateExpenseUseCase } from "./application/use-cases/create-expense.use-case";
import { ListExpensesUseCase } from "./application/use-cases/list-expenses.use-case";
import { parseCreateExpenseInput } from "./presentation/http/request-parsers";

@Controller("bi/expenses")
export class ExpensesController {
  constructor(
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly listExpensesUseCase: ListExpensesUseCase,
  ) {}

  @Get()
  async list() {
    return this.listExpensesUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateExpenseInput(body);
    return this.createExpenseUseCase.execute(input);
  }
}
