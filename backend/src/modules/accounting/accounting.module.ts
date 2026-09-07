import { Module } from "@nestjs/common";
import { AccountsController } from "./accounts.controller";
import { CreateAccountUseCase } from "./application/use-cases/create-account.use-case";
import { CreateTransactionUseCase } from "./application/use-cases/create-transaction.use-case";
import { GetTransactionUseCase } from "./application/use-cases/get-transaction.use-case";
import { ListAccountsUseCase } from "./application/use-cases/list-accounts.use-case";
import { ListTransactionsUseCase } from "./application/use-cases/list-transactions.use-case";
import { PostTransactionUseCase } from "./application/use-cases/post-transaction.use-case";
import { VoidTransactionUseCase } from "./application/use-cases/void-transaction.use-case";
import { getPrisma } from "../../shared/infrastructure/prisma-client";
import { PrismaAccountingRepository } from "./infrastructure/prisma/prisma-accounting.repository";
import { TransactionsController } from "./transactions.controller";

@Module({
  controllers: [AccountsController, TransactionsController],
  providers: [
    {
      provide: PrismaAccountingRepository,
      useFactory: () => new PrismaAccountingRepository(getPrisma()),
    },
    {
      provide: CreateAccountUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new CreateAccountUseCase(repository),
    },
    {
      provide: ListAccountsUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new ListAccountsUseCase(repository),
    },
    {
      provide: CreateTransactionUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new CreateTransactionUseCase(repository),
    },
    {
      provide: ListTransactionsUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new ListTransactionsUseCase(repository),
    },
    {
      provide: GetTransactionUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new GetTransactionUseCase(repository),
    },
    {
      provide: PostTransactionUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new PostTransactionUseCase(repository),
    },
    {
      provide: VoidTransactionUseCase,
      inject: [PrismaAccountingRepository],
      useFactory: (repository: PrismaAccountingRepository) => new VoidTransactionUseCase(repository),
    },
  ],
})
export class AccountingModule {}
