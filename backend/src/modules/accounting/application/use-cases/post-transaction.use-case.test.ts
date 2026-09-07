import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "../../../../shared/domain/money";
import type { Account, AccountBalanceDelta, NewAccount } from "../../domain/account";
import { restoreAccount } from "../../domain/account";
import type { AccountingTransaction, NewAccountingTransaction } from "../../domain/transaction";
import { restoreTransaction } from "../../domain/transaction";
import type { AccountingRepository, VoidTransactionInput } from "../ports/accounting-repository.port";
import { PostTransactionUseCase } from "./post-transaction.use-case";

class FakeAccountingRepository implements AccountingRepository {
  accounts = new Map<string, Account>();
  transactions = new Map<string, AccountingTransaction>();
  postedBalanceDeltas: AccountBalanceDelta[] | null = null;

  async createAccount(_account: NewAccount): Promise<Account> {
    throw new Error("not needed for this test");
  }

  async listAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async findAccountsByIds(idAccounts: string[]): Promise<Account[]> {
    return idAccounts
      .map((idAccount) => this.accounts.get(idAccount))
      .filter((account): account is Account => account !== undefined);
  }

  async createTransaction(_transaction: NewAccountingTransaction): Promise<AccountingTransaction> {
    throw new Error("not needed for this test");
  }

  async listTransactions(): Promise<AccountingTransaction[]> {
    return Array.from(this.transactions.values());
  }

  async findTransactionById(idTransaction: string): Promise<AccountingTransaction | null> {
    return this.transactions.get(idTransaction) ?? null;
  }

  async postTransaction(
    idTransaction: string,
    balanceDeltas: AccountBalanceDelta[],
  ): Promise<AccountingTransaction> {
    this.postedBalanceDeltas = balanceDeltas;
    const transaction = this.transactions.get(idTransaction);

    if (!transaction) {
      throw new Error("transaction not found");
    }

    const posted = { ...transaction, status: "POSTED" as const };
    this.transactions.set(idTransaction, posted);

    return posted;
  }

  async voidTransaction(_input: VoidTransactionInput): Promise<AccountingTransaction> {
    throw new Error("not needed for this test");
  }
}

function seedAccount(repository: FakeAccountingRepository, idAccount: string, type: Account["type"]) {
  repository.accounts.set(
    idAccount,
    restoreAccount({ idAccount, name: idAccount, description: null, type, balance: Money.zero() }),
  );
}

test("PostTransactionUseCase computes and forwards balance deltas for a balanced draft", async () => {
  const repository = new FakeAccountingRepository();
  seedAccount(repository, "account-cash", "ASSET");
  seedAccount(repository, "account-revenue", "REVENUE");

  repository.transactions.set(
    "tx-1",
    restoreTransaction({
      idTransaction: "tx-1",
      date: new Date("2026-09-01"),
      description: "Venta de servicio",
      status: "DRAFT",
      entries: [
        {
          idTransactionEntry: "entry-1",
          idTransaction: "tx-1",
          idAccount: "account-cash",
          amount: Money.fromDecimal("150.00"),
          type: "DEBIT",
        },
        {
          idTransactionEntry: "entry-2",
          idTransaction: "tx-1",
          idAccount: "account-revenue",
          amount: Money.fromDecimal("150.00"),
          type: "CREDIT",
        },
      ],
    }),
  );

  const useCase = new PostTransactionUseCase(repository);
  const result = await useCase.execute("tx-1");

  assert.equal(result.status, "POSTED");
  assert.equal(repository.postedBalanceDeltas?.length, 2);
  const cashDelta = repository.postedBalanceDeltas?.find((delta) => delta.idAccount === "account-cash");
  assert.equal(cashDelta?.delta.toDecimalString(), "150.00");
});

test("PostTransactionUseCase throws when the transaction does not exist", async () => {
  const repository = new FakeAccountingRepository();
  const useCase = new PostTransactionUseCase(repository);

  await assert.rejects(() => useCase.execute("missing-tx"));
});
