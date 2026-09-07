import type { BusinessDocumentStatus } from "../../domain/enums";

export type ExpenseDto = Readonly<{
  idExpense: string;
  idParty: string | null;
  date: string;
  description: string;
  amount: string;
  status: BusinessDocumentStatus;
}>;
