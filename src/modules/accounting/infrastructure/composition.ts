import "server-only";

import { CreateAccountUseCase } from "../application/use-cases/create-account.use-case";
import { CreateTransactionUseCase } from "../application/use-cases/create-transaction.use-case";
import { GetTransactionUseCase } from "../application/use-cases/get-transaction.use-case";
import { ListAccountsUseCase } from "../application/use-cases/list-accounts.use-case";
import { ListTransactionsUseCase } from "../application/use-cases/list-transactions.use-case";
import { PostTransactionUseCase } from "../application/use-cases/post-transaction.use-case";
import { VoidTransactionUseCase } from "../application/use-cases/void-transaction.use-case";
import { getPrisma } from "./prisma/prisma-client";
import { PrismaAccountingRepository } from "./prisma/prisma-accounting.repository";

function makeAccountingRepository(): PrismaAccountingRepository {
  return new PrismaAccountingRepository(getPrisma());
}

export function makeCreateAccountUseCase(): CreateAccountUseCase {
  return new CreateAccountUseCase(makeAccountingRepository());
}

export function makeListAccountsUseCase(): ListAccountsUseCase {
  return new ListAccountsUseCase(makeAccountingRepository());
}

export function makeListTransactionsUseCase(): ListTransactionsUseCase {
  return new ListTransactionsUseCase(makeAccountingRepository());
}

export function makeCreateTransactionUseCase(): CreateTransactionUseCase {
  return new CreateTransactionUseCase(makeAccountingRepository());
}

export function makeGetTransactionUseCase(): GetTransactionUseCase {
  return new GetTransactionUseCase(makeAccountingRepository());
}

export function makePostTransactionUseCase(): PostTransactionUseCase {
  return new PostTransactionUseCase(makeAccountingRepository());
}

export function makeVoidTransactionUseCase(): VoidTransactionUseCase {
  return new VoidTransactionUseCase(makeAccountingRepository());
}
