import type { LoanStatus } from "../../domain/enums";

export type LoanPaymentDto = Readonly<{
  idLoanPayment: string;
  idLoan: string;
  date: string;
  amount: string;
  principalAmount: string;
  interestAmount: string;
}>;

export type LoanDto = Readonly<{
  idLoan: string;
  idLender: string;
  principal: string;
  interestRate: string;
  startDate: string;
  maturityDate: string;
  status: LoanStatus;
  payments: LoanPaymentDto[];
}>;
