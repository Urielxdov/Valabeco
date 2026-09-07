import type { Expense } from "../../domain/expense";
import type { ExpenseDto } from "../dto/expense.dto";

export function toExpenseDto(expense: Expense): ExpenseDto {
  return {
    idExpense: expense.idExpense,
    idParty: expense.idParty,
    date: expense.date.toISOString(),
    description: expense.description,
    amount: expense.amount.toDecimalString(),
    status: expense.status,
  };
}
