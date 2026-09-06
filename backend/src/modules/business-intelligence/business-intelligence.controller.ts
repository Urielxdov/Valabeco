import { Body, Controller, Get, Post } from "@nestjs/common";
import { BusinessIntelligenceService } from "./application/business-intelligence.service";

@Controller("bi")
export class BusinessIntelligenceController {
  constructor(private readonly service: BusinessIntelligenceService) {}

  @Get("sales")
  async listSales() {
    return this.service.listSales();
  }

  @Post("sales")
  async createSale(@Body() body: Record<string, unknown>) {
    return this.service.createSale(body);
  }

  @Get("purchases")
  async listPurchases() {
    return this.service.listPurchases();
  }

  @Post("purchases")
  async createPurchase(@Body() body: Record<string, unknown>) {
    return this.service.createPurchase(body);
  }

  @Get("expenses")
  async listExpenses() {
    return this.service.listExpenses();
  }

  @Post("expenses")
  async createExpense(@Body() body: Record<string, unknown>) {
    return this.service.createExpense(body);
  }

  @Get("loans")
  async listLoans() {
    return this.service.listLoans();
  }

  @Post("loans")
  async createLoan(@Body() body: Record<string, unknown>) {
    return this.service.createLoan(body);
  }

  @Post("loan-payments")
  async createLoanPayment(@Body() body: Record<string, unknown>) {
    return this.service.createLoanPayment(body);
  }

  @Get("capital-contributions")
  async listCapitalContributions() {
    return this.service.listCapitalContributions();
  }

  @Post("capital-contributions")
  async createCapitalContribution(@Body() body: Record<string, unknown>) {
    return this.service.createCapitalContribution(body);
  }

  @Get("owner-withdrawals")
  async listOwnerWithdrawals() {
    return this.service.listOwnerWithdrawals();
  }

  @Post("owner-withdrawals")
  async createOwnerWithdrawal(@Body() body: Record<string, unknown>) {
    return this.service.createOwnerWithdrawal(body);
  }

  @Get("refunds")
  async listRefunds() {
    return this.service.listRefunds();
  }

  @Post("refunds")
  async createRefund(@Body() body: Record<string, unknown>) {
    return this.service.createRefund(body);
  }
}
