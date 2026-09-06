import { Body, Controller, Get, HttpCode, Param, Post } from "@nestjs/common";
import { CreateTransactionUseCase } from "./application/use-cases/create-transaction.use-case";
import { GetTransactionUseCase } from "./application/use-cases/get-transaction.use-case";
import { ListTransactionsUseCase } from "./application/use-cases/list-transactions.use-case";
import { PostTransactionUseCase } from "./application/use-cases/post-transaction.use-case";
import { VoidTransactionUseCase } from "./application/use-cases/void-transaction.use-case";
import { parseCreateTransactionInput } from "./presentation/http/request-parsers";

@Controller("transactions")
export class TransactionsController {
  constructor(
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly postTransactionUseCase: PostTransactionUseCase,
    private readonly voidTransactionUseCase: VoidTransactionUseCase,
  ) {}

  @Get()
  async list() {
    return this.listTransactionsUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateTransactionInput(body);
    return this.createTransactionUseCase.execute(input);
  }

  @Get(":idTransaction")
  async get(@Param("idTransaction") idTransaction: string) {
    return this.getTransactionUseCase.execute(idTransaction);
  }

  @Post(":idTransaction/post")
  @HttpCode(200)
  async post(@Param("idTransaction") idTransaction: string) {
    return this.postTransactionUseCase.execute(idTransaction);
  }

  @Post(":idTransaction/void")
  @HttpCode(200)
  async void(@Param("idTransaction") idTransaction: string) {
    return this.voidTransactionUseCase.execute(idTransaction);
  }
}
