import { Body, Controller, Get, Post } from "@nestjs/common";
import { CreateCapitalContributionUseCase } from "./application/use-cases/create-capital-contribution.use-case";
import { ListCapitalContributionsUseCase } from "./application/use-cases/list-capital-contributions.use-case";
import { parseCreateCapitalContributionInput } from "./presentation/http/request-parsers";

@Controller("bi/capital-contributions")
export class CapitalContributionsController {
  constructor(
    private readonly createCapitalContributionUseCase: CreateCapitalContributionUseCase,
    private readonly listCapitalContributionsUseCase: ListCapitalContributionsUseCase,
  ) {}

  @Get()
  async list() {
    return this.listCapitalContributionsUseCase.execute();
  }

  @Post()
  async create(@Body() body: Record<string, unknown>) {
    const input = parseCreateCapitalContributionInput(body);
    return this.createCapitalContributionUseCase.execute(input);
  }
}
