import { Money } from "../../../../shared/domain/money";
import { createDraftExpense } from "../../domain/expense";
import type { BusinessDocumentStatus } from "../../domain/enums";
import type { ExpenseDto } from "../dto/expense.dto";
import { toExpenseDto } from "../mappers/expense.mapper";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";

export type CreateExpenseInput = Readonly<{
  idParty?: string | null;
  date?: Date;
  description: string;
  amount: string;
  status: BusinessDocumentStatus;
}>;

export class CreateExpenseUseCase {
  constructor(private readonly repository: BusinessIntelligenceRepository) {}

  async execute(input: CreateExpenseInput): Promise<ExpenseDto> {
    const expense = createDraftExpense({
      idParty: input.idParty,
      date: input.date,
      description: input.description,
      amount: Money.fromDecimal(input.amount),
      status: input.status,
    });

    const created = await this.repository.createExpense(expense);

    return toExpenseDto(created);
  }
}
