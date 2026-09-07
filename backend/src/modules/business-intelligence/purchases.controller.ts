import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreatePurchaseUseCase } from "./application/use-cases/create-purchase.use-case";
import { ListPurchasesUseCase } from "./application/use-cases/list-purchases.use-case";
import { parseCreatePurchaseInput } from "./presentation/http/request-parsers";

@Controller("bi/purchases")
export class PurchasesController {
  constructor(
    private readonly createPurchaseUseCase: CreatePurchaseUseCase,
    private readonly listPurchasesUseCase: ListPurchasesUseCase,
  ) {}

  @Get()
  async list() {
    return this.listPurchasesUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreatePurchaseInput(body);
    return this.createPurchaseUseCase.execute(input);
  }
}
