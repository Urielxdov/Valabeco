import type {
  CapitalContribution as PrismaCapitalContribution,
  Expense as PrismaExpense,
  Loan as PrismaLoan,
  LoanPayment as PrismaLoanPayment,
  OwnerWithdrawal as PrismaOwnerWithdrawal,
  PrismaClient,
  Purchase as PrismaPurchase,
  PurchaseItem as PrismaPurchaseItem,
  Refund as PrismaRefund,
  Sale as PrismaSale,
  SaleItem as PrismaSaleItem,
} from "@prisma/client";

import { Money } from "../../../../shared/domain/money";
import type { BusinessIntelligenceRepository } from "../../application/ports/business-intelligence-repository.port";
import type { CapitalContribution, NewCapitalContribution, NewOwnerWithdrawal, OwnerWithdrawal } from "../../domain/capital";
import { restoreCapitalContribution, restoreOwnerWithdrawal } from "../../domain/capital";
import type { BusinessDocumentStatus, LoanStatus, RefundStatus } from "../../domain/enums";
import type { Expense, NewExpense } from "../../domain/expense";
import { restoreExpense } from "../../domain/expense";
import type { Loan, LoanPayment, NewLoan, NewLoanPayment } from "../../domain/loan";
import { restoreLoan, restoreLoanPayment } from "../../domain/loan";
import type { NewPurchase, Purchase } from "../../domain/purchase";
import { restorePurchase } from "../../domain/purchase";
import type { NewRefund, Refund } from "../../domain/refund";
import { restoreRefund } from "../../domain/refund";
import type { NewSale, Sale } from "../../domain/sale";
import { restoreSale } from "../../domain/sale";

type PurchaseWithItems = PrismaPurchase & { items: PrismaPurchaseItem[] };
type SaleWithItems = PrismaSale & { items: PrismaSaleItem[] };
type LoanWithPayments = PrismaLoan & { payments: PrismaLoanPayment[] };

export class PrismaBusinessIntelligenceRepository implements BusinessIntelligenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createSale(sale: NewSale): Promise<Sale> {
    const created = await this.prisma.sale.create({
      data: {
        idCustomer: sale.idCustomer,
        date: sale.date,
        subtotal: sale.subtotal.toDecimalString(),
        tax: sale.tax.toDecimalString(),
        total: sale.total.toDecimalString(),
        status: sale.status,
        items: {
          create: sale.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toDecimalString(),
          })),
        },
      },
      include: { items: true },
    });

    return toDomainSale(created);
  }

  async listSales(): Promise<Sale[]> {
    const sales = await this.prisma.sale.findMany({
      orderBy: { date: "desc" },
      include: { items: true },
    });

    return sales.map(toDomainSale);
  }

  async createPurchase(purchase: NewPurchase): Promise<Purchase> {
    const created = await this.prisma.purchase.create({
      data: {
        idSupplier: purchase.idSupplier,
        date: purchase.date,
        subtotal: purchase.subtotal.toDecimalString(),
        tax: purchase.tax.toDecimalString(),
        total: purchase.total.toDecimalString(),
        status: purchase.status,
        items: {
          create: purchase.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice.toDecimalString(),
          })),
        },
      },
      include: { items: true },
    });

    return toDomainPurchase(created);
  }

  async listPurchases(): Promise<Purchase[]> {
    const purchases = await this.prisma.purchase.findMany({
      orderBy: { date: "desc" },
      include: { items: true },
    });

    return purchases.map(toDomainPurchase);
  }

  async createExpense(expense: NewExpense): Promise<Expense> {
    const created = await this.prisma.expense.create({
      data: {
        idParty: expense.idParty,
        date: expense.date,
        description: expense.description,
        amount: expense.amount.toDecimalString(),
        status: expense.status,
      },
    });

    return toDomainExpense(created);
  }

  async listExpenses(): Promise<Expense[]> {
    const expenses = await this.prisma.expense.findMany({ orderBy: { date: "desc" } });

    return expenses.map(toDomainExpense);
  }

  async createLoan(loan: NewLoan): Promise<Loan> {
    const created = await this.prisma.loan.create({
      data: {
        idLender: loan.idLender,
        principal: loan.principal.toDecimalString(),
        interestRate: loan.interestRate,
        startDate: loan.startDate,
        maturityDate: loan.maturityDate,
        status: loan.status,
      },
      include: { payments: true },
    });

    return toDomainLoan(created);
  }

  async listLoans(): Promise<Loan[]> {
    const loans = await this.prisma.loan.findMany({
      orderBy: { startDate: "desc" },
      include: { payments: true },
    });

    return loans.map(toDomainLoan);
  }

  async createLoanPayment(payment: NewLoanPayment): Promise<LoanPayment> {
    const created = await this.prisma.loanPayment.create({
      data: {
        idLoan: payment.idLoan,
        date: payment.date,
        amount: payment.amount.toDecimalString(),
        principalAmount: payment.principalAmount.toDecimalString(),
        interestAmount: payment.interestAmount.toDecimalString(),
      },
    });

    return toDomainLoanPayment(created);
  }

  async createCapitalContribution(
    contribution: NewCapitalContribution,
  ): Promise<CapitalContribution> {
    const created = await this.prisma.capitalContribution.create({
      data: {
        idOwner: contribution.idOwner,
        date: contribution.date,
        amount: contribution.amount.toDecimalString(),
      },
    });

    return toDomainCapitalContribution(created);
  }

  async listCapitalContributions(): Promise<CapitalContribution[]> {
    const contributions = await this.prisma.capitalContribution.findMany({
      orderBy: { date: "desc" },
    });

    return contributions.map(toDomainCapitalContribution);
  }

  async createOwnerWithdrawal(withdrawal: NewOwnerWithdrawal): Promise<OwnerWithdrawal> {
    const created = await this.prisma.ownerWithdrawal.create({
      data: {
        idOwner: withdrawal.idOwner,
        date: withdrawal.date,
        amount: withdrawal.amount.toDecimalString(),
        reason: withdrawal.reason,
      },
    });

    return toDomainOwnerWithdrawal(created);
  }

  async listOwnerWithdrawals(): Promise<OwnerWithdrawal[]> {
    const withdrawals = await this.prisma.ownerWithdrawal.findMany({
      orderBy: { date: "desc" },
    });

    return withdrawals.map(toDomainOwnerWithdrawal);
  }

  async createRefund(refund: NewRefund): Promise<Refund> {
    const created = await this.prisma.refund.create({
      data: {
        idSale: refund.idSale,
        date: refund.date,
        amount: refund.amount.toDecimalString(),
        reason: refund.reason,
        status: refund.status,
      },
    });

    return toDomainRefund(created);
  }

  async listRefunds(): Promise<Refund[]> {
    const refunds = await this.prisma.refund.findMany({ orderBy: { date: "desc" } });

    return refunds.map(toDomainRefund);
  }
}

