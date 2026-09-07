import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateSaleUseCase } from "./application/use-cases/create-sale.use-case";
import { ListSalesUseCase } from "./application/use-cases/list-sales.use-case";
import { parseCreateSaleInput } from "./presentation/http/request-parsers";

@Controller("bi/sales")
export class SalesController {
  constructor(
    private readonly createSaleUseCase: CreateSaleUseCase,
    private readonly listSalesUseCase: ListSalesUseCase,
  ) {}

  @Get()
  async list() {
    return this.listSalesUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateSaleInput(body);
    return this.createSaleUseCase.execute(input);
  }
}
