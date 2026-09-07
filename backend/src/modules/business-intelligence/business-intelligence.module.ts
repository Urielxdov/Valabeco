import { Module } from "@nestjs/common";
import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { CapitalContributionsController } from "./capital-contributions.controller";
import { ExpensesController } from "./expenses.controller";
import { LoanPaymentsController } from "./loan-payments.controller";
import { LoansController } from "./loans.controller";
import { OwnerWithdrawalsController } from "./owner-withdrawals.controller";
import { PurchasesController } from "./purchases.controller";
import { RefundsController } from "./refunds.controller";
import { SalesController } from "./sales.controller";
import { CreateCapitalContributionUseCase } from "./application/use-cases/create-capital-contribution.use-case";
import { CreateExpenseUseCase } from "./application/use-cases/create-expense.use-case";
import { CreateLoanPaymentUseCase } from "./application/use-cases/create-loan-payment.use-case";
import { CreateLoanUseCase } from "./application/use-cases/create-loan.use-case";
import { CreateOwnerWithdrawalUseCase } from "./application/use-cases/create-owner-withdrawal.use-case";
import { CreatePurchaseUseCase } from "./application/use-cases/create-purchase.use-case";
import { CreateRefundUseCase } from "./application/use-cases/create-refund.use-case";
import { CreateSaleUseCase } from "./application/use-cases/create-sale.use-case";
import { ListCapitalContributionsUseCase } from "./application/use-cases/list-capital-contributions.use-case";
import { ListExpensesUseCase } from "./application/use-cases/list-expenses.use-case";
import { ListLoansUseCase } from "./application/use-cases/list-loans.use-case";
import { ListOwnerWithdrawalsUseCase } from "./application/use-cases/list-owner-withdrawals.use-case";
import { ListPurchasesUseCase } from "./application/use-cases/list-purchases.use-case";
import { ListRefundsUseCase } from "./application/use-cases/list-refunds.use-case";
import { ListSalesUseCase } from "./application/use-cases/list-sales.use-case";
import { PrismaBusinessIntelligenceRepository } from "./infrastructure/prisma/prisma-business-intelligence.repository";

@Module({
  controllers: [
    SalesController,
    PurchasesController,
    ExpensesController,
    LoansController,
    LoanPaymentsController,
    CapitalContributionsController,
    OwnerWithdrawalsController,
    RefundsController,
  ],
  providers: [
    {
      provide: PrismaBusinessIntelligenceRepository,
      useFactory: () => new PrismaBusinessIntelligenceRepository(getPrisma()),
    },
    {
      provide: CreateSaleUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateSaleUseCase(repository),
    },
    {
      provide: ListSalesUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListSalesUseCase(repository),
    },
    {
      provide: CreatePurchaseUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreatePurchaseUseCase(repository),
    },
    {
      provide: ListPurchasesUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListPurchasesUseCase(repository),
    },
    {
      provide: CreateExpenseUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateExpenseUseCase(repository),
    },
    {
      provide: ListExpensesUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListExpensesUseCase(repository),
    },
    {
      provide: CreateLoanUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateLoanUseCase(repository),
    },
    {
      provide: ListLoansUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListLoansUseCase(repository),
    },
    {
      provide: CreateLoanPaymentUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateLoanPaymentUseCase(repository),
    },
    {
      provide: CreateCapitalContributionUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateCapitalContributionUseCase(repository),
    },
    {
      provide: ListCapitalContributionsUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListCapitalContributionsUseCase(repository),
    },
    {
      provide: CreateOwnerWithdrawalUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateOwnerWithdrawalUseCase(repository),
    },
    {
      provide: ListOwnerWithdrawalsUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListOwnerWithdrawalsUseCase(repository),
    },
    {
      provide: CreateRefundUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new CreateRefundUseCase(repository),
    },
    {
      provide: ListRefundsUseCase,
      inject: [PrismaBusinessIntelligenceRepository],
      useFactory: (repository: PrismaBusinessIntelligenceRepository) =>
        new ListRefundsUseCase(repository),
    },
  ],
})
export class BusinessIntelligenceModule {}