function toDomainSale(sale: SaleWithItems): Sale {
  return restoreSale({
    idSale: sale.idSale,
    idCustomer: sale.idCustomer,
    date: sale.date,
    subtotal: Money.fromDecimal(sale.subtotal.toString()),
    tax: Money.fromDecimal(sale.tax.toString()),
    total: Money.fromDecimal(sale.total.toString()),
    status: sale.status as BusinessDocumentStatus,
    items: sale.items.map((item) => ({
      idSaleItem: item.idSaleItem,
      idSale: item.idSale,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: Money.fromDecimal(item.unitPrice.toString()),
    })),
  });
}

function toDomainPurchase(purchase: PurchaseWithItems): Purchase {
  return restorePurchase({
    idPurchase: purchase.idPurchase,
    idSupplier: purchase.idSupplier,
    date: purchase.date,
    subtotal: Money.fromDecimal(purchase.subtotal.toString()),
    tax: Money.fromDecimal(purchase.tax.toString()),
    total: Money.fromDecimal(purchase.total.toString()),
    status: purchase.status as BusinessDocumentStatus,
    items: purchase.items.map((item) => ({
      idPurchaseItem: item.idPurchaseItem,
      idPurchase: item.idPurchase,
      description: item.description,
      quantity: item.quantity.toString(),
      unitPrice: Money.fromDecimal(item.unitPrice.toString()),
    })),
  });
}

function toDomainExpense(expense: PrismaExpense): Expense {
  return restoreExpense({
    idExpense: expense.idExpense,
    idParty: expense.idParty,
    date: expense.date,
    description: expense.description,
    amount: Money.fromDecimal(expense.amount.toString()),
    status: expense.status as BusinessDocumentStatus,
  });
}

function toDomainLoan(loan: LoanWithPayments): Loan {
  return restoreLoan({
    idLoan: loan.idLoan,
    idLender: loan.idLender,
    principal: Money.fromDecimal(loan.principal.toString()),
    interestRate: loan.interestRate.toString(),
    startDate: loan.startDate,
    maturityDate: loan.maturityDate,
    status: loan.status as LoanStatus,
    payments: loan.payments.map(toDomainLoanPayment),
  });
}

function toDomainLoanPayment(payment: PrismaLoanPayment): LoanPayment {
  return restoreLoanPayment({
    idLoanPayment: payment.idLoanPayment,
    idLoan: payment.idLoan,
    date: payment.date,
    amount: Money.fromDecimal(payment.amount.toString()),
    principalAmount: Money.fromDecimal(payment.principalAmount.toString()),
    interestAmount: Money.fromDecimal(payment.interestAmount.toString()),
  });
}

function toDomainCapitalContribution(
  contribution: PrismaCapitalContribution,
): CapitalContribution {
  return restoreCapitalContribution({
    idContribution: contribution.idContribution,
    idOwner: contribution.idOwner,
    date: contribution.date,
    amount: Money.fromDecimal(contribution.amount.toString()),
  });
}

function toDomainOwnerWithdrawal(withdrawal: PrismaOwnerWithdrawal): OwnerWithdrawal {
  return restoreOwnerWithdrawal({
    idWithdrawal: withdrawal.idWithdrawal,
    idOwner: withdrawal.idOwner,
    date: withdrawal.date,
    amount: Money.fromDecimal(withdrawal.amount.toString()),
    reason: withdrawal.reason,
  });
}

function toDomainRefund(refund: PrismaRefund): Refund {
  return restoreRefund({
    idRefund: refund.idRefund,
    idSale: refund.idSale,
    date: refund.date,
    amount: Money.fromDecimal(refund.amount.toString()),
    reason: refund.reason,
    status: refund.status as RefundStatus,
  });
}
