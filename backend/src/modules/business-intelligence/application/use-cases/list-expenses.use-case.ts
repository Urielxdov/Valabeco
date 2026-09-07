import type { ExpenseDto } from "../dto/expense.dto";
import { toExpenseDto } from "../mappers/expense.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export class ListExpensesUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(): Promise<ExpenseDto[]> {
    const expenses = await this.repository.listExpenses();

    return expenses.map(toExpenseDto);
  }
}
