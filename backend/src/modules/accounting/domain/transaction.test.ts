import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "../../../shared/domain/money";
import { createDraftTransaction, assertCanPostTransaction, assertCanVoidTransaction, restoreTransaction } from "./transaction";

function balancedEntries() {
  return [
    { idAccount: "account-cash", amount: Money.fromDecimal("150.00"), type: "DEBIT" as const },
    { idAccount: "account-revenue", amount: Money.fromDecimal("150.00"), type: "CREDIT" as const },
  ];
}

test("createDraftTransaction requires at least two entries", () => {
  assert.throws(() =>
    createDraftTransaction({
      description: "Venta",
      entries: [{ idAccount: "account-cash", amount: Money.fromDecimal("10.00"), type: "DEBIT" }],
    }),
  );
});

test("createDraftTransaction rejects entries with non-positive amounts", () => {
  assert.throws(() =>
    createDraftTransaction({
      description: "Venta",
      entries: [
        { idAccount: "account-cash", amount: Money.zero(), type: "DEBIT" },
        { idAccount: "account-revenue", amount: Money.fromDecimal("10.00"), type: "CREDIT" },
      ],
    }),
  );
});

test("assertCanPostTransaction accepts a balanced draft", () => {
  const transaction = restoreTransaction({
    idTransaction: "tx-1",
    date: new Date("2026-09-01"),
    description: "Venta de servicio",
    status: "DRAFT",
    entries: balancedEntries().map((entry, index) => ({
      idTransactionEntry: `entry-${index}`,
      idTransaction: "tx-1",
      ...entry,
    })),
  });

  assert.doesNotThrow(() => assertCanPostTransaction(transaction));
});

test("assertCanPostTransaction rejects an unbalanced transaction (SUM(DEBIT) != SUM(CREDIT))", () => {
  const transaction = restoreTransaction({
    idTransaction: "tx-2",
    date: new Date("2026-09-01"),
    description: "Venta descuadrada",
    status: "DRAFT",
    entries: [
      {
        idTransactionEntry: "entry-1",
        idTransaction: "tx-2",
        idAccount: "account-cash",
        amount: Money.fromDecimal("150.00"),
        type: "DEBIT",
      },
      {
        idTransactionEntry: "entry-2",
        idTransaction: "tx-2",
        idAccount: "account-revenue",
        amount: Money.fromDecimal("100.00"),
        type: "CREDIT",
      },
    ],
  });

  assert.throws(() => assertCanPostTransaction(transaction), /Debit and credit totals must be equal/);
});

test("assertCanPostTransaction rejects a transaction that is not DRAFT", () => {
  const transaction = restoreTransaction({
    idTransaction: "tx-3",
    date: new Date("2026-09-01"),
    description: "Ya asentada",
    status: "POSTED",
    entries: balancedEntries().map((entry, index) => ({
      idTransactionEntry: `entry-${index}`,
      idTransaction: "tx-3",
      ...entry,
    })),
  });

  assert.throws(() => assertCanPostTransaction(transaction));
});

test("assertCanVoidTransaction rejects voiding an already voided transaction", () => {
  const transaction = restoreTransaction({
    idTransaction: "tx-4",
    date: new Date("2026-09-01"),
    description: "Anulada",
    status: "VOIDED",
    entries: balancedEntries().map((entry, index) => ({
      idTransactionEntry: `entry-${index}`,
      idTransaction: "tx-4",
      ...entry,
    })),
  });

  assert.throws(() => assertCanVoidTransaction(transaction));
});
