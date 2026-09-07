import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "../../../shared/domain/money";
import { calculateBalanceDeltas, reverseBalanceDeltas } from "./accounting-policy";
import { restoreAccount } from "./account";
import { restoreTransaction } from "./transaction";

test("calculateBalanceDeltas increases ASSET on DEBIT and REVENUE on CREDIT", () => {
  const cash = restoreAccount({
    idAccount: "account-cash",
    name: "Caja",
    description: null,
    type: "ASSET",
    balance: Money.zero(),
  });
  const revenue = restoreAccount({
    idAccount: "account-revenue",
    name: "Ingresos",
    description: null,
    type: "REVENUE",
    balance: Money.zero(),
  });
  const transaction = restoreTransaction({
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
  });

  const deltas = calculateBalanceDeltas(transaction, [cash, revenue]);
  const cashDelta = deltas.find((delta) => delta.idAccount === "account-cash");
  const revenueDelta = deltas.find((delta) => delta.idAccount === "account-revenue");

  assert.equal(cashDelta?.delta.toDecimalString(), "150.00");
  assert.equal(revenueDelta?.delta.toDecimalString(), "150.00");
});

test("calculateBalanceDeltas decreases LIABILITY on DEBIT", () => {
  const payable = restoreAccount({
    idAccount: "account-payable",
    name: "Cuentas por pagar",
    description: null,
    type: "LIABILITY",
    balance: Money.fromDecimal("500.00"),
  });
  const cash = restoreAccount({
    idAccount: "account-cash",
    name: "Caja",
    description: null,
    type: "ASSET",
    balance: Money.fromDecimal("500.00"),
  });
  const transaction = restoreTransaction({
    idTransaction: "tx-2",
    date: new Date("2026-09-01"),
    description: "Pago a proveedor",
    status: "DRAFT",
    entries: [
      {
        idTransactionEntry: "entry-1",
        idTransaction: "tx-2",
        idAccount: "account-payable",
        amount: Money.fromDecimal("100.00"),
        type: "DEBIT",
      },
      {
        idTransactionEntry: "entry-2",
        idTransaction: "tx-2",
        idAccount: "account-cash",
        amount: Money.fromDecimal("100.00"),
        type: "CREDIT",
      },
    ],
  });

  const deltas = calculateBalanceDeltas(transaction, [payable, cash]);
  const payableDelta = deltas.find((delta) => delta.idAccount === "account-payable");
  const cashDelta = deltas.find((delta) => delta.idAccount === "account-cash");

  assert.equal(payableDelta?.delta.toDecimalString(), "-100.00");
  assert.equal(cashDelta?.delta.toDecimalString(), "-100.00");
});

test("reverseBalanceDeltas negates every delta", () => {
  const deltas = [
    { idAccount: "account-cash", delta: Money.fromDecimal("150.00") },
    { idAccount: "account-revenue", delta: Money.fromDecimal("150.00") },
  ];

  const reversed = reverseBalanceDeltas(deltas);

  assert.equal(reversed[0].delta.toDecimalString(), "-150.00");
  assert.equal(reversed[1].delta.toDecimalString(), "-150.00");
});
