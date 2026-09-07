import type { CapitalContribution, NewCapitalContribution, NewOwnerWithdrawal, OwnerWithdrawal } from "../../domain/capital";
import type { Expense, NewExpense } from "../../domain/expense";
import type { Loan, LoanPayment, NewLoan, NewLoanPayment } from "../../domain/loan";
import type { NewPurchase, Purchase } from "../../domain/purchase";
import type { NewRefund, Refund } from "../../domain/refund";
import type { NewSale, Sale } from "../../domain/sale";

export interface BusinessIntelligenceRepository {
  createSale(sale: NewSale): Promise<Sale>;
  listSales(): Promise<Sale[]>;

  createPurchase(purchase: NewPurchase): Promise<Purchase>;
  listPurchases(): Promise<Purchase[]>;

  createExpense(expense: NewExpense): Promise<Expense>;
  listExpenses(): Promise<Expense[]>;

  createLoan(loan: NewLoan): Promise<Loan>;
  listLoans(): Promise<Loan[]>;
  createLoanPayment(payment: NewLoanPayment): Promise<LoanPayment>;

  createCapitalContribution(contribution: NewCapitalContribution): Promise<CapitalContribution>;
  listCapitalContributions(): Promise<CapitalContribution[]>;

  createOwnerWithdrawal(withdrawal: NewOwnerWithdrawal): Promise<OwnerWithdrawal>;
  listOwnerWithdrawals(): Promise<OwnerWithdrawal[]>;

  createRefund(refund: NewRefund): Promise<Refund>;
  listRefunds(): Promise<Refund[]>;
}
