import assert from "node:assert/strict";
import { test } from "node:test";

import { Money } from "../../../shared/domain/money";
import { createDraftSale } from "./sale";

test("createDraftSale computes subtotal as the sum of quantity x unitPrice per item", () => {
  const sale = createDraftSale({
    idCustomer: "customer-1",
    tax: Money.fromDecimal("24.00"),
    status: "DRAFT",
    items: [
      { description: "Consultoria", quantity: "2", unitPrice: Money.fromDecimal("100.00") },
      { description: "Soporte", quantity: "0.5", unitPrice: Money.fromDecimal("40.00") },
    ],
  });

  // 2 x 100.00 = 200.00 ; 0.5 x 40.00 = 20.00 -> subtotal = 220.00
  assert.equal(sale.subtotal.toDecimalString(), "220.00");
  assert.equal(sale.total.toDecimalString(), "244.00");
});

test("createDraftSale rejects an empty item list", () => {
  assert.throws(() =>
    createDraftSale({
      idCustomer: "customer-1",
      tax: Money.zero(),
      status: "DRAFT",
      items: [],
    }),
  );
});

test("createDraftSale rejects an item with zero quantity", () => {
  assert.throws(() =>
    createDraftSale({
      idCustomer: "customer-1",
      tax: Money.zero(),
      status: "DRAFT",
      items: [{ description: "Servicio", quantity: "0", unitPrice: Money.fromDecimal("10.00") }],
    }),
  );
});

test("createDraftSale rejects negative tax", () => {
  assert.throws(() =>
    createDraftSale({
      idCustomer: "customer-1",
      tax: Money.fromDecimal("-1.00"),
      status: "DRAFT",
      items: [{ description: "Servicio", quantity: "1", unitPrice: Money.fromDecimal("10.00") }],
    }),
  );
});
