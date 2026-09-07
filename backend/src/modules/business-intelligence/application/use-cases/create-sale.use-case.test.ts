import assert from "node:assert/strict";
import { test } from "node:test";

import type { CapitalContribution, NewCapitalContribution, NewOwnerWithdrawal, OwnerWithdrawal } from "../../domain/capital";
import type { Expense, NewExpense } from "../../domain/expense";
import type { Loan, LoanPayment, NewLoan, NewLoanPayment } from "../../domain/loan";
import type { NewPurchase, Purchase } from "../../domain/purchase";
import type { NewRefund, Refund } from "../../domain/refund";
import type { NewSale, Sale } from "../../domain/sale";
import { restoreSale } from "../../domain/sale";
import type { BusinessIntelligenceRepository } from "../ports/business-intelligence-repository.port";
import { CreateSaleUseCase } from "./create-sale.use-case";

class FakeBusinessIntelligenceRepository implements BusinessIntelligenceRepository {
  createdSale: NewSale | null = null;

  async createSale(sale: NewSale): Promise<Sale> {
    this.createdSale = sale;

    return restoreSale({
      idSale: "sale-1",
      idCustomer: sale.idCustomer,
      date: sale.date,
      subtotal: sale.subtotal,
      tax: sale.tax,
      total: sale.total,
      status: sale.status,
      items: sale.items.map((item, index) => ({
        idSaleItem: `item-${index}`,
        idSale: "sale-1",
        ...item,
      })),
    });
  }

  async listSales(): Promise<Sale[]> {
    return [];
  }

  async createPurchase(_purchase: NewPurchase): Promise<Purchase> {
    throw new Error("not needed for this test");
  }

  async listPurchases(): Promise<Purchase[]> {
    return [];
  }

  async createExpense(_expense: NewExpense): Promise<Expense> {
    throw new Error("not needed for this test");
  }

  async listExpenses(): Promise<Expense[]> {
    return [];
  }

  async createLoan(_loan: NewLoan): Promise<Loan> {
    throw new Error("not needed for this test");
  }

  async listLoans(): Promise<Loan[]> {
    return [];
  }

  async createLoanPayment(_payment: NewLoanPayment): Promise<LoanPayment> {
    throw new Error("not needed for this test");
  }

  async createCapitalContribution(
    _contribution: NewCapitalContribution,
  ): Promise<CapitalContribution> {
    throw new Error("not needed for this test");
  }

  async listCapitalContributions(): Promise<CapitalContribution[]> {
    return [];
  }

  async createOwnerWithdrawal(_withdrawal: NewOwnerWithdrawal): Promise<OwnerWithdrawal> {
    throw new Error("not needed for this test");
  }

  async listOwnerWithdrawals(): Promise<OwnerWithdrawal[]> {
    return [];
  }

  async createRefund(_refund: NewRefund): Promise<Refund> {
    throw new Error("not needed for this test");
  }

  async listRefunds(): Promise<Refund[]> {
    return [];
  }
}

test("CreateSaleUseCase parses decimal strings into Money and computes totals via the domain", async () => {
  const repository = new FakeBusinessIntelligenceRepository();
  const useCase = new CreateSaleUseCase(repository);

  const result = await useCase.execute({
    idCustomer: "customer-1",
    tax: "16.00",
    status: "DRAFT",
    items: [{ description: "Consultoria", quantity: "2", unitPrice: "100.00" }],
  });

  assert.equal(result.subtotal, "200.00");
  assert.equal(result.total, "216.00");
  assert.equal(repository.createdSale?.items[0]?.unitPrice.toDecimalString(), "100.00");
});
