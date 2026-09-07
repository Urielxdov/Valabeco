import type { Loan, LoanPayment } from "../../domain/loan";
import type { LoanDto, LoanPaymentDto } from "../dto/loan.dto";

export function toLoanDto(loan: Loan): LoanDto {
  return {
    idLoan: loan.idLoan,
    idLender: loan.idLender,
    principal: loan.principal.toDecimalString(),
    interestRate: loan.interestRate,
    startDate: loan.startDate.toISOString(),
    maturityDate: loan.maturityDate.toISOString(),
    status: loan.status,
    payments: loan.payments.map(toLoanPaymentDto),
  };
}

export function toLoanPaymentDto(payment: LoanPayment): LoanPaymentDto {
  return {
    idLoanPayment: payment.idLoanPayment,
    idLoan: payment.idLoan,
    date: payment.date.toISOString(),
    amount: payment.amount.toDecimalString(),
    principalAmount: payment.principalAmount.toDecimalString(),
    interestAmount: payment.interestAmount.toDecimalString(),
  };
}
