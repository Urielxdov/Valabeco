import type {
  Account as PrismaAccount,
  PrismaClient,
  Transaction as PrismaTransaction,
  TransactionEntry as PrismaTransactionEntry,
} from "@prisma/client";

import type { Account, AccountBalanceDelta, NewAccount } from "../../domain/account";
import { restoreAccount } from "../../domain/account";
import type { AccountType, EntryType, TransactionStatus } from "../../domain/enums";
import { Money } from "../../domain/money";
import type {
  AccountingTransaction,
  NewAccountingTransaction,
} from "../../domain/transaction";
import { restoreTransaction } from "../../domain/transaction";
import { AccountingConflictError } from "../../application/errors";
import type {
  AccountingRepository,
  VoidTransactionInput,
} from "../../application/ports/accounting-repository.port";

type TransactionWithEntries = PrismaTransaction & {
  entries: PrismaTransactionEntry[];
};

export class PrismaAccountingRepository implements AccountingRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createAccount(account: NewAccount): Promise<Account> {
    const created = await this.prisma.account.create({
      data: {
        name: account.name,
        description: account.description,
        type: account.type,
        balance: account.balance.toDecimalString(),
      },
    });

    return toDomainAccount(created);
  }

  async listAccounts(): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return accounts.map(toDomainAccount);
  }

  async findAccountsByIds(idAccounts: string[]): Promise<Account[]> {
    const uniqueIds = Array.from(new Set(idAccounts));

    if (uniqueIds.length === 0) {
      return [];
    }

    const accounts = await this.prisma.account.findMany({
      where: {
        idAccount: {
          in: uniqueIds,
        },
      },
    });

    return accounts.map(toDomainAccount);
  }

  async createTransaction(transaction: NewAccountingTransaction): Promise<AccountingTransaction> {
    const created = await this.prisma.transaction.create({
      data: {
        date: transaction.date,
        description: transaction.description,
        status: transaction.status,
        entries: {
          create: transaction.entries.map((entry) => ({
            idAccount: entry.idAccount,
            amount: entry.amount.toDecimalString(),
            type: entry.type,
          })),
        },
      },
      include: {
        entries: true,
      },
    });

    return toDomainTransaction(created);
  }

  async listTransactions(): Promise<AccountingTransaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      orderBy: {
        date: "desc",
      },
      include: {
        entries: true,
      },
    });

    return transactions.map(toDomainTransaction);
  }

  async findTransactionById(idTransaction: string): Promise<AccountingTransaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: {
        idTransaction,
      },
      include: {
        entries: true,
      },
    });

    return transaction ? toDomainTransaction(transaction) : null;
  }

  async postTransaction(
    idTransaction: string,
    balanceDeltas: AccountBalanceDelta[],
  ): Promise<AccountingTransaction> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: {
          idTransaction,
          status: "DRAFT",
        },
        data: {
          status: "POSTED",
        },
      });

      if (updated.count !== 1) {
        throw new AccountingConflictError("Transaction is no longer draft.");
      }

      await applyBalanceDeltas(tx, balanceDeltas);

      const posted = await tx.transaction.findUniqueOrThrow({
        where: {
          idTransaction,
        },
        include: {
          entries: true,
        },
      });

      return toDomainTransaction(posted);
    });
  }

  async voidTransaction(input: VoidTransactionInput): Promise<AccountingTransaction> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.updateMany({
        where: {
          idTransaction: input.idTransaction,
          status: input.expectedStatus,
        },
        data: {
          status: "VOIDED",
        },
      });

      if (updated.count !== 1) {
        throw new AccountingConflictError("Transaction state changed before voiding.");
      }

      await applyBalanceDeltas(tx, input.balanceDeltas);

      const voided = await tx.transaction.findUniqueOrThrow({
        where: {
          idTransaction: input.idTransaction,
        },
        include: {
          entries: true,
        },
      });

      return toDomainTransaction(voided);
    });
  }
}

async function applyBalanceDeltas(
  tx: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">,
  balanceDeltas: AccountBalanceDelta[],
): Promise<void> {
  for (const balanceDelta of balanceDeltas) {
    await tx.account.update({
      where: {
        idAccount: balanceDelta.idAccount,
      },
      data: {
        balance: {
          increment: balanceDelta.delta.toDecimalString(),
        },
      },
    });
  }
}

function toDomainAccount(account: PrismaAccount): Account {
  return restoreAccount({
    idAccount: account.idAccount,
    name: account.name,
    description: account.description,
    type: account.type as AccountType,
    balance: Money.fromDecimal(account.balance.toString()),
  });
}

function toDomainTransaction(transaction: TransactionWithEntries): AccountingTransaction {
  return restoreTransaction({
    idTransaction: transaction.idTransaction,
    date: transaction.date,
    description: transaction.description,
    status: transaction.status as TransactionStatus,
    entries: transaction.entries.map((entry) => ({
      idTransactionEntry: entry.idTransactionEntry,
      idTransaction: entry.idTransaction,
      idAccount: entry.idAccount,
      amount: Money.fromDecimal(entry.amount.toString()),
      type: entry.type as EntryType,
    })),
  });
}
