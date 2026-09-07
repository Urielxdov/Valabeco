import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "./money";

test("Money.fromDecimal rejects floating point garbage and requires up to 2 decimals", () => {
  assert.throws(() => Money.fromDecimal("12.345"));
  assert.throws(() => Money.fromDecimal("abc"));
  assert.equal(Money.fromDecimal("12.30").toDecimalString(), "12.30");
  assert.equal(Money.fromDecimal("-12.30").toDecimalString(), "-12.30");
});

test("add/subtract/negate operate in integer cents", () => {
  const ten = Money.fromDecimal("10.00");
  const three = Money.fromDecimal("3.33");

  assert.equal(ten.add(three).toDecimalString(), "13.33");
  assert.equal(ten.subtract(three).toDecimalString(), "6.67");
  assert.equal(three.negate().toDecimalString(), "-3.33");
});

test("multiplyByQuantity computes an exact product without floating point drift", () => {
  const unitPrice = Money.fromDecimal("10.00");

  assert.equal(unitPrice.multiplyByQuantity("2.5").toDecimalString(), "25.00");
  assert.equal(unitPrice.multiplyByQuantity("0.0001").toDecimalString(), "0.00");
});

test("multiplyByQuantity rounds half up to the nearest cent", () => {
  // $0.03 * 0.5 = 1.5 centavos exactos -> redondea hacia arriba a 2 centavos.
  const smallPrice = Money.fromDecimal("0.03");
  assert.equal(smallPrice.multiplyByQuantity("0.5").toDecimalString(), "0.02");

  // $0.10 * 0.125 = 1.25 centavos -> redondea hacia abajo a 1 centavo.
  const tenCents = Money.fromDecimal("0.10");
  assert.equal(tenCents.multiplyByQuantity("0.125").toDecimalString(), "0.01");
});

test("multiplyByQuantity rejects negative or malformed quantities", () => {
  const money = Money.fromDecimal("1.00");

  assert.throws(() => money.multiplyByQuantity("-1"));
  assert.throws(() => money.multiplyByQuantity("1.23456"));
});

test("equals/isPositive/isNegative/isZero reflect the underlying cents", () => {
  assert.ok(Money.fromDecimal("1.00").isPositive());
  assert.ok(Money.fromDecimal("-1.00").isNegative());
  assert.ok(Money.zero().isZero());
  assert.ok(Money.fromDecimal("5.00").equals(Money.fromDecimal("5.00")));
});
