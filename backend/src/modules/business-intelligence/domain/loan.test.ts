import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "../../../shared/domain/money";
import { createNewLoan, createNewLoanPayment } from "./loan";

test("createNewLoanPayment accepts amount = principalAmount + interestAmount", () => {
  const payment = createNewLoanPayment({
    idLoan: "loan-1",
    amount: Money.fromDecimal("110.00"),
    principalAmount: Money.fromDecimal("100.00"),
    interestAmount: Money.fromDecimal("10.00"),
  });

  assert.equal(payment.amount.toDecimalString(), "110.00");
});

test("createNewLoanPayment rejects amount != principalAmount + interestAmount", () => {
  assert.throws(
    () =>
      createNewLoanPayment({
        idLoan: "loan-1",
        amount: Money.fromDecimal("100.00"),
        principalAmount: Money.fromDecimal("100.00"),
        interestAmount: Money.fromDecimal("10.00"),
      }),
    /principalAmount \+ interestAmount/,
  );
});

test("createNewLoan rejects a maturity date before the start date", () => {
  assert.throws(() =>
    createNewLoan({
      idLender: "lender-1",
      principal: Money.fromDecimal("1000.00"),
      interestRate: "5.0000",
      startDate: new Date("2026-09-01"),
      maturityDate: new Date("2026-08-01"),
      status: "ACTIVE",
    }),
  );
});

test("createNewLoan rejects a non-positive principal", () => {
  assert.throws(() =>
    createNewLoan({
      idLender: "lender-1",
      principal: Money.zero(),
      interestRate: "5.0000",
      startDate: new Date("2026-09-01"),
      maturityDate: new Date("2027-09-01"),
      status: "ACTIVE",
    }),
  );
});
